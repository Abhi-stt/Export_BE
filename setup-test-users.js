const jwt = require('jsonwebtoken');
const { User } = require('./schemas');
const bcrypt = require('bcryptjs');

// Create test users for different roles
async function setupTestUsers() {
  console.log('👥 Setting up Test Users');
  console.log('========================\n');

  try {
    // Create Exporter user
    let exporter = await User.findOne({ email: 'exporter@test.com' });
    
    if (!exporter) {
      console.log('📝 Creating exporter user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      exporter = new User({
        name: 'Test Exporter',
        email: 'exporter@test.com',
        password: hashedPassword,
        role: 'exporter',
        isActive: true,
        company: 'Test Export Company'
      });
      
      await exporter.save();
      console.log('✅ Exporter user created successfully');
    } else {
      console.log('✅ Exporter user already exists');
    }

    // Create CA user
    let ca = await User.findOne({ email: 'ca@test.com' });
    
    if (!ca) {
      console.log('📝 Creating CA user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      ca = new User({
        name: 'Test CA',
        email: 'ca@test.com',
        password: hashedPassword,
        role: 'ca',
        isActive: true,
        company: 'Test CA Firm'
      });
      
      await ca.save();
      console.log('✅ CA user created successfully');
    } else {
      console.log('✅ CA user already exists');
    }

    // Generate JWT tokens
    const exporterToken = jwt.sign(
      { user: { id: exporter._id, email: exporter.email, role: exporter.role } },
      process.env.JWT_SECRET || 'your_jwt_secret_here',
      { expiresIn: '24h' }
    );

    const caToken = jwt.sign(
      { user: { id: ca._id, email: ca.email, role: ca.role } },
      process.env.JWT_SECRET || 'your_jwt_secret_here',
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Test Users Information:');
    console.log('==========================');
    console.log('\n📦 EXPORTER USER:');
    console.log(`Email: ${exporter.email}`);
    console.log(`Password: test123`);
    console.log(`Role: ${exporter.role}`);
    console.log(`User ID: ${exporter._id}`);
    
    console.log('\n📋 CA USER:');
    console.log(`Email: ${ca.email}`);
    console.log(`Password: test123`);
    console.log(`Role: ${ca.role}`);
    console.log(`User ID: ${ca._id}`);
    
    console.log('\n🎫 JWT Tokens:');
    console.log('==============');
    console.log('\nExporter Token:');
    console.log(exporterToken);
    console.log('\nCA Token:');
    console.log(caToken);
    
    console.log('\n📋 How to test:');
    console.log('===============');
    console.log('1. Login as EXPORTER to create and submit orders');
    console.log('2. Login as CA to review submitted orders');
    console.log('3. Use the tokens above for API testing');
    
    return { exporter, ca, exporterToken, caToken };

  } catch (error) {
    console.error('❌ Error setting up test users:', error.message);
    throw error;
  }
}

// Run the function
setupTestUsers()
  .then(() => {
    console.log('\n✅ Test users setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
