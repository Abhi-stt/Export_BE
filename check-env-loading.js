// Check if .env file is being loaded properly
require('dotenv').config();

console.log('🔍 Checking .env File Loading:');
console.log('==============================\n');

console.log('📋 Environment Variables:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`   PORT: ${process.env.PORT || 'Not set'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI || 'Not set'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET || 'NOT SET'}`);
console.log(`   JWT_EXPIRES: ${process.env.JWT_EXPIRES || 'Not set'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);

console.log('\n🔍 JWT_SECRET Details:');
console.log(`   Length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0}`);
console.log(`   First 10 chars: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) : 'N/A'}`);
console.log(`   Last 10 chars: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(process.env.JWT_SECRET.length - 10) : 'N/A'}`);

// Test JWT functionality
const jwt = require('jsonwebtoken');

if (process.env.JWT_SECRET) {
  console.log('\n🧪 Testing JWT with loaded secret:');
  try {
    const testPayload = { user: { id: 'test', role: 'forwarder' } };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`✅ JWT token created successfully`);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ JWT token verified successfully`);
  } catch (error) {
    console.log(`❌ JWT test failed: ${error.message}`);
  }
} else {
  console.log('\n❌ JWT_SECRET is not loaded from .env file');
}

console.log('\n🎯 Environment Status:');
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length > 0) {
  console.log('✅ JWT_SECRET is properly loaded from .env');
  console.log('✅ Server should work with authentication');
} else {
  console.log('❌ JWT_SECRET is not loaded or empty');
  console.log('❌ Server will fail authentication');
}
