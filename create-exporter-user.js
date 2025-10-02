const mongoose = require('mongoose');
const { User } = require('./schemas');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createExporterUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-export-project');
    console.log('Connected to MongoDB');

    // Check if exporter already exists
    let exporter = await User.findOne({ email: 'exporter@test.com' });
    
    if (!exporter) {
      console.log('Creating exporter user...');
      
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

    // Generate JWT token
    const token = jwt.sign(
      { user: { id: exporter._id, email: exporter.email, role: exporter.role } },
      process.env.JWT_SECRET || 'your_jwt_secret_here',
      { expiresIn: '24h' }
    );

    console.log('\n🔑 EXPORTER LOGIN CREDENTIALS:');
    console.log('==============================');
    console.log(`Email: ${exporter.email}`);
    console.log(`Password: test123`);
    console.log(`Role: ${exporter.role}`);
    console.log(`User ID: ${exporter._id}`);
    
    console.log('\n🎫 JWT Token (for testing):');
    console.log(token);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. Logout from current account');
    console.log('2. Login with: exporter@test.com / test123');
    console.log('3. Create and submit your order');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createExporterUser();
