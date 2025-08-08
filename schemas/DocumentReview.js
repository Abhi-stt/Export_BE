const mongoose = require('mongoose');

const documentReviewSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true,
    enum: ['invoice', 'boe', 'packing_list', 'certificate', 'shipping_bill', 'other']
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'under_review'],
    default: 'pending'
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  issues: [{
    type: {
      type: String,
      enum: ['compliance', 'format', 'missing_info', 'calculation', 'other']
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  }],
  recommendations: [{
    type: {
      type: String,
      enum: ['improvement', 'correction', 'optimization', 'compliance']
    },
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    implemented: {
      type: Boolean,
      default: false
    }
  }],
  reviewNotes: {
    type: String
  },
  reviewDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  timeSpent: {
    type: Number // in minutes
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  tags: [{
    type: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }]
}, {
  timestamps: true
});

// Create indexes for better performance
documentReviewSchema.index({ document: 1 });
documentReviewSchema.index({ client: 1 });
documentReviewSchema.index({ status: 1 });
documentReviewSchema.index({ reviewer: 1 });
documentReviewSchema.index({ assignedTo: 1 });
documentReviewSchema.index({ reviewDate: -1 });

module.exports = mongoose.model('DocumentReview', documentReviewSchema); 