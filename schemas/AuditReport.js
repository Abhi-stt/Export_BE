const mongoose = require('mongoose');

const auditReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  type: {
    type: String,
    enum: ['compliance', 'financial', 'operational', 'security', 'quality'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'in_progress', 'draft', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  scope: {
    type: String,
    required: true
  },
  objectives: {
    type: String,
    required: true
  },
  methodology: {
    type: String
  },
  auditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  findings: [{
    category: {
      type: String,
      enum: ['compliance', 'financial', 'operational', 'security', 'quality']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    impact: String,
    recommendation: String,
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    resolvedDate: Date
  }],
  recommendations: [{
    category: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    actionRequired: String,
    timeline: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'implemented', 'closed']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    implementationDate: Date
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  summary: {
    type: String
  },
  conclusion: {
    type: String
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for better performance
auditReportSchema.index({ client: 1 });
auditReportSchema.index({ type: 1 });
auditReportSchema.index({ status: 1 });
auditReportSchema.index({ auditor: 1 });
auditReportSchema.index({ startDate: -1 });
auditReportSchema.index({ endDate: -1 });

module.exports = mongoose.model('AuditReport', auditReportSchema); 