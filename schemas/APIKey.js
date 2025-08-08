const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'admin', 'delete'],
    default: ['read']
  }],
  lastUsed: {
    type: Date
  },
  requests: {
    type: Number,
    default: 0
  },
  rateLimit: {
    type: Number,
    default: 1000 // requests per hour
  },
  expiresAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  description: {
    type: String
  },
  ipWhitelist: [{
    type: String
  }],
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for better performance
apiKeySchema.index({ key: 1 });
apiKeySchema.index({ status: 1 });
apiKeySchema.index({ createdBy: 1 });
apiKeySchema.index({ expiresAt: 1 });

module.exports = mongoose.model('APIKey', apiKeySchema); 