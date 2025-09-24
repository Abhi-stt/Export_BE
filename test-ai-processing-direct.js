const AIProcessor = require('./services/aiProcessor');
const { Document } = require('./schemas');
const fs = require('fs');
const path = require('path');

// Test AI processing directly
async function testAIProcessing() {
  console.log('🧪 Testing AI Processing Directly');
  console.log('=================================\n');

  try {
    // Check if we have a test document
    const testDocPath = path.join(__dirname, 'uploads', 'documents');
    const testFiles = fs.readdirSync(testDocPath).filter(file => 
      file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pdf')
    );

    if (testFiles.length === 0) {
      console.log('❌ No test documents found in uploads/documents/');
      console.log('Please upload a document through the frontend first.');
      return;
    }

    const testFile = testFiles[0];
    const filePath = path.join(testDocPath, testFile);
    console.log(`📄 Using test file: ${testFile}`);

    // Create a test document in the database
    const testDocument = new Document({
      fileName: testFile,
      originalName: testFile,
      fileType: testFile.endsWith('.png') ? 'image/png' : 
                testFile.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
      fileSize: fs.statSync(filePath).size,
      documentType: 'invoice',
      description: 'Test document for AI processing',
      uploadedBy: 'test-user-id',
      filePath: filePath,
      status: 'uploading'
    });

    await testDocument.save();
    console.log(`✅ Test document created with ID: ${testDocument._id}`);

    // Initialize AI processor
    const aiProcessor = new AIProcessor();
    console.log('🤖 AI Processor initialized');

    // Process the document
    console.log('🔄 Starting AI processing...');
    const startTime = Date.now();
    
    const result = await aiProcessor.processDocument(testDocument._id);
    
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);

    console.log(`⏱️  Total processing time: ${totalTime}s`);

    if (result.success) {
      console.log('✅ AI processing completed successfully!');
      
      // Get the updated document
      const updatedDocument = await Document.findById(testDocument._id);
      
      console.log('\n📊 Processing Results:');
      console.log('=====================');
      console.log(`Status: ${updatedDocument.status}`);
      console.log(`Processing Time: ${updatedDocument.processingTime || 'N/A'}s`);
      console.log(`Confidence: ${updatedDocument.confidence ? (updatedDocument.confidence * 100).toFixed(1) : 'N/A'}%`);
      console.log(`Extracted Text Length: ${updatedDocument.extractedText ? updatedDocument.extractedText.length : 0} characters`);
      console.log(`Entities Found: ${updatedDocument.entities ? updatedDocument.entities.length : 0}`);
      console.log(`Compliance Score: ${updatedDocument.complianceAnalysis?.score || 'N/A'}/100`);
      console.log(`Compliance Errors: ${updatedDocument.complianceErrors ? updatedDocument.complianceErrors.length : 0}`);
      console.log(`HS Code Suggestions: ${updatedDocument.hsCodeSuggestions ? updatedDocument.hsCodeSuggestions.length : 0}`);

      // Show AI processing results
      if (updatedDocument.aiProcessingResults) {
        console.log('\n🤖 AI Processing Details:');
        console.log('========================');
        console.log(`OCR Provider: ${updatedDocument.aiProcessingResults.step1_ocr?.provider || 'N/A'}`);
        console.log(`OCR Success: ${updatedDocument.aiProcessingResults.step1_ocr?.success || false}`);
        console.log(`OCR Confidence: ${updatedDocument.aiProcessingResults.step1_ocr?.confidence || 'N/A'}`);
        console.log(`Compliance Provider: ${updatedDocument.aiProcessingResults.step2_compliance?.provider || 'N/A'}`);
        console.log(`Compliance Success: ${updatedDocument.aiProcessingResults.step2_compliance?.success || false}`);
        console.log(`HS Code Provider: ${updatedDocument.aiProcessingResults.step3_hscodes?.provider || 'N/A'}`);
        console.log(`HS Code Success: ${updatedDocument.aiProcessingResults.step3_hscodes?.success || false}`);
      }

      // Show sample extracted text
      if (updatedDocument.extractedText) {
        console.log('\n📝 Sample Extracted Text:');
        console.log('========================');
        const sampleText = updatedDocument.extractedText.substring(0, 300);
        console.log(sampleText + (updatedDocument.extractedText.length > 300 ? '...' : ''));
      }

      // Show compliance analysis
      if (updatedDocument.complianceAnalysis) {
        console.log('\n📋 Compliance Analysis:');
        console.log('======================');
        console.log(`Valid: ${updatedDocument.complianceAnalysis.isValid || false}`);
        console.log(`Score: ${updatedDocument.complianceAnalysis.score || 0}/100`);
        if (updatedDocument.complianceErrors && updatedDocument.complianceErrors.length > 0) {
          console.log('Errors:');
          updatedDocument.complianceErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.message || error}`);
          });
        }
      }

      // Show HS code suggestions
      if (updatedDocument.hsCodeSuggestions && updatedDocument.hsCodeSuggestions.length > 0) {
        console.log('\n🏷️  HS Code Suggestions:');
        console.log('========================');
        updatedDocument.hsCodeSuggestions.slice(0, 3).forEach((suggestion, index) => {
          console.log(`${index + 1}. ${suggestion.code || 'N/A'} - ${suggestion.description || 'N/A'}`);
          console.log(`   Confidence: ${suggestion.confidence || 'N/A'}%`);
        });
      }

      // Show structured data
      if (updatedDocument.structuredData) {
        console.log('\n📊 Structured Data:');
        console.log('==================');
        console.log(JSON.stringify(updatedDocument.structuredData, null, 2));
      }

    } else {
      console.log('❌ AI processing failed:', result.error);
    }

    // Clean up test document
    await Document.findByIdAndDelete(testDocument._id);
    console.log('\n🧹 Test document cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testAIProcessing();
