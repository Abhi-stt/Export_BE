require('dotenv').config();
const mongoose = require('mongoose');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const User = require('./schemas/User');
const ShipmentOrder = require('./schemas/ShipmentOrder');

async function checkSpecificForwarderTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get specific forwarders by name
    const forwarderNames = ['Abhishek', 'Mohit', 'Hema', 'Deepak', 'Het'];
    
    console.log('=== Checking tasks for specific forwarders ===');
    
    for (const name of forwarderNames) {
      console.log(`\n--- ${name} ---`);
      
      // Find the user
      const user = await User.findOne({ name: name });
      if (!user) {
        console.log(`User ${name} not found`);
        continue;
      }
      
      console.log(`Found user: ${user.name} (${user.email})`);
      console.log(`User ID: ${user._id}`);
      console.log(`Role: ${user.role}, Designation: ${user.designation}`);
      
      // Check assignments for this user
      const assignments = await ForwarderAssignment.find({
        'assignedForwarders.forwarderId': user._id
      }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
      .populate('assignedForwarders.forwarderId', 'name email company specialization');
      
      console.log(`Found ${assignments.length} assignments for ${name}`);
      
      if (assignments.length > 0) {
        assignments.forEach((assignment, i) => {
          console.log(`\n  Assignment ${i + 1}:`);
          console.log(`    Order: ${assignment.orderId?.orderNumber || 'No order'}`);
          console.log(`    Assigned Forwarders: ${assignment.assignedForwarders.length}`);
          
          assignment.assignedForwarders.forEach((f, j) => {
            console.log(`      ${j + 1}. Stage: ${f.stage}, Status: ${f.status}`);
            console.log(`         Forwarder ID: ${f.forwarderId}`);
            console.log(`         Forwarder Name: ${f.forwarderId?.name || 'Not populated'}`);
            console.log(`         Matches user: ${f.forwarderId.toString() === user._id.toString()}`);
          });
          
          // Find this user's specific assignment
          const myAssignment = assignment.assignedForwarders.find(
            f => f.forwarderId.toString() === user._id.toString()
          );
          
          if (myAssignment) {
            console.log(`    ✅ ${name}'s assignment found:`);
            console.log(`       Stage: ${myAssignment.stage}`);
            console.log(`       Status: ${myAssignment.status}`);
            console.log(`       Assigned At: ${myAssignment.assignedAt}`);
            console.log(`       Notes: ${myAssignment.notes || 'None'}`);
          } else {
            console.log(`    ❌ ${name}'s assignment NOT found in this assignment`);
          }
        });
      } else {
        console.log(`  No assignments found for ${name}`);
        
        // Let's check if there are any assignments with this user's ID in a different format
        const allAssignments = await ForwarderAssignment.find({});
        console.log(`  Checking all ${allAssignments.length} assignments for ${name}'s ID...`);
        
        allAssignments.forEach((assignment, i) => {
          const hasUser = assignment.assignedForwarders.some(f => 
            f.forwarderId.toString() === user._id.toString()
          );
          if (hasUser) {
            console.log(`    Found ${name} in assignment ${i + 1} (${assignment._id})`);
          }
        });
      }
    }
    
    // Also check all assignments to see what forwarder IDs are actually stored
    console.log('\n=== All Assignment Forwarder IDs ===');
    const allAssignments = await ForwarderAssignment.find({});
    const allForwarderIds = new Set();
    
    allAssignments.forEach((assignment, i) => {
      console.log(`Assignment ${i + 1} (${assignment._id}):`);
      assignment.assignedForwarders.forEach((f, j) => {
        console.log(`  ${j + 1}. Stage: ${f.stage}, Forwarder ID: ${f.forwarderId}`);
        allForwarderIds.add(f.forwarderId.toString());
      });
    });
    
    console.log('\nUnique forwarder IDs in assignments:', Array.from(allForwarderIds));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpecificForwarderTasks();
