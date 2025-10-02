require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const jwt = require('jsonwebtoken');

async function testFixedServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test with Abhishek
    const user = await User.findOne({ name: 'Abhishek' });
    
    if (!user) {
      console.log('Abhishek not found');
      return;
    }
    
    console.log('Testing with user:', user.name, '(' + user.email + ')');
    
    // Create a JWT token
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\nTesting FIXED server on port 5001...');
    
    // Test the FIXED API endpoint
    const response = await fetch('http://localhost:5001/api/forwarder/my-tasks', {
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
        console.log(`\n✅ SUCCESS! Found ${data.data.length} tasks for ${user.name}`);
        data.data.forEach((task, i) => {
          console.log(`  ${i + 1}. ${task.stage} - ${task.status} (Order: ${task.orderId?.orderNumber})`);
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

testFixedServer();
