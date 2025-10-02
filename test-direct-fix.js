require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');

async function testDirectFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test with Abhishek (transit forwarder)
    const user = await User.findOne({ name: 'Abhishek' });
    
    if (!user) {
      console.log('Abhishek not found');
      return;
    }
    
    console.log('Testing with user:', user.name, '(' + user.email + ')');
    console.log('User ID:', user._id);
    
    // Test the exact query that the API uses
    const assignments = await ForwarderAssignment.find({
      'assignedForwarders.forwarderId': user._id
    }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
    .populate('assignedForwarders.forwarderId', 'name email company specialization');
    
    console.log('\nFound assignments:', assignments.length);
    
    if (assignments.length > 0) {
      console.log('\nTesting the fixed comparison logic...');
      
      const tasks = [];
      
      for (const assignment of assignments) {
        console.log('\nProcessing assignment:', assignment._id);
        console.log('Order:', assignment.orderId?.orderNumber);
        console.log('Assigned Forwarders:', assignment.assignedForwarders.length);
        
        // Test the FIXED comparison logic
        const myAssignment = assignment.assignedForwarders.find(
          f => {
            // Handle both populated and non-populated forwarderId
            const forwarderId = f.forwarderId._id || f.forwarderId;
            const matches = forwarderId.toString() === user._id.toString();
            console.log('  Checking forwarder:', forwarderId.toString(), 'vs', user._id.toString(), 'matches:', matches);
            return matches;
          }
        );
        
        if (myAssignment) {
          console.log('  ✅ Found my assignment:', myAssignment.stage, myAssignment.status);
          
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
            actualDuration: null
          };
          
          tasks.push(task);
          console.log('  ✅ Task created:', task.stage, task.status);
        } else {
          console.log('  ❌ No assignment found for current user');
        }
      }
      
      console.log('\n=== FINAL RESULT ===');
      console.log('Total tasks found:', tasks.length);
      
      if (tasks.length > 0) {
        console.log('\nTasks for', user.name, ':');
        tasks.forEach((task, i) => {
          console.log(`  ${i + 1}. ${task.stage} - ${task.status} (Order: ${task.orderId?.orderNumber})`);
        });
        
        console.log('\n✅ SUCCESS! The fix works - sub-forwarders should see their tasks!');
      } else {
        console.log('\n❌ FAILED! No tasks found - the fix is not working');
      }
    } else {
      console.log('No assignments found for this user');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDirectFix();
