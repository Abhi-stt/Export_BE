#!/usr/bin/env node

/**
 * Direct API Test Script
 * Tests each API individually to identify exact failures
 */

require('dotenv').config();

console.log('🧪 Direct API Connection Test');
console.log('=============================');
console.log('');

async function testGeminiAPI() {
  console.log('1️⃣ Testing Gemini API...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('   ❌ GEMINI_API_KEY not found');
    return false;
  }
  
  console.log('   🔑 Key format:', process.env.GEMINI_API_KEY.substring(0, 15) + '...');
  
  // Check key format
  if (process.env.GEMINI_API_KEY.startsWith('sk-or-v1')) {
    console.log('   ❌ INVALID FORMAT: sk-or-v1 is not valid for Gemini');
    console.log('   💡 Gemini keys should start with: AIza...');
    console.log('   🔗 Get correct key: https://aistudio.google.com/app/apikey');
    return false;
  }
  
  if (!process.env.GEMINI_API_KEY.startsWith('AIza')) {
    console.log('   ❌ INVALID FORMAT: Gemini keys should start with "AIza"');
    console.log('   🔗 Get correct key: https://aistudio.google.com/app/apikey');
    return false;
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Test with a simple prompt
    const result = await model.generateContent('Hello, test message');
    console.log('   ✅ Gemini API working correctly');
    return true;
  } catch (error) {
    console.log('   ❌ Gemini API Error:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('   💡 The API key is invalid - get a new one');
    }
    return false;
  }
}

async function testOpenAIAPI() {
  console.log('');
  console.log('2️⃣ Testing OpenAI API...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('   ❌ OPENAI_API_KEY not found');
    return false;
  }
  
  console.log('   🔑 Key format:', process.env.OPENAI_API_KEY.substring(0, 15) + '...');
  
  // Check key format
  if (process.env.OPENAI_API_KEY.startsWith('sk-or-v1')) {
    console.log('   ❌ INVALID FORMAT: sk-or-v1 is an old/invalid format');
    console.log('   💡 OpenAI keys should start with: sk-proj-...');
    console.log('   🔗 Get new key: https://platform.openai.com/api-keys');
    return false;
  }
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello, test message' }],
      model: 'gpt-3.5-turbo',
      max_tokens: 10
    });
    
    console.log('   ✅ OpenAI API working correctly');
    return true;
  } catch (error) {
    console.log('   ❌ OpenAI API Error:', error.message);
    if (error.message.includes('401')) {
      console.log('   💡 Invalid API key - get a new one from OpenAI');
    }
    if (error.message.includes('billing')) {
      console.log('   💡 Add billing/credits to your OpenAI account');
    }
    return false;
  }
}

async function main() {
  console.log('🎯 API Key Issues Identified:');
  console.log('');
  
  // Check key formats first
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('sk-or-v1')) {
    console.log('❌ GEMINI KEY WRONG: You have an OpenAI-format key for Gemini');
    console.log('   Current: sk-or-v1... (OpenAI format)');
    console.log('   Needed:  AIza... (Gemini format)');
    console.log('   Fix: Get Gemini key from https://aistudio.google.com/app/apikey');
    console.log('');
  }
  
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-or-v1')) {
    console.log('❌ OPENAI KEY OLD: You have an old/invalid OpenAI key format');
    console.log('   Current: sk-or-v1... (old/invalid format)');
    console.log('   Needed:  sk-proj-... (new format)');
    console.log('   Fix: Get new key from https://platform.openai.com/api-keys');
    console.log('');
  }
  
  console.log('🔧 EXACT FIX NEEDED:');
  console.log('');
  console.log('1. Get GEMINI API Key:');
  console.log('   • Go to: https://aistudio.google.com/app/apikey');
  console.log('   • Create new API key');
  console.log('   • Should start with: AIzaSy...');
  console.log('   • Update GEMINI_API_KEY in BE/.env');
  console.log('');
  console.log('2. Get NEW OpenAI API Key:');
  console.log('   • Go to: https://platform.openai.com/api-keys');
  console.log('   • Create new API key');
  console.log('   • Should start with: sk-proj-...');
  console.log('   • Update OPENAI_API_KEY in BE/.env');
  console.log('');
  console.log('3. Add OpenAI Billing:');
  console.log('   • Go to: https://platform.openai.com/settings/organization/billing');
  console.log('   • Add payment method');
  console.log('   • Add at least $5 credit');
  console.log('');
  
  // Test APIs
  const geminiWorks = await testGeminiAPI();
  const openaiWorks = await testOpenAIAPI();
  
  console.log('');
  console.log('📊 SUMMARY:');
  console.log('Gemini API:', geminiWorks ? '✅ Working' : '❌ Broken');
  console.log('OpenAI API:', openaiWorks ? '✅ Working' : '❌ Broken');
  console.log('');
  
  if (!geminiWorks || !openaiWorks) {
    console.log('🎯 RESULT: Document upload will fall back to OCR');
    console.log('💡 SOLUTION: Fix the API keys above, then restart server');
  } else {
    console.log('🎯 RESULT: APIs should work - check for other issues');
  }
  console.log('');
  console.log('🚀 After fixing: Restart server with "cd BE && npm start"');
}

main().catch(error => {
  console.error('Test script error:', error.message);
});
