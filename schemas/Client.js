const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  complianceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  documentsProcessed: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  issues: {
    type: Number,
    default: 0
  },
  industry: {
    type: String,
    trim: true
  },
  monthlyFee: {
    type: Number,
    default: 0
  },
  contractEnd: {
    type: Date
  },
  type: {
    type: String,
    enum: ['exporter', 'importer', 'both'],
    default: 'exporter'
  },
  notes: {
    type: String
  },
  assignedCA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
clientSchema.index({ email: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ assignedCA: 1 });

module.exports = mongoose.model('Client', clientSchema); 