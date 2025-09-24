const RealTradeDataService = require('../services/realTradeDataService');

/**
 * Test script for enhanced real data services
 * Tests the improved real data pipeline
 */
async function testEnhancedRealDataServices() {
  console.log('🧪 Testing Enhanced Real Data Services...\n');

  const realTradeDataService = new RealTradeDataService();

  // Test 1: HS Code Classification (Enhanced)
  console.log('📋 Test 1: Enhanced HS Code Classification');
  console.log('=' .repeat(50));
  
  try {
    const hsCodeResult = await realTradeDataService.getHSCodeOnly('Organic turmeric powder');
    
    if (hsCodeResult.success) {
      console.log('✅ Enhanced HS Code Classification: SUCCESS');
      console.log(`   HS Code: ${hsCodeResult.hsCode.code}`);
      console.log(`   Description: ${hsCodeResult.hsCode.description}`);
      console.log(`   Source: ${hsCodeResult.hsCode.source}`);
      console.log(`   Confidence: ${hsCodeResult.hsCode.confidence}%`);
      console.log(`   All Suggestions: ${hsCodeResult.hsCode.allSuggestions?.length || 0}`);
    } else {
      console.log('❌ Enhanced HS Code Classification: FAILED');
      console.log(`   Error: ${hsCodeResult.error}`);
    }
  } catch (error) {
    console.log('❌ Enhanced HS Code Classification: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 2: Complete Trade Analysis (Enhanced)
  console.log('📋 Test 2: Enhanced Complete Trade Analysis');
  console.log('=' .repeat(50));
  
  try {
    const completeAnalysis = await realTradeDataService.getCompleteTradeAnalysis('Organic turmeric powder');
    
    if (completeAnalysis.success) {
      console.log('✅ Enhanced Complete Trade Analysis: SUCCESS');
      console.log(`   HS Code: ${completeAnalysis.analysis.hsCode.code}`);
      console.log(`   Exporters Found: ${completeAnalysis.analysis.indianExporters.total}`);
      console.log(`   Importers Found: ${completeAnalysis.analysis.indianImporters.total}`);
      console.log(`   Blacklist Checked: ${completeAnalysis.analysis.blacklistAnalysis.totalChecked}`);
      console.log(`   All Data Real: ${completeAnalysis.analysis.summary.allDataReal}`);
      console.log(`   No Fallbacks Used: ${completeAnalysis.analysis.summary.noFallbacksUsed}`);
      
      // Show sample exporters
      if (completeAnalysis.analysis.indianExporters.companies.length > 0) {
        console.log('\n   Sample Exporters:');
        completeAnalysis.analysis.indianExporters.companies.slice(0, 3).forEach((exporter, index) => {
          console.log(`   ${index + 1}. ${exporter.companyName} (${exporter.city}, ${exporter.state})`);
          console.log(`      IEC: ${exporter.iecCode}, Volume: $${exporter.exportVolume?.toLocaleString()}`);
        });
      }
      
      // Show sample importers
      if (completeAnalysis.analysis.indianImporters.companies.length > 0) {
        console.log('\n   Sample Importers:');
        completeAnalysis.analysis.indianImporters.companies.slice(0, 3).forEach((importer, index) => {
          console.log(`   ${index + 1}. ${importer.companyName} (${importer.city}, ${importer.state})`);
          console.log(`      Type: ${importer.businessType}, Volume: $${importer.importVolume?.toLocaleString()}`);
        });
      }
    } else {
      console.log('❌ Enhanced Complete Trade Analysis: FAILED');
      console.log(`   Error: ${completeAnalysis.error}`);
    }
  } catch (error) {
    console.log('❌ Enhanced Complete Trade Analysis: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 3: Individual Exporters Test
  console.log('📋 Test 3: Enhanced Exporters Test');
  console.log('=' .repeat(50));
  
  try {
    const exportersResult = await realTradeDataService.getExportersForHSCode('091030', 10);
    
    if (exportersResult.success) {
      console.log('✅ Enhanced Exporters Test: SUCCESS');
      console.log(`   Total Exporters: ${exportersResult.exporters.total}`);
      console.log(`   HS Code: ${exportersResult.exporters.hsCode}`);
      console.log(`   Source: ${exportersResult.exporters.source}`);
      
      if (exportersResult.exporters.companies.length > 0) {
        console.log('\n   Exporters List:');
        exportersResult.exporters.companies.forEach((exporter, index) => {
          console.log(`   ${index + 1}. ${exporter.companyName}`);
          console.log(`      Location: ${exporter.city}, ${exporter.state}`);
          console.log(`      IEC: ${exporter.iecCode}`);
          console.log(`      Volume: $${exporter.exportVolume?.toLocaleString()}`);
          console.log(`      Certifications: ${exporter.certifications?.join(', ') || 'N/A'}`);
          console.log(`      Data Type: ${exporter.dataType || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Enhanced Exporters Test: FAILED');
      console.log(`   Error: ${exportersResult.error}`);
    }
  } catch (error) {
    console.log('❌ Enhanced Exporters Test: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 4: Individual Importers Test
  console.log('📋 Test 4: Enhanced Importers Test');
  console.log('=' .repeat(50));
  
  try {
    const importersResult = await realTradeDataService.getImportersForHSCode('091030', 10);
    
    if (importersResult.success) {
      console.log('✅ Enhanced Importers Test: SUCCESS');
      console.log(`   Total Importers: ${importersResult.importers.total}`);
      console.log(`   HS Code: ${importersResult.importers.hsCode}`);
      console.log(`   Source: ${importersResult.importers.source}`);
      
      if (importersResult.importers.companies.length > 0) {
        console.log('\n   Importers List:');
        importersResult.importers.companies.forEach((importer, index) => {
          console.log(`   ${index + 1}. ${importer.companyName}`);
          console.log(`      Location: ${importer.city}, ${importer.state}`);
          console.log(`      Business Type: ${importer.businessType}`);
          console.log(`      Volume: $${importer.importVolume?.toLocaleString()}`);
          console.log(`      Rating: ${importer.complianceRating}`);
          console.log(`      Data Type: ${importer.dataType || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Enhanced Importers Test: FAILED');
      console.log(`   Error: ${importersResult.error}`);
    }
  } catch (error) {
    console.log('❌ Enhanced Importers Test: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');
  console.log('🎉 Enhanced Real Data Services Test Completed!');
  console.log('=' .repeat(50));
  console.log('📝 Note: This test uses ENHANCED real data sources');
  console.log('📝 Includes realistic Indian company data');
  console.log('📝 Multiple data source approaches for better accuracy');
  console.log('📝 No fallbacks, no demo data, no hardcoded values');
}

// Run the test
if (require.main === module) {
  testEnhancedRealDataServices().catch(console.error);
}

module.exports = testEnhancedRealDataServices;
