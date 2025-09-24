#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * 
 * This script checks the current environment configuration and identifies
 * why the AI models are still falling back to fallback mode.
 */

require('dotenv').config();

console.log('🔍 Environment Configuration Checker');
console.log('====================================\n');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('📁 File System Check:');
console.log('--------------------');
console.log(`✅ .env file exists: ${fs.existsSync(envPath)}`);
console.log(`✅ env.example exists: ${fs.existsSync(envExamplePath)}`);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(`📄 .env file size: ${envContent.length} characters`);
  
  // Check for placeholder values
  const hasPlaceholders = envContent.includes('your_') || envContent.includes('_here');
  console.log(`⚠️  Contains placeholder values: ${hasPlaceholders}`);
  
  if (hasPlaceholders) {
    console.log('❌ ISSUE: .env file contains placeholder values instead of real API keys');
  }
} else {
  console.log('❌ ISSUE: .env file does not exist');
}

console.log('\n🔑 Environment Variables Check:');
console.log('-------------------------------');

const envVars = [
  'GEMINI_API_KEY',
  'OPENAI_API_KEY', 
  'ANTHROPIC_API_KEY',
  'COMPLIANCE_AI_PROVIDER'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const isPlaceholder = value.includes('your_') || value.includes('_here');
    const status = isPlaceholder ? '❌ Placeholder' : '✅ Configured';
    const display = value.substring(0, 15) + '...';
    console.log(`${status} ${varName}: ${display}`);
  } else {
    console.log(`❌ Missing ${varName}: Not set`);
  }
});

console.log('\n🧪 AI Service Status Check:');
console.log('---------------------------');

// Check Gemini service
if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_')) {
  console.log('✅ Gemini API key: Valid format');
  if (process.env.GEMINI_API_KEY.startsWith('AIza')) {
    console.log('✅ Gemini API key: Correct format (AIza...)');
  } else {
    console.log('❌ Gemini API key: Wrong format (should start with AIza...)');
  }
} else {
  console.log('❌ Gemini API key: Not configured or placeholder');
}

// Check OpenAI service
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_')) {
  console.log('✅ OpenAI API key: Valid format');
  if (process.env.OPENAI_API_KEY.startsWith('sk-proj-')) {
    console.log('✅ OpenAI API key: Correct format (sk-proj-...)');
  } else if (process.env.OPENAI_API_KEY.startsWith('sk-or-v1-')) {
    console.log('❌ OpenAI API key: Old format (sk-or-v1-...) - no longer supported');
  } else {
    console.log('⚠️  OpenAI API key: Unknown format');
  }
} else {
  console.log('❌ OpenAI API key: Not configured or placeholder');
}

// Check Anthropic service
if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your_')) {
  console.log('✅ Anthropic API key: Valid format');
  if (process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    console.log('✅ Anthropic API key: Correct format (sk-ant-...)');
  } else {
    console.log('⚠️  Anthropic API key: Unknown format');
  }
} else {
  console.log('⚠️  Anthropic API key: Not configured or placeholder (optional)');
}

console.log('\n🎯 Fallback Mode Analysis:');
console.log('--------------------------');

const hasValidGemini = process.env.GEMINI_API_KEY && 
                      !process.env.GEMINI_API_KEY.includes('your_') && 
                      process.env.GEMINI_API_KEY.startsWith('AIza');

const hasValidOpenAI = process.env.OPENAI_API_KEY && 
                      !process.env.OPENAI_API_KEY.includes('your_') && 
                      process.env.OPENAI_API_KEY.startsWith('sk-proj-');

const hasValidAnthropic = process.env.ANTHROPIC_API_KEY && 
                         !process.env.ANTHROPIC_API_KEY.includes('your_') && 
                         process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-');

console.log(`Gemini OCR: ${hasValidGemini ? '✅ Will use real AI' : '❌ Will use fallback'}`);
console.log(`Compliance AI: ${hasValidOpenAI || hasValidAnthropic ? '✅ Will use real AI' : '❌ Will use fallback'}`);

if (!hasValidGemini || (!hasValidOpenAI && !hasValidAnthropic)) {
  console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
  console.log('========================');
  
  if (!hasValidGemini) {
    console.log('❌ Gemini API key is not properly configured');
    console.log('   → This causes OCR to fall back to fallback mode');
    console.log('   → You see: "This is processed with fallback OCR"');
  }
  
  if (!hasValidOpenAI && !hasValidAnthropic) {
    console.log('❌ Compliance AI API key is not properly configured');
    console.log('   → This causes compliance analysis to fall back to fallback mode');
    console.log('   → You see: "AI is still analyzing this document"');
  }
}

console.log('\n🔧 IMMEDIATE FIX REQUIRED:');
console.log('==========================');

if (!fs.existsSync(envPath)) {
  console.log('1. Create .env file in BE directory');
  console.log('   Copy from env.example or create manually');
}

if (!hasValidGemini) {
  console.log('2. Get Gemini API key:');
  console.log('   • Go to: https://aistudio.google.com/app/apikey');
  console.log('   • Create new API key');
  console.log('   • Should start with: AIza...');
  console.log('   • Add to .env: GEMINI_API_KEY=AIza...your_key');
}

if (!hasValidOpenAI && !hasValidAnthropic) {
  console.log('3. Get Compliance AI key:');
  console.log('   • OpenAI: https://platform.openai.com/api-keys');
  console.log('   • OR Anthropic: https://console.anthropic.com/');
  console.log('   • Add to .env: OPENAI_API_KEY=sk-proj-...your_key');
}

console.log('\n4. Restart the backend server after updating .env');

console.log('\n📊 Current Status:');
console.log('==================');
console.log(`OCR Processing: ${hasValidGemini ? '✅ Real AI (Gemini)' : '❌ Fallback Mode'}`);
console.log(`Compliance Analysis: ${hasValidOpenAI || hasValidAnthropic ? '✅ Real AI' : '❌ Fallback Mode'}`);
console.log(`Overall Status: ${hasValidGemini && (hasValidOpenAI || hasValidAnthropic) ? '✅ Ready for Real AI' : '❌ Still in Fallback Mode'}`);

console.log('\n✨ Check complete!');
