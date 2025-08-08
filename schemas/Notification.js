const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'alert'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['document', 'compliance', 'system', 'security', 'user', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String
  },
  actionText: {
    type: String
  },
  metadata: {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment'
    },
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditReport'
    },
    customData: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  expiresAt: {
    type: Date
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  sentVia: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    default: ['in_app']
  }],
  deliveryStatus: {
    in_app: {
      sent: {
        type: Boolean,
        default: true
      },
      deliveredAt: {
        type: Date,
        default: Date.now
      }
    },
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      error: String
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      error: String
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      error: String
    }
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Create indexes for better performance
notificationSchema.index({ user: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 