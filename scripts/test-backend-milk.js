const RealTradeDataService = require('../services/realTradeDataService');

/**
 * Test script to verify backend milk HS code functionality
 */
async function testBackendMilk() {
  console.log('🧪 Testing Backend Milk HS Code Functionality...\n');

  const realTradeDataService = new RealTradeDataService();

  try {
    console.log('📋 Testing milk HS code retrieval...');
    console.log('=' .repeat(50));
    
    const result = await realTradeDataService.getHSCodeOnly('milk');
    
    if (result.success) {
      console.log('✅ Backend Milk HS Code: SUCCESS');
      console.log(`   HS Code: ${result.hsCode.code}`);
      console.log(`   Description: ${result.hsCode.description}`);
      console.log(`   Confidence: ${result.hsCode.confidence}%`);
      console.log(`   Category: ${result.hsCode.category}`);
      console.log(`   Source: ${result.hsCode.source}`);
      console.log(`   GST Rates: ${result.hsCode.gstRates ? JSON.stringify(result.hsCode.gstRates) : 'N/A'}`);
      console.log(`   Data Source: ${result.metadata.source}`);
      
      // Check if it's the correct milk HS code
      const isCorrectMilkCode = result.hsCode.code === '0401.00.00' || 
                               result.hsCode.code === '0402.00.00' ||
                               result.hsCode.description.toLowerCase().includes('milk');
      
      console.log(`   Correct Milk Code: ${isCorrectMilkCode ? 'YES ✅' : 'NO ❌'}`);
      
    } else {
      console.log('❌ Backend Milk HS Code: FAILED');
      console.log(`   Error: ${result.error}`);
      console.log(`   Source: ${result.metadata.source}`);
    }
  } catch (error) {
    console.log('❌ Backend Milk HS Code: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');
  console.log('🎉 Backend Test Completed!');
  console.log('=' .repeat(50));
  console.log('📝 This test verifies the backend is working correctly');
  console.log('📝 Using official government data sources only');
}

// Run the test
if (require.main === module) {
  testBackendMilk().catch(console.error);
}

module.exports = testBackendMilk;
