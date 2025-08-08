const mongoose = require('mongoose');

const complianceReportSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true
  },
  totalDocuments: {
    type: Number,
    default: 0
  },
  complianceScore: {
    type: Number,
    min: 0,
    max: 100
  },
  errorsReduced: {
    type: Number,
    default: 0
  },
  avgProcessingTime: {
    type: Number
  },
  monthlyData: [{
    month: String,
    documents: Number,
    errors: Number,
    compliance: Number
  }],
  errorTypes: [{
    name: String,
    value: Number,
    color: String
  }],
  topIssues: [{
    issue: String,
    frequency: Number,
    severity: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  exportedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
complianceReportSchema.index({ period: 1 });
complianceReportSchema.index({ generatedBy: 1 });

module.exports = mongoose.model('ComplianceReport', complianceReportSchema); 