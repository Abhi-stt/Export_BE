const mongoose = require('mongoose');
const User = require('./schemas/User');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-export-project');
    console.log('✅ Connected to MongoDB');

    const users = await User.find({}).select('name email role status');
    console.log('👥 Users in database:');
    console.log('==================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log('   ---');
    });

    // Check for admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`\n🔑 Admin users found: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found! You need to create an admin user first.');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUsers();
