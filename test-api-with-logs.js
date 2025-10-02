require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const jwt = require('jsonwebtoken');

async function testAPIWithLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find Abhishek user
    const user = await User.findOne({ email: 'anex@gmail.com' });
    
    if (!user) {
      console.log('Abhishek not found');
      return;
    }
    
    console.log('Testing API with Abhishek:', user.name);
    
    // Create a JWT token
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\n🔍 Calling API endpoint...');
    console.log('   This should trigger debugging logs in the server console');
    console.log('   Look for logs starting with "🚀 UPDATED CODE RUNNING"');
    
    try {
      const response = await fetch('http://localhost:5000/api/forwarder/my-tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data) {
          console.log(`✅ Found ${data.data.length} tasks`);
          if (data.data.length > 0) {
            console.log('Tasks:');
            data.data.forEach((task, i) => {
              console.log(`  ${i + 1}. ${task.stage} - ${task.status} (Order: ${task.orderId?.orderNumber})`);
            });
          }
        } else {
          console.log('❌ No tasks returned');
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', response.status, errorText);
      }
    } catch (apiError) {
      console.log('❌ API Request failed:', apiError.message);
    }
    
    console.log('\n🔍 Check the server console for debugging logs!');
    console.log('   If you see "🚀 UPDATED CODE RUNNING" logs, the server is running the new code');
    console.log('   If you don\'t see those logs, the server is still running the old code');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPIWithLogs();
