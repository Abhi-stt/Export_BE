#!/usr/bin/env node

/**
 * Simple Test for AI Services
 */

require('dotenv').config();

async function simpleTest() {
  console.log('🧪 Simple AI Test');
  console.log('================');
  
  console.log('\n🔑 API Keys Check:');
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET ✅' : 'MISSING ❌'}`);
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET ✅' : 'MISSING ❌'}`);
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET ✅' : 'MISSING ❌'}`);
  
  try {
    const ComplianceService = require('./services/compliance');
    console.log('\n📦 Loading ComplianceService... ✅');
    
    const complianceService = new ComplianceService();
    console.log('🔧 ComplianceService initialized... ✅');
    
    // Test simple HS code suggestion
    console.log('\n🧪 Testing HS Code Suggestions...');
    const hsResult = await complianceService.suggestHSCodes('Cotton T-shirts', 'Export invoice');
    
    if (hsResult.success) {
      console.log(`✅ HS Code test PASSED - Found ${hsResult.suggestions?.length || 0} suggestions`);
      if (hsResult.suggestions && hsResult.suggestions.length > 0) {
        console.log(`   Sample: ${hsResult.suggestions[0].code} - ${hsResult.suggestions[0].description?.substring(0, 50)}...`);
      }
    } else {
      console.log(`❌ HS Code test FAILED - ${hsResult.error}`);
      if (hsResult.metadata?.fallbackUsed) {
        console.log(`   Fallback used: ${hsResult.metadata.fallbackUsed}`);
      }
    }
    
    // Test compliance analysis
    console.log('\n🧪 Testing Compliance Analysis...');
    const testDoc = {
      extractedText: 'INVOICE INV-001 Cotton T-shirts $100',
      documentType: 'invoice'
    };
    
    const compResult = await complianceService.analyzeCompliance(testDoc, 'invoice');
    
    if (compResult.success) {
      console.log(`✅ Compliance test PASSED - Score: ${compResult.compliance?.score || 0}%`);
      console.log(`   Errors: ${compResult.errors?.length || 0}, Corrections: ${compResult.corrections?.length || 0}`);
    } else {
      console.log(`❌ Compliance test FAILED - ${compResult.error}`);
    }
    
  } catch (error) {
    console.log(`💥 Test failed with error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
  
  console.log('\n🏁 Test Complete');
}

simpleTest().then(() => process.exit(0)).catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
