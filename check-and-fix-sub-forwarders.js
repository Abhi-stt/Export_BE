const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./schemas/User');

async function checkAndFixSubForwarders() {
  try {
    console.log('🔍 Checking and Fixing Sub-Forwarder Passwords:');
    console.log('==============================================\n');

    await mongoose.connect('mongodb://localhost:27017/export-project');
    console.log('✅ Connected to MongoDB');

    const subForwarders = [
      { name: 'Raj', email: 'r12@gmail.com' },
      { name: 'Harsh', email: 'het@gmail.com' },
      { name: 'Abhishek Dash', email: 'anex@gmail.com' },
      { name: 'Hema', email: 'hema@gmail.com' },
      { name: 'Mohit', email: 'mo@forwarder.com' },
      { name: 'Deepak', email: 'deepak@forwarder.com' }
    ];

    for (const forwarder of subForwarders) {
      console.log(`📧 Checking: ${forwarder.name} (${forwarder.email})`);
      
      const user = await User.findOne({ email: forwarder.email });
      
      if (!user) {
        console.log(`❌ User not found`);
        continue;
      }

      console.log(`✅ User found: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Designation: ${user.designation}`);

      // Set password to a simple one that works
      const newPassword = 'password123';
      console.log(`🔧 Setting password to: ${newPassword}`);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      user.password = hashedPassword;
      user.status = 'active';
      user.loginAttempts = 0;
      user.lockUntil = null;
      
      await user.save();
      
      console.log(`✅ Password updated successfully`);
      
      // Test the password
      const isPasswordValid = await bcrypt.compare(newPassword, user.password);
      console.log(`✅ Password verification: ${isPasswordValid ? 'Valid' : 'Invalid'}`);
      
      console.log('   ---');
    }

    console.log('\n🎯 WORKING SUB-FORWARDER CREDENTIALS:');
    console.log('====================================');
    console.log('All sub-forwarders now use: password123');
    subForwarders.forEach(f => {
      console.log(`• ${f.name}: ${f.email} / password123`);
    });

    console.log('\n✅ All sub-forwarder passwords have been fixed!');
    console.log('You can now test the login flow with these credentials.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAndFixSubForwarders();
