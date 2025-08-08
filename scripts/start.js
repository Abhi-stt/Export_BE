const mongoose = require('mongoose');
require('dotenv').config();

const { seedData } = require('./seed');

// Enhanced database connection with retry logic
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/export_project';
      
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('✅ MongoDB Connected successfully');
      console.log(`📍 Database: ${mongoose.connection.name}`);
      console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      
      return true;
    } catch (err) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries} failed:`, err.message);
      
      if (retries < maxRetries) {
        console.log(`⏳ Retrying connection in 3 seconds... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error('💥 Failed to connect to MongoDB after maximum retries');
        throw err;
      }
    }
  }
};

// Startup sequence
const startup = async () => {
  try {
    console.log('🚀 Starting AI-Powered Export Backend...');
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
    
    // Connect to database
    await connectDB();
    
    // Seed initial data if needed
    console.log('🌱 Checking for initial data...');
    await seedData();
    
    // Start the main server
    console.log('🎯 Starting main server...');
    require('../server');
    
  } catch (error) {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  });
});

// Start the application
if (require.main === module) {
  startup();
}

module.exports = { startup, connectDB };