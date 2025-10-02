const mongoose = require('mongoose');
const User = require('./schemas/User');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');

async function assignTasksToSubForwarders() {
  try {
    console.log('🚀 Starting task assignment to sub-forwarders...');
    
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
      console.log(`  - ${f.name} (${f.email}) - ${f.specialization}`);
    });

    // Get all active shipment orders
    const shipmentOrders = await ShipmentOrder.find({
      status: { $in: ['pending', 'processing', 'confirmed'] }
    }).populate('exporter');

    console.log(`\n📦 Found ${shipmentOrders.length} active shipment orders`);

    if (shipmentOrders.length === 0) {
      console.log('⚠️  No active shipment orders found. Creating sample orders...');
      
      // Create sample shipment orders for testing
      const sampleOrders = [
        {
          orderNumber: 'ORD-001-2024',
          exporter: null, // Will be set later
          status: 'confirmed',
          products: [
            { name: 'Cotton T-Shirts', quantity: 1000, unit: 'pieces', hsCode: '6109.10.00' },
            { name: 'Denim Jeans', quantity: 500, unit: 'pieces', hsCode: '6203.42.00' }
          ],
          orderDetails: {
            origin: { city: 'Mumbai', country: 'India' },
            destination: { city: 'New York', country: 'USA' },
            expectedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          },
          totalValue: 50000,
          currency: 'USD',
          createdAt: new Date(),
          lastUpdated: new Date()
        },
        {
          orderNumber: 'ORD-002-2024',
          exporter: null,
          status: 'processing',
          products: [
            { name: 'Steel Pipes', quantity: 200, unit: 'tons', hsCode: '7306.30.00' },
            { name: 'Aluminum Sheets', quantity: 50, unit: 'tons', hsCode: '7606.12.00' }
          ],
          orderDetails: {
            origin: { city: 'Delhi', country: 'India' },
            destination: { city: 'Hamburg', country: 'Germany' },
            expectedDelivery: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) // 25 days from now
          },
          totalValue: 75000,
          currency: 'USD',
          createdAt: new Date(),
          lastUpdated: new Date()
        }
      ];

      for (const order of sampleOrders) {
        const savedOrder = await ShipmentOrder.create(order);
        console.log(`✅ Created sample order: ${savedOrder.orderNumber}`);
      }

      // Refresh shipment orders
      const updatedOrders = await ShipmentOrder.find({
        status: { $in: ['pending', 'processing', 'confirmed'] }
      });
      shipmentOrders.push(...updatedOrders);
    }

    // Assign tasks to sub-forwarders based on their specialization
    for (const order of shipmentOrders) {
      console.log(`\n📦 Processing order: ${order.orderNumber}`);
      
      // Check if assignment already exists
      let assignment = await ForwarderAssignment.findOne({ orderId: order._id });
      
      if (!assignment) {
        // Create new assignment
        assignment = new ForwarderAssignment({
          orderId: order._id,
          assignedForwarders: [],
          createdAt: new Date(),
          lastUpdated: new Date()
        });
      }

      // Define stages and their requirements
      const stages = [
        { name: 'pickup', specializations: ['pickup', 'logistics'] },
        { name: 'transit', specializations: ['transit', 'logistics'] },
        { name: 'port_loading', specializations: ['port loading', 'logistics'] },
        { name: 'on_ship', specializations: ['on-ship', 'shipping'] },
        { name: 'destination_unloading', specializations: ['destination unloading', 'logistics'] }
      ];

      // Assign each stage to appropriate sub-forwarders
      for (const stage of stages) {
        // Check if stage is already assigned
        const existingAssignment = assignment.assignedForwarders.find(
          f => f.stage === stage.name
        );

        if (!existingAssignment) {
          // Find suitable sub-forwarder
          const suitableForwarder = subForwarders.find(forwarder => 
            stage.specializations.some(spec => 
              forwarder.specialization.toLowerCase().includes(spec.toLowerCase())
            )
          );

          if (suitableForwarder) {
            // Calculate due date based on stage
            const baseDate = new Date();
            const stageDays = {
              pickup: 1,
              transit: 3,
              port_loading: 2,
              on_ship: 7,
              destination_unloading: 2
            };
            
            const dueDate = new Date(baseDate.getTime() + (stageDays[stage.name] || 1) * 24 * 60 * 60 * 1000);

            assignment.assignedForwarders.push({
              forwarderId: suitableForwarder._id,
              stage: stage.name,
              status: 'pending',
              assignedDate: new Date(),
              dueDate: dueDate,
              priority: 'medium',
              estimatedDuration: stageDays[stage.name] * 24, // Convert to hours
              location: getLocationForStage(stage.name, order.orderDetails),
              notes: `Handle ${stage.name.replace('_', ' ')} for order ${order.orderNumber}`
            });

            console.log(`  ✅ Assigned ${stage.name} to ${suitableForwarder.name}`);
          } else {
            console.log(`  ⚠️  No suitable forwarder found for ${stage.name}`);
          }
        } else {
          console.log(`  ℹ️  ${stage.name} already assigned to ${existingAssignment.forwarderId}`);
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

  } catch (error) {
    console.error('❌ Error assigning tasks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

function getLocationForStage(stage, orderDetails) {
  const locations = {
    pickup: orderDetails?.origin?.city || 'Origin City',
    transit: 'In Transit',
    port_loading: orderDetails?.origin?.city || 'Origin Port',
    on_ship: 'At Sea',
    destination_unloading: orderDetails?.destination?.city || 'Destination City'
  };
  
  return locations[stage] || 'TBD';
}

// Run the script
assignTasksToSubForwarders();

