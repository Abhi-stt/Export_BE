const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Test document upload with complete AI processing
async function testDocumentUpload() {
  console.log('🧪 Testing Complete Document Upload with AI Processing');
  console.log('==================================================\n');

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

    // Create form data
    const formData = new FormData();
    formData.append('document', fs.createReadStream(filePath));
    formData.append('documentType', 'invoice');
    formData.append('description', 'Test document for AI processing');

    // Upload document
    console.log('📤 Uploading document...');
    const uploadResponse = await axios.post('http://localhost:5000/api/documents/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer test-token' // Using test token
      }
    });

    if (uploadResponse.data.success) {
      console.log('✅ Document uploaded successfully');
      const documentId = uploadResponse.data.document._id;
      console.log(`📋 Document ID: ${documentId}`);

      // Wait for processing to complete
      console.log('⏳ Waiting for AI processing to complete...');
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        try {
          const statusResponse = await axios.get(`http://localhost:5000/api/documents/${documentId}/processing-status`, {
            headers: { 'Authorization': 'Bearer test-token' }
          });

          const status = statusResponse.data;
          console.log(`🔄 Processing status: ${status.status} (attempt ${attempts + 1}/${maxAttempts})`);

          if (status.status === 'completed') {
            processingComplete = true;
            console.log('✅ Processing completed!');
            
            // Display results
            console.log('\n📊 AI Processing Results:');
            console.log('========================');
            console.log(`Processing Time: ${status.processingTime || 'N/A'}s`);
            console.log(`Confidence: ${status.confidence ? (status.confidence * 100).toFixed(1) : 'N/A'}%`);
            console.log(`Extracted Text Length: ${status.extractedText ? status.extractedText.length : 0} characters`);
            console.log(`Entities Found: ${status.entities ? status.entities.length : 0}`);
            console.log(`Compliance Score: ${status.complianceAnalysis?.score || 'N/A'}/100`);
            console.log(`Compliance Errors: ${status.complianceErrors ? status.complianceErrors.length : 0}`);
            console.log(`HS Code Suggestions: ${status.hsCodeSuggestions ? status.hsCodeSuggestions.length : 0}`);

            // Show AI processing results
            if (status.aiProcessingResults) {
              console.log('\n🤖 AI Processing Details:');
              console.log('========================');
              console.log(`OCR Provider: ${status.aiProcessingResults.step1_ocr?.provider || 'N/A'}`);
              console.log(`OCR Success: ${status.aiProcessingResults.step1_ocr?.success || false}`);
              console.log(`OCR Confidence: ${status.aiProcessingResults.step1_ocr?.confidence || 'N/A'}`);
              console.log(`Compliance Provider: ${status.aiProcessingResults.step2_compliance?.provider || 'N/A'}`);
              console.log(`Compliance Success: ${status.aiProcessingResults.step2_compliance?.success || false}`);
              console.log(`HS Code Provider: ${status.aiProcessingResults.step3_hscodes?.provider || 'N/A'}`);
              console.log(`HS Code Success: ${status.aiProcessingResults.step3_hscodes?.success || false}`);
            }

            // Show sample extracted text
            if (status.extractedText) {
              console.log('\n📝 Sample Extracted Text:');
              console.log('========================');
              const sampleText = status.extractedText.substring(0, 200);
              console.log(sampleText + (status.extractedText.length > 200 ? '...' : ''));
            }

            // Show compliance analysis
            if (status.complianceAnalysis) {
              console.log('\n📋 Compliance Analysis:');
              console.log('======================');
              console.log(`Valid: ${status.complianceAnalysis.isValid || false}`);
              console.log(`Score: ${status.complianceAnalysis.score || 0}/100`);
              if (status.complianceErrors && status.complianceErrors.length > 0) {
                console.log('Errors:');
                status.complianceErrors.forEach((error, index) => {
                  console.log(`  ${index + 1}. ${error.message || error}`);
                });
              }
            }

            // Show HS code suggestions
            if (status.hsCodeSuggestions && status.hsCodeSuggestions.length > 0) {
              console.log('\n🏷️  HS Code Suggestions:');
              console.log('========================');
              status.hsCodeSuggestions.slice(0, 3).forEach((suggestion, index) => {
                console.log(`${index + 1}. ${suggestion.code || 'N/A'} - ${suggestion.description || 'N/A'}`);
                console.log(`   Confidence: ${suggestion.confidence || 'N/A'}%`);
              });
            }

          } else if (status.status === 'failed') {
            console.log('❌ Processing failed');
            console.log(`Error: ${status.error || 'Unknown error'}`);
            break;
          }

        } catch (error) {
          console.log(`⚠️  Error checking status: ${error.message}`);
        }

        attempts++;
      }

      if (!processingComplete) {
        console.log('⏰ Processing timeout - document may still be processing');
      }

    } else {
      console.log('❌ Upload failed:', uploadResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDocumentUpload();
