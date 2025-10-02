/**
 * Set default passwords for existing forwarders
 * This script sets a default password 'forwarder123' for all forwarders that don't have a password
 * Run with: node set-default-forwarder-passwords.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./schemas/User');

async function setDefaultPasswords() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all forwarder users
    const forwarders = await User.find({ role: 'forwarder' });

    console.log(`📊 Found ${forwarders.length} forwarder(s)\n`);
    
    // Default password for existing forwarders
    const defaultPassword = 'forwarder123';
    const salt = await bcrypt.genSalt(10);
    const hashedDefaultPassword = await bcrypt.hash(defaultPassword, salt);

    let updatedCount = 0;
    let alreadyHadPassword = 0;

    for (const forwarder of forwarders) {
      console.log(`\n👤 ${forwarder.name} (${forwarder.email})`);
      console.log(`   Designation: ${forwarder.designation || 'Not set'}`);
      
      // Check if user has a password
      if (!forwarder.password) {
        forwarder.password = hashedDefaultPassword;
        await forwarder.save();
        console.log(`   ✅ Password set to: ${defaultPassword}`);
        updatedCount++;
      } else {
        // Check if it's already the default password
        const isDefaultPwd = await bcrypt.compare(defaultPassword, forwarder.password);
        if (isDefaultPwd) {
          console.log(`   ✅ Already has default password: ${defaultPassword}`);
        } else {
          console.log(`   ✅ Already has custom password (keeping existing)`);
        }
        alreadyHadPassword++;
      }
      
      // Set designation if not set
      if (!forwarder.designation) {
        forwarder.designation = 'Forwarder';
        await forwarder.save();
        console.log(`   📝 Designation set to: Forwarder`);
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total forwarders: ${forwarders.length}`);
    console.log(`Passwords set: ${updatedCount}`);
    console.log(`Already had passwords: ${alreadyHadPassword}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 ALL FORWARDER CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const forwarder of forwarders) {
      const isDefaultPwd = await bcrypt.compare(defaultPassword, forwarder.password);
      console.log(`👤 ${forwarder.name}`);
      console.log(`   Email: ${forwarder.email}`);
      console.log(`   Password: ${isDefaultPwd ? defaultPassword : '(custom password)'}`);
      console.log(`   Role: ${forwarder.designation || 'Forwarder'}`);
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 TIP: You can now update passwords via the UI:');
    console.log('   1. Login as Forwarder Admin (forwarder@export.com / forwarder123)');
    console.log('   2. Go to Dashboard → Management Tab');
    console.log('   3. Click Edit button on any forwarder');
    console.log('   4. Enter a new password and save\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('✅ All forwarders now have passwords!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setDefaultPasswords();

