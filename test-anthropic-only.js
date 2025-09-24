#!/usr/bin/env node

/**
 * Test Anthropic Only (Skip OpenAI)
 */

require('dotenv').config();

async function testAnthropicOnly() {
  console.log('🧪 Testing Anthropic-Only AI Processing');
  console.log('=====================================');
  
  // Temporarily disable OpenAI to test Anthropic only
  const originalOpenAI = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  
  try {
    const ComplianceService = require('./services/compliance');
    console.log('📦 Loading ComplianceService...');
    
    const complianceService = new ComplianceService();
    console.log('✅ ComplianceService initialized');
    
    // Test HS Code Suggestions
    console.log('\n🏷️ Testing HS Code Suggestions...');
    const hsResult = await complianceService.suggestHSCodes('Cotton T-shirts', 'Export document');
    
    if (hsResult.success) {
      console.log('✅ HS Code suggestions SUCCESS!');
      console.log(`   Found ${hsResult.suggestions?.length || 0} suggestions`);
      if (hsResult.suggestions && hsResult.suggestions.length > 0) {
        console.log(`   Sample: ${hsResult.suggestions[0].code} - ${hsResult.suggestions[0].description?.substring(0, 60)}...`);
      }
      console.log(`   Provider: ${hsResult.metadata?.provider}`);
      console.log(`   Fallback used: ${hsResult.metadata?.fallbackUsed || false}`);
    } else {
      console.log('❌ HS Code suggestions FAILED');
      console.log(`   Error: ${hsResult.error}`);
    }
    
    // Test Compliance Analysis
    console.log('\n🔍 Testing Compliance Analysis...');
    const testDoc = {
      extractedText: 'COMMERCIAL INVOICE\nINV-001\nCotton T-shirts\n$100',
      documentType: 'invoice',
      parties: {
        exporter: { name: 'ABC Corp' },
        importer: { name: 'XYZ Ltd' }
      }
    };
    
    const compResult = await complianceService.analyzeCompliance(testDoc, 'invoice');
    
    if (compResult.success) {
      console.log('✅ Compliance analysis SUCCESS!');
      console.log(`   Valid: ${compResult.compliance?.isValid}`);
      console.log(`   Score: ${compResult.compliance?.score}%`);
      console.log(`   Errors: ${compResult.errors?.length || 0}`);
      console.log(`   Corrections: ${compResult.corrections?.length || 0}`);
      console.log(`   Provider: ${compResult.metadata?.provider}`);
      console.log(`   Fallback used: ${compResult.metadata?.fallback || false}`);
    } else {
      console.log('❌ Compliance analysis FAILED');
      console.log(`   Error: ${compResult.error}`);
    }
    
  } catch (error) {
    console.log('💥 Test failed:', error.message);
  } finally {
    // Restore OpenAI key
    if (originalOpenAI) {
      process.env.OPENAI_API_KEY = originalOpenAI;
    }
  }
  
  console.log('\n🏁 Anthropic-only test complete');
}

testAnthropicOnly().then(() => process.exit(0)).catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
