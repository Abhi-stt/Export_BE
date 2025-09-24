#!/usr/bin/env node

/**
 * Test Script for AI Features
 * Tests HS Code Suggestions and AI Corrections
 */

require('dotenv').config();

const ComplianceService = require('./services/compliance');
const AIProcessor = require('./services/aiProcessor');

async function testHSCodeSuggestions() {
  console.log('🧪 Testing HS Code Suggestions...');
  console.log('================================');
  
  const complianceService = new ComplianceService();
  
  const testProducts = [
    'Cotton T-shirts',
    'Electronic Components',
    'Steel Wire',
    'Plastic Toys',
    'Coffee Beans'
  ];
  
  for (const product of testProducts) {
    try {
      console.log(`\n🔍 Testing product: ${product}`);
      const result = await complianceService.suggestHSCodes(product, 'Export document');
      
      if (result.success && result.suggestions && result.suggestions.length > 0) {
        console.log(`✅ Success: Found ${result.suggestions.length} HS code suggestions`);
        console.log(`   First suggestion: ${result.suggestions[0].code} - ${result.suggestions[0].description}`);
        console.log(`   Confidence: ${result.suggestions[0].confidence}%`);
      } else {
        console.log(`❌ Failed: ${result.error || 'No suggestions generated'}`);
        if (result.metadata?.fallbackUsed) {
          console.log(`   Using fallback: ${result.metadata.fallbackUsed}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

async function testComplianceAnalysis() {
  console.log('\n\n🧪 Testing Compliance Analysis...');
  console.log('=================================');
  
  const complianceService = new ComplianceService();
  
  const testDocument = {
    documentType: 'invoice',
    extractedText: `COMMERCIAL INVOICE
Invoice Number: INV-2024-001
Date: 2024-01-15
Exporter: ABC Export Company
Address: 123 Export Street, Mumbai, India
GST: 27AABCU9603R1ZR
Importer: XYZ Import Corp
Address: 456 Import Ave, New York, USA
Items:
1. Cotton T-shirts - Qty: 100 - Unit Price: $12.00 - Total: $1200.00
2. Electronic Components - Qty: 50 - Unit Price: $25.00 - Total: $1250.00
Total Amount: $2450.00`,
    parties: {
      exporter: {
        name: 'ABC Export Company',
        gstNumber: '27AABCU9603R1ZR'
      },
      importer: {
        name: 'XYZ Import Corp'
      }
    },
    items: [
      { description: 'Cotton T-shirts', quantity: 100, unitPrice: 12.00 },
      { description: 'Electronic Components', quantity: 50, unitPrice: 25.00 }
    ],
    totals: {
      totalValue: 2450.00,
      currency: 'USD'
    }
  };
  
  try {
    const result = await complianceService.analyzeCompliance(testDocument, 'invoice');
    
    if (result.success) {
      console.log('✅ Compliance analysis completed successfully');
      console.log(`   Overall valid: ${result.compliance?.isValid}`);
      console.log(`   Score: ${result.compliance?.score}%`);
      console.log(`   Checks performed: ${result.compliance?.checks?.length || 0}`);
      console.log(`   Errors found: ${result.errors?.length || 0}`);
      console.log(`   Corrections suggested: ${result.corrections?.length || 0}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n📝 Sample error:');
        console.log(`   ${result.errors[0].field}: ${result.errors[0].message}`);
      }
      
      if (result.corrections && result.corrections.length > 0) {
        console.log('\n🔧 Sample correction:');
        console.log(`   ${result.corrections[0].field}: ${result.corrections[0].suggestion}`);
      }
    } else {
      console.log(`❌ Compliance analysis failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testAIProcessorIntegration() {
  console.log('\n\n🧪 Testing AI Processor Integration...');
  console.log('=====================================');
  
  const aiProcessor = new AIProcessor();
  
  const mockOCRResult = {
    success: true,
    extractedText: `COMMERCIAL INVOICE
Invoice: INV-2024-001
Items: Cotton T-shirts, Electronic Components`,
    structuredData: {
      documentType: 'invoice',
      items: [
        { description: 'Cotton T-shirts' },
        { description: 'Electronic Components' }
      ]
    },
    entities: [
      { type: 'product', value: 'Cotton T-shirts' },
      { type: 'product', value: 'Electronic Components' }
    ]
  };
  
  try {
    console.log('🔍 Testing HS Code generation from AI Processor...');
    const hsResult = await aiProcessor.generateHSCodeSuggestions(mockOCRResult, 'invoice');
    
    if (hsResult.success) {
      console.log(`✅ HS Code generation successful`);
      console.log(`   Products analyzed: ${hsResult.productsAnalyzed}`);
      console.log(`   Suggestions generated: ${hsResult.suggestionsGenerated}`);
      console.log(`   Total suggestion groups: ${hsResult.suggestions?.length || 0}`);
      
      if (hsResult.suggestions && hsResult.suggestions.length > 0) {
        const firstGroup = hsResult.suggestions[0];
        console.log(`\n📦 Sample product suggestion:`);
        console.log(`   Product: ${firstGroup.productDescription}`);
        console.log(`   HS Codes: ${firstGroup.suggestions?.length || 0} suggestions`);
        if (firstGroup.suggestions && firstGroup.suggestions.length > 0) {
          console.log(`   First HS Code: ${firstGroup.suggestions[0].code}`);
        }
      }
    } else {
      console.log(`❌ HS Code generation failed: ${hsResult.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting AI Features Test');
  console.log('============================');
  console.log('');
  
  console.log('🔑 Environment Check:');
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  try {
    await testHSCodeSuggestions();
    await testComplianceAnalysis(); 
    await testAIProcessorIntegration();
    
    console.log('\n\n🎉 Test Suite Completed!');
    console.log('========================');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. If all tests passed ✅, the AI features should work in document upload');
    console.log('2. If any tests failed ❌, check the API keys and error messages above');
    console.log('3. Test document upload in frontend to verify end-to-end functionality');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  runTests();
}
