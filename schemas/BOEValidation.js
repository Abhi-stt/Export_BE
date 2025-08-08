const mongoose = require('mongoose');

const boeValidationSchema = new mongoose.Schema({
  invoiceDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  boeDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  boeNumber: {
    type: String,
    required: true
  },
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  overallStatus: {
    type: String,
    enum: ['passed', 'failed', 'warning'],
    default: 'pending'
  },
  results: [{
    field: {
      type: String,
      required: true
    },
    invoiceValue: String,
    boeValue: String,
    status: {
      type: String,
      enum: ['match', 'mismatch', 'missing']
    },
    variance: String,
    suggestion: String
  }],
  metadata: {
    invoiceFileName: String,
    boeFileName: String,
    processingTime: Number,
    invoiceFields: Number,
    boeFields: Number
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
boeValidationSchema.index({ invoiceDocument: 1 });
boeValidationSchema.index({ boeDocument: 1 });
boeValidationSchema.index({ overallStatus: 1 });

module.exports = mongoose.model('BOEValidation', boeValidationSchema); 