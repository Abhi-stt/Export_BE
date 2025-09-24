const express = require('express');
const { InvoiceValidation, BOEValidation, Document } = require('../schemas');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper functions for BOE validation
function calculateMatchPercentage(invoiceData, boeData) {
  let matches = 0;
  let total = 0;
  
  const fieldsToCompare = ['invoiceNumber', 'total', 'date', 'supplier', 'buyer'];
  
  fieldsToCompare.forEach(field => {
    if (invoiceData[field] && boeData[field]) {
      total++;
      if (invoiceData[field] === boeData[field]) {
        matches++;
      }
    }
  });
  
  return total > 0 ? Math.round((matches / total) * 100) : 0;
}

function determineOverallStatus(invoiceData, boeData) {
  const matchPercentage = calculateMatchPercentage(invoiceData, boeData);
  if (matchPercentage >= 90) return 'passed';
  if (matchPercentage >= 70) return 'warning';
  return 'failed';
}

function compareDocuments(invoiceData, boeData) {
  const results = [];
  const fieldsToCompare = [
    { key: 'invoiceNumber', label: 'Invoice Number' },
    { key: 'total', label: 'Total Amount' },
    { key: 'date', label: 'Date' },
    { key: 'supplier', label: 'Supplier' }
  ];
  
  fieldsToCompare.forEach(field => {
    const invoiceValue = invoiceData[field.key] || 'N/A';
    const boeValue = boeData[field.key] || 'N/A';
    
    let status = 'no_data';
    let variance = 'N/A';
    let suggestion = 'No data available for comparison';
    
    if (invoiceValue !== 'N/A' && boeValue !== 'N/A') {
      if (invoiceValue === boeValue) {
        status = 'match';
        variance = '0%';
        suggestion = 'Perfect match';
      } else {
        status = 'mismatch';
        variance = 'Different values';
        suggestion = 'Values do not match - please verify';
      }
    }
    
    results.push({
      field: field.label,
      invoiceValue: invoiceValue.toString(),
      boeValue: boeValue.toString(),
      status: status,
      variance: variance,
      suggestion: suggestion
    });
  });
  
  return results;
}

