/**
 * Test script to verify document upload and processing
 * Run with: node test-upload.js
 */

const fs = require('fs');
const path = require('path');

// Test the AI processing pipeline
async function testDocumentProcessing() {
  console.log('🧪 Testing Document Processing Pipeline\n');

  try {
    // Import the services
    const AIProcessor = require('./services/aiProcessor');
    const aiProcessor = new AIProcessor();

    console.log('✅ AI Processor initialized successfully');

    // Create a test document entry (simulating what happens after upload)
    const mongoose = require('mongoose');
    const { Document } = require('./schemas');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export');
    console.log('✅ Database connected');

    // Create test document
    const testDoc = new Document({
      originalName: 'test-invoice.txt',
      fileName: 'test-invoice-' + Date.now() + '.txt',
      filePath: path.join(__dirname, 'test-files', 'test-invoice.txt'),
      fileType: 'text/plain',
      fileSize: 1024,
      documentType: 'invoice',
      status: 'uploaded',
      uploadedBy: new mongoose.Types.ObjectId() // Mock user ID
    });

    // Create test file if it doesn't exist
    const testFilePath = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testFilePath)) {
      fs.mkdirSync(testFilePath, { recursive: true });
    }

    const testFileFullPath = path.join(testFilePath, 'test-invoice.txt');
    if (!fs.existsSync(testFileFullPath)) {
      fs.writeFileSync(testFileFullPath, `COMMERCIAL INVOICE

Invoice Number: INV-TEST-001
Date: ${new Date().toLocaleDateString()}
From: Test Exporter Ltd
Address: 123 Export Street, Mumbai, India
To: Test Importer Inc
Address: 456 Import Avenue, New York, USA

Items:
1. Electronic Components - Qty: 100 - Price: $50.00 - Total: $5,000.00
2. Textiles - Qty: 50 - Price: $30.00 - Total: $1,500.00

Subtotal: $6,500.00
Tax: $650.00
Total: $7,150.00

Payment Terms: 30 days
Shipping: FOB Mumbai Port`);
    }

    testDoc.filePath = testFileFullPath;
    await testDoc.save();

    console.log('✅ Test document created:', testDoc._id);

    // Test the AI processing
    console.log('\n🔄 Starting AI processing...');
    const result = await aiProcessor.processDocument(testDoc._id);

    if (result.success) {
      console.log('✅ AI Processing completed successfully!');
      console.log('📊 Results:');
      console.log('- Status:', result.results.finalStatus);
      console.log('- Confidence:', result.results.confidence);
      console.log('- Processing Time:', result.processingTime + 's');
      console.log('- OCR Success:', result.results.ocr.success);
      console.log('- Compliance Success:', result.results.compliance.success);
      
      // Get the updated document
      const updatedDoc = await Document.findById(testDoc._id);
      console.log('\n📄 Document Status:', updatedDoc.status);
      console.log('📄 Extracted Text Length:', updatedDoc.extractedText?.length || 0);
      console.log('📄 Entities Found:', updatedDoc.entities?.length || 0);
      console.log('📄 Compliance Score:', updatedDoc.complianceAnalysis?.score || 'N/A');

      // Test processing status endpoint
      console.log('\n🔍 Testing processing status endpoint...');
      const statusResult = await aiProcessor.getProcessingStatus(testDoc._id);
      if (statusResult.success) {
        console.log('✅ Processing status endpoint working');
        console.log('📊 Status Response:', {
          status: statusResult.status,
          confidence: statusResult.confidence,
          hasExtractedText: !!statusResult.extractedText,
          hasEntities: !!(statusResult.entities && statusResult.entities.length > 0),
          hasComplianceAnalysis: !!statusResult.complianceAnalysis
        });
      } else {
        console.log('❌ Processing status endpoint failed:', statusResult.error);
      }

    } else {
      console.log('❌ AI Processing failed:', result.error);
    }

    // Clean up
    await Document.findByIdAndDelete(testDoc._id);
    if (fs.existsSync(testFileFullPath)) {
      fs.unlinkSync(testFileFullPath);
    }
    console.log('✅ Test cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Load environment variables
require('dotenv').config();

// Run the test
testDocumentProcessing();