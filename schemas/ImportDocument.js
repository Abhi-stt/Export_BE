const mongoose = require('mongoose');

const importDocumentSchema = new mongoose.Schema({
  importShipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportShipment',
    required: true
  },
  importer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin', 'insurance_certificate', 'import_license', 'customs_declaration', 'phytosanitary_certificate', 'fumigation_certificate', 'other'],
    required: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  aiProcessing: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    extractedText: String,
    extractedData: {
      supplierName: String,
      supplierAddress: String,
      importerName: String,
      importerAddress: String,
      invoiceNumber: String,
      invoiceDate: Date,
      totalAmount: Number,
      currency: String,
      hsCodes: [String],
      goodsDescription: String,
      quantity: Number,
      unit: String,
      unitPrice: Number,
      totalPrice: Number,
      originCountry: String,
      destinationCountry: String,
      portOfLoading: String,
      portOfDischarge: String,
      vesselName: String,
      voyageNumber: String,
      containerNumber: String,
      sealNumber: String,
      weight: Number,
      volume: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      }
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processingTime: Number,
    aiProvider: {
      type: String,
      enum: ['openai', 'anthropic', 'gemini']
    },
    errors: [String],
    suggestions: [String]
  },
  validation: {
    status: {
      type: String,
      enum: ['pending', 'validated', 'rejected', 'needs_review'],
      default: 'pending'
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: Date,
    validationNotes: String,
    complianceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    issues: [{
      type: {
        type: String,
        enum: ['missing_field', 'incorrect_format', 'compliance_issue', 'data_mismatch', 'other']
      },
      field: String,
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      suggestion: String
    }],
    corrections: [{
      field: String,
      originalValue: String,
      correctedValue: String,
      correctedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      correctedAt: Date
    }]
  },
  customs: {
    declarationNumber: String,
    customsStatus: {
      type: String,
      enum: ['not_submitted', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'not_submitted'
    },
    customsNotes: String,
    dutyCalculation: {
      hsCode: String,
      dutyRate: Number,
      dutyAmount: Number,
      taxRate: Number,
      taxAmount: Number,
      totalDutyTax: Number
    }
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'validated', 'rejected', 'archived'],
    default: 'uploaded'
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  expiryDate: Date,
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    fileName: String,
    filePath: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better performance
importDocumentSchema.index({ importShipment: 1 });
importDocumentSchema.index({ importer: 1 });
importDocumentSchema.index({ documentType: 1 });
importDocumentSchema.index({ status: 1 });
importDocumentSchema.index({ 'validation.status': 1 });
importDocumentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImportDocument', importDocumentSchema);
