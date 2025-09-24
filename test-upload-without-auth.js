const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Document } = require('./schemas');
const AIProcessor = require('./services/aiProcessor');

// Create a test server for upload testing
const app = express();
const aiProcessor = new AIProcessor();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
    }
  }
});

// Test upload endpoint without authentication
app.post('/test-upload', upload.single('document'), async (req, res) => {
  try {
    console.log('📄 Test Upload Request:', {
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      documentType: req.body.documentType,
      description: req.body.description
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    // Create new document (without user authentication for testing)
    const document = new Document({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      documentType: req.body.documentType || 'other',
      description: req.body.description || 'Test upload',
      uploadedBy: 'test-user-id', // Mock user ID
      filePath: req.file.path,
      status: 'uploading'
    });

    await document.save();
    console.log('✅ Document saved to database');

    // Process document with AI pipeline
    setImmediate(async () => {
      try {
        console.log('🤖 Starting AI processing...');
        await aiProcessor.processDocument(document._id);
        console.log(`✅ Document ${document.originalName} processed successfully`);
      } catch (error) {
        console.error(`❌ Error processing document ${document.originalName}:`, error);
      }
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        fileName: document.originalName,
        status: document.status,
        uploadedAt: document.createdAt
      }
    });

  } catch (err) {
    console.error('❌ Upload error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Start test server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Test upload server running on port ${PORT}`);
  console.log(`📡 Test endpoint: http://localhost:${PORT}/test-upload`);
  console.log('\n📋 Test with curl:');
  console.log(`curl -X POST http://localhost:${PORT}/test-upload \\`);
  console.log(`  -F "document=@test-file.jpg" \\`);
  console.log(`  -F "documentType=invoice" \\`);
  console.log(`  -F "description=Test upload"`);
  console.log('\n⏹️  Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});

