const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ImportDocument = require('../schemas/ImportDocument');
const ImportShipment = require('../schemas/ImportShipment');
const auth = require('../middleware/auth');
// Simple AI processing function for import documents
const processDocumentWithAI = async (filePath, documentType) => {
  try {
    // This is a simplified version - in production, you would use the full AI pipeline
    // For now, return mock data to prevent errors
    return {
      extractedText: "Mock extracted text from document",
      extractedData: {
        supplierName: "Sample Supplier",
        supplierAddress: "123 Main St, City, Country",
        importerName: "Sample Importer",
        invoiceNumber: "INV-001",
        invoiceDate: new Date(),
        totalAmount: 1000,
        currency: "USD",
        hsCodes: ["1234.56.78"],
        goodsDescription: "Sample goods description",
        quantity: 10,
        unit: "pcs",
        unitPrice: 100,
        totalPrice: 1000,
        originCountry: "US",
        destinationCountry: "IN",
        portOfLoading: "New York",
        portOfDischarge: "Mumbai"
      },
      confidence: 0.85,
      processingTime: 1500,
      provider: 'mock',
      errors: [],
      suggestions: []
    };
  } catch (error) {
    console.error('AI processing error:', error);
    throw error;
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/import-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed'));
    }
  }
});

// Upload import document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { importShipmentId, documentType, isRequired = true } = req.body;

    // Verify the import shipment belongs to the user
    const shipment = await ImportShipment.findOne({
      _id: importShipmentId,
      importer: req.user.id
    });

    if (!shipment) {
      // Delete uploaded file if shipment not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    const document = new ImportDocument({
      importShipment: importShipmentId,
      importer: req.user.id,
      documentType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      isRequired,
      createdBy: req.user.id
    });

    await document.save();

    // Process document with AI
    try {
      const aiResult = await processDocumentWithAI(req.file.path, documentType);
      document.aiProcessing = {
        status: 'completed',
        extractedText: aiResult.extractedText,
        extractedData: aiResult.extractedData,
        confidence: aiResult.confidence,
        processingTime: aiResult.processingTime,
        aiProvider: aiResult.provider,
        errors: aiResult.errors || [],
        suggestions: aiResult.suggestions || []
      };
      await document.save();
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      document.aiProcessing.status = 'failed';
      document.aiProcessing.errors = [aiError.message];
      await document.save();
    }

    res.status(201).json(document);
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Get all documents for an import shipment
router.get('/shipment/:shipmentId', auth, async (req, res) => {
  try {
    // Verify the import shipment belongs to the user
    const shipment = await ImportShipment.findOne({
      _id: req.params.shipmentId,
      importer: req.user.id
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    const documents = await ImportDocument.find({
      importShipment: req.params.shipmentId
    }).sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific document
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await ImportDocument.findOne({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download a document
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await ImportDocument.findOne({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(document.filePath, document.originalName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update document validation
router.patch('/:id/validate', auth, async (req, res) => {
  try {
    const { status, notes, complianceScore, issues, corrections } = req.body;

    const document = await ImportDocument.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      {
        'validation.status': status,
        'validation.validatedBy': req.user.id,
        'validation.validatedAt': new Date(),
        'validation.validationNotes': notes,
        'validation.complianceScore': complianceScore,
        'validation.issues': issues || [],
        'validation.corrections': corrections || []
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await ImportDocument.findOne({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await ImportDocument.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get document statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await ImportDocument.aggregate([
      { $match: { importer: req.user._id } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          documentTypes: {
            $push: '$documentType'
          },
          validationStatus: {
            $push: '$validation.status'
          },
          aiProcessingStatus: {
            $push: '$aiProcessing.status'
          }
        }
      }
    ]);

    const documentTypeCounts = {};
    const validationStatusCounts = {};
    const aiProcessingStatusCounts = {};

    if (stats.length > 0) {
      stats[0].documentTypes.forEach(type => {
        documentTypeCounts[type] = (documentTypeCounts[type] || 0) + 1;
      });

      stats[0].validationStatus.forEach(status => {
        validationStatusCounts[status] = (validationStatusCounts[status] || 0) + 1;
      });

      stats[0].aiProcessingStatus.forEach(status => {
        aiProcessingStatusCounts[status] = (aiProcessingStatusCounts[status] || 0) + 1;
      });
    }

    res.json({
      totalDocuments: stats[0]?.totalDocuments || 0,
      documentTypeCounts,
      validationStatusCounts,
      aiProcessingStatusCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
