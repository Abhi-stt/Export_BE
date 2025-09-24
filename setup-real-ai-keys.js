const fs = require('fs');
const path = require('path');

console.log('🔑 Real AI API Keys Setup Guide');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# AI API Keys - Get these from the respective platforms
# Replace the placeholder values with your actual API keys

# Google Gemini API Key
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (must start with sk-proj-)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Key (must start with sk-ant-)
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AI Provider Selection
COMPLIANCE_AI_PROVIDER=openai

# Database Configuration
MONGODB_URI=mongodb+srv://admin:admin123@cluster0.ouj8jvu.mongodb.net/test?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🔑 Step-by-Step API Key Setup:');
console.log('===============================\n');

console.log('1️⃣ Google Gemini API Key:');
console.log('   • Go to: https://aistudio.google.com/app/apikey');
console.log('   • Sign in with your Google account');
console.log('   • Click "Create API Key"');
console.log('   • Copy the key (starts with AIza...)');
console.log('   • Replace "your_gemini_api_key_here" in .env file\n');

console.log('2️⃣ OpenAI API Key:');
console.log('   • Go to: https://platform.openai.com/api-keys');
console.log('   • Sign in to your OpenAI account');
console.log('   • Click "Create new secret key"');
console.log('   • Copy the key (starts with sk-proj-...)');
console.log('   • Replace "your_openai_api_key_here" in .env file\n');

console.log('3️⃣ Anthropic API Key:');
console.log('   • Go to: https://console.anthropic.com/');
console.log('   • Sign in to your Anthropic account');
console.log('   • Go to API Keys section');
console.log('   • Create a new API key');
console.log('   • Copy the key (starts with sk-ant-...)');
console.log('   • Replace "your_anthropic_api_key_here" in .env file\n');

console.log('4️⃣ After updating .env file:');
console.log('   • Restart your backend server');
console.log('   • Test with: node test-ai-services-simple.js');
console.log('   • Upload a document through the frontend\n');

console.log('💡 Important Notes:');
console.log('===================');
console.log('• OpenAI keys must start with "sk-proj-" (new format)');
console.log('• Old "sk-or-v1-" keys are no longer supported');
console.log('• Make sure you have sufficient API credits/quota');
console.log('• Keep your API keys secure and never share them\n');

console.log('🧪 Test Commands:');
console.log('=================');
console.log('• Test API keys: node test-ai-models.js');
console.log('• Test document processing: node test-ai-services-simple.js');
console.log('• Check configuration: node check-env-config.js\n');

console.log('✨ Once you have real API keys, your system will use:');
console.log('   • Gemini 1.5 Pro for OCR and text extraction');
console.log('   • OpenAI GPT-4 Turbo for compliance analysis');
console.log('   • Claude 3 Sonnet for HS code suggestions');
console.log('   • Real AI processing instead of fallback mode');
