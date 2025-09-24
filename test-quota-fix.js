const QuotaMonitor = require('./services/quotaMonitor');
const QuotaBypass = require('./services/quotaBypass');
const GeminiService = require('./services/gemini');
const ComplianceService = require('./services/compliance');

// Test quota fix solutions
async function testQuotaFix() {
  console.log('🔧 Quota Fix Test Suite');
  console.log('========================\n');

  try {
    // Initialize quota monitor
    console.log('1️⃣ Initializing Quota Monitor...');
    const quotaMonitor = new QuotaMonitor();
    
    // Wait a moment for initial check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n2️⃣ Testing Quota Bypass...');
    const quotaBypass = new QuotaBypass();
    
    // Test enhanced fallback
    console.log('   Testing enhanced fallback processing...');
    const fallbackResult = await quotaBypass.enhancedFallbackProcessing('test-doc');
    
    if (fallbackResult.success) {
      console.log('✅ Enhanced fallback working!');
      console.log(`   Confidence: ${(fallbackResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Entities: ${fallbackResult.entities?.length || 0}`);
      console.log(`   HS Codes: ${fallbackResult.hsCodeSuggestions?.length || 0}`);
    } else {
      console.log('❌ Enhanced fallback failed');
    }

    console.log('\n3️⃣ Testing Service Availability...');
    
    // Test Gemini
    console.log('   Testing Gemini availability...');
    const geminiAvailable = await quotaMonitor.testServiceAvailability('gemini');
    console.log(`   Gemini: ${geminiAvailable ? '✅ Available' : '❌ Quota Exceeded'}`);
    
    // Test OpenAI
    console.log('   Testing OpenAI availability...');
    const openaiAvailable = await quotaMonitor.testServiceAvailability('openai');
    console.log(`   OpenAI: ${openaiAvailable ? '✅ Available' : '❌ Quota Exceeded'}`);
    
    // Test Anthropic
    console.log('   Testing Anthropic availability...');
    const anthropicAvailable = await quotaMonitor.testServiceAvailability('anthropic');
    console.log(`   Anthropic: ${anthropicAvailable ? '✅ Available' : '❌ Quota Exceeded'}`);

    console.log('\n4️⃣ Testing Best Available Services...');
    const bestOCR = quotaMonitor.getBestAvailableService('ocr');
    const bestCompliance = quotaMonitor.getBestAvailableService('compliance');
    const bestHSCodes = quotaMonitor.getBestAvailableService('hscodes');
    
    console.log(`   Best OCR Service: ${bestOCR}`);
    console.log(`   Best Compliance Service: ${bestCompliance}`);
    console.log(`   Best HS Code Service: ${bestHSCodes}`);

    console.log('\n5️⃣ Testing Document Processing...');
    
    // Test with a real document if available
    const fs = require('fs');
    const path = require('path');
    const testDocPath = path.join(__dirname, 'uploads', 'documents');
    
    if (fs.existsSync(testDocPath)) {
      const testFiles = fs.readdirSync(testDocPath).filter(file => 
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pdf')
      );
      
      if (testFiles.length > 0) {
        const testFile = testFiles[0];
        const filePath = path.join(testDocPath, testFile);
        
        console.log(`   Testing with: ${testFile}`);
        
        // Test Gemini with quota bypass
        const geminiService = new GeminiService();
        const ocrResult = await geminiService.extractTextFromDocument(
          filePath,
          testFile.endsWith('.png') ? 'image/png' : 
          testFile.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
          'invoice'
        );
        
        console.log(`   OCR Result: ${ocrResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   Provider: ${ocrResult.metadata?.provider || 'Unknown'}`);
        console.log(`   Confidence: ${ocrResult.confidence ? (ocrResult.confidence * 100).toFixed(1) : 'N/A'}%`);
        
        // Test Compliance with quota bypass
        const complianceService = new ComplianceService();
        const complianceResult = await complianceService.analyzeCompliance(
          ocrResult.structuredData || { extractedText: ocrResult.extractedText },
          'invoice'
        );
        
        console.log(`   Compliance Result: ${complianceResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   Provider: ${complianceResult.metadata?.provider || 'Unknown'}`);
        console.log(`   Score: ${complianceResult.compliance?.score || 'N/A'}/100`);
        
      } else {
        console.log('   No test documents found');
      }
    } else {
      console.log('   No uploads directory found');
    }

    console.log('\n6️⃣ Quota Status Summary:');
    console.log('==========================');
    const quotaStatus = quotaMonitor.getQuotaStatus();
    
    Object.entries(quotaStatus).forEach(([service, status]) => {
      const statusIcon = status.available ? '✅' : '❌';
      const lastCheck = status.lastCheck ? status.lastCheck.toLocaleTimeString() : 'Never';
      console.log(`${statusIcon} ${service.toUpperCase()}: ${status.available ? 'Available' : 'Quota Exceeded'}`);
      console.log(`   Last Check: ${lastCheck}`);
      if (status.retryAfter) {
        console.log(`   Retry After: ${status.retryAfter.toLocaleString()}`);
      }
    });

    console.log('\n7️⃣ Recommendations:');
    console.log('====================');
    const recommendations = quotaMonitor.getRetryRecommendations();
    
    if (recommendations.length === 0) {
      console.log('✅ All services are available!');
      console.log('🚀 Your AI models are working perfectly!');
    } else {
      recommendations.forEach(rec => {
        console.log(`❌ ${rec.service}: ${rec.action}`);
        console.log(`   Estimated Wait: ${rec.estimatedWait}`);
        console.log(`   Alternative: ${rec.alternative}`);
      });
      
      console.log('\n💡 Solutions:');
      console.log('1. Wait for quota reset (usually 1-24 hours)');
      console.log('2. Get new API keys with higher quotas');
      console.log('3. Use enhanced fallback processing (already implemented)');
      console.log('4. Upgrade to paid plans for higher quotas');
    }

    console.log('\n🎯 Final Status:');
    console.log('================');
    const workingServices = Object.values(quotaStatus).filter(s => s.available).length;
    const totalServices = Object.keys(quotaStatus).length;
    
    if (workingServices === totalServices) {
      console.log('🎉 ALL AI SERVICES WORKING!');
      console.log('✅ Real AI processing is active');
      console.log('✅ No fallback mode needed');
    } else if (workingServices > 0) {
      console.log(`⚠️  ${workingServices}/${totalServices} services working`);
      console.log('🔄 Mixed mode: Some real AI, some fallback');
    } else {
      console.log('❌ All services using fallback mode');
      console.log('🔄 Enhanced fallback provides good results');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testQuotaFix();
