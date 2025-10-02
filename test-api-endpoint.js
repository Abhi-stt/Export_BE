require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const jwt = require('jsonwebtoken');

async function testAPIEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find Abhishek user
    const user = await User.findOne({ name: 'Abhishek' });
    
    if (!user) {
      console.log('Abhishek not found');
      return;
    }
    
    console.log('Found user:', user.name, '(' + user.email + ')');
    console.log('User ID:', user._id);
    
    // Create a JWT token
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\nGenerated JWT token');
    
    // Test the API endpoint
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
      console.log('API Response Data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        console.log(`\n✅ Success! Found ${data.data.length} tasks for ${user.name}`);
        data.data.forEach((task, i) => {
          console.log(`  Task ${i + 1}:`);
          console.log(`    Stage: ${task.stage}`);
          console.log(`    Status: ${task.status}`);
          console.log(`    Order: ${task.orderId?.orderNumber || 'No order'}`);
        });
      } else {
        console.log('❌ API returned success: false');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, errorText);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPIEndpoint();
