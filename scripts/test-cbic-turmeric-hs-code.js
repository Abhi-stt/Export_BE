const RealTradeDataService = require('../services/realTradeDataService');

/**
 * Test script specifically for CBIC GST portal HS code search for turmeric
 */
async function testCBICTurmericHSCode() {
  console.log('🧪 Testing CBIC GST Portal for Turmeric HS Code...\n');
  console.log('🏛️  Using official CBIC GST portal: https://cbic-gst.gov.in/gst-goods-services-rates.html\n');

  const realTradeDataService = new RealTradeDataService();

  // Test: Search for turmeric specifically
  console.log('📋 Searching for Turmeric HS Code in CBIC GST Portal');
  console.log('=' .repeat(60));
  
  try {
    const hsCodeResult = await realTradeDataService.getHSCodeOnly('turmeric powder');
    
    if (hsCodeResult.success) {
      console.log('✅ CBIC GST Portal HS Code Search: SUCCESS');
      console.log(`   HS Code: ${hsCodeResult.hsCode.code}`);
      console.log(`   Description: ${hsCodeResult.hsCode.description}`);
      console.log(`   Source: ${hsCodeResult.hsCode.source}`);
      console.log(`   Confidence: ${hsCodeResult.hsCode.confidence}%`);
      console.log(`   GST Rates: ${hsCodeResult.hsCode.gstRates ? JSON.stringify(hsCodeResult.hsCode.gstRates) : 'N/A'}`);
      
      // Check if we found turmeric specifically
      const isTurmeric = hsCodeResult.hsCode.description.toLowerCase().includes('turmeric') || 
                        hsCodeResult.hsCode.description.toLowerCase().includes('curcuma');
      
      console.log(`   Found Turmeric: ${isTurmeric ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Data Source: ${hsCodeResult.metadata.source}`);
      
      // Show all suggestions to find turmeric
      if (hsCodeResult.hsCode.allSuggestions && hsCodeResult.hsCode.allSuggestions.length > 0) {
        console.log('\n   🔍 Searching for turmeric in all suggestions...');
        
        const turmericCodes = hsCodeResult.hsCode.allSuggestions.filter(suggestion => 
          suggestion.description.toLowerCase().includes('turmeric') ||
          suggestion.description.toLowerCase().includes('curcuma') ||
          suggestion.description.toLowerCase().includes('spice')
        );
        
        if (turmericCodes.length > 0) {
          console.log(`   ✅ Found ${turmericCodes.length} turmeric-related HS codes:`);
          turmericCodes.slice(0, 5).forEach((code, index) => {
            console.log(`   ${index + 1}. ${code.code} - ${code.description.substring(0, 100)}...`);
            console.log(`      Confidence: ${code.confidence}%, Source: ${code.source}`);
            if (code.gstRates) {
              console.log(`      GST Rates: CGST: ${code.gstRates.cgst}, SGST: ${code.gstRates.sgst}, IGST: ${code.gstRates.igst}`);
            }
          });
        } else {
          console.log('   ❌ No turmeric-specific codes found in suggestions');
        }
      }
      
    } else {
      console.log('❌ CBIC GST Portal HS Code Search: FAILED');
      console.log(`   Error: ${hsCodeResult.error}`);
      console.log(`   Source: ${hsCodeResult.metadata.source}`);
    }
  } catch (error) {
    console.log('❌ CBIC GST Portal HS Code Search: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');
  console.log('🎉 CBIC GST Portal Test Completed!');
  console.log('=' .repeat(60));
  console.log('🏛️  Official CBIC GST Portal: https://cbic-gst.gov.in/gst-goods-services-rates.html');
  console.log('📝 This test uses ONLY the official CBIC GST portal for HS codes');
  console.log('📝 NO AI used - pure web scraping from government source');
  console.log('📝 Real official government data with GST rates');
}

// Run the test
if (require.main === module) {
  testCBICTurmericHSCode().catch(console.error);
}

module.exports = testCBICTurmericHSCode;
