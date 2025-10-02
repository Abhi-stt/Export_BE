const ForwarderAssignment = require('../schemas/ForwarderAssignment');
const ForwarderProfile = require('../schemas/ForwarderProfile');
const ShipmentOrder = require('../schemas/ShipmentOrder');
const Notification = require('../schemas/Notification');
const User = require('../schemas/User');

class ForwarderAssignmentService {
  // Create forwarder assignment for a shipment order
  async createAssignment(orderId) {
    try {
      console.log('🚚 Creating forwarder assignment for order:', orderId);

      // Get the shipment order
      const order = await ShipmentOrder.findById(orderId)
        .populate('exporter', 'name email')
        .populate('client', 'name company');

      if (!order) {
        throw new Error('Shipment order not found');
      }

      if (order.status !== 'approved') {
        throw new Error('Order must be approved before forwarder assignment');
      }

      // Check if assignment already exists
      const existingAssignment = await ForwarderAssignment.findOne({ orderId });
      if (existingAssignment) {
        console.log('⚠️ Assignment already exists for this order');
        return existingAssignment;
      }

      // Get route information from order
      const route = this.extractRouteFromOrder(order);

      // Create forwarder assignment
      const assignment = new ForwarderAssignment({
        orderId,
        currentStage: 'pickup',
        status: 'assigned',
        route,
        timeline: {
          assignedAt: new Date(),
          estimatedCompletion: this.calculateEstimatedCompletion(route)
        }
      });

      // Assign forwarders for each stage
      const assignedForwarders = await this.assignForwardersForStages(route);
      assignment.assignedForwarders = assignedForwarders;

      // Add initial tracking
      assignment.tracking.push({
        stage: 'pickup',
        status: 'assigned',
        location: route.origin.city,
        notes: 'Forwarder assignment created',
        updatedBy: null
      });

      // Add to audit trail
      assignment.auditTrail.push({
        action: 'Assignment Created',
        performedBy: null,
        details: 'Forwarder assignment created automatically',
        previousStatus: null,
        newStatus: 'assigned'
      });

      await assignment.save();

      // Update order status
      order.status = 'forwarder_assigned';
      order.auditTrail.push({
        action: 'Assigned to Forwarder',
        performedBy: null,
        details: 'Order assigned to forwarder for processing',
        previousStatus: 'approved',
        newStatus: 'forwarder_assigned'
      });
      await order.save();

      // Send notifications to assigned forwarders
      await this.sendAssignmentNotifications(assignment);

      console.log('✅ Forwarder assignment created successfully');
      return assignment;

    } catch (error) {
      console.error('❌ Error creating forwarder assignment:', error);
      throw error;
    }
  }

  // Assign forwarders for all stages
  async assignForwardersForStages(route) {
    const stages = ['pickup', 'transit', 'port_loading', 'on_ship', 'destination'];
    const assignedForwarders = [];

    for (const stage of stages) {
      try {
        const forwarder = await this.findBestForwarderForStage(stage, route);
        if (forwarder) {
          assignedForwarders.push({
            stage,
            forwarderId: forwarder._id,
            forwarderName: forwarder.name,
            assignedAt: new Date(),
            status: 'assigned'
          });

          // Update forwarder load
          await this.updateForwarderLoad(forwarder._id, 1);
        } else {
          console.log(`⚠️ No forwarder found for stage: ${stage}`);
          // Still add the stage but mark as unassigned
          assignedForwarders.push({
            stage,
            forwarderId: null,
            forwarderName: 'Unassigned',
            assignedAt: new Date(),
            status: 'unassigned'
          });
        }
      } catch (error) {
        console.error(`❌ Error assigning forwarder for stage ${stage}:`, error);
      }
    }

    return assignedForwarders;
  }

  // Find the best forwarder for a specific stage
  async findBestForwarderForStage(stage, route) {
    try {
      const query = {
        specialization: stage,
        status: 'active',
        'availability.isActive': true,
        'capacity.currentLoad': { $lt: { $expr: '$capacity.maxConcurrentShipments' } }
      };

      // Add location filter if available
      if (route.origin && route.origin.city) {
        query['serviceAreas.city'] = route.origin.city;
      }

      const forwarders = await ForwarderProfile.find(query)
        .populate('userId', 'name email')
        .sort({
          'performance.averageRating': -1,
          'performance.onTimeDelivery': -1,
          'capacity.currentLoad': 1
        })
        .limit(5);

      if (forwarders.length === 0) {
        return null;
      }

      // Return the best forwarder
      return forwarders[0].userId;
    } catch (error) {
      console.error('❌ Error finding forwarder for stage:', error);
      return null;
    }
  }

