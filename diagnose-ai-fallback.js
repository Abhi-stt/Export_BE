#!/usr/bin/env node

/**
 * AI Fallback Diagnostic Tool
 * 
 * This script diagnoses why AI models are falling back to fallback mode
 * instead of using real AI processing.
 */

require('dotenv').config();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 AI Fallback Diagnostic Tool');
console.log('================================\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('--------------------------------');

const envChecks = [
  { name: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY, required: true },
  { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY, required: true },
  { name: 'ANTHROPIC_API_KEY', value: process.env.ANTHROPIC_API_KEY, required: false },
  { name: 'COMPLIANCE_AI_PROVIDER', value: process.env.COMPLIANCE_AI_PROVIDER, required: false }
];

envChecks.forEach(check => {
  const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
  const display = check.value ? 
    `${check.value.substring(0, 10)}...` : 
    'Not set';
  console.log(`${status} ${check.name}: ${display}`);
});

console.log('\n🔧 API Key Format Validation:');
console.log('-----------------------------');

// Check Gemini API key format
if (process.env.GEMINI_API_KEY) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey.startsWith('AIza')) {
    console.log('✅ GEMINI_API_KEY: Correct format (AIza...)');
  } else if (geminiKey.startsWith('sk-')) {
    console.log('❌ GEMINI_API_KEY: Wrong format - This looks like an OpenAI key!');
    console.log('   Expected: AIza... (Gemini format)');
    console.log('   Found: sk-... (OpenAI format)');
  } else {
    console.log('⚠️  GEMINI_API_KEY: Unknown format');
  }
} else {
  console.log('❌ GEMINI_API_KEY: Not configured');
}

// Check OpenAI API key format
if (process.env.OPENAI_API_KEY) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey.startsWith('sk-proj-')) {
    console.log('✅ OPENAI_API_KEY: Correct format (sk-proj-...)');
  } else if (openaiKey.startsWith('sk-or-v1-')) {
    console.log('❌ OPENAI_API_KEY: Old/invalid format (sk-or-v1-...)');
    console.log('   This format is no longer supported by OpenAI');
  } else if (openaiKey.startsWith('sk-')) {
    console.log('⚠️  OPENAI_API_KEY: Unknown format (sk-...)');
  } else {
    console.log('⚠️  OPENAI_API_KEY: Unknown format');
  }
} else {
  console.log('❌ OPENAI_API_KEY: Not configured');
}

// Check Anthropic API key format
if (process.env.ANTHROPIC_API_KEY) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey.startsWith('sk-ant-')) {
    console.log('✅ ANTHROPIC_API_KEY: Correct format (sk-ant-...)');
  } else {
    console.log('⚠️  ANTHROPIC_API_KEY: Unknown format');
  }
} else {
  console.log('⚠️  ANTHROPIC_API_KEY: Not configured (optional)');
}

console.log('\n🧪 AI Service Initialization Test:');
console.log('----------------------------------');

// Test Gemini initialization
console.log('\n1. Testing Gemini Service:');
try {
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log('✅ Gemini service initialized successfully');
  } else {
    console.log('❌ Gemini service: No API key provided');
  }
} catch (error) {
  console.log('❌ Gemini service initialization failed:', error.message);
}

// Test OpenAI initialization
console.log('\n2. Testing OpenAI Service:');
try {
  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI service initialized successfully');
  } else {
    console.log('❌ OpenAI service: No API key provided');
  }
} catch (error) {
  console.log('❌ OpenAI service initialization failed:', error.message);
}

// Test Anthropic initialization
console.log('\n3. Testing Anthropic Service:');
try {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('✅ Anthropic service initialized successfully');
  } else {
    console.log('⚠️  Anthropic service: No API key provided (optional)');
  }
} catch (error) {
  console.log('❌ Anthropic service initialization failed:', error.message);
}

console.log('\n🔍 Compliance Service Logic Analysis:');
console.log('-------------------------------------');

// Simulate the compliance service logic
const preferredProvider = process.env.COMPLIANCE_AI_PROVIDER || 'openai';
console.log(`Preferred provider: ${preferredProvider}`);

if (preferredProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
  console.log('✅ Will use Anthropic Claude for compliance analysis');
} else if (process.env.OPENAI_API_KEY) {
  console.log('✅ Will use OpenAI GPT-4 for compliance analysis');
} else {
  console.log('❌ Will fall back to fallback compliance analysis');
  console.log('   Reason: No valid AI provider configured');
}

console.log('\n🔍 Gemini Service Logic Analysis:');
console.log('---------------------------------');

if (process.env.GEMINI_API_KEY) {
  console.log('✅ Will use Gemini 1.5 Pro for OCR processing');
} else {
  console.log('❌ Will fall back to fallback OCR processing');
  console.log('   Reason: No Gemini API key configured');
}

console.log('\n📊 Summary & Recommendations:');
console.log('==============================');

const issues = [];
const recommendations = [];

// Check for critical issues
if (!process.env.GEMINI_API_KEY) {
  issues.push('Missing GEMINI_API_KEY');
  recommendations.push('Get Gemini API key from https://aistudio.google.com/app/apikey');
}

if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  issues.push('Missing both OPENAI_API_KEY and ANTHROPIC_API_KEY');
  recommendations.push('Get OpenAI API key from https://platform.openai.com/api-keys OR Anthropic key from https://console.anthropic.com/');
}

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('sk-')) {
  issues.push('GEMINI_API_KEY has wrong format (OpenAI format)');
  recommendations.push('Get correct Gemini API key from https://aistudio.google.com/app/apikey');
}

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-or-v1-')) {
  issues.push('OPENAI_API_KEY has old/invalid format');
  recommendations.push('Get new OpenAI API key from https://platform.openai.com/api-keys');
}

if (issues.length === 0) {
  console.log('✅ No critical issues found! AI models should work properly.');
} else {
  console.log('❌ Critical issues found:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  
  console.log('\n🔧 Recommended fixes:');
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
}

console.log('\n📝 Next Steps:');
console.log('---------------');
console.log('1. Fix any critical issues identified above');
console.log('2. Create/update BE/.env file with correct API keys');
console.log('3. Restart the backend server');
console.log('4. Test document upload to verify AI processing works');

console.log('\n🔗 Useful Links:');
console.log('----------------');
console.log('• Gemini API: https://aistudio.google.com/app/apikey');
console.log('• OpenAI API: https://platform.openai.com/api-keys');
console.log('• Anthropic API: https://console.anthropic.com/');
console.log('• Setup Guide: BE/SETUP_AI_KEYS.md');

console.log('\n✨ Diagnostic complete!');
