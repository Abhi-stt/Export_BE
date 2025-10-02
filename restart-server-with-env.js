// Restart server with proper .env loading
const path = require('path');

console.log('🔧 Restarting Server with .env Configuration:');
console.log('==============================================\n');

// Set the working directory to BE folder
process.chdir(__dirname);
console.log(`📁 Working directory: ${process.cwd()}`);

// Load .env file
require('dotenv').config();

console.log('\n📋 Environment Variables Loaded:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`   PORT: ${process.env.PORT || 'Not set'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Loaded' : '❌ Not loaded'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Loaded' : '❌ Not loaded'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);

if (process.env.JWT_SECRET) {
  console.log(`   JWT_SECRET length: ${process.env.JWT_SECRET.length}`);
  console.log(`   JWT_SECRET preview: ${process.env.JWT_SECRET.substring(0, 10)}...`);
}

console.log('\n🚀 Starting server...');

// Start the server
require('./server.js');
