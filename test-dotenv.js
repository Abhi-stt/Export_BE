const path = require('path');
const fs = require('fs');

console.log('🔍 Testing dotenv loading...');
console.log('================================');

// Check current working directory
console.log('Current working directory:', process.cwd());

// Check .env file path
const envPath = path.join(__dirname, '.env');
console.log('.env file path:', envPath);

// Check if .env exists
if (fs.existsSync(envPath)) {
  console.log('.env file: ✅ EXISTS');
  
  // Read and display .env content (first few characters of each line)
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📄 .env file content (first 50 chars per line):');
  envContent.split('\n').forEach((line, index) => {
    if (line.trim()) {
      console.log(`${index + 1}: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
    }
  });
  
  // Try to load with dotenv
  console.log('\n🔄 Loading with dotenv...');
  try {
    require('dotenv').config({ path: envPath });
    console.log('dotenv.config() completed');
    
    // Check if variables are loaded
    console.log('\n🔑 Environment variables after dotenv:');
    console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ SET' : '❌ NOT SET');
    
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Anthropic key preview:', process.env.ANTHROPIC_API_KEY.substring(0, 20) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error loading dotenv:', error.message);
  }
  
} else {
  console.log('.env file: ❌ NOT FOUND');
}

console.log('================================');