  // Extract route information from order
  extractRouteFromOrder(order) {
    return {
      origin: {
        country: order.orderDetails?.origin?.country || 'India',
        city: order.orderDetails?.origin?.city || 'Mumbai',
        port: order.orderDetails?.origin?.port || 'Mumbai Port',
        coordinates: {
          latitude: order.orderDetails?.origin?.coordinates?.latitude || 19.0760,
          longitude: order.orderDetails?.origin?.coordinates?.longitude || 72.8777
        }
      },
      destination: {
        country: order.orderDetails?.destination?.country || 'USA',
        city: order.orderDetails?.destination?.city || 'New York',
        port: order.orderDetails?.destination?.port || 'New York Port',
        coordinates: {
          latitude: order.orderDetails?.destination?.coordinates?.latitude || 40.7128,
          longitude: order.orderDetails?.destination?.coordinates?.longitude || -74.0060
        }
      },
      estimatedDuration: this.calculateEstimatedDuration(order.orderDetails?.transportMode),
      distance: this.calculateDistance(
        order.orderDetails?.origin?.coordinates,
        order.orderDetails?.destination?.coordinates
      )
    };
  }

  // Calculate estimated completion date
  calculateEstimatedCompletion(route) {
    const now = new Date();
    const estimatedDays = route.estimatedDuration || 14; // Default 14 days
    return new Date(now.getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
  }

  // Calculate estimated duration based on transport mode
  calculateEstimatedDuration(transportMode) {
    const durations = {
      'sea': 14, // 14 days
      'air': 3,  // 3 days
      'road': 7  // 7 days
    };
    return durations[transportMode] || 14;
  }

  // Calculate distance between two points (simplified)
  calculateDistance(origin, destination) {
    if (!origin || !destination) return 0;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(destination.latitude - origin.latitude);
    const dLon = this.deg2rad(destination.longitude - origin.longitude);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(origin.latitude)) * Math.cos(this.deg2rad(destination.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Update forwarder load
  async updateForwarderLoad(forwarderId, change) {
    try {
      const profile = await ForwarderProfile.findOne({ userId: forwarderId });
      if (profile) {
        await profile.updateLoad(change);
      }
    } catch (error) {
      console.error('❌ Error updating forwarder load:', error);
    }
  }

  // Send assignment notifications
  async sendAssignmentNotifications(assignment) {
    try {
      const order = await ShipmentOrder.findById(assignment.orderId)
        .populate('exporter', 'name email')
        .populate('client', 'name company');

      for (const forwarderAssignment of assignment.assignedForwarders) {
        if (forwarderAssignment.forwarderId) {
          // Create notification for forwarder
          const notification = new Notification({
            user: forwarderAssignment.forwarderId,
            type: 'alert',
            category: 'shipment',
            title: 'New Shipment Assignment',
            message: `You have been assigned to handle ${forwarderAssignment.stage} stage for order ${order.orderNumber}`,
            priority: 'high',
            actionUrl: `/forwarder-assignments/${assignment._id}`,
            actionText: 'View Assignment',
            metadata: {
              assignmentId: assignment._id,
              orderId: order._id,
              stage: forwarderAssignment.stage
            },
            tags: ['forwarder_assignment', forwarderAssignment.stage]
          });

          await notification.save();
          console.log(`📧 Notification sent to forwarder for ${forwarderAssignment.stage} stage`);
        }
      }

      // Notify exporter about forwarder assignment
      if (order.exporter) {
        const exporterNotification = new Notification({
          user: order.exporter._id,
          type: 'info',
          category: 'shipment',
          title: 'Forwarder Assigned',
          message: `Your order ${order.orderNumber} has been assigned to forwarders for processing`,
          priority: 'medium',
          actionUrl: `/shipment-orders/${order._id}`,
          actionText: 'View Order',
          metadata: {
            orderId: order._id,
            assignmentId: assignment._id
          },
          tags: ['forwarder_assignment', 'exporter']
        });

        await exporterNotification.save();
        console.log('📧 Notification sent to exporter about forwarder assignment');
      }

    } catch (error) {
      console.error('❌ Error sending assignment notifications:', error);
    }
  }

  // Get assignment statistics
  async getAssignmentStats() {
    try {
      const stats = await ForwarderAssignment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stageStats = await ForwarderAssignment.aggregate([
        {
          $group: {
            _id: '$currentStage',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        statusStats: stats,
        stageStats: stageStats
      };
    } catch (error) {
      console.error('❌ Error getting assignment stats:', error);
      throw error;
    }
  }

  // Update assignment stage
  async updateStage(assignmentId, newStage, forwarderId) {
    try {
      const assignment = await ForwarderAssignment.findById(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      await assignment.updateStage(newStage, forwarderId);

      // Add tracking update
      assignment.tracking.push({
        stage: newStage,
        status: 'stage_updated',
        location: 'Stage updated',
        notes: `Stage updated to ${newStage}`,
        updatedBy: forwarderId
      });

      await assignment.save();

      return assignment;
    } catch (error) {
      console.error('❌ Error updating stage:', error);
      throw error;
    }
  }
}

module.exports = ForwarderAssignmentService;
