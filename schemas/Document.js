const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  documentType: {
    type: String,
    enum: ['invoice', 'boe', 'packing_list', 'certificate', 'shipping_bill', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'error', 'failed', 'validated', 'rejected'],
    default: 'uploading'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  description: {
    type: String
  },
  filePath: {
    type: String,
    required: true
  },
  processingTime: {
    type: Number
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  language: {
    type: String,
    default: 'en'
  },
  pages: {
    type: Number,
    default: 1
  },
  errors: [{
    type: {
      type: String,
      enum: ['missing_field', 'invalid_format', 'incomplete_info', 'compliance_issue']
    },
    field: String,
    message: String,
    suggestion: String
  }],
  suggestions: [{
    type: {
      type: String,
      enum: ['hs_code', 'compliance', 'format', 'completion']
    },
    message: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  extractedText: {
    type: String
  },
  entities: [{
    type: {
      type: String,
      enum: ['company', 'person', 'date', 'amount', 'hs_code', 'product', 'location', 'invoice_number', 'boe_number', 'port', 'iec_code', 'document', 'email', 'phone']
    },
    value: String,
    confidence: Number,
    position: {
      start: Number,
      end: Number
    }
  }],
  validation: {
    isValid: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    checks: [{
      name: String,
      passed: Boolean,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      }
    }]
  },
  
  // Enhanced AI Processing Fields
  processingStartTime: {
    type: Date
  },
  processingEndTime: {
    type: Date
  },
  processingError: {
    type: String
  },
  
  // OCR Results (Step 1 - Gemini)
  structuredData: {
    type: mongoose.Schema.Types.Mixed // Flexible schema for OCR results
  },
  ocrMetadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Compliance Analysis Results (Step 2 - GPT-4/Claude)
  complianceAnalysis: {
    isValid: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    checks: [{
      name: String,
      passed: Boolean,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      },
      field: String,
      requirement: String
    }]
  },
  complianceErrors: [{
    type: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['error', 'warning'],
      required: true
    },
    requirement: String
  }],
  complianceCorrections: [{
    type: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    suggestion: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true
    }
  }],
  complianceSummary: {
    totalChecks: {
      type: Number,
      default: 0
    },
    passedChecks: {
      type: Number,
      default: 0
    },
    failedChecks: {
      type: Number,
      default: 0
    },
    warningsCount: {
      type: Number,
      default: 0
    },
    criticalIssues: {
      type: Number,
      default: 0
    }
  },
  complianceRecommendations: [{
    category: String,
    message: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  complianceMetadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // AI Processing Pipeline Results
  aiProcessingResults: {
    step1_ocr: {
      provider: String,
      success: Boolean,
      confidence: Number,
      entitiesFound: Number
    },
    step2_compliance: {
      provider: String,
      success: Boolean,
      complianceScore: Number,
      issuesFound: Number
    },
    totalProcessingTime: Number,
    completedAt: Date
  }
}, {
  timestamps: true
});

// Create indexes for better performance
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema); 