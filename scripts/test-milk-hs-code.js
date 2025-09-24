const RealTradeDataService = require('../services/realTradeDataService');

/**
 * Test script specifically for Milk HS code search
 */
async function testMilkHSCode() {
  console.log('🧪 Testing Milk HS Code Search...\n');
  console.log('🏛️  Using official CBIC GST portal for milk HS codes\n');

  const realTradeDataService = new RealTradeDataService();

  // Test: Search for milk specifically
  console.log('📋 Searching for Milk HS Code in CBIC GST Portal');
  console.log('=' .repeat(60));
  
  try {
    const hsCodeResult = await realTradeDataService.getHSCodeOnly('milk');
    
    if (hsCodeResult.success) {
      console.log('✅ Milk HS Code Search: SUCCESS');
      console.log(`   HS Code: ${hsCodeResult.hsCode.code}`);
      console.log(`   Description: ${hsCodeResult.hsCode.description}`);
      console.log(`   Source: ${hsCodeResult.hsCode.source}`);
      console.log(`   Confidence: ${hsCodeResult.hsCode.confidence}%`);
      console.log(`   GST Rates: ${hsCodeResult.hsCode.gstRates ? JSON.stringify(hsCodeResult.hsCode.gstRates) : 'N/A'}`);
      
      // Check if we found milk specifically
      const isMilk = hsCodeResult.hsCode.description.toLowerCase().includes('milk');
      
      console.log(`   Found Milk: ${isMilk ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Data Source: ${hsCodeResult.metadata.source}`);
      
      // Show all suggestions to find milk
      if (hsCodeResult.hsCode.allSuggestions && hsCodeResult.hsCode.allSuggestions.length > 0) {
        console.log('\n   🔍 Searching for milk in all suggestions...');
        
        const milkCodes = hsCodeResult.hsCode.allSuggestions.filter(suggestion => 
          suggestion.description.toLowerCase().includes('milk')
        );
        
        if (milkCodes.length > 0) {
          console.log(`   ✅ Found ${milkCodes.length} milk-related HS codes:`);
          milkCodes.slice(0, 10).forEach((code, index) => {
            console.log(`   ${index + 1}. ${code.code} - ${code.description.substring(0, 150)}...`);
            console.log(`      Confidence: ${code.confidence}%, Source: ${code.source}`);
            if (code.gstRates) {
              console.log(`      GST Rates: CGST: ${code.gstRates.cgst}, SGST: ${code.gstRates.sgst}, IGST: ${code.gstRates.igst}`);
            }
          });
        } else {
          console.log('   ❌ No milk-specific codes found in suggestions');
          
          // Let's check what we got instead
          console.log('\n   📋 Top 5 suggestions found:');
          hsCodeResult.hsCode.allSuggestions.slice(0, 5).forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion.code} - ${suggestion.description.substring(0, 100)}...`);
            console.log(`      Confidence: ${suggestion.confidence}%, Source: ${suggestion.source}`);
          });
        }
      }
      
    } else {
      console.log('❌ Milk HS Code Search: FAILED');
      console.log(`   Error: ${hsCodeResult.error}`);
      console.log(`   Source: ${hsCodeResult.metadata.source}`);
    }
  } catch (error) {
    console.log('❌ Milk HS Code Search: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test with more specific milk terms
  console.log('📋 Testing with specific milk terms...');
  console.log('=' .repeat(60));
  
  const milkTerms = ['fresh milk', 'dairy milk', 'cow milk', 'buffalo milk', 'milk products'];
  
  for (const term of milkTerms) {
    try {
      console.log(`\n🔍 Searching for: "${term}"`);
      const result = await realTradeDataService.getHSCodeOnly(term);
      
      if (result.success) {
        const isMilk = result.hsCode.description.toLowerCase().includes('milk');
        console.log(`   ✅ HS Code: ${result.hsCode.code}`);
        console.log(`   ✅ Description: ${result.hsCode.description.substring(0, 100)}...`);
        console.log(`   ✅ Found Milk: ${isMilk ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   ✅ Confidence: ${result.hsCode.confidence}%`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n');
  console.log('🎉 Milk HS Code Test Completed!');
  console.log('=' .repeat(60));
  console.log('🏛️  Official CBIC GST Portal: https://cbic-gst.gov.in/gst-goods-services-rates.html');
  console.log('📝 This test uses ONLY the official CBIC GST portal for HS codes');
  console.log('📝 NO AI used - pure web scraping from government source');
}

// Run the test
if (require.main === module) {
  testMilkHSCode().catch(console.error);
}

module.exports = testMilkHSCode;
