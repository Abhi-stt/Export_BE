// Test with Forwarder Admin to see what JWT_SECRET the server is using
const axios = require('axios');

async function testForwarderAdmin() {
  console.log('🧪 Testing Forwarder Admin to Check Server JWT_SECRET:');
  console.log('======================================================\n');

  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'forwarder@export.com',
      password: 'forwarder123'
    });

    if (response.data.success) {
      console.log(`✅ Forwarder Admin login successful!`);
      console.log(`   Name: ${response.data.data.user.name}`);
      console.log(`   Role: ${response.data.data.user.role}`);
      console.log(`   Token: ${response.data.data.token ? 'Generated' : 'Missing'}`);
      
      const token = response.data.data.token;
      console.log(`   Token preview: ${token.substring(0, 50)}...`);
      
      // Test /api/users/me endpoint
      try {
        const meResponse = await axios.get('http://localhost:5000/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (meResponse.data.success) {
          console.log(`✅ /api/users/me working!`);
          console.log(`   User data:`, meResponse.data.data);
        } else {
          console.log(`❌ /api/users/me failed: ${meResponse.data.message}`);
        }
      } catch (meError) {
        console.log(`❌ /api/users/me error: ${meError.response?.data?.message || meError.message}`);
      }
      
    } else {
      console.log(`❌ Forwarder Admin login failed: ${response.data.message}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Forwarder Admin test failed: ${error.response.data.message}`);
      console.log(`   Status: ${error.response.status}`);
    } else {
      console.log(`❌ Network error: ${error.message}`);
    }
  }

  console.log('\n🎯 CONCLUSION:');
  console.log('==============');
  console.log('If Forwarder Admin works but sub-forwarders don\'t,');
  console.log('the issue is with the sub-forwarder passwords in the database.');
  console.log('\nTry logging in with Forwarder Admin first to confirm server is working:');
  console.log('• Forwarder Admin: forwarder@export.com / forwarder123');
}

testForwarderAdmin().catch(console.error);
