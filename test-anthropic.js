#!/usr/bin/env node

/**
 * Test Anthropic API Configuration
 */

require('dotenv').config();

async function testAnthropic() {
  console.log('🔍 Testing Anthropic Configuration...');
  console.log('');
  
  // Check API key
  console.log('🔑 API Key Check:');
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET ✅' : 'MISSING ❌'}`);
  
  if (process.env.ANTHROPIC_API_KEY) {
    const keyFormat = process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...';
    console.log(`Key format: ${keyFormat}`);
    console.log(`Key length: ${process.env.ANTHROPIC_API_KEY.length}`);
  }
  console.log('');
  
  try {
    console.log('📦 Loading Anthropic SDK...');
    const Anthropic = require('@anthropic-ai/sdk');
    console.log('✅ Anthropic SDK loaded successfully');
    
    console.log('🔧 Initializing Anthropic client...');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('✅ Anthropic client initialized successfully');
    
    console.log('🧪 Testing simple API call...');
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Use cheaper model for testing
      max_tokens: 100,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: "Say 'Hello World' in JSON format: {\"message\": \"Hello World\"}"
        }
      ]
    });
    
    console.log('✅ Anthropic API call successful!');
    console.log('Response:', message.content[0].text);
    
  } catch (error) {
    console.log('❌ Anthropic test failed:', error.message);
    console.log('Error type:', error.constructor.name);
    if (error.status) {
      console.log('HTTP Status:', error.status);
    }
    if (error.code) {
      console.log('Error Code:', error.code);
    }
  }
  
  console.log('');
  console.log('🏁 Anthropic test complete');
}

testAnthropic().then(() => process.exit(0)).catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
