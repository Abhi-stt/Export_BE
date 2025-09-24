const GeminiService = require('./services/gemini');
const ComplianceService = require('./services/compliance');
const fs = require('fs');
const path = require('path');

// Test to verify real AI models are working
async function testRealAIVerification() {
  console.log('🤖 Real AI Models Verification Test');
  console.log('===================================\n');

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

    let realAICount = 0;
    let totalTests = 3;

    // Test 1: Gemini OCR
    console.log('\n1️⃣ Testing Gemini OCR (Real AI)...');
    console.log('===================================');
    const geminiService = new GeminiService();
    
    const ocrResult = await geminiService.extractTextFromDocument(
      filePath,
      testFile.endsWith('.png') ? 'image/png' : 
      testFile.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
      'invoice'
    );

    const isRealGemini = ocrResult.metadata?.provider === 'gemini-1.5-pro' && 
                        !ocrResult.metadata?.fallback;
    
    console.log(`📊 OCR Result: ${ocrResult.success ? 'Success' : 'Failed'}`);
    console.log(`🤖 Provider: ${ocrResult.metadata?.provider || 'Unknown'}`);
    console.log(`🔄 Fallback Used: ${ocrResult.metadata?.fallback ? 'Yes' : 'No'}`);
    console.log(`📈 Confidence: ${ocrResult.confidence ? (ocrResult.confidence * 100).toFixed(1) : 'N/A'}%`);
    
    if (isRealGemini) {
      console.log('✅ REAL GEMINI AI WORKING!');
      realAICount++;
    } else {
      console.log('⚠️  Using fallback - check GEMINI_API_KEY');
    }

    // Test 2: Compliance Analysis
    console.log('\n2️⃣ Testing Compliance Analysis (Real AI)...');
    console.log('===========================================');
    const complianceService = new ComplianceService();
    
    const complianceResult = await complianceService.analyzeCompliance(
      ocrResult.structuredData || { extractedText: ocrResult.extractedText },
      'invoice'
    );

    const isRealCompliance = complianceResult.metadata?.provider && 
                           !complianceResult.metadata?.fallback &&
                           (complianceResult.metadata.provider.includes('gpt-4') || 
                            complianceResult.metadata.provider.includes('claude'));
    
    console.log(`📊 Compliance Result: ${complianceResult.success ? 'Success' : 'Failed'}`);
    console.log(`🤖 Provider: ${complianceResult.metadata?.provider || 'Unknown'}`);
    console.log(`🔄 Fallback Used: ${complianceResult.metadata?.fallback ? 'Yes' : 'No'}`);
    console.log(`📈 Score: ${complianceResult.compliance?.score || 'N/A'}/100`);
    
    if (isRealCompliance) {
      console.log('✅ REAL COMPLIANCE AI WORKING!');
      realAICount++;
    } else {
      console.log('⚠️  Using fallback - check OPENAI_API_KEY or ANTHROPIC_API_KEY');
    }

    // Test 3: HS Code Suggestions
    console.log('\n3️⃣ Testing HS Code Suggestions (Real AI)...');
    console.log('===========================================');
    
    const hsCodeResult = await complianceService.suggestHSCodes(
      'Electronic components and accessories',
      'From invoice document'
    );

    const isRealHSCodes = hsCodeResult.metadata?.provider && 
                         !hsCodeResult.metadata?.fallback &&
                         (hsCodeResult.metadata.provider.includes('claude') || 
                          hsCodeResult.metadata.provider.includes('gpt'));
    
    console.log(`📊 HS Code Result: ${hsCodeResult.success ? 'Success' : 'Failed'}`);
    console.log(`🤖 Provider: ${hsCodeResult.metadata?.provider || 'Unknown'}`);
    console.log(`🔄 Fallback Used: ${hsCodeResult.metadata?.fallback ? 'Yes' : 'No'}`);
    console.log(`🏷️  Suggestions: ${hsCodeResult.suggestions ? hsCodeResult.suggestions.length : 0}`);
    
    if (isRealHSCodes) {
      console.log('✅ REAL HS CODE AI WORKING!');
      realAICount++;
    } else {
      console.log('⚠️  Using fallback - check OPENAI_API_KEY or ANTHROPIC_API_KEY');
    }

    // Final Results
    console.log('\n🎯 REAL AI VERIFICATION RESULTS:');
    console.log('=================================');
    console.log(`Real AI Models Working: ${realAICount}/${totalTests}`);
    
    if (realAICount === totalTests) {
      console.log('\n🎉 ALL REAL AI MODELS WORKING!');
      console.log('✅ Your system is using real AI instead of fallback');
      console.log('✅ Document processing will use actual AI models');
      console.log('✅ You will get real-time AI analysis results');
    } else if (realAICount > 0) {
      console.log('\n⚠️  PARTIAL REAL AI WORKING');
      console.log(`✅ ${realAICount} AI model(s) working with real APIs`);
      console.log(`⚠️  ${totalTests - realAICount} AI model(s) still using fallback`);
    } else {
      console.log('\n❌ NO REAL AI MODELS WORKING');
      console.log('⚠️  All services are using fallback mode');
      console.log('🔧 Check your API keys in the .env file');
    }

    console.log('\n🔧 To Fix Fallback Issues:');
    console.log('===========================');
    if (realAICount < totalTests) {
      console.log('1. Get API keys from the respective platforms');
      console.log('2. Update the .env file with real keys');
      console.log('3. Restart the backend server');
      console.log('4. Run this test again to verify');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealAIVerification();
