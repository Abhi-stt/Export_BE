const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user', 'document', 'system', 'compliance'],
    required: true
  },
  period: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
analyticsSchema.index({ type: 1 });
analyticsSchema.index({ period: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema); 