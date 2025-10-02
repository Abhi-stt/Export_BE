require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const jwt = require('jsonwebtoken');

async function testAbhishekAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find Abhishek user
    const user = await User.findOne({ email: 'anex@gmail.com' });
    
    if (!user) {
      console.log('❌ Abhishek not found');
      return;
    }
    
    console.log('✅ Found Abhishek:', user.name, '(' + user.email + ')');
    console.log('   User ID:', user._id);
    console.log('   Role:', user.role);
    console.log('   Designation:', user.designation);
    
    // Test the database query directly
    console.log('\n=== Testing Database Query ===');
    const assignments = await ForwarderAssignment.find({
      'assignedForwarders.forwarderId': user._id
    }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
    .populate('assignedForwarders.forwarderId', 'name email company specialization');
    
    console.log('Found assignments:', assignments.length);
    
    if (assignments.length > 0) {
      console.log('\nAssignment details:');
      assignments.forEach((assignment, i) => {
        console.log(`\nAssignment ${i + 1}:`);
        console.log('  Order:', assignment.orderId?.orderNumber);
        console.log('  Assigned Forwarders:', assignment.assignedForwarders.length);
        
        assignment.assignedForwarders.forEach((f, j) => {
          const forwarderId = f.forwarderId._id || f.forwarderId;
          const matches = forwarderId.toString() === user._id.toString();
          console.log(`    ${j + 1}. Stage: ${f.stage}, Status: ${f.status}, Matches: ${matches}`);
        });
      });
      
      // Test the FIXED comparison logic
      console.log('\n=== Testing FIXED Comparison Logic ===');
      const tasks = [];
      
      for (const assignment of assignments) {
        const myAssignment = assignment.assignedForwarders.find(
          f => {
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
      
      console.log('✅ Tasks found with FIXED logic:', tasks.length);
      tasks.forEach((task, i) => {
        console.log(`  ${i + 1}. ${task.stage} - ${task.status} (Order: ${task.orderId?.orderNumber})`);
      });
    } else {
      console.log('❌ No assignments found for Abhishek');
    }
    
    // Test the API endpoint
    console.log('\n=== Testing API Endpoint ===');
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Generated JWT token');
    
    try {
      const response = await fetch('http://localhost:5000/api/forwarder/my-tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data) {
          console.log(`✅ API returned ${data.data.length} tasks`);
        } else {
          console.log('❌ API returned success: false');
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', response.status, errorText);
      }
    } catch (apiError) {
      console.log('❌ API Request failed:', apiError.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAbhishekAPI();
