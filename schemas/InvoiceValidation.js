const mongoose = require('mongoose');

const invoiceValidationSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  success: {
    type: Boolean,
    default: false
  },
  text: {
    type: String
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
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
  compliance: {
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
      },
      requirement: String
    }]
  },
  errors: [{
    type: {
      type: String,
      enum: ['compliance_error', 'missing_entity', 'format_error', 'calculation_error']
    },
    field: String,
    message: String,
    severity: {
      type: String,
      enum: ['error', 'warning']
    },
    requirement: String
  }],
  corrections: [{
    type: {
      type: String,
      enum: ['add_field', 'format_field', 'recalculate', 'compliance_fix']
    },
    field: String,
    message: String,
    suggestion: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  metadata: {
    fileName: String,
    confidence: Number,
    language: String,
    pages: Number,
    processingTime: Number
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
invoiceValidationSchema.index({ document: 1 });
invoiceValidationSchema.index({ 'compliance.isValid': 1 });

module.exports = mongoose.model('InvoiceValidation', invoiceValidationSchema); 