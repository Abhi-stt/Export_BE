const mongoose = require('mongoose');
const User = require('./schemas/User');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');

async function assignTasksFixed() {
  try {
    console.log('🚀 Assigning tasks to existing shipment orders (Fixed)...');
    
    // Connect to database
    const cloudUri = 'mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export';
    await mongoose.connect(cloudUri);
    console.log('✅ Connected to Cloud MongoDB');

    // Get all sub-forwarders
    const subForwarders = await User.find({
      role: 'forwarder',
      designation: { $not: /admin/i }
    });

    console.log(`📋 Found ${subForwarders.length} sub-forwarders:`);
    subForwarders.forEach(f => {
      console.log(`  - ${f.name} (${f.email}) - ${f.designation}`);
    });

    // Get active shipment orders
    const activeOrders = await ShipmentOrder.find({
      status: { $in: ['assigned_to_forwarder', 'approved'] }
    }).populate('exporter', 'name email company');

    console.log(`\n📦 Found ${activeOrders.length} active shipment orders`);

    if (activeOrders.length === 0) {
      console.log('⚠️  No active orders found. Please create some shipment orders first.');
      return;
    }

    // Assign tasks to each order
    for (const order of activeOrders) {
      console.log(`\n📦 Processing order: ${order.orderNumber} (${order.status})`);
      
      // Check if assignment already exists
      let assignment = await ForwarderAssignment.findOne({ orderId: order._id });
      
      if (!assignment) {
        // Create new assignment
        assignment = new ForwarderAssignment({
          orderId: order._id,
          currentStage: 'pickup',
          status: 'assigned',
          assignedForwarders: [],
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        console.log('  ✅ Created new assignment');
      } else {
        console.log('  ℹ️  Assignment already exists');
      }

      // Define stages and map to forwarder designations
      const stageMappings = [
        { 
          stage: 'pickup', 
          designations: ['Pickup Forwarder'],
          duration: 1 // days
        },
        { 
          stage: 'transit', 
          designations: ['Transit Forwarder'],
          duration: 3
        },
        { 
          stage: 'port_loading', 
          designations: ['Port Loading Forwarder'],
          duration: 2
        },
        { 
          stage: 'on_ship', 
          designations: ['On-Ship Forwarder'],
          duration: 7
        },
        { 
          stage: 'destination', 
          designations: ['Destination Unloading Forwarder'],
          duration: 2
        }
      ];

      // Assign each stage to appropriate sub-forwarders
      for (const stageMapping of stageMappings) {
        // Check if stage is already assigned
        const existingAssignment = assignment.assignedForwarders.find(
          f => f.stage === stageMapping.stage
        );

        if (!existingAssignment) {
          // Find suitable sub-forwarder based on designation
          const suitableForwarder = subForwarders.find(forwarder => 
            stageMapping.designations.some(designation => 
              forwarder.designation && forwarder.designation.toLowerCase().includes(designation.toLowerCase())
            )
          );

          if (suitableForwarder) {
            // Calculate due date based on stage
            const baseDate = new Date();
            const dueDate = new Date(baseDate.getTime() + stageMapping.duration * 24 * 60 * 60 * 1000);

            assignment.assignedForwarders.push({
              stage: stageMapping.stage,
              forwarderId: suitableForwarder._id,
              forwarderName: suitableForwarder.name, // Required field
              assignedAt: new Date(),
              status: 'assigned', // Use correct enum value
              startedAt: null,
              completedAt: null,
              documents: [],
              notes: `Handle ${stageMapping.stage.replace('_', ' ')} for order ${order.orderNumber}`,
              location: getLocationForStage(stageMapping.stage, order.orderDetails),
              estimatedCompletion: dueDate
            });

            console.log(`  ✅ Assigned ${stageMapping.stage} to ${suitableForwarder.name} (${suitableForwarder.designation})`);
          } else {
            console.log(`  ⚠️  No suitable forwarder found for ${stageMapping.stage} (looking for: ${stageMapping.designations.join(', ')})`);
          }
        } else {
          console.log(`  ℹ️  ${stageMapping.stage} already assigned`);
        }
      }

      // Save assignment
      await assignment.save();
      console.log(`  💾 Saved assignment for order ${order.orderNumber}`);
    }

    console.log('\n🎉 Task assignment completed successfully!');
    
    // Display summary
    const totalAssignments = await ForwarderAssignment.countDocuments();
    const totalTasks = await ForwarderAssignment.aggregate([
      { $unwind: '$assignedForwarders' },
      { $count: 'total' }
    ]);

    console.log('\n📊 Summary:');
    console.log(`  - Total assignments: ${totalAssignments}`);
    console.log(`  - Total tasks: ${totalTasks[0]?.total || 0}`);
    console.log(`  - Sub-forwarders: ${subForwarders.length}`);

    // Show task distribution
    console.log('\n📋 Task Distribution:');
    for (const forwarder of subForwarders) {
      const taskCount = await ForwarderAssignment.aggregate([
        { $unwind: '$assignedForwarders' },
        { $match: { 'assignedForwarders.forwarderId': forwarder._id } },
        { $count: 'total' }
      ]);
      
      console.log(`  - ${forwarder.name}: ${taskCount[0]?.total || 0} tasks`);
    }

  } catch (error) {
    console.error('❌ Error assigning tasks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

function getLocationForStage(stage, orderDetails) {
  const locations = {
    pickup: orderDetails?.destination?.city || 'Origin City',
    transit: 'In Transit',
    port_loading: orderDetails?.destination?.city || 'Origin Port',
    on_ship: 'At Sea',
    destination: orderDetails?.destination?.city || 'Destination City'
  };
  
  return locations[stage] || 'TBD';
}

// Run the script
assignTasksFixed();

