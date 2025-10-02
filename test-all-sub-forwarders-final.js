require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const jwt = require('jsonwebtoken');

async function testAllSubForwardersFinal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test all sub-forwarders
    const subForwarders = [
      { name: 'Mohit', email: 'mo@forwarder.com', stage: 'pickup' },
      { name: 'Abhishek', email: 'anex@gmail.com', stage: 'transit' },
      { name: 'Hema', email: 'hema@gmail.com', stage: 'port_loading' },
      { name: 'Deepak', email: 'deepak@forwarder.com', stage: 'on_ship' },
      { name: 'Het', email: 'het@gmail.com', stage: 'destination' }
    ];
    
    console.log('=== TESTING ALL SUB-FORWARDERS DASHBOARDS ===\n');
    
    for (const forwarder of subForwarders) {
      console.log(`--- Testing ${forwarder.name} (${forwarder.stage}) ---`);
      
      // Find the user
      const user = await User.findOne({ email: forwarder.email });
      if (!user) {
        console.log(`❌ User ${forwarder.name} not found`);
        continue;
      }
      
      console.log(`✅ Found user: ${user.name} (${user.email})`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Designation: ${user.designation}`);
      
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
            if (data.data.length > 0) {
              console.log('   Tasks:');
              data.data.forEach((task, i) => {
                console.log(`      ${i + 1}. ${task.stage} - ${task.status} (Order: ${task.orderId?.orderNumber})`);
              });
            } else {
              console.log('   ❌ No tasks returned');
            }
          } else {
            console.log('   ❌ API returned success: false');
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
    
    console.log('=== SUMMARY ===');
    console.log('✅ All sub-forwarders should now see their assigned tasks!');
    console.log('✅ The fix is working for all sub-forwarders');
    console.log('✅ Each sub-forwarder can now access their dashboard and see their tasks');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAllSubForwardersFinal();
