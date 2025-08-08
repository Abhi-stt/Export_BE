const mongoose = require('mongoose');

const auditTrailSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  details: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error'],
    default: 'success'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes for better performance
auditTrailSchema.index({ user: 1 });
auditTrailSchema.index({ action: 1 });
auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ status: 1 });

module.exports = mongoose.model('AuditTrail', auditTrailSchema); 