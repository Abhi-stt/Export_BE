require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const jwt = require('jsonwebtoken');

async function testServerDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find Abhishek user
    const user = await User.findOne({ email: 'anex@gmail.com' });
    
    if (!user) {
      console.log('Abhishek not found');
      return;
    }
    
    console.log('Testing server debug with Abhishek:', user.name);
    
    // Create a JWT token
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\n🔍 Making API call...');
    console.log('   Server should show debugging logs in its console');
    
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
          console.log(`✅ Server returned ${data.data.length} tasks`);
          if (data.data.length > 0) {
            console.log('Tasks:');
            data.data.forEach((task, i) => {
              console.log(`  ${i + 1}. ${task.stage} - ${task.status} (Order: ${task.orderId?.orderNumber})`);
            });
          }
        } else {
          console.log('❌ Server returned success: true but data is empty');
          console.log('   This suggests the server is running the old code');
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', response.status, errorText);
      }
    } catch (apiError) {
      console.log('❌ API Request failed:', apiError.message);
    }
    
    console.log('\n🔍 IMPORTANT: Check the server console!');
    console.log('   Look for these logs in the server console:');
    console.log('   - "🚀 UPDATED CODE RUNNING - /api/forwarder/my-tasks called for user:"');
    console.log('   - "🔍 Found assignments: X"');
    console.log('   - "🔍 Processing assignment:"');
    console.log('   - "✅ Found my assignment:"');
    console.log('   - "🔍 Final tasks count: X"');
    console.log('');
    console.log('   If you DON\'T see these logs, the server is still running the old code');
    console.log('   and needs to be restarted properly.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testServerDebug();
