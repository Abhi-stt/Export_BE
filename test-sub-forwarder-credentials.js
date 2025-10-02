// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'your_super_secret_jwt_key_for_testing_only';

const axios = require('axios');

async function testSubForwarderCredentials() {
  console.log('🧪 Testing Sub-Forwarder Credentials:');
  console.log('====================================\n');

  const credentials = [
    { name: 'Raj', email: 'r12@gmail.com', password: 'password123' },
    { name: 'Harsh', email: 'het@gmail.com', password: 'password123' },
    { name: 'Abhishek Dash', email: 'anex@gmail.com', password: 'password123' },
    { name: 'Hema', email: 'hema@gmail.com', password: 'password123' },
    { name: 'Mohit', email: 'mo@forwarder.com', password: 'password123' },
    { name: 'Deepak', email: 'deepak@forwarder.com', password: 'password123' }
  ];

  let successCount = 0;
  let totalCount = credentials.length;

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
        console.log(`   Token: ${response.data.data.token ? 'Generated' : 'Missing'}`);
        
        // Test /api/users/me endpoint
        const token = response.data.data.token;
        try {
          const meResponse = await axios.get('http://localhost:5000/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (meResponse.data.success) {
            console.log(`✅ /api/users/me working!`);
          } else {
            console.log(`❌ /api/users/me failed: ${meResponse.data.message}`);
          }
        } catch (meError) {
          console.log(`❌ /api/users/me error: ${meError.response?.data?.message || meError.message}`);
        }
        
        successCount++;
        
      } else {
        console.log(`❌ Login failed: ${response.data.message}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Login failed: ${error.response.data.message}`);
        console.log(`   Status: ${error.response.status}`);
      } else {
        console.log(`❌ Network error: ${error.message}`);
      }
    }
    
    console.log('   ---');
  }

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Successful logins: ${successCount}/${totalCount}`);
  console.log(`❌ Failed logins: ${totalCount - successCount}/${totalCount}`);

  if (successCount > 0) {
    console.log('\n🎯 WORKING SUB-FORWARDER CREDENTIALS:');
    console.log('====================================');
    console.log('Use these credentials to test the login flow:');
    credentials.forEach(c => {
      console.log(`• ${c.name}: ${c.email} / ${c.password}`);
    });
    
    console.log('\n📱 After login, you will be redirected to:');
    console.log('→ /sub-forwarder-dashboard (My Tasks view)');
  } else {
    console.log('\n⚠️  No credentials are working. Check server JWT_SECRET.');
  }
}

testSubForwarderCredentials().catch(console.error);
