const jwt = require('jsonwebtoken');
const { User } = require('./schemas');
const bcrypt = require('bcryptjs');

// Create a test user and generate a valid token
async function createTestUser() {
  console.log('👤 Creating Test User and Token');
  console.log('================================\n');

  try {
    // Check if test user already exists
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('📝 Creating new test user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      // Create user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        isActive: true
      });
      
      await testUser.save();
      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user already exists');
    }

    // Generate JWT token
    const payload = {
      user: {
        id: testUser._id,
        email: testUser.email,
        role: testUser.role
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_here', {
      expiresIn: '24h'
    });

    console.log('\n🔑 Test User Information:');
    console.log('=========================');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: test123`);
    console.log(`Role: ${testUser.role}`);
    console.log(`User ID: ${testUser._id}`);
    
    console.log('\n🎫 JWT Token:');
    console.log('=============');
    console.log(token);
    
    console.log('\n📋 How to use:');
    console.log('==============');
    console.log('1. Copy the token above');
    console.log('2. In your browser, open Developer Tools (F12)');
    console.log('3. Go to Application/Storage > Local Storage');
    console.log('4. Set key: "token", value: [paste the token]');
    console.log('5. Refresh the page and try uploading again');
    
    console.log('\n🧪 Test Commands:');
    console.log('==================');
    console.log(`curl -X POST http://localhost:5000/api/documents/upload \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -F "document=@test-file.jpg" \\`);
    console.log(`  -F "documentType=invoice" \\`);
    console.log(`  -F "description=Test upload"`);

    return { user: testUser, token };

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

// Run the function
createTestUser()
  .then(() => {
    console.log('\n✅ Test user setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });

