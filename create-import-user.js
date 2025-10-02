const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User schema
const User = require('./schemas/User');

async function createImportUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-export-project');
    console.log('✅ Connected to MongoDB');

    // Check if import user already exists
    const existingUser = await User.findOne({ email: 'importer@export.com' });
    if (existingUser) {
      console.log('⚠️  Import user already exists:', existingUser.email);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('importer123', saltRounds);

    // Create import user
    const importUser = new User({
      name: 'Import Manager',
      email: 'importer@export.com',
      password: hashedPassword,
      phone: '+1-555-0123',
      company: 'Global Import Solutions',
      role: 'importer',
      status: 'active',
      department: 'Import Operations',
      designation: 'Import Manager'
    });

    await importUser.save();
    console.log('✅ Import user created successfully:');
    console.log('- Name:', importUser.name);
    console.log('- Email:', importUser.email);
    console.log('- Role:', importUser.role);
    console.log('- Company:', importUser.company);
    console.log('- Status:', importUser.status);

  } catch (error) {
    console.error('❌ Error creating import user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the function
createImportUser();
