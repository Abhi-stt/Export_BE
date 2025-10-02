const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../schemas/User');
const ShipmentOrder = require('../schemas/ShipmentOrder');
const ForwarderAssignment = require('../schemas/ForwarderAssignment');

// Get tasks assigned to the current sub-forwarder
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    console.log('🚀 UPDATED CODE RUNNING - /api/forwarder/my-tasks called for user:', currentUser);
    console.log('🚀 User ID:', currentUser._id || currentUser.id);
    console.log('🚀 User ID type:', typeof (currentUser._id || currentUser.id));
    
    // Get the correct user ID
    const userId = currentUser._id || currentUser.id;
    console.log('🚀 Using userId:', userId);
    
    // Find all assignments where this forwarder is assigned
    const assignments = await ForwarderAssignment.find({
      'assignedForwarders.forwarderId': userId
    }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
    .populate('assignedForwarders.forwarderId', 'name email company specialization');
    
    console.log('🔍 Found assignments:', assignments.length);

    // Transform assignments into tasks
    const tasks = [];
    
    for (const assignment of assignments) {
      console.log('🔍 Processing assignment:', assignment._id);
      console.log('🔍 Assignment forwarders:', assignment.assignedForwarders.length);
      
      const myAssignment = assignment.assignedForwarders.find(
        f => {
          // Handle both populated and non-populated forwarderId
          const forwarderId = f.forwarderId._id || f.forwarderId;
          const matches = forwarderId.toString() === userId.toString();
          console.log('🔍 Checking forwarder:', forwarderId.toString(), 'vs', userId.toString(), 'matches:', matches);
          return matches;
        }
      );
      
      if (myAssignment) {
        console.log('✅ Found my assignment:', myAssignment.stage, myAssignment.status);
        tasks.push({
          _id: assignment._id,
          orderId: assignment.orderId,
          stage: myAssignment.stage,
          status: myAssignment.status,
          assignedDate: myAssignment.assignedAt,
          dueDate: myAssignment.estimatedCompletion,
          location: myAssignment.location,
          notes: myAssignment.notes,
          priority: 'medium', // Default priority
          estimatedDuration: 24, // Default duration
          actualDuration: null
        });
      } else {
        console.log('❌ No assignment found for current user in this assignment');
      }
    }
    
    console.log('🔍 Final tasks count:', tasks.length);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching sub-forwarder tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Update task status
router.put('/tasks/:taskId/status', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;
    const currentUser = req.user;

    // Validate status
    const validStatuses = ['assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: assigned, in_progress, completed, cancelled'
      });
    }

    // Find the assignment
    const assignment = await ForwarderAssignment.findById(taskId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get the correct user ID
    const userId = currentUser._id || currentUser.id;
    
    // Find the specific forwarder assignment
    const forwarderAssignment = assignment.assignedForwarders.find(
      f => {
        // Handle both populated and non-populated forwarderId
        const forwarderId = f.forwarderId._id || f.forwarderId;
        return forwarderId.toString() === userId.toString();
      }
    );

    if (!forwarderAssignment) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this task'
      });
    }

    // Update the status
    forwarderAssignment.status = status;
    
    // Update notes if provided
    if (notes) {
      forwarderAssignment.notes = notes;
    }
    
    // If marking as in_progress, set start date
    if (status === 'in_progress' && !forwarderAssignment.startedAt) {
      forwarderAssignment.startedAt = new Date();
    }
    
    // If marking as completed, set completion date
    if (status === 'completed') {
      forwarderAssignment.completedAt = new Date();
    }

    await assignment.save();

    // Update shipment order status if all tasks are completed
    await updateShipmentOrderStatus(assignment.orderId);

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        taskId: assignment._id,
        status: forwarderAssignment.status,
        completedAt: forwarderAssignment.completedAt
      }
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
});

