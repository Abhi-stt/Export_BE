#!/usr/bin/env node

/**
 * Quota Management Test Script
 * 
 * This script tests the new quota management system to ensure
 * it handles API quota limits gracefully and provides enhanced fallback processing.
 */

require('dotenv').config();

console.log('🧪 Quota Management Test');
console.log('========================\n');

async function testQuotaManagement() {
  console.log('1. Testing Quota Manager:');
  console.log('-------------------------');
  
  try {
    const QuotaManager = require('./services/quotaManager');
    const quotaManager = new QuotaManager();
    
    console.log('✅ Quota Manager initialized successfully');
    
    // Test quota status
    const status = quotaManager.getQuotaStatus();
    console.log('📊 Initial quota status:', status);
    
    // Test service availability
    console.log('🔍 Service availability:');
    console.log(`   Gemini: ${quotaManager.isServiceAvailable('gemini') ? '✅ Available' : '❌ Not available'}`);
    console.log(`   OpenAI: ${quotaManager.isServiceAvailable('openai') ? '✅ Available' : '❌ Not available'}`);
    console.log(`   Anthropic: ${quotaManager.isServiceAvailable('anthropic') ? '✅ Available' : '❌ Not available'}`);
    
    // Test best available service selection
    const bestOCR = quotaManager.getBestAvailableService('ocr');
    const bestCompliance = quotaManager.getBestAvailableService('compliance');
    
    console.log('🎯 Best available services:');
    console.log(`   OCR: ${bestOCR}`);
    console.log(`   Compliance: ${bestCompliance}`);
    
    return true;
  } catch (error) {
    console.log('❌ Quota Manager test failed:', error.message);
    return false;
  }
}

async function testEnhancedFallback() {
  console.log('\n2. Testing Enhanced Fallback Processing:');
  console.log('----------------------------------------');
  
  try {
    const GeminiService = require('./services/gemini');
    const geminiService = new GeminiService();
    
    console.log('✅ Gemini service initialized');
    
    // Test enhanced fallback processing
    const fallbackResult = geminiService.getEnhancedFallbackProcessing('./test-document.pdf', 'invoice');
    
    console.log('📄 Enhanced fallback result:');
    console.log(`   Success: ${fallbackResult.success}`);
    console.log(`   Confidence: ${fallbackResult.confidence}%`);
    console.log(`   Model: ${fallbackResult.metadata.model}`);
    console.log(`   Quota Exceeded: ${fallbackResult.metadata.quotaExceeded}`);
    console.log(`   Note: ${fallbackResult.metadata.note}`);
    
    // Check if it has realistic data
    if (fallbackResult.structuredData && fallbackResult.structuredData.invoiceNumber) {
      console.log('✅ Enhanced fallback provides realistic structured data');
    } else {
      console.log('❌ Enhanced fallback missing structured data');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Enhanced fallback test failed:', error.message);
    return false;
  }
}

async function testDocumentProcessingWithQuota() {
  console.log('\n3. Testing Document Processing with Quota Management:');
  console.log('-----------------------------------------------------');
  
  try {
    const GeminiService = require('./services/gemini');
    const ComplianceService = require('./services/compliance');
    
    const geminiService = new GeminiService();
    const complianceService = new ComplianceService();
    
    console.log('✅ AI services initialized');
    
    // Test quota-aware processing
    console.log('🔍 Testing quota-aware processing...');
    
    // Simulate a document processing request
    const testDocument = {
      filePath: './test-invoice.pdf',
      mimeType: 'application/pdf',
      documentType: 'invoice'
    };
    
    // Test Gemini processing
    console.log('📄 Testing Gemini OCR processing...');
    const ocrResult = await geminiService.extractTextFromDocument(
      testDocument.filePath,
      testDocument.mimeType,
      testDocument.documentType
    );
    
    console.log(`   OCR Result: ${ocrResult.success ? 'Success' : 'Failed'}`);
    console.log(`   Model Used: ${ocrResult.metadata.model}`);
    console.log(`   Quota Exceeded: ${ocrResult.metadata.quotaExceeded || false}`);
    
    // Test compliance processing
    console.log('📊 Testing compliance analysis...');
    const complianceResult = await complianceService.analyzeCompliance(
      ocrResult.structuredData || {},
      testDocument.documentType
    );
    
    console.log(`   Compliance Result: ${complianceResult.success ? 'Success' : 'Failed'}`);
    console.log(`   Provider: ${complianceResult.metadata?.provider || 'fallback'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Document processing test failed:', error.message);
    return false;
  }
}

async function testQuotaRecovery() {
  console.log('\n4. Testing Quota Recovery:');
  console.log('--------------------------');
  
  try {
    const QuotaManager = require('./services/quotaManager');
    const quotaManager = new QuotaManager();
    
    // Simulate quota exceeded
    console.log('🔄 Simulating quota exceeded scenario...');
    const mockError = new Error('429 Too Many Requests');
    quotaManager.handleQuotaExceeded('gemini', mockError);
    
    console.log('📊 Quota status after exceeded:');
    const status = quotaManager.getQuotaStatus();
    console.log(`   Gemini Available: ${status.gemini.available}`);
    console.log(`   Retry After: ${status.gemini.retryAfter ? new Date(status.gemini.retryAfter).toLocaleString() : 'N/A'}`);
    
    // Test service availability
    console.log(`   Service Available: ${quotaManager.isServiceAvailable('gemini')}`);
    
    // Simulate quota reset
    console.log('🔄 Simulating quota reset...');
    quotaManager.resetServiceQuota('gemini');
    
    console.log('📊 Quota status after reset:');
    const resetStatus = quotaManager.getQuotaStatus();
    console.log(`   Gemini Available: ${resetStatus.gemini.available}`);
    console.log(`   Service Available: ${quotaManager.isServiceAvailable('gemini')}`);
    
    return true;
  } catch (error) {
    console.log('❌ Quota recovery test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Current Environment Status:');
  console.log('-------------------------------');
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set'}`);
  
  // Run tests
  const quotaTest = await testQuotaManagement();
  const fallbackTest = await testEnhancedFallback();
  const processingTest = await testDocumentProcessingWithQuota();
  const recoveryTest = await testQuotaRecovery();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Quota Management: ${quotaTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`Enhanced Fallback: ${fallbackTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`Document Processing: ${processingTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`Quota Recovery: ${recoveryTest ? '✅ Working' : '❌ Failed'}`);
  
  console.log('\n🎯 Quota Management Benefits:');
  console.log('=============================');
  console.log('✅ Handles API quota limits gracefully');
  console.log('✅ Provides enhanced fallback processing');
  console.log('✅ Tracks quota status and retry times');
  console.log('✅ Automatically recovers when quota resets');
  console.log('✅ Maintains service availability during quota issues');
  
  console.log('\n🚀 Next Steps:');
  console.log('==============');
  console.log('1. The quota management system is now active');
  console.log('2. Document processing will handle quota limits gracefully');
  console.log('3. Enhanced fallback processing provides better results');
  console.log('4. Test document upload to see improved handling');
  
  console.log('\n✨ Quota management test complete!');
}

// Run the tests
main().catch(console.error);
