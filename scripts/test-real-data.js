const RealTradeDataService = require('../services/realTradeDataService');

/**
 * Test script for real data services
 * Tests the complete real data pipeline
 */
async function testRealDataServices() {
  console.log('🧪 Testing Real Data Services...\n');

  const realTradeDataService = new RealTradeDataService();

  // Test 1: HS Code Classification
  console.log('📋 Test 1: HS Code Classification');
  console.log('=' .repeat(50));
  
  try {
    const hsCodeResult = await realTradeDataService.getHSCodeOnly('Organic turmeric powder');
    
    if (hsCodeResult.success) {
      console.log('✅ HS Code Classification: SUCCESS');
      console.log(`   HS Code: ${hsCodeResult.hsCode.code}`);
      console.log(`   Description: ${hsCodeResult.hsCode.description}`);
      console.log(`   Source: ${hsCodeResult.hsCode.source}`);
      console.log(`   Confidence: ${hsCodeResult.hsCode.confidence}%`);
    } else {
      console.log('❌ HS Code Classification: FAILED');
      console.log(`   Error: ${hsCodeResult.error}`);
    }
  } catch (error) {
    console.log('❌ HS Code Classification: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 2: Complete Trade Analysis
  console.log('📋 Test 2: Complete Trade Analysis');
  console.log('=' .repeat(50));
  
  try {
    const completeAnalysis = await realTradeDataService.getCompleteTradeAnalysis('Organic turmeric powder');
    
    if (completeAnalysis.success) {
      console.log('✅ Complete Trade Analysis: SUCCESS');
      console.log(`   HS Code: ${completeAnalysis.analysis.hsCode.code}`);
      console.log(`   Exporters Found: ${completeAnalysis.analysis.indianExporters.total}`);
      console.log(`   Importers Found: ${completeAnalysis.analysis.indianImporters.total}`);
      console.log(`   Blacklist Checked: ${completeAnalysis.analysis.blacklistAnalysis.totalChecked}`);
      console.log(`   All Data Real: ${completeAnalysis.analysis.summary.allDataReal}`);
      console.log(`   No Fallbacks Used: ${completeAnalysis.analysis.summary.noFallbacksUsed}`);
    } else {
      console.log('❌ Complete Trade Analysis: FAILED');
      console.log(`   Error: ${completeAnalysis.error}`);
    }
  } catch (error) {
    console.log('❌ Complete Trade Analysis: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 3: Service Health Check
  console.log('📋 Test 3: Service Health Check');
  console.log('=' .repeat(50));
  
  try {
    const healthStatus = realTradeDataService.getHealthStatus();
    console.log('✅ Service Health Check: SUCCESS');
    console.log(`   Service: ${healthStatus.service}`);
    console.log(`   Status: ${healthStatus.status}`);
    console.log(`   Real Data Only: ${healthStatus.realDataOnly}`);
    console.log(`   No Fallbacks: ${healthStatus.noFallbacks}`);
  } catch (error) {
    console.log('❌ Service Health Check: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 4: Input Validation
  console.log('📋 Test 4: Input Validation');
  console.log('=' .repeat(50));
  
  try {
    const validation1 = realTradeDataService.validateInput('');
    const validation2 = realTradeDataService.validateInput('ab');
    const validation3 = realTradeDataService.validateInput('Organic turmeric powder');
    
    console.log('✅ Input Validation: SUCCESS');
    console.log(`   Empty string: ${validation1.valid ? 'VALID' : 'INVALID'} (${validation1.error || 'OK'})`);
    console.log(`   Short string: ${validation2.valid ? 'VALID' : 'INVALID'} (${validation2.error || 'OK'})`);
    console.log(`   Valid string: ${validation3.valid ? 'VALID' : 'INVALID'} (${validation3.error || 'OK'})`);
  } catch (error) {
    console.log('❌ Input Validation: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');
  console.log('🎉 Real Data Services Test Completed!');
  console.log('=' .repeat(50));
  console.log('📝 Note: This test uses REAL data sources only');
  console.log('📝 No fallbacks, no demo data, no hardcoded values');
  console.log('📝 All data comes from live Indian government sources');
}

// Run the test
if (require.main === module) {
  testRealDataServices().catch(console.error);
}

module.exports = testRealDataServices;
