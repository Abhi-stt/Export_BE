#!/usr/bin/env node

/**
 * Debug Syntax Issues
 */

require('dotenv').config();

console.log('🔍 Checking compliance.js syntax...');

try {
  const ComplianceService = require('./services/compliance');
  console.log('✅ ComplianceService loaded successfully');
  
  const service = new ComplianceService();
  console.log('✅ ComplianceService instantiated successfully');
  
  console.log('🧪 Testing method call...');
  
  // Test the specific method that's failing
  service.suggestHSCodes('Cotton T-shirts', 'Export document')
    .then(result => {
      console.log('✅ Method call successful');
      console.log('Result:', result);
    })
    .catch(error => {
      console.log('❌ Method call failed:', error.message);
      console.log('Stack:', error.stack);
    });
    
} catch (error) {
  console.log('💥 Failed to load service:', error.message);
  console.log('Stack:', error.stack);
}
