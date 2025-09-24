const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Test the upload endpoint directly
async function testUploadEndpoint() {
  console.log('🧪 Testing Upload Endpoint');
  console.log('==========================\n');

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
    formData.append('description', 'Test document upload');

    // Test without authentication first
    console.log('\n1️⃣ Testing upload without authentication...');
    try {
      const response = await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        }
      });
      console.log('✅ Upload successful without auth:', response.data);
    } catch (error) {
      console.log('❌ Upload failed without auth:', error.response?.status, error.response?.data);
    }

    // Test with authentication
    console.log('\n2️⃣ Testing upload with authentication...');
    try {
      const response = await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Upload successful with auth:', response.data);
    } catch (error) {
      console.log('❌ Upload failed with auth:', error.response?.status, error.response?.data);
    }

    // Test with a simple text file
    console.log('\n3️⃣ Testing with simple text file...');
    const textContent = 'This is a test document for upload testing.';
    const textFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(textFilePath, textContent);

    const textFormData = new FormData();
    textFormData.append('document', fs.createReadStream(textFilePath));
    textFormData.append('documentType', 'invoice');
    textFormData.append('description', 'Test text document');

    try {
      const response = await axios.post('http://localhost:5000/api/documents/upload', textFormData, {
        headers: {
          ...textFormData.getHeaders(),
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Text file upload successful:', response.data);
    } catch (error) {
      console.log('❌ Text file upload failed:', error.response?.status, error.response?.data);
    }

    // Clean up
    if (fs.existsSync(textFilePath)) {
      fs.unlinkSync(textFilePath);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testUploadEndpoint();

