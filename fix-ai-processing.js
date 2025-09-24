#!/usr/bin/env node

/**
 * AI Processing Fix Script
 * 
 * This script fixes the AI processing pipeline to ensure it uses real AI models
 * instead of falling back to fallback mode.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔧 AI Processing Fix Script');
console.log('===========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('📋 Environment Configuration Check:');
console.log('-----------------------------------');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found in BE directory');
  console.log('✅ Creating .env file from env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExampleContent);
    console.log('✅ .env file created successfully');
  } else {
    console.log('❌ env.example file not found');
    console.log('💡 Please create a .env file manually with your API keys');
  }
} else {
  console.log('✅ .env file exists');
}

// Check API key configuration
console.log('\n🔑 API Key Configuration Check:');
console.log('-------------------------------');

const requiredKeys = [
  { name: 'GEMINI_API_KEY', description: 'Google AI Studio API key for OCR', url: 'https://aistudio.google.com/app/apikey' },
  { name: 'OPENAI_API_KEY', description: 'OpenAI API key for compliance analysis', url: 'https://platform.openai.com/api-keys' },
  { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key for compliance analysis (optional)', url: 'https://console.anthropic.com/' }
];

let hasValidKeys = false;

requiredKeys.forEach(key => {
  const value = process.env[key.name];
  if (value && value !== `your_${key.name.toLowerCase()}_here`) {
    console.log(`✅ ${key.name}: Configured`);
    hasValidKeys = true;
  } else {
    console.log(`❌ ${key.name}: Not configured`);
    console.log(`   Description: ${key.description}`);
    console.log(`   Get key from: ${key.url}`);
  }
});

if (!hasValidKeys) {
  console.log('\n🚨 CRITICAL ISSUE: No valid API keys configured!');
  console.log('This is why the AI models are falling back to fallback mode.');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Get your API keys from the URLs above');
  console.log('2. Update the .env file in the BE directory');
  console.log('3. Restart the backend server');
  console.log('\n📝 Example .env configuration:');
  console.log('GEMINI_API_KEY=AIzaSy...');
  console.log('OPENAI_API_KEY=sk-proj-...');
  console.log('ANTHROPIC_API_KEY=sk-ant-...');
} else {
  console.log('\n✅ API keys are configured!');
}

// Test AI service initialization
console.log('\n🧪 Testing AI Service Initialization:');
console.log('-------------------------------------');

try {
  // Test Gemini service
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    console.log('✅ Gemini service: Initialized successfully');
  } else {
    console.log('❌ Gemini service: Not initialized (no valid API key)');
  }
} catch (error) {
  console.log('❌ Gemini service: Initialization failed -', error.message);
}

try {
  // Test OpenAI service
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI service: Initialized successfully');
  } else {
    console.log('❌ OpenAI service: Not initialized (no valid API key)');
  }
} catch (error) {
  console.log('❌ OpenAI service: Initialization failed -', error.message);
}

try {
  // Test Anthropic service
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('✅ Anthropic service: Initialized successfully');
  } else {
    console.log('⚠️  Anthropic service: Not initialized (optional)');
  }
} catch (error) {
  console.log('❌ Anthropic service: Initialization failed -', error.message);
}

// Check compliance service logic
console.log('\n🔍 Compliance Service Logic Check:');
console.log('----------------------------------');

const preferredProvider = process.env.COMPLIANCE_AI_PROVIDER || 'openai';
console.log(`Preferred provider: ${preferredProvider}`);

if (preferredProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
  console.log('✅ Will use Anthropic Claude for compliance analysis');
} else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  console.log('✅ Will use OpenAI GPT-4 for compliance analysis');
} else {
  console.log('❌ Will fall back to fallback compliance analysis');
  console.log('   Reason: No valid AI provider configured');
}

// Check Gemini service logic
console.log('\n🔍 Gemini Service Logic Check:');
console.log('------------------------------');

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  console.log('✅ Will use Gemini 1.5 Pro for OCR processing');
} else {
  console.log('❌ Will fall back to fallback OCR processing');
  console.log('   Reason: No valid Gemini API key configured');
}

console.log('\n📊 Summary:');
console.log('===========');

const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
const hasAnthropic = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';

if (hasGemini && (hasOpenAI || hasAnthropic)) {
  console.log('✅ AI models should work properly!');
  console.log('   Document processing will use real AI instead of fallback mode.');
} else {
  console.log('❌ AI models will fall back to fallback mode!');
  console.log('   Reason: Missing required API keys');
  
  if (!hasGemini) {
    console.log('   - Missing: GEMINI_API_KEY');
  }
  if (!hasOpenAI && !hasAnthropic) {
    console.log('   - Missing: OPENAI_API_KEY or ANTHROPIC_API_KEY');
  }
}

console.log('\n🔧 Next Steps:');
console.log('==============');
console.log('1. Get your API keys from the URLs provided above');
console.log('2. Update the .env file in the BE directory with your actual API keys');
console.log('3. Restart the backend server');
console.log('4. Test document upload to verify real AI processing works');

console.log('\n🔗 Useful Links:');
console.log('================');
console.log('• Gemini API: https://aistudio.google.com/app/apikey');
console.log('• OpenAI API: https://platform.openai.com/api-keys');
console.log('• Anthropic API: https://console.anthropic.com/');
console.log('• Setup Guide: BE/SETUP_AI_KEYS.md');

console.log('\n✨ Fix script complete!');
