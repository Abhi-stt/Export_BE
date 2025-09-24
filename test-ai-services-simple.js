const GeminiService = require('./services/gemini');
const ComplianceService = require('./services/compliance');
const fs = require('fs');
const path = require('path');

// Test AI services directly
async function testAIServices() {
  console.log('🧪 Testing AI Services Directly');
  console.log('===============================\n');

  try {
    // Check if we have a test document
    const testDocPath = path.join(__dirname, 'uploads', 'documents');
    const testFiles = fs.readdirSync(testDocPath).filter(file => 
      file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pdf')
    );

    if (testFiles.length === 0) {
      console.log('❌ No test documents found in uploads/documents/');
      console.log('Please upload a document through the frontend first.');
      return;
    }

    const testFile = testFiles[0];
    const filePath = path.join(testDocPath, testFile);
    console.log(`📄 Using test file: ${testFile}`);

    // Test Gemini OCR
    console.log('\n1️⃣ Testing Gemini OCR...');
    console.log('========================');
    const geminiService = new GeminiService();
    
    const ocrResult = await geminiService.extractTextFromDocument(
      filePath,
      testFile.endsWith('.png') ? 'image/png' : 
      testFile.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
      'invoice'
    );

    console.log(`✅ OCR Result: ${ocrResult.success ? 'Success' : 'Failed'}`);
    console.log(`📊 Confidence: ${ocrResult.confidence ? (ocrResult.confidence * 100).toFixed(1) : 'N/A'}%`);
    console.log(`📝 Text Length: ${ocrResult.extractedText ? ocrResult.extractedText.length : 0} characters`);
    console.log(`🏷️  Entities: ${ocrResult.entities ? ocrResult.entities.length : 0}`);
    console.log(`📊 Structured Data: ${ocrResult.structuredData ? 'Yes' : 'No'}`);

    if (ocrResult.extractedText) {
      console.log('\n📝 Sample Extracted Text:');
      console.log('========================');
      const sampleText = ocrResult.extractedText.substring(0, 200);
      console.log(sampleText + (ocrResult.extractedText.length > 200 ? '...' : ''));
    }

    // Test Compliance Analysis
    console.log('\n2️⃣ Testing Compliance Analysis...');
    console.log('==================================');
    const complianceService = new ComplianceService();
    
    const complianceResult = await complianceService.analyzeCompliance(
      ocrResult.structuredData || { extractedText: ocrResult.extractedText },
      'invoice'
    );

    console.log(`✅ Compliance Result: ${complianceResult.success ? 'Success' : 'Failed'}`);
    console.log(`📊 Compliance Score: ${complianceResult.compliance?.score || 'N/A'}/100`);
    console.log(`❌ Errors: ${complianceResult.errors ? complianceResult.errors.length : 0}`);
    console.log(`💡 Corrections: ${complianceResult.corrections ? complianceResult.corrections.length : 0}`);
    console.log(`📋 Summary: ${complianceResult.summary ? 'Yes' : 'No'}`);

    if (complianceResult.compliance) {
      console.log('\n📋 Compliance Details:');
      console.log('======================');
      console.log(`Valid: ${complianceResult.compliance.isValid || false}`);
      console.log(`Score: ${complianceResult.compliance.score || 0}/100`);
      if (complianceResult.errors && complianceResult.errors.length > 0) {
        console.log('Errors:');
        complianceResult.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.message || error}`);
        });
      }
    }

    // Test HS Code Suggestions
    console.log('\n3️⃣ Testing HS Code Suggestions...');
    console.log('==================================');
    
    const hsCodeResult = await complianceService.suggestHSCodes(
      'Electronic components and accessories',
      'From invoice document'
    );

    console.log(`✅ HS Code Result: ${hsCodeResult.success ? 'Success' : 'Failed'}`);
    console.log(`🏷️  Suggestions: ${hsCodeResult.suggestions ? hsCodeResult.suggestions.length : 0}`);

    if (hsCodeResult.suggestions && hsCodeResult.suggestions.length > 0) {
      console.log('\n🏷️  HS Code Suggestions:');
      console.log('========================');
      hsCodeResult.suggestions.slice(0, 3).forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.code || 'N/A'} - ${suggestion.description || 'N/A'}`);
        console.log(`   Confidence: ${suggestion.confidence || 'N/A'}%`);
      });
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`OCR Processing: ${ocrResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`Compliance Analysis: ${complianceResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`HS Code Suggestions: ${hsCodeResult.success ? '✅ Working' : '❌ Failed'}`);
    
    const allWorking = ocrResult.success && complianceResult.success && hsCodeResult.success;
    console.log(`\n🎯 Overall Status: ${allWorking ? '✅ All AI services working!' : '⚠️  Some services need attention'}`);

    if (allWorking) {
      console.log('\n🚀 Your AI processing pipeline is ready!');
      console.log('   - Document upload will work with real AI models');
      console.log('   - Preview will show correct confidence and processing time');
      console.log('   - All features are functioning properly');
    } else {
      console.log('\n🔧 Issues to fix:');
      if (!ocrResult.success) console.log('   - Fix Gemini OCR service');
      if (!complianceResult.success) console.log('   - Fix Compliance analysis service');
      if (!hsCodeResult.success) console.log('   - Fix HS Code suggestions service');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testAIServices();
