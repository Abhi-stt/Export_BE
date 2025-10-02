require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const jwt = require('jsonwebtoken');

async function testAllSubForwarders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test specific sub-forwarders
    const subForwarders = [
      { name: 'Mohit', stage: 'pickup' },
      { name: 'Abhishek', stage: 'transit' },
      { name: 'Hema', stage: 'port_loading' },
      { name: 'Deepak', stage: 'on_ship' },
      { name: 'Het', stage: 'destination' }
    ];
    
    console.log('=== Testing API for all sub-forwarders ===\n');
    
    for (const forwarder of subForwarders) {
      console.log(`--- Testing ${forwarder.name} (${forwarder.stage}) ---`);
      
      // Find the user
      const user = await User.findOne({ name: forwarder.name });
      if (!user) {
        console.log(`❌ User ${forwarder.name} not found`);
        continue;
      }
      
      console.log(`✅ Found user: ${user.name} (${user.email})`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Designation: ${user.designation}`);
      
      // Test the database query directly
      const assignments = await ForwarderAssignment.find({
        'assignedForwarders.forwarderId': user._id
      }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
      .populate('assignedForwarders.forwarderId', 'name email company specialization');
      
      console.log(`   Found ${assignments.length} assignments in database`);
      
      if (assignments.length > 0) {
        // Test the comparison logic
        let foundTasks = 0;
        assignments.forEach((assignment, i) => {
          const myAssignment = assignment.assignedForwarders.find(
            f => {
              const forwarderId = f.forwarderId._id || f.forwarderId;
              return forwarderId.toString() === user._id.toString();
            }
          );
          
          if (myAssignment) {
            foundTasks++;
            console.log(`   ✅ Task ${foundTasks}: ${myAssignment.stage} - ${myAssignment.status}`);
            console.log(`      Order: ${assignment.orderId?.orderNumber || 'No order'}`);
          }
        });
        
        console.log(`   Total tasks found: ${foundTasks}`);
      }
      
      // Test the API endpoint
      const token = jwt.sign(
        { user: { id: user._id, role: user.role } },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      try {
        const response = await fetch('http://localhost:5000/api/forwarder/my-tasks', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log(`   ✅ API returned ${data.data.length} tasks`);
            data.data.forEach((task, i) => {
              console.log(`      Task ${i + 1}: ${task.stage} - ${task.status}`);
            });
          } else {
            console.log(`   ❌ API returned success: false`);
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ API Error: ${response.status} - ${errorText}`);
        }
      } catch (apiError) {
        console.log(`   ❌ API Request failed: ${apiError.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Also check what assignments exist in the database
    console.log('=== All Assignments in Database ===');
    const allAssignments = await ForwarderAssignment.find({}).populate('orderId', 'orderNumber');
    console.log(`Total assignments: ${allAssignments.length}`);
    
    allAssignments.forEach((assignment, i) => {
      console.log(`\nAssignment ${i + 1} (${assignment._id}):`);
      console.log(`  Order: ${assignment.orderId?.orderNumber || 'No order'}`);
      console.log(`  Assigned Forwarders: ${assignment.assignedForwarders.length}`);
      
      assignment.assignedForwarders.forEach((f, j) => {
        const forwarderId = f.forwarderId._id || f.forwarderId;
        console.log(`    ${j + 1}. Stage: ${f.stage}, Status: ${f.status}, Forwarder ID: ${forwarderId}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAllSubForwarders();
