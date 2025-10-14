const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ImportDocument = require('../schemas/ImportDocument');
const ImportShipment = require('../schemas/ImportShipment');
const auth = require('../middleware/auth');
const GeminiService = require('../services/gemini');
const ComplianceService = require('../services/compliance');

// Initialize AI services
const geminiService = new GeminiService();
const complianceService = new ComplianceService();

// Real AI processing function for import documents
const processDocumentWithAI = async (filePath, documentType, mimeType) => {
  try {
    const startTime = Date.now();
    
    console.log(`🤖 Processing import document with AI: ${path.basename(filePath)}`);
    
    // Step 1: Extract text using Gemini
    let ocrResult = await geminiService.extractTextFromDocument(
      filePath,
      mimeType,
      documentType
    );

    // If OCR fails, use fallback
    if (!ocrResult.success) {
      console.warn('⚠️  OCR failed, using fallback processing...');
      ocrResult = await geminiService.getFallbackProcessing(filePath, documentType);
    }

    // Step 2: Analyze compliance for import documents
    let complianceResult = await complianceService.analyzeCompliance(
      ocrResult.structuredData || { extractedText: ocrResult.extractedText },
      documentType
    );

    // If compliance analysis fails, use fallback
    if (!complianceResult.success) {
      console.warn('⚠️  Compliance analysis failed, using fallback...');
      complianceResult = await complianceService.getFallbackCompliance(
        ocrResult.structuredData || { extractedText: ocrResult.extractedText },
        documentType
      );
    }

    // Step 3: Extract HS codes and get suggestions
    const extractedData = ocrResult.structuredData || {};
    let hsCodes = extractedData.items?.map(item => item.hsCode).filter(Boolean) || [];
    
    // If no HS codes found, try to suggest based on product descriptions
    if (hsCodes.length === 0 && extractedData.items) {
      const products = extractedData.items.map(item => item.description).filter(Boolean);
      if (products.length > 0) {
        try {
          const hsCodeResult = await complianceService.suggestHSCodes(
            products[0], // Use first product for suggestion
            `From ${documentType} document`
          );
          if (hsCodeResult.success && hsCodeResult.suggestions) {
            hsCodes = hsCodeResult.suggestions.map(s => s.code);
          }
        } catch (error) {
          console.warn('HS code suggestion failed:', error.message);
        }
      }
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return {
      extractedText: ocrResult.extractedText || '',
      extractedData: {
        supplierName: extractedData.supplier?.name || extractedData.from?.name || '',
        supplierAddress: extractedData.supplier?.address || extractedData.from?.address || '',
        importerName: extractedData.buyer?.name || extractedData.to?.name || '',
        importerAddress: extractedData.buyer?.address || extractedData.to?.address || '',
        invoiceNumber: extractedData.invoiceNumber || extractedData.documentNumber || '',
        invoiceDate: extractedData.invoiceDate || extractedData.date || new Date(),
        totalAmount: extractedData.totalAmount || extractedData.grandTotal || 0,
        currency: extractedData.currency || 'USD',
        hsCodes: hsCodes,
        goodsDescription: extractedData.items?.[0]?.description || extractedData.goodsDescription || '',
        quantity: extractedData.items?.[0]?.quantity || 0,
        unit: extractedData.items?.[0]?.unit || 'pcs',
        unitPrice: extractedData.items?.[0]?.unitPrice || 0,
        totalPrice: extractedData.items?.[0]?.totalPrice || extractedData.totalAmount || 0,
        originCountry: extractedData.origin?.country || extractedData.supplier?.country || '',
        destinationCountry: extractedData.destination?.country || extractedData.buyer?.country || '',
        portOfLoading: extractedData.origin?.port || extractedData.shipFrom?.port || '',
        portOfDischarge: extractedData.destination?.port || extractedData.shipTo?.port || '',
        vesselName: extractedData.vessel?.name || '',
        voyageNumber: extractedData.vessel?.voyage || '',
        containerNumber: extractedData.container?.number || '',
        sealNumber: extractedData.container?.seal || '',
        weight: extractedData.totalWeight || extractedData.weight || 0,
        volume: extractedData.totalVolume || extractedData.volume || 0,
        dimensions: extractedData.dimensions || {}
      },
      confidence: ocrResult.confidence || 0,
      processingTime: processingTime,
      provider: 'gemini-openai-pipeline',
      errors: complianceResult.errors || [],
      suggestions: complianceResult.recommendations || []
    };
  } catch (error) {
    console.error('❌ AI processing error:', error);
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

    // Process document with AI in background
    setImmediate(async () => {
      try {
        console.log(`🚀 Starting AI processing for: ${document.originalName}`);
        document.aiProcessing.status = 'processing';
        await document.save();
        
        const aiResult = await processDocumentWithAI(req.file.path, documentType, req.file.mimetype);
        
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
        
        // Auto-validate if confidence is high
        if (aiResult.confidence > 0.8) {
          document.validation.status = 'validated';
          document.validation.complianceScore = Math.round(aiResult.confidence * 100);
          document.validation.validatedAt = new Date();
        } else {
          document.validation.status = 'needs_review';
        }
        
        document.status = 'validated';
        await document.save();
        console.log(`✅ AI processing completed for: ${document.originalName}`);
      } catch (aiError) {
        console.error('❌ AI processing error:', aiError);
        document.aiProcessing.status = 'failed';
        document.aiProcessing.errors = [aiError.message];
        document.status = 'rejected';
        await document.save();
      }
    });

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

// Get all documents for the authenticated importer
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, documentType, status } = req.query;
    const query = { importer: req.user.id };
    
    if (documentType) {
      query.documentType = documentType;
    }
    
    if (status) {
      query.status = status;
    }

    const documents = await ImportDocument.find(query)
      .populate('importShipment', 'shipmentNumber supplier')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ImportDocument.countDocuments(query);

    res.json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
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