// @route   POST /api/validation/invoice
// @desc    Validate invoice document
// @access  Private
router.post('/invoice', auth, async (req, res) => {
  try {
    const { documentId } = req.body;

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to this document
    const documentOwnerId = document.uploadedBy?.toString();
    const requestingUserId = req.user.id.toString();
    
    let hasAccess = false;
    
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (documentOwnerId === requestingUserId) {
      hasAccess = true;
    } else if (req.user.role === 'forwarder') {
      // Forwarders can validate documents if:
      // 1. Document is assigned to them
      // 2. Document is shared with them with validate permission
      // 3. Document belongs to their client
      const isAssignedToForwarder = document.assignedForwarder?.toString() === requestingUserId;
      const isSharedWithForwarder = document.sharedWith?.some(share => 
        share.user?.toString() === requestingUserId && 
        share.permissions?.includes('validate')
      );
      const isClientDocument = document.client && req.user.clientId && 
        document.client.toString() === req.user.clientId.toString();
      
      hasAccess = isAssignedToForwarder || isSharedWithForwarder || isClientDocument;
    } else if (req.user.role === 'ca') {
      // CAs can validate documents if:
      // 1. Document is shared with them with validate permission
      // 2. Document belongs to their client
      const isSharedWithCA = document.sharedWith?.some(share => 
        share.user?.toString() === requestingUserId && 
        share.permissions?.includes('validate')
      );
      const isClientDocument = document.client && req.user.clientId && 
        document.client.toString() === req.user.clientId.toString();
      
      hasAccess = isSharedWithCA || isClientDocument;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to validate this document' });
    }

    // Check if document is completed
    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document must be processed before validation' });
    }

    // Check if validation already exists
    let validation = await InvoiceValidation.findOne({ document: documentId });
    if (validation) {
      return res.status(400).json({ message: 'Validation already exists for this document' });
    }

    // Create new validation using real AI processing results
    validation = new InvoiceValidation({
      document: documentId,
      success: true,
      extractedText: document.extractedText || '',
      confidence: document.confidence || 0,
      entities: document.entities || [],
      complianceAnalysis: document.complianceAnalysis || {
        isValid: false,
        score: 0,
        checks: []
      },
      complianceErrors: document.complianceErrors || [],
      complianceCorrections: document.complianceCorrections || [],
      complianceSummary: document.complianceSummary || {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningsCount: 0,
        criticalIssues: 0
      },
      complianceRecommendations: document.complianceRecommendations || [],
      metadata: {
        fileName: document.fileName,
        confidence: document.confidence,
        language: 'en',
        pages: document.pages || 1,
        processingTime: document.processingTime || 0
      },
      validatedBy: req.user.id
    });

    await validation.save();

    const populatedValidation = await InvoiceValidation.findById(validation.id)
      .populate('document', 'originalName fileName')
      .populate('validatedBy', 'name email');

    res.json({
      message: 'Invoice validation completed',
      validation: populatedValidation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/validation/boe
// @desc    Validate BOE against invoice
// @access  Private
router.post('/boe', auth, async (req, res) => {
  try {
    const { invoiceDocumentId, boeDocumentId } = req.body;

    // Check if documents exist
    const invoiceDocument = await Document.findById(invoiceDocumentId);
    const boeDocument = await Document.findById(boeDocumentId);

    if (!invoiceDocument || !boeDocument) {
      return res.status(404).json({ message: 'One or both documents not found' });
    }

    // Check if user has access to these documents
    const invoiceOwnerId = invoiceDocument.uploadedBy?.toString();
    const boeOwnerId = boeDocument.uploadedBy?.toString();
    const requestingUserId = req.user.id.toString();
    
    let hasInvoiceAccess = false;
    let hasBOEAccess = false;
    
    if (req.user.role === 'admin') {
      hasInvoiceAccess = true;
      hasBOEAccess = true;
    } else if (invoiceOwnerId === requestingUserId && boeOwnerId === requestingUserId) {
      hasInvoiceAccess = true;
      hasBOEAccess = true;
    } else if (req.user.role === 'forwarder') {
      // Check invoice access
      const isInvoiceAssignedToForwarder = invoiceDocument.assignedForwarder?.toString() === requestingUserId;
      const isInvoiceSharedWithForwarder = invoiceDocument.sharedWith?.some(share => 
        share.user?.toString() === requestingUserId && 
        share.permissions?.includes('validate')
      );
      const isInvoiceClientDocument = invoiceDocument.client && req.user.clientId && 
        invoiceDocument.client.toString() === req.user.clientId.toString();
      
      hasInvoiceAccess = isInvoiceAssignedToForwarder || isInvoiceSharedWithForwarder || isInvoiceClientDocument;
      
      // Check BOE access
      const isBOEAssignedToForwarder = boeDocument.assignedForwarder?.toString() === requestingUserId;
      const isBOESharedWithForwarder = boeDocument.sharedWith?.some(share => 
        share.user?.toString() === requestingUserId && 
        share.permissions?.includes('validate')
      );
      const isBOEClientDocument = boeDocument.client && req.user.clientId && 
        boeDocument.client.toString() === req.user.clientId.toString();
      
      hasBOEAccess = isBOEAssignedToForwarder || isBOESharedWithForwarder || isBOEClientDocument;
    } else if (req.user.role === 'ca') {
      // Check invoice access
      const isInvoiceSharedWithCA = invoiceDocument.sharedWith?.some(share => 
        share.user?.toString() === requestingUserId && 
        share.permissions?.includes('validate')
      );
      const isInvoiceClientDocument = invoiceDocument.client && req.user.clientId && 
        invoiceDocument.client.toString() === req.user.clientId.toString();
      
      hasInvoiceAccess = isInvoiceSharedWithCA || isInvoiceClientDocument;
      
      // Check BOE access
      const isBOESharedWithCA = boeDocument.sharedWith?.some(share => 
        share.user?.toString() === requestingUserId && 
        share.permissions?.includes('validate')
      );
      const isBOEClientDocument = boeDocument.client && req.user.clientId && 
        boeDocument.client.toString() === req.user.clientId.toString();
      
      hasBOEAccess = isBOESharedWithCA || isBOEClientDocument;
    }
    
    if (!hasInvoiceAccess || !hasBOEAccess) {
      return res.status(403).json({ message: 'Not authorized to validate these documents' });
    }

    // Check if documents are completed
    if (invoiceDocument.status !== 'completed' || boeDocument.status !== 'completed') {
      return res.status(400).json({ message: 'Both documents must be processed before validation' });
    }

    // Check if validation already exists
    let validation = await BOEValidation.findOne({
      invoiceDocument: invoiceDocumentId,
      boeDocument: boeDocumentId
    });
    if (validation) {
      return res.status(400).json({ message: 'Validation already exists for these documents' });
    }

    // Extract data from AI processed documents
    const invoiceData = invoiceDocument.structuredData || {};
    const boeData = boeDocument.structuredData || {};
    
    // Create new validation using real AI processing results
    validation = new BOEValidation({
      invoiceDocument: invoiceDocumentId,
      boeDocument: boeDocumentId,
      invoiceNumber: invoiceData.invoiceNumber || 'N/A',
      boeNumber: boeData.boeNumber || 'N/A',
      matchPercentage: calculateMatchPercentage(invoiceData, boeData),
      overallStatus: determineOverallStatus(invoiceData, boeData),
      results: compareDocuments(invoiceData, boeData),
      metadata: {
        invoiceFileName: invoiceDocument.fileName,
        boeFileName: boeDocument.fileName,
        processingTime: (invoiceDocument.processingTime || 0) + (boeDocument.processingTime || 0),
        invoiceFields: invoiceDocument.entities?.length || 0,
        boeFields: boeDocument.entities?.length || 0
      },
      validatedBy: req.user.id
    });

    await validation.save();

    const populatedValidation = await BOEValidation.findById(validation.id)
      .populate('invoiceDocument', 'originalName fileName')
      .populate('boeDocument', 'originalName fileName')
      .populate('validatedBy', 'name email');

    res.json({
      message: 'BOE validation completed',
      validation: populatedValidation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/validation/invoice/:id
// @desc    Get invoice validation by ID
// @access  Private
router.get('/invoice/:id', auth, async (req, res) => {
  try {
    const validation = await InvoiceValidation.findById(req.params.id)
      .populate('document', 'originalName fileName')
      .populate('validatedBy', 'name email');

    if (!validation) {
      return res.status(404).json({ message: 'Validation not found' });
    }

    // Check if user has access to this validation
    if (req.user.role !== 'admin' && validation.validatedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(validation);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/validation/boe/:id
// @desc    Get BOE validation by ID
// @access  Private
router.get('/boe/:id', auth, async (req, res) => {
  try {
    const validation = await BOEValidation.findById(req.params.id)
      .populate('invoiceDocument', 'originalName fileName')
      .populate('boeDocument', 'originalName fileName')
      .populate('validatedBy', 'name email');

    if (!validation) {
      return res.status(404).json({ message: 'Validation not found' });
    }

    // Check if user has access to this validation
    if (req.user.role !== 'admin' && validation.validatedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(validation);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/validation/invoice
// @desc    Get all invoice validations
// @access  Private
router.get('/invoice', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (status) query['compliance.isValid'] = status === 'valid';

    // If user is not admin, only show their validations
    if (req.user.role !== 'admin') {
      query.validatedBy = req.user.id;
    }

    const validations = await InvoiceValidation.find(query)
      .populate('document', 'originalName fileName')
      .populate('validatedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await InvoiceValidation.countDocuments(query);

    res.json({
      validations,
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

// @route   GET /api/validation/boe
// @desc    Get all BOE validations
// @access  Private
router.get('/boe', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (status) query.overallStatus = status;

    // If user is not admin, only show their validations
    if (req.user.role !== 'admin') {
      query.validatedBy = req.user.id;
    }

    const validations = await BOEValidation.find(query)
      .populate('invoiceDocument', 'originalName fileName')
      .populate('boeDocument', 'originalName fileName')
      .populate('validatedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await BOEValidation.countDocuments(query);

    res.json({
      validations,
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

// @route   PUT /api/validation/invoice/:id
// @desc    Update invoice validation
// @access  Private
router.put('/invoice/:id', auth, async (req, res) => {
  try {
    const { compliance, errors, corrections } = req.body;

    const validation = await InvoiceValidation.findById(req.params.id);
    if (!validation) {
      return res.status(404).json({ message: 'Validation not found' });
    }

    // Check if user has access to update this validation
    if (req.user.role !== 'admin' && validation.validatedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    if (compliance) validation.compliance = compliance;
    if (errors) validation.errors = errors;
    if (corrections) validation.corrections = corrections;

    await validation.save();

    const updatedValidation = await InvoiceValidation.findById(validation.id)
      .populate('document', 'originalName fileName')
      .populate('validatedBy', 'name email');

    res.json({
      message: 'Validation updated successfully',
      validation: updatedValidation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/validation/invoice/:id
// @desc    Delete invoice validation
// @access  Private
router.delete('/invoice/:id', auth, async (req, res) => {
  try {
    const validation = await InvoiceValidation.findById(req.params.id);
    if (!validation) {
      return res.status(404).json({ message: 'Validation not found' });
    }

    // Check if user has access to delete this validation
    if (req.user.role !== 'admin' && validation.validatedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await InvoiceValidation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Validation deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 