const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const { User } = require('../schemas');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/export_project', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@export.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@export.com',
        password: hashedPassword,
        phone: '+1234567890',
        company: 'Export Admin Co.',
        role: 'admin',
        status: 'active',
        department: 'Administration',
        designation: 'System Administrator'
      });

      await adminUser.save();
      console.log('✅ Admin user created: admin@export.com / admin123');
    }

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'user@export.com' });
    if (existingUser) {
      console.log('ℹ️  Test user already exists');
    } else {
      // Create test user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('user123', salt);

      const testUser = new User({
        name: 'Test User',
        email: 'user@export.com',
        password: hashedPassword,
        phone: '+1234567891',
        company: 'Test Export Co.',
        role: 'exporter',
        status: 'active',
        department: 'Operations',
        designation: 'Export Manager'
      });

      await testUser.save();
      console.log('✅ Test user created: user@export.com / user123');
    }

    // Create Forwarder user
    const existingForwarder = await User.findOne({ email: 'forwarder@export.com' });
    if (existingForwarder) {
      console.log('ℹ️  Forwarder user already exists');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('forwarder123', salt);

      const forwarderUser = new User({
        name: 'Forwarder User',
        email: 'forwarder@export.com',
        password: hashedPassword,
        phone: '+1234567893',
        company: 'Freight Forwarder Co.',
        role: 'forwarder',
        status: 'active',
        department: 'Logistics',
        designation: 'Freight Forwarder'
      });

      await forwarderUser.save();
      console.log('✅ Forwarder user created: forwarder@export.com / forwarder123');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@export.com / admin123');
    console.log('User: user@export.com / user123');
    console.log('Forwarder: forwarder@export.com / forwarder123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run seeding
const runSeed = async () => {
  await connectDB();
  await seedData();
  mongoose.disconnect();
  console.log('👋 Database connection closed');
  process.exit(0);
};

// Check if this script is run directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedData, connectDB };