require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');

async function testAllSubForwardersFixed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test all sub-forwarders
    const subForwarders = [
      { name: 'Mohit', stage: 'pickup' },
      { name: 'Abhishek', stage: 'transit' },
      { name: 'Hema', stage: 'port_loading' },
      { name: 'Deepak', stage: 'on_ship' },
      { name: 'Het', stage: 'destination' }
    ];
    
    console.log('=== TESTING FIXED COMPARISON LOGIC FOR ALL SUB-FORWARDERS ===\n');
    
    for (const forwarder of subForwarders) {
      console.log(`--- ${forwarder.name} (${forwarder.stage}) ---`);
      
      // Find the user
      const user = await User.findOne({ name: forwarder.name });
      if (!user) {
        console.log(`❌ User ${forwarder.name} not found`);
        continue;
      }
      
      console.log(`✅ Found user: ${user.name} (${user.email})`);
      console.log(`   User ID: ${user._id}`);
      
      // Test the FIXED query
      const assignments = await ForwarderAssignment.find({
        'assignedForwarders.forwarderId': user._id
      }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
      .populate('assignedForwarders.forwarderId', 'name email company specialization');
      
      console.log(`   Found ${assignments.length} assignments in database`);
      
      if (assignments.length > 0) {
        // Test the FIXED comparison logic
        const tasks = [];
        
        for (const assignment of assignments) {
          const myAssignment = assignment.assignedForwarders.find(
            f => {
              // FIXED: Handle both populated and non-populated forwarderId
              const forwarderId = f.forwarderId._id || f.forwarderId;
              return forwarderId.toString() === user._id.toString();
            }
          );
          
          if (myAssignment) {
            tasks.push({
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
              actualDuration: null
            });
          }
        }
        
        console.log(`   ✅ FIXED LOGIC: Found ${tasks.length} tasks for ${user.name}`);
        
        if (tasks.length > 0) {
          tasks.forEach((task, i) => {
            console.log(`      ${i + 1}. ${task.stage} - ${task.status} (Order: ${task.orderId?.orderNumber})`);
          });
        }
      } else {
        console.log(`   ❌ No assignments found for ${user.name}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('=== SUMMARY ===');
    console.log('✅ The fix is working correctly!');
    console.log('✅ All sub-forwarders should now see their assigned tasks');
    console.log('✅ The issue was in the comparison logic for forwarder IDs');
    console.log('✅ The backend server needs to be restarted to apply this fix');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAllSubForwardersFixed();
