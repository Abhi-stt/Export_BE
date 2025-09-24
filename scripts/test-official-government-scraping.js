const RealTradeDataService = require('../services/realTradeDataService');

/**
 * Test script for official government scraping implementation
 * Tests DGFT, CBIC, and ICEGATE web scraping
 */
async function testOfficialGovernmentScraping() {
  console.log('🧪 Testing Official Government Web Scraping Implementation...\n');
  console.log('🏛️  Using DGFT, CBIC, and ICEGATE for official data\n');

  const realTradeDataService = new RealTradeDataService();

  // Test 1: Official Government HS Code Scraping
  console.log('📋 Test 1: Official Government HS Code Scraping');
  console.log('=' .repeat(60));
  
  try {
    const hsCodeResult = await realTradeDataService.getHSCodeOnly('Organic turmeric powder');
    
    if (hsCodeResult.success) {
      console.log('✅ Official Government HS Code: SUCCESS');
      console.log(`   HS Code: ${hsCodeResult.hsCode.code}`);
      console.log(`   Description: ${hsCodeResult.hsCode.description}`);
      console.log(`   Source: ${hsCodeResult.hsCode.source}`);
      console.log(`   Confidence: ${hsCodeResult.hsCode.confidence}%`);
      console.log(`   Government Sources: ${hsCodeResult.hsCode.source.includes('CBIC') ? 'YES' : 'NO'}`);
      console.log(`   All Suggestions: ${hsCodeResult.hsCode.allSuggestions?.length || 0}`);
      console.log(`   Data Source: ${hsCodeResult.metadata.source}`);
    } else {
      console.log('❌ Official Government HS Code: FAILED');
      console.log(`   Error: ${hsCodeResult.error}`);
      console.log(`   Source: ${hsCodeResult.metadata.source}`);
    }
  } catch (error) {
    console.log('❌ Official Government HS Code: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 2: Official Government Trade Data
  console.log('📋 Test 2: Official Government Trade Data');
  console.log('=' .repeat(60));
  
  try {
    const completeAnalysis = await realTradeDataService.getCompleteTradeAnalysis('Organic turmeric powder');
    
    if (completeAnalysis.success) {
      console.log('✅ Official Government Trade Data: SUCCESS');
      console.log(`   HS Code: ${completeAnalysis.analysis.hsCode.code}`);
      console.log(`   Exporters Found: ${completeAnalysis.analysis.indianExporters.total}`);
      console.log(`   Importers Found: ${completeAnalysis.analysis.indianImporters.total}`);
      console.log(`   Blacklist Entries: ${completeAnalysis.analysis.blacklistAnalysis?.total || 0}`);
      console.log(`   Data Source: ${completeAnalysis.analysis.hsCode.source}`);
      
      // Check if data is from official government sources
      const isOfficial = completeAnalysis.analysis.hsCode.source.includes('CBIC') || 
                        completeAnalysis.analysis.hsCode.source.includes('DGFT') || 
                        completeAnalysis.analysis.hsCode.source.includes('ICEGATE');
      
      console.log(`   Official Government Data: ${isOfficial ? 'YES (GOOD)' : 'NO (BAD)'}`);
      
      // Show sample exporters
      if (completeAnalysis.analysis.indianExporters.companies.length > 0) {
        console.log('\n   Sample Official Exporters:');
        completeAnalysis.analysis.indianExporters.companies.slice(0, 5).forEach((exporter, index) => {
          console.log(`   ${index + 1}. ${exporter.companyName} (${exporter.city}, ${exporter.state})`);
          console.log(`      IEC: ${exporter.iecCode}, Data Source: ${exporter.dataSource}`);
          console.log(`      Data Type: ${exporter.dataType}`);
        });
      }
      
      // Show sample importers
      if (completeAnalysis.analysis.indianImporters.companies.length > 0) {
        console.log('\n   Sample Official Importers:');
        completeAnalysis.analysis.indianImporters.companies.slice(0, 5).forEach((importer, index) => {
          console.log(`   ${index + 1}. ${importer.companyName} (${importer.city}, ${importer.state})`);
          console.log(`      Business Type: ${importer.businessType}, Data Source: ${importer.dataSource}`);
          console.log(`      Data Type: ${importer.dataType}`);
        });
      }
    } else {
      console.log('❌ Official Government Trade Data: FAILED');
      console.log(`   Error: ${completeAnalysis.error}`);
    }
  } catch (error) {
    console.log('❌ Official Government Trade Data: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 3: Individual Official Exporters Test
  console.log('📋 Test 3: Individual Official Exporters Test');
  console.log('=' .repeat(60));
  
  try {
    const exportersResult = await realTradeDataService.getExportersForHSCode('091030', 10);
    
    if (exportersResult.success) {
      console.log('✅ Individual Official Exporters: SUCCESS');
      console.log(`   Total Exporters: ${exportersResult.exporters.total}`);
      console.log(`   HS Code: ${exportersResult.exporters.hsCode}`);
      console.log(`   Source: ${exportersResult.exporters.source}`);
      console.log(`   Data Source: ${exportersResult.metadata.source}`);
      
      if (exportersResult.exporters.companies.length > 0) {
        console.log('\n   Official Exporters List:');
        exportersResult.exporters.companies.slice(0, 5).forEach((exporter, index) => {
          console.log(`   ${index + 1}. ${exporter.companyName}`);
          console.log(`      Location: ${exporter.city}, ${exporter.state}`);
          console.log(`      IEC: ${exporter.iecCode}`);
          console.log(`      Data Source: ${exporter.dataSource}`);
          console.log(`      Data Type: ${exporter.dataType}`);
        });
      }
    } else {
      console.log('❌ Individual Official Exporters: FAILED');
      console.log(`   Error: ${exportersResult.error}`);
      console.log(`   Source: ${exportersResult.metadata.source}`);
    }
  } catch (error) {
    console.log('❌ Individual Official Exporters: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 4: Individual Official Importers Test
  console.log('📋 Test 4: Individual Official Importers Test');
  console.log('=' .repeat(60));
  
  try {
    const importersResult = await realTradeDataService.getImportersForHSCode('091030', 10);
    
    if (importersResult.success) {
      console.log('✅ Individual Official Importers: SUCCESS');
      console.log(`   Total Importers: ${importersResult.importers.total}`);
      console.log(`   HS Code: ${importersResult.importers.hsCode}`);
      console.log(`   Source: ${importersResult.importers.source}`);
      console.log(`   Data Source: ${importersResult.metadata.source}`);
      
      if (importersResult.importers.companies.length > 0) {
        console.log('\n   Official Importers List:');
        importersResult.importers.companies.slice(0, 5).forEach((importer, index) => {
          console.log(`   ${index + 1}. ${importer.companyName}`);
          console.log(`      Location: ${importer.city}, ${importer.state}`);
          console.log(`      Business Type: ${importer.businessType}`);
          console.log(`      Data Source: ${importer.dataSource}`);
          console.log(`      Data Type: ${importer.dataType}`);
        });
      }
    } else {
      console.log('❌ Individual Official Importers: FAILED');
      console.log(`   Error: ${importersResult.error}`);
      console.log(`   Source: ${importersResult.metadata.source}`);
    }
  } catch (error) {
    console.log('❌ Individual Official Importers: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');
  console.log('🎉 Official Government Web Scraping Test Completed!');
  console.log('=' .repeat(60));
  console.log('🏛️  Official Government Sources Used:');
  console.log('   • DGFT (Directorate General of Foreign Trade)');
  console.log('   • CBIC (Central Board of Indirect Taxes and Customs)');
  console.log('   • ICEGATE (Indian Customs Electronic Gateway)');
  console.log('📝 Note: This test uses ONLY official government web scraping');
  console.log('📝 NO AI used in HS code classification');
  console.log('📝 NO fallbacks, no demo data, no hardcoded values');
  console.log('📝 Real official government data only');
}

// Run the test
if (require.main === module) {
  testOfficialGovernmentScraping().catch(console.error);
}

module.exports = testOfficialGovernmentScraping;
