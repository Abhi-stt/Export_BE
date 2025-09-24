#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps set up the .env file with proper API keys
 * to fix the AI fallback issue.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Environment Setup Script');
console.log('===========================\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

// Check if .env exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  
  // Check if it has placeholder values
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasPlaceholders = envContent.includes('your_') || envContent.includes('_here');
  
  if (hasPlaceholders) {
    console.log('⚠️  .env file contains placeholder values');
    console.log('💡 You need to replace placeholder values with real API keys');
  } else {
    console.log('✅ .env file appears to have real values');
  }
} else {
  console.log('❌ .env file does not exist');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('✅ Creating .env file from env.example...');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExampleContent);
    console.log('✅ .env file created successfully');
  } else {
    console.log('❌ env.example file not found');
    console.log('💡 Please create a .env file manually');
  }
}

console.log('\n📋 Required API Keys:');
console.log('====================');

console.log('\n1. 🤖 Gemini API Key (Required for OCR):');
console.log('   • Go to: https://aistudio.google.com/app/apikey');
console.log('   • Sign in with Google account');
console.log('   • Click "Create API Key"');
console.log('   • Copy the key (should start with AIza...)');
console.log('   • Update .env: GEMINI_API_KEY=AIza...your_key');

console.log('\n2. 🧠 OpenAI API Key (Required for Compliance):');
console.log('   • Go to: https://platform.openai.com/api-keys');
console.log('   • Sign in or create account');
console.log('   • Click "Create new secret key"');
console.log('   • Copy the key (should start with sk-proj-...)');
console.log('   • Update .env: OPENAI_API_KEY=sk-proj-...your_key');

console.log('\n3. 🔄 Anthropic API Key (Alternative for Compliance):');
console.log('   • Go to: https://console.anthropic.com/');
console.log('   • Sign in or create account');
console.log('   • Go to API Keys section');
console.log('   • Create new API key');
console.log('   • Update .env: ANTHROPIC_API_KEY=sk-ant-...your_key');

console.log('\n📝 Example .env Configuration:');
console.log('==============================');
console.log('GEMINI_API_KEY=AIzaSy...your_actual_gemini_key_here');
console.log('OPENAI_API_KEY=sk-proj-...your_actual_openai_key_here');
console.log('ANTHROPIC_API_KEY=sk-ant-...your_actual_anthropic_key_here');
console.log('COMPLIANCE_AI_PROVIDER=openai');

console.log('\n🚨 Important Notes:');
console.log('===================');
console.log('• Replace ALL placeholder values with real API keys');
console.log('• API keys should NOT contain "your_" or "_here"');
console.log('• Gemini keys should start with "AIza"');
console.log('• OpenAI keys should start with "sk-proj-"');
console.log('• Anthropic keys should start with "sk-ant-"');

console.log('\n🔧 After Updating .env:');
console.log('=======================');
console.log('1. Save the .env file');
console.log('2. Restart the backend server');
console.log('3. Test document upload');
console.log('4. Check that fallback messages are gone');

console.log('\n✅ Setup script complete!');
console.log('💡 Next: Update your .env file with real API keys');
