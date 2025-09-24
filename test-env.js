console.log('🔍 Environment Variables Check:');
console.log('================================');

// Check AI service keys
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ SET' : '❌ NOT SET');

// Check other important vars
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('.env file: ✅ EXISTS');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasAnthropic = envContent.includes('ANTHROPIC_API_KEY');
  const hasOpenAI = envContent.includes('OPENAI_API_KEY');
  console.log('  - Contains ANTHROPIC_API_KEY:', hasAnthropic ? '✅ YES' : '❌ NO');
  console.log('  - Contains OPENAI_API_KEY:', hasOpenAI ? '✅ YES' : '❌ NO');
} else {
  console.log('.env file: ❌ NOT FOUND');
}

console.log('================================');
console.log('If keys are not set, you need to create a .env file with your API keys.');
