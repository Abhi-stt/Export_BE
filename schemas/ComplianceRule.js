const mongoose = require('mongoose');

const complianceRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['customs', 'export', 'import', 'financial', 'documentation', 'security', 'quality'],
    required: true
  },
  type: {
    type: String,
    enum: ['validation', 'requirement', 'restriction', 'guideline'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  rule: {
    type: String,
    required: true
  },
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists']
    },
    value: mongoose.Schema.Types.Mixed,
    logicalOperator: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    }
  }],
  actions: [{
    type: {
      type: String,
      enum: ['error', 'warning', 'info', 'auto_correct', 'block', 'flag']
    },
    message: String,
    field: String,
    value: mongoose.Schema.Types.Mixed
  }],
  applicableTo: [{
    type: String,
    enum: ['invoice', 'boe', 'packing_list', 'certificate', 'shipping_bill', 'all']
  }],
  countries: [{
    type: String
  }],
  industries: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'active'
  },
  priority: {
    type: Number,
    default: 0
  },
  version: {
    type: String,
    default: '1.0'
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String
  }],
  references: [{
    title: String,
    url: String,
    type: String
  }],
  statistics: {
    totalChecks: {
      type: Number,
      default: 0
    },
    violations: {
      type: Number,
      default: 0
    },
    lastTriggered: {
      type: Date
    }
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for better performance
complianceRuleSchema.index({ code: 1 });
complianceRuleSchema.index({ category: 1 });
complianceRuleSchema.index({ type: 1 });
complianceRuleSchema.index({ status: 1 });
complianceRuleSchema.index({ severity: 1 });
complianceRuleSchema.index({ applicableTo: 1 });
complianceRuleSchema.index({ effectiveDate: -1 });

module.exports = mongoose.model('ComplianceRule', complianceRuleSchema); 