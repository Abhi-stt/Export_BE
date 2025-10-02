const axios = require('axios');

async function testUsersMeEndpoint() {
  console.log('🧪 Testing /api/users/me endpoint:');
  console.log('==================================\n');

  try {
    // First, login to get a token
    console.log('1. Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'r12@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log(`❌ Login failed: ${loginResponse.data.message}`);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log(`✅ Login successful! Token: ${token.substring(0, 50)}...`);

    // Test /api/users/me endpoint
    console.log('\n2. Testing /api/users/me endpoint...');
    const meResponse = await axios.get('http://localhost:5000/api/users/me', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (meResponse.data.success) {
      console.log(`✅ /api/users/me successful!`);
      console.log(`   User: ${meResponse.data.data.name}`);
      console.log(`   Email: ${meResponse.data.data.email}`);
      console.log(`   Role: ${meResponse.data.data.role}`);
      console.log(`   Status: ${meResponse.data.data.status}`);
      console.log(`   Designation: ${meResponse.data.data.designation}`);
    } else {
      console.log(`❌ /api/users/me failed: ${meResponse.data.message}`);
    }

  } catch (error) {
    if (error.response) {
      console.log(`❌ Error: ${error.response.status} - ${error.response.data.message || error.response.data}`);
      if (error.response.data.error) {
        console.log(`   Details: ${error.response.data.error}`);
      }
    } else {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
}

testUsersMeEndpoint();
