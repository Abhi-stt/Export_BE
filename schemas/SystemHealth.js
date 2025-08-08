const mongoose = require('mongoose');

const systemHealthSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['healthy', 'warning', 'error', 'offline'],
    default: 'healthy'
  },
  uptime: {
    type: Number,
    min: 0,
    max: 100
  },
  responseTime: {
    type: Number
  },
  lastCheck: {
    type: Date,
    default: Date.now
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes for better performance
systemHealthSchema.index({ service: 1 });
systemHealthSchema.index({ status: 1 });

module.exports = mongoose.model('SystemHealth', systemHealthSchema); 