const mongoose = require('mongoose');

const erpIntegrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Accounting', 'ERP', 'Cloud ERP', 'SAP', 'Oracle', 'Microsoft Dynamics'],
    required: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'syncing', 'error', 'active'],
    default: 'disconnected'
  },
  lastSync: {
    type: Date
  },
  recordsSynced: {
    type: Number,
    default: 0
  },
  version: {
    type: String
  },
  apiEndpoint: {
    type: String,
    required: true
  },
  apiKey: {
    type: String
  },
  credentials: {
    type: mongoose.Schema.Types.Mixed
  },
  syncFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'daily'
  },
  autoSync: {
    type: Boolean,
    default: false
  },
  configuredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
erpIntegrationSchema.index({ name: 1 });
erpIntegrationSchema.index({ status: 1 });

module.exports = mongoose.model('ERPIntegration', erpIntegrationSchema); 