// Helper function to update shipment order status
async function updateShipmentOrderStatus(orderId) {
  try {
    const assignment = await ForwarderAssignment.findOne({ orderId });
    if (!assignment) return;

    // Check if all forwarder tasks are completed
    const allCompleted = assignment.assignedForwarders.every(
      f => f.status === 'completed'
    );

    if (allCompleted) {
      // Update shipment order status
      await ShipmentOrder.findByIdAndUpdate(orderId, {
        status: 'in_transit',
        lastUpdated: new Date()
      });

      console.log(`✅ All tasks completed for order ${orderId}. Status updated to in_transit.`);
    } else {
      // Check if any tasks are in progress
      const anyInProgress = assignment.assignedForwarders.some(
        f => f.status === 'in_progress'
      );

      if (anyInProgress) {
        await ShipmentOrder.findByIdAndUpdate(orderId, {
          status: 'processing',
          lastUpdated: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error updating shipment order status:', error);
  }
}

// Get task details
router.get('/tasks/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user;

    const assignment = await ForwarderAssignment.findById(taskId)
      .populate('orderId', 'orderNumber status products origin destination expectedDelivery')
      .populate('assignedForwarders.forwarderId', 'name email company specialization');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get the correct user ID
    const userId = currentUser._id || currentUser.id;
    
    const myAssignment = assignment.assignedForwarders.find(
      f => {
        // Handle both populated and non-populated forwarderId
        const forwarderId = f.forwarderId._id || f.forwarderId;
        return forwarderId.toString() === userId.toString();
      }
    );

    if (!myAssignment) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this task'
      });
    }

    const task = {
      _id: assignment._id,
      orderId: assignment.orderId,
      stage: myAssignment.stage,
      status: myAssignment.status,
      assignedDate: myAssignment.assignedAt,
      dueDate: myAssignment.estimatedCompletion,
      location: myAssignment.location,
      notes: myAssignment.notes,
      priority: 'medium',
      estimatedDuration: 24,
      actualDuration: null,
      completedAt: myAssignment.completedAt
    };

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task details'
    });
  }
});

// Get workflow status for all orders that the current user has tasks for
router.get('/workflow-status', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const userId = currentUser._id || currentUser.id;

    // Find all assignments where this forwarder is assigned
    const assignments = await ForwarderAssignment.find({
      'assignedForwarders.forwarderId': userId
    }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
    .populate('assignedForwarders.forwarderId', 'name email company specialization');

    // Get all unique order IDs
    const orderIds = [...new Set(assignments.map(a => a.orderId._id.toString()))];

    // For each order, get the complete workflow status
    const workflowStatus = {};
    
    orderIds.forEach(orderId => {
      const orderAssignments = assignments.filter(a => a.orderId._id.toString() === orderId);
      const order = orderAssignments[0].orderId;
      
      workflowStatus[orderId] = {
        orderNumber: order.orderNumber,
        stages: {
          pickup: { completed: false, inProgress: false, notStarted: true },
          transit: { completed: false, inProgress: false, notStarted: true },
          port_loading: { completed: false, inProgress: false, notStarted: true },
          on_ship: { completed: false, inProgress: false, notStarted: true },
          destination: { completed: false, inProgress: false, notStarted: true }
        }
      };

      // Check status of all stages for this order
      orderAssignments.forEach(assignment => {
        assignment.assignedForwarders.forEach(forwarderAssignment => {
          const stage = forwarderAssignment.stage;
          if (workflowStatus[orderId].stages[stage]) {
            if (forwarderAssignment.status === 'completed') {
              workflowStatus[orderId].stages[stage] = { completed: true, inProgress: false, notStarted: false };
            } else if (forwarderAssignment.status === 'in_progress') {
              workflowStatus[orderId].stages[stage] = { completed: false, inProgress: true, notStarted: false };
            } else if (forwarderAssignment.status === 'assigned') {
              workflowStatus[orderId].stages[stage] = { completed: false, inProgress: false, notStarted: false };
            }
          }
        });
      });
    });

    res.json({
      success: true,
      data: workflowStatus
    });
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow status'
    });
  }
});

module.exports = router;
