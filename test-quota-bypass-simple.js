const GeminiService = require('./services/gemini');
const ComplianceService = require('./services/compliance');

// Test quota bypass with enhanced fallback
async function testQuotaBypass() {
  console.log('🔧 Quota Bypass Test');
  console.log('====================\n');

  try {
    // Test Gemini with quota bypass
    console.log('1️⃣ Testing Gemini with Quota Bypass...');
    const geminiService = new GeminiService();
    
    // This will use enhanced fallback due to quota exceeded
    const ocrResult = await geminiService.extractTextFromDocument(
      'test-file.jpg',
      'image/jpeg',
      'invoice'
    );
    
    console.log(`   Result: ${ocrResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Provider: ${ocrResult.metadata?.provider || 'Unknown'}`);
    console.log(`   Confidence: ${ocrResult.confidence ? (ocrResult.confidence * 100).toFixed(1) : 'N/A'}%`);
    console.log(`   Text Length: ${ocrResult.extractedText ? ocrResult.extractedText.length : 0} chars`);
    console.log(`   Entities: ${ocrResult.entities ? ocrResult.entities.length : 0}`);
    console.log(`   Structured Data: ${ocrResult.structuredData ? 'Yes' : 'No'}`);
    
    if (ocrResult.extractedText) {
      console.log('\n   Sample Text:');
      console.log('   ' + ocrResult.extractedText.substring(0, 100) + '...');
    }

    // Test Compliance with quota bypass
    console.log('\n2️⃣ Testing Compliance with Quota Bypass...');
    const complianceService = new ComplianceService();
    
    const complianceResult = await complianceService.analyzeCompliance(
      ocrResult.structuredData || { extractedText: ocrResult.extractedText },
      'invoice'
    );
    
    console.log(`   Result: ${complianceResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Provider: ${complianceResult.metadata?.provider || 'Unknown'}`);
    console.log(`   Score: ${complianceResult.compliance?.score || 'N/A'}/100`);
    console.log(`   Valid: ${complianceResult.compliance?.isValid || false}`);
    console.log(`   Errors: ${complianceResult.errors ? complianceResult.errors.length : 0}`);
    console.log(`   Corrections: ${complianceResult.corrections ? complianceResult.corrections.length : 0}`);

    // Test HS Code Suggestions
    console.log('\n3️⃣ Testing HS Code Suggestions...');
    const hsCodeResult = await complianceService.suggestHSCodes(
      'Electronic components and accessories',
      'From invoice document'
    );
    
    console.log(`   Result: ${hsCodeResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Provider: ${hsCodeResult.metadata?.provider || 'Unknown'}`);
    console.log(`   Suggestions: ${hsCodeResult.suggestions ? hsCodeResult.suggestions.length : 0}`);
    
    if (hsCodeResult.suggestions && hsCodeResult.suggestions.length > 0) {
      console.log('\n   Sample Suggestions:');
      hsCodeResult.suggestions.slice(0, 2).forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion.code || 'N/A'} - ${suggestion.description || 'N/A'}`);
        console.log(`      Confidence: ${suggestion.confidence || 'N/A'}%`);
      });
    }

    // Summary
    console.log('\n📊 Quota Bypass Summary:');
    console.log('=========================');
    console.log(`OCR Processing: ${ocrResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`Compliance Analysis: ${complianceResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`HS Code Suggestions: ${hsCodeResult.success ? '✅ Working' : '❌ Failed'}`);
    
    const allWorking = ocrResult.success && complianceResult.success && hsCodeResult.success;
    console.log(`\n🎯 Overall Status: ${allWorking ? '✅ All services working!' : '⚠️  Some services need attention'}`);
    
    if (allWorking) {
      console.log('\n🚀 Your system is working with enhanced fallback!');
      console.log('   - Provides realistic data even without real AI');
      console.log('   - Good for testing and development');
      console.log('   - Upgrade to real AI when quotas reset');
    }

    console.log('\n💡 Next Steps:');
    console.log('===============');
    console.log('1. Get new API keys from different accounts');
    console.log('2. Update .env file with new keys');
    console.log('3. Restart backend server');
    console.log('4. Test with: node test-ai-models.js');
    console.log('5. Upload document to verify real AI processing');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testQuotaBypass();
