const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Document, User, Client } = require('../schemas');
const auth = require('../middleware/auth');
const AIProcessor = require('../services/aiProcessor');
const router = express.Router();

// Initialize AI processor
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

// @route   GET /api/documents
// @desc    Get all documents with pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const documentType = req.query.documentType || '';
    const client = req.query.client || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (documentType) query.documentType = documentType;
    if (client) query.client = client;

    // If user is not admin, only show their documents
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user.id;
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('client', 'name company')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('client', 'name company');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Debug logging for authorization issue
    console.log('🔍 Document Access Debug:', {
      documentId: req.params.id,
      requestingUserId: req.user.id,
      requestingUserRole: req.user.role,
      documentUploadedBy: document.uploadedBy?._id || document.uploadedBy,
      documentUploadedByString: document.uploadedBy?.toString(),
      isAdmin: req.user.role === 'admin',
      idsMatch: document.uploadedBy?.toString() === req.user.id
    });

    // Check if user has access to this document
    // Convert both IDs to strings for comparison
    const documentOwnerId = document.uploadedBy?._id ? document.uploadedBy._id.toString() : document.uploadedBy?.toString();
    const requestingUserId = req.user.id.toString();
    
    // Development bypass: Allow access if NODE_ENV is development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasAccess = req.user.role === 'admin' || documentOwnerId === requestingUserId || isDevelopment;
    
    if (!hasAccess) {
      console.log('❌ Access denied:', {
        reason: 'User does not own document and is not admin',
        documentOwner: documentOwnerId,
        requestingUser: requestingUserId,
        isDevelopment
      });
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (isDevelopment && documentOwnerId !== requestingUserId) {
      console.log('⚠️ Development bypass: Allowing access to document not owned by user');
    }

    console.log('✅ Document access granted');
    res.json({ document });
  } catch (err) {
    console.error('❌ Document access error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/documents/upload
// @desc    Upload a new document
// @access  Private
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    const {
      documentType,
      description,
      client
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Debug logging for upload
    console.log('📄 Document Upload Debug:', {
      uploadingUserId: req.user.id,
      uploadingUserRole: req.user.role,
      uploadingUserEmail: req.user.email,
      fileName: req.file.originalname,
      documentType
    });

    // Create new document
    const document = new Document({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      documentType,
      description,
      uploadedBy: req.user.id,
      client,
      filePath: req.file.path,
      status: 'uploading'
    });

    await document.save();
    
    console.log('✅ Document created with uploadedBy:', document.uploadedBy);

    // Process document with AI pipeline (Gemini + GPT-4/Claude)
    // Run in background to avoid blocking the response
    setImmediate(async () => {
      try {
        await aiProcessor.processDocument(document._id);
        console.log(`Document ${document.originalName} processed successfully`);
      } catch (error) {
        console.error(`Error processing document ${document.originalName}:`, error);
      }
    });

    const populatedDocument = await Document.findById(document.id)
      .populate('uploadedBy', 'name email')
      .populate('client', 'name company');

    res.json({
      message: 'Document uploaded successfully',
      document: populatedDocument
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      description,
      status,
      errors,
      suggestions,
      extractedText,
      entities,
      validation
    } = req.body;

    // Check if document exists
    let document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to update this document
    if (req.user.role !== 'admin' && document.uploadedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    if (description !== undefined) document.description = description;
    if (status) document.status = status;
    if (errors) document.errors = errors;
    if (suggestions) document.suggestions = suggestions;
    if (extractedText) document.extractedText = extractedText;
    if (entities) document.entities = entities;
    if (validation) document.validation = validation;

    await document.save();

    const updatedDocument = await Document.findById(document.id)
      .populate('uploadedBy', 'name email')
      .populate('client', 'name company');

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/documents/:id/reprocess
// @desc    Reprocess document with AI
// @access  Private
router.post('/:id/reprocess', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has permission to reprocess this document
    if (req.user.role !== 'admin' && document.uploadedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Start reprocessing
    const result = await aiProcessor.reprocessDocument(req.params.id);

    if (result.success) {
      res.json({
        message: 'Document reprocessing started',
        documentId: req.params.id,
        processingTime: result.processingTime
      });
    } else {
      res.status(500).json({
        message: 'Failed to reprocess document',
        error: result.error
      });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/:id/processing-status
// @desc    Get document processing status
// @access  Private
router.get('/:id/processing-status', auth, async (req, res) => {
  try {
    const result = await aiProcessor.getProcessingStatus(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json({
        message: 'Document not found or status unavailable',
        error: result.error
      });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to delete this document
    if (req.user.role !== 'admin' && document.uploadedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete file from filesystem
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/:id/download
// @desc    Download document
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to download this document
    if (req.user.role !== 'admin' && document.uploadedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!document.filePath || !fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(document.filePath, document.originalName);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/documents/:id/reprocess
// @desc    Reprocess document with AI
// @access  Private
router.post('/:id/reprocess', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to reprocess this document
    if (req.user.role !== 'admin' && document.uploadedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Reset processing status
    document.status = 'processing';
    document.errors = [];
    document.suggestions = [];
    document.extractedText = '';
    document.entities = [];
    document.validation = { isValid: false, score: 0, checks: [] };
    await document.save();

    // Simulate AI reprocessing
    setTimeout(async () => {
      document.status = 'completed';
      document.processingTime = Math.floor(Math.random() * 30) + 5;
      document.confidence = Math.floor(Math.random() * 30) + 70;
      document.extractedText = 'Reprocessed text from document...';
      document.entities = [
        {
          type: 'company',
          value: 'Updated Company Ltd',
          confidence: 92
        },
        {
          type: 'amount',
          value: '75000',
          confidence: 85
        }
      ];
      await document.save();
    }, 3000);

    res.json({
      message: 'Document reprocessing started',
      document: {
        id: document.id,
        status: document.status
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/stats/overview
// @desc    Get document statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user.id;
    }

    const totalDocuments = await Document.countDocuments(query);
    const completedDocuments = await Document.countDocuments({ ...query, status: 'completed' });
    const processingDocuments = await Document.countDocuments({ ...query, status: 'processing' });
    const errorDocuments = await Document.countDocuments({ ...query, status: 'error' });

    const typeStats = await Document.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentDocuments = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('client', 'name company')
      .select('originalName documentType status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalDocuments,
      completedDocuments,
      processingDocuments,
      errorDocuments,
      typeStats,
      recentDocuments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/:id/ocr-results
// @desc    Get OCR results for download/preview
// @access  Private
router.get('/:id/ocr-results', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to this document
    if (req.user.role !== 'admin' && document.uploadedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if document is processed
    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document processing not completed' });
    }

    const ocrResults = {
      documentId: document._id,
      fileName: document.originalName,
      extractedText: document.extractedText,
      confidence: document.confidence,
      entities: document.entities,
      structuredData: document.structuredData,
      complianceAnalysis: document.complianceAnalysis,
      complianceErrors: document.complianceErrors,
      complianceCorrections: document.complianceCorrections,
      complianceSummary: document.complianceSummary,
      processingTime: document.processingTime,
      aiProcessingResults: document.aiProcessingResults,
      createdAt: document.createdAt,
      processedAt: document.processingEndTime
    };

    res.json({
      success: true,
      data: ocrResults,
      message: 'OCR results retrieved successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router; 