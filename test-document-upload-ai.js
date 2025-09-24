#!/usr/bin/env node

/**
 * Document Upload AI Test Script
 * 
 * This script tests the document upload functionality to ensure
 * all AI features work with real AI models instead of fallback mode.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🧪 Document Upload AI Test');
console.log('==========================\n');

// Test AI service initialization
async function testAIServices() {
  console.log('1. Testing AI Service Initialization:');
  console.log('-------------------------------------');
  
  let geminiWorking = false;
  let openaiWorking = false;
  let anthropicWorking = false;
  
  // Test Gemini
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Test with a simple prompt
    const result = await model.generateContent('Test message');
    console.log('✅ Gemini: Working');
    geminiWorking = true;
  } catch (error) {
    console.log('❌ Gemini: Failed -', error.message);
    if (error.message.includes('429')) {
      console.log('   → Quota exceeded - need new API key or wait for reset');
    } else if (error.message.includes('API_KEY_INVALID')) {
      console.log('   → Invalid API key - need new key');
    }
  }
  
  // Test OpenAI
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: 'Test message' }],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI: Working');
    openaiWorking = true;
  } catch (error) {
    console.log('❌ OpenAI: Failed -', error.message);
    if (error.message.includes('401')) {
      console.log('   → Invalid API key - need new key');
    } else if (error.message.includes('sk-or-v1')) {
      console.log('   → Old API key format - need new key');
    }
  }
  
  // Test Anthropic
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Test message' }]
    });
    
    console.log('✅ Anthropic: Working');
    anthropicWorking = true;
  } catch (error) {
    console.log('❌ Anthropic: Failed -', error.message);
  }
  
  return { geminiWorking, openaiWorking, anthropicWorking };
}

// Test document processing pipeline
async function testDocumentProcessing() {
  console.log('\n2. Testing Document Processing Pipeline:');
  console.log('------------------------------------------');
  
  try {
    // Import the AI services
    const GeminiService = require('./services/gemini');
    const ComplianceService = require('./services/compliance');
    
    console.log('✅ AI services imported successfully');
    
    // Test Gemini service
    const geminiService = new GeminiService();
    console.log(`📊 Gemini service: ${geminiService.genAI ? 'Initialized' : 'Not initialized'}`);
    
    // Test Compliance service
    const complianceService = new ComplianceService();
    console.log(`📊 Compliance service: ${complianceService.openai || complianceService.anthropic ? 'Initialized' : 'Not initialized'}`);
    console.log(`📊 Preferred provider: ${complianceService.preferredProvider}`);
    
    return true;
  } catch (error) {
    console.log('❌ Document processing pipeline test failed:', error.message);
    return false;
  }
}

// Test with a sample document
async function testSampleDocument() {
  console.log('\n3. Testing Sample Document Processing:');
  console.log('---------------------------------------');
  
  try {
    // Create a sample document for testing
    const sampleDocument = {
      originalName: 'test-invoice.pdf',
      filePath: './uploads/test-invoice.pdf',
      fileType: 'application/pdf',
      documentType: 'invoice'
    };
    
    // Test Gemini OCR
    const GeminiService = require('./services/gemini');
    const geminiService = new GeminiService();
    
    if (geminiService.genAI && geminiService.model) {
      console.log('✅ Gemini OCR: Ready for real processing');
    } else {
      console.log('❌ Gemini OCR: Will use fallback mode');
    }
    
    // Test Compliance Analysis
    const ComplianceService = require('./services/compliance');
    const complianceService = new ComplianceService();
    
    if (complianceService.openai || complianceService.anthropic) {
      console.log('✅ Compliance Analysis: Ready for real processing');
    } else {
      console.log('❌ Compliance Analysis: Will use fallback mode');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Sample document test failed:', error.message);
    return false;
  }
}

// Main test function
async function main() {
  console.log('🔍 Current Environment Status:');
  console.log('-------------------------------');
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`COMPLIANCE_AI_PROVIDER: ${process.env.COMPLIANCE_AI_PROVIDER || 'openai'}`);
  
  // Run tests
  const aiStatus = await testAIServices();
  const pipelineStatus = await testDocumentProcessing();
  const sampleStatus = await testSampleDocument();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Gemini OCR: ${aiStatus.geminiWorking ? '✅ Real AI' : '❌ Fallback Mode'}`);
  console.log(`OpenAI Compliance: ${aiStatus.openaiWorking ? '✅ Real AI' : '❌ Fallback Mode'}`);
  console.log(`Anthropic Compliance: ${aiStatus.anthropicWorking ? '✅ Real AI' : '❌ Fallback Mode'}`);
  console.log(`Document Pipeline: ${pipelineStatus ? '✅ Working' : '❌ Failed'}`);
  console.log(`Sample Document: ${sampleStatus ? '✅ Ready' : '❌ Failed'}`);
  
  console.log('\n🎯 Document Upload Status:');
  console.log('==========================');
  
  if (aiStatus.geminiWorking && (aiStatus.openaiWorking || aiStatus.anthropicWorking)) {
    console.log('✅ ALL AI FEATURES WILL WORK WITH REAL AI MODELS');
    console.log('   • OCR will use Gemini 1.5 Pro');
    console.log('   • Compliance analysis will use real AI');
    console.log('   • HS code suggestions will use real AI');
    console.log('   • No fallback mode warnings');
  } else {
    console.log('❌ SOME FEATURES WILL USE FALLBACK MODE');
    
    if (!aiStatus.geminiWorking) {
      console.log('   • OCR will use fallback mode (Gemini failed)');
    }
    
    if (!aiStatus.openaiWorking && !aiStatus.anthropicWorking) {
      console.log('   • Compliance analysis will use fallback mode');
      console.log('   • HS code suggestions will use fallback mode');
    }
  }
  
  console.log('\n🔧 Required Fixes:');
  console.log('==================');
  
  if (!aiStatus.geminiWorking) {
    console.log('❌ Fix Gemini API:');
    console.log('   • Get new API key from: https://aistudio.google.com/app/apikey');
    console.log('   • Or wait for quota reset (24 hours)');
  }
  
  if (!aiStatus.openaiWorking && !aiStatus.anthropicWorking) {
    console.log('❌ Fix Compliance AI:');
    console.log('   • Get new OpenAI key from: https://platform.openai.com/api-keys');
    console.log('   • OR get new Anthropic key from: https://console.anthropic.com/');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('==============');
  console.log('1. Fix any failed AI services above');
  console.log('2. Update your .env file with new API keys');
  console.log('3. Restart the backend server');
  console.log('4. Test document upload through the frontend');
  console.log('5. Check that no fallback warnings appear');
  
  console.log('\n✨ Test complete!');
}

// Run the tests
main().catch(console.error);
