// Test with the correct JWT_SECRET from .env
process.env.JWT_SECRET = 'sfdjklsdkfjsdfksjl';

const axios = require('axios');

async function testWithCorrectJWT() {
  console.log('🧪 Testing with Correct JWT_SECRET:');
  console.log('===================================\n');

  console.log(`JWT_SECRET: ${process.env.JWT_SECRET}`);

  const credentials = [
    { name: 'Raj', email: 'r12@gmail.com', password: 'password123' },
    { name: 'Harsh', email: 'het@gmail.com', password: 'password123' },
    { name: 'Abhishek', email: 'anex@gmail.com', password: 'password123' },
    { name: 'Hema', email: 'hema@gmail.com', password: 'password123' },
    { name: 'Mohit', email: 'mo@forwarder.com', password: 'password123' },
    { name: 'Deepak', email: 'deepak@forwarder.com', password: 'password123' }
  ];

  let successCount = 0;

  for (const user of credentials) {
    console.log(`📧 Testing: ${user.name} (${user.email})`);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: user.email,
        password: user.password
      });

      if (response.data.success) {
        console.log(`✅ Login successful!`);
        console.log(`   Name: ${response.data.data.user.name}`);
        console.log(`   Role: ${response.data.data.user.role}`);
        console.log(`   Designation: ${response.data.data.user.designation}`);
        
        successCount++;
        
      } else {
        console.log(`❌ Login failed: ${response.data.message}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Login failed: ${error.response.data.message}`);
      } else {
        console.log(`❌ Network error: ${error.message}`);
      }
    }
    
    console.log('   ---');
  }

  console.log(`\n📊 Results: ${successCount}/${credentials.length} successful logins`);

  if (successCount > 0) {
    console.log('\n🎯 WORKING CREDENTIALS:');
    console.log('=======================');
    credentials.forEach(c => {
      console.log(`• ${c.name}: ${c.email} / ${c.password}`);
    });
  }
}

testWithCorrectJWT().catch(console.error);
