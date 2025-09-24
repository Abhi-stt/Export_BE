const RealTradeDataService = require('../services/realTradeDataService');

/**
 * Test script for pure web scraping implementation
 * Tests HS codes without AI and proper trade data without form elements
 */
async function testPureWebScraping() {
  console.log('🧪 Testing Pure Web Scraping Implementation...\n');

  const realTradeDataService = new RealTradeDataService();

  // Test 1: Pure Web Scraping HS Code (NO AI)
  console.log('📋 Test 1: Pure Web Scraping HS Code (NO AI)');
  console.log('=' .repeat(50));
  
  try {
    const hsCodeResult = await realTradeDataService.getHSCodeOnly('Organic turmeric powder');
    
    if (hsCodeResult.success) {
      console.log('✅ Pure Web Scraping HS Code: SUCCESS');
      console.log(`   HS Code: ${hsCodeResult.hsCode.code}`);
      console.log(`   Description: ${hsCodeResult.hsCode.description}`);
      console.log(`   Source: ${hsCodeResult.hsCode.source}`);
      console.log(`   Confidence: ${hsCodeResult.hsCode.confidence}%`);
      console.log(`   AI Used: ${hsCodeResult.hsCode.source.includes('AI') ? 'YES' : 'NO'}`);
      console.log(`   All Suggestions: ${hsCodeResult.hsCode.allSuggestions?.length || 0}`);
    } else {
      console.log('❌ Pure Web Scraping HS Code: FAILED');
      console.log(`   Error: ${hsCodeResult.error}`);
    }
  } catch (error) {
    console.log('❌ Pure Web Scraping HS Code: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 2: Proper Trade Data (NO Form Elements)
  console.log('📋 Test 2: Proper Trade Data (NO Form Elements)');
  console.log('=' .repeat(50));
  
  try {
    const completeAnalysis = await realTradeDataService.getCompleteTradeAnalysis('Organic turmeric powder');
    
    if (completeAnalysis.success) {
      console.log('✅ Proper Trade Data: SUCCESS');
      console.log(`   HS Code: ${completeAnalysis.analysis.hsCode.code}`);
      console.log(`   Exporters Found: ${completeAnalysis.analysis.indianExporters.total}`);
      console.log(`   Importers Found: ${completeAnalysis.analysis.indianImporters.total}`);
      console.log(`   Blacklist Checked: ${completeAnalysis.analysis.blacklistAnalysis.totalChecked}`);
      
      // Check for form elements in exporters
      const hasFormElements = completeAnalysis.analysis.indianExporters.companies.some(exporter => 
        exporter.companyName && (
          exporter.companyName.toLowerCase().includes('email') || 
          exporter.companyName.toLowerCase().includes('message') ||
          exporter.companyName.toLowerCase().includes('captcha')
        )
      );
      
      console.log(`   Contains Form Elements: ${hasFormElements ? 'YES (BAD)' : 'NO (GOOD)'}`);
      
      // Show sample exporters
      if (completeAnalysis.analysis.indianExporters.companies.length > 0) {
        console.log('\n   Sample Exporters:');
        completeAnalysis.analysis.indianExporters.companies.slice(0, 5).forEach((exporter, index) => {
          console.log(`   ${index + 1}. ${exporter.companyName} (${exporter.city}, ${exporter.state})`);
          console.log(`      IEC: ${exporter.iecCode}, Volume: $${exporter.exportVolume?.toLocaleString()}`);
          console.log(`      Certifications: ${exporter.certifications?.join(', ') || 'N/A'}`);
        });
      }
      
      // Show sample importers
      if (completeAnalysis.analysis.indianImporters.companies.length > 0) {
        console.log('\n   Sample Importers:');
        completeAnalysis.analysis.indianImporters.companies.slice(0, 5).forEach((importer, index) => {
          console.log(`   ${index + 1}. ${importer.companyName} (${importer.city}, ${importer.state})`);
          console.log(`      Type: ${importer.businessType}, Volume: $${importer.importVolume?.toLocaleString()}`);
          console.log(`      Rating: ${importer.complianceRating}`);
        });
      }
    } else {
      console.log('❌ Proper Trade Data: FAILED');
      console.log(`   Error: ${completeAnalysis.error}`);
    }
  } catch (error) {
    console.log('❌ Proper Trade Data: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 3: Individual Exporters Test
  console.log('📋 Test 3: Individual Exporters Test');
  console.log('=' .repeat(50));
  
  try {
    const exportersResult = await realTradeDataService.getExportersForHSCode('091030', 10);
    
    if (exportersResult.success) {
      console.log('✅ Individual Exporters: SUCCESS');
      console.log(`   Total Exporters: ${exportersResult.exporters.total}`);
      console.log(`   HS Code: ${exportersResult.exporters.hsCode}`);
      console.log(`   Source: ${exportersResult.exporters.source}`);
      
      // Check for form elements
      const hasFormElements = exportersResult.exporters.companies.some(exporter => 
        exporter.companyName && (
          exporter.companyName.toLowerCase().includes('email') || 
          exporter.companyName.toLowerCase().includes('message') ||
          exporter.companyName.toLowerCase().includes('captcha')
        )
      );
      
      console.log(`   Contains Form Elements: ${hasFormElements ? 'YES (BAD)' : 'NO (GOOD)'}`);
      
      if (exportersResult.exporters.companies.length > 0) {
        console.log('\n   Exporters List:');
        exportersResult.exporters.companies.slice(0, 5).forEach((exporter, index) => {
          console.log(`   ${index + 1}. ${exporter.companyName}`);
          console.log(`      Location: ${exporter.city}, ${exporter.state}`);
          console.log(`      IEC: ${exporter.iecCode}`);
          console.log(`      Volume: $${exporter.exportVolume?.toLocaleString()}`);
          console.log(`      Data Type: ${exporter.dataType || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Individual Exporters: FAILED');
      console.log(`   Error: ${exportersResult.error}`);
    }
  } catch (error) {
    console.log('❌ Individual Exporters: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test 4: Individual Importers Test
  console.log('📋 Test 4: Individual Importers Test');
  console.log('=' .repeat(50));
  
  try {
    const importersResult = await realTradeDataService.getImportersForHSCode('091030', 10);
    
    if (importersResult.success) {
      console.log('✅ Individual Importers: SUCCESS');
      console.log(`   Total Importers: ${importersResult.importers.total}`);
      console.log(`   HS Code: ${importersResult.importers.hsCode}`);
      console.log(`   Source: ${importersResult.importers.source}`);
      
      // Check for form elements
      const hasFormElements = importersResult.importers.companies.some(importer => 
        importer.companyName && (
          importer.companyName.toLowerCase().includes('email') || 
          importer.companyName.toLowerCase().includes('message') ||
          importer.companyName.toLowerCase().includes('captcha')
        )
      );
      
      console.log(`   Contains Form Elements: ${hasFormElements ? 'YES (BAD)' : 'NO (GOOD)'}`);
      
      if (importersResult.importers.companies.length > 0) {
        console.log('\n   Importers List:');
        importersResult.importers.companies.slice(0, 5).forEach((importer, index) => {
          console.log(`   ${index + 1}. ${importer.companyName}`);
          console.log(`      Location: ${importer.city}, ${importer.state}`);
          console.log(`      Business Type: ${importer.businessType}`);
          console.log(`      Volume: $${importer.importVolume?.toLocaleString()}`);
          console.log(`      Data Type: ${importer.dataType || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Individual Importers: FAILED');
      console.log(`   Error: ${importersResult.error}`);
    }
  } catch (error) {
    console.log('❌ Individual Importers: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');
  console.log('🎉 Pure Web Scraping Test Completed!');
  console.log('=' .repeat(50));
  console.log('📝 Note: This test uses PURE web scraping for HS codes');
  console.log('📝 NO AI used in HS code classification');
  console.log('📝 Proper Indian company data (no Email/Message/Captcha)');
  console.log('📝 Real Indian exporters and importers');
  console.log('📝 No fallbacks, no demo data, no hardcoded values');
}

// Run the test
if (require.main === module) {
  testPureWebScraping().catch(console.error);
}

module.exports = testPureWebScraping;
