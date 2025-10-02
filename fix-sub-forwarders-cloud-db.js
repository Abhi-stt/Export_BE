const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./schemas/User');

async function fixSubForwardersCloudDB() {
  try {
    console.log('🔍 Fixing Sub-Forwarders in Cloud Database:');
    console.log('==========================================\n');

    // Connect to the cloud database that the server is using
    const cloudUri = 'mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export';
    await mongoose.connect(cloudUri);
    console.log('✅ Connected to Cloud MongoDB');

    const subForwarders = [
      { name: 'Raj', email: 'r12@gmail.com', company: 'HTY', specialization: 'Pickup' },
      { name: 'Harsh', email: 'het@gmail.com', company: 'TCE', specialization: 'Destination Unloading' },
      { name: 'Abhishek Dash', email: 'anex@gmail.com', company: 'TCS', specialization: 'Transit' },
      { name: 'Hema', email: 'hema@gmail.com', company: 'NET', specialization: 'Port Loading' },
      { name: 'Mohit', email: 'mo@forwarder.com', company: 'Ola', specialization: 'Pickup' },
      { name: 'Deepak', email: 'deepak@forwarder.com', company: 'NRT', specialization: 'On-Ship' }
    ];

    for (const forwarder of subForwarders) {
      console.log(`📧 Processing: ${forwarder.name} (${forwarder.email})`);
      
      // Check if user exists
      let user = await User.findOne({ email: forwarder.email });
      
      if (!user) {
        console.log(`   Creating new user: ${forwarder.name}`);
        
        // Create new user
        const defaultPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);
        
        user = new User({
          name: forwarder.name,
          email: forwarder.email,
          password: hashedPassword,
          role: 'forwarder',
          designation: `${forwarder.specialization} Forwarder`,
          phone: '1234567890',
          company: forwarder.company,
          status: 'active',
          specialization: forwarder.specialization.toLowerCase().replace(' ', '_'),
          workingDays: 5,
          rating: 0.0,
          totalShipments: 0,
          completedShipments: 0
        });
        
        await user.save();
        console.log(`✅ Created: ${forwarder.name} with password: ${defaultPassword}`);
        
      } else {
        console.log(`   Updating existing user: ${user.name}`);
        
        // Update password
        const newPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        user.password = hashedPassword;
        user.status = 'active';
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.company = forwarder.company;
        user.designation = `${forwarder.specialization} Forwarder`;
        
        await user.save();
        console.log(`✅ Updated: ${forwarder.name} with password: ${newPassword}`);
      }
      
      console.log('   ---');
    }

    console.log('\n🎯 WORKING SUB-FORWARDER CREDENTIALS:');
    console.log('====================================');
    console.log('All sub-forwarders now use: password123');
    subForwarders.forEach(f => {
      console.log(`• ${f.name}: ${f.email} / password123`);
    });

    console.log('\n✅ All sub-forwarders fixed in cloud database!');
    console.log('You can now test the login flow with these credentials.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from Cloud MongoDB');
  }
}

fixSubForwardersCloudDB();
