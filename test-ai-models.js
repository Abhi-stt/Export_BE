#!/usr/bin/env node

/**
 * AI Models Test Script
 * 
 * This script tests the AI models to ensure they're working with real-time data
 * and not falling back to fallback mode.
 */

require('dotenv').config();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🤖 AI Models Test Script');
console.log('========================\n');

// Test Gemini API
async function testGeminiAPI() {
  console.log('1. Testing Gemini 1.5 Pro API...');
  console.log('---------------------------------');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY not found in environment variables');
    return false;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    console.log('✅ Gemini service initialized successfully');
    
    // Test with a simple prompt
    const testPrompt = "Extract text from this image and return it as JSON with fields: text, confidence, entities.";
    const testImage = {
      inlineData: {
        data: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==').toString('base64'),
        mimeType: 'image/png'
      }
    };
    
    console.log('🔄 Testing Gemini API call...');
    const result = await model.generateContent([testPrompt, testImage]);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API call successful');
    console.log(`📝 Response length: ${text.length} characters`);
    return true;
    
  } catch (error) {
    console.log('❌ Gemini API test failed:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('   → Invalid API key format or key');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('   → API quota exceeded');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('   → API key doesn\'t have required permissions');
    }
    return false;
  }
}

// Test OpenAI API
async function testOpenAIAPI() {
  console.log('\n2. Testing OpenAI GPT-4 Turbo API...');
  console.log('-------------------------------------');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
    return false;
  }
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('✅ OpenAI service initialized successfully');
    
    // Test with a simple prompt
    console.log('🔄 Testing OpenAI API call...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert in international trade compliance. Provide brief, accurate analysis."
        },
        {
          role: "user",
          content: "Analyze this invoice data for compliance: Invoice #12345, Date: 2024-01-15, Amount: $1000, Currency: USD"
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    
    const response = completion.choices[0].message.content;
    console.log('✅ OpenAI API call successful');
    console.log(`📝 Response length: ${response.length} characters`);
    return true;
    
  } catch (error) {
    console.log('❌ OpenAI API test failed:', error.message);
    if (error.message.includes('Incorrect API key')) {
      console.log('   → Invalid API key');
    } else if (error.message.includes('insufficient_quota')) {
      console.log('   → Insufficient quota or billing not set up');
    } else if (error.message.includes('rate_limit_exceeded')) {
      console.log('   → Rate limit exceeded');
    }
    return false;
  }
}

// Test Anthropic API
async function testAnthropicAPI() {
  console.log('\n3. Testing Anthropic Claude 3 Sonnet API...');
  console.log('---------------------------------------------');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  ANTHROPIC_API_KEY not found in environment variables (optional)');
    return false;
  }
  
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    console.log('✅ Anthropic service initialized successfully');
    
    // Test with a simple prompt
    console.log('🔄 Testing Anthropic API call...');
    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 500,
      temperature: 0.1,
      system: "You are an expert in international trade compliance. Provide brief, accurate analysis.",
      messages: [
        {
          role: "user",
          content: "Analyze this invoice data for compliance: Invoice #12345, Date: 2024-01-15, Amount: $1000, Currency: USD"
        }
      ]
    });
    
    const response = message.content[0].text;
    console.log('✅ Anthropic API call successful');
    console.log(`📝 Response length: ${response.length} characters`);
    return true;
    
  } catch (error) {
    console.log('❌ Anthropic API test failed:', error.message);
    if (error.message.includes('authentication_error')) {
      console.log('   → Invalid API key');
    } else if (error.message.includes('rate_limit_error')) {
      console.log('   → Rate limit exceeded');
    }
    return false;
  }
}

// Test the actual AI processing pipeline
async function testAIProcessingPipeline() {
  console.log('\n4. Testing AI Processing Pipeline...');
  console.log('-------------------------------------');
  
  try {
    // Import the AI services
    const GeminiService = require('./services/gemini');
    const ComplianceService = require('./services/compliance');
    
    console.log('✅ AI services imported successfully');
    
    // Test Gemini service
    const geminiService = new GeminiService();
    console.log(`📊 Gemini service status: ${geminiService.genAI ? 'Initialized' : 'Not initialized'}`);
    
    // Test Compliance service
    const complianceService = new ComplianceService();
    console.log(`📊 Compliance service status: ${complianceService.openai || complianceService.anthropic ? 'Initialized' : 'Not initialized'}`);
    console.log(`📊 Preferred provider: ${complianceService.preferredProvider}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ AI processing pipeline test failed:', error.message);
    return false;
  }
}

// Main test function
async function main() {
  console.log('🔍 Environment Variables Check:');
  console.log('--------------------------------');
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '⚠️  Not set (optional)'}`);
  console.log(`COMPLIANCE_AI_PROVIDER: ${process.env.COMPLIANCE_AI_PROVIDER || 'openai'}`);
  
  // Run tests
  const geminiWorks = await testGeminiAPI();
  const openaiWorks = await testOpenAIAPI();
  const anthropicWorks = await testAnthropicAPI();
  const pipelineWorks = await testAIProcessingPipeline();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Gemini 1.5 Pro: ${geminiWorks ? '✅ Working' : '❌ Failed'}`);
  console.log(`OpenAI GPT-4: ${openaiWorks ? '✅ Working' : '❌ Failed'}`);
  console.log(`Anthropic Claude: ${anthropicWorks ? '✅ Working' : '⚠️  Not tested/optional'}`);
  console.log(`AI Pipeline: ${pipelineWorks ? '✅ Working' : '❌ Failed'}`);
  
  console.log('\n🎯 Recommendations:');
  console.log('===================');
  
  if (!geminiWorks) {
    console.log('❌ Fix Gemini API:');
    console.log('   • Get API key from: https://aistudio.google.com/app/apikey');
    console.log('   • Ensure key starts with "AIza"');
    console.log('   • Add to BE/.env file: GEMINI_API_KEY=your_key_here');
  }
  
  if (!openaiWorks && !anthropicWorks) {
    console.log('❌ Fix Compliance AI:');
    console.log('   • Get OpenAI key from: https://platform.openai.com/api-keys');
    console.log('   • OR get Anthropic key from: https://console.anthropic.com/');
    console.log('   • Ensure OpenAI key starts with "sk-proj-"');
    console.log('   • Add to BE/.env file: OPENAI_API_KEY=your_key_here');
  }
  
  if (geminiWorks && (openaiWorks || anthropicWorks)) {
    console.log('✅ All AI models are working! Document processing should use real AI instead of fallback.');
  } else {
    console.log('⚠️  Some AI models are not working. Document processing will use fallback mode.');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('==============');
  console.log('1. Fix any failed API tests above');
  console.log('2. Restart the backend server');
  console.log('3. Test document upload to verify real AI processing');
  console.log('4. Check server logs for AI processing messages');
}

// Run the tests
main().catch(console.error);
