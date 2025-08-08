const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    bio: {
      type: String,
      maxlength: 500
    },
    avatar: {
      type: String
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    }
  },
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      documentUploads: {
        type: Boolean,
        default: true
      },
      validationResults: {
        type: Boolean,
        default: true
      },
      complianceAlerts: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: false
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      urgentAlerts: {
        type: Boolean,
        default: true
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      documentStatus: {
        type: Boolean,
        default: true
      },
      complianceIssues: {
        type: Boolean,
        default: true
      }
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorMethod: {
      type: String,
      enum: ['sms', 'email', 'authenticator'],
      default: 'authenticator'
    },
    sessionTimeout: {
      type: Number,
      default: 24 // hours
    },
    passwordExpiry: {
      type: Number,
      default: 90 // days
    },
    loginNotifications: {
      type: Boolean,
      default: true
    },
    deviceManagement: {
      type: Boolean,
      default: true
    }
  },
  preferences: {
    dashboard: {
      layout: {
        type: String,
        enum: ['grid', 'list', 'compact'],
        default: 'grid'
      },
      widgets: [{
        name: String,
        enabled: {
          type: Boolean,
          default: true
        },
        position: Number
      }],
      refreshInterval: {
        type: Number,
        default: 300 // seconds
      }
    },
    documents: {
      defaultView: {
        type: String,
        enum: ['grid', 'list', 'table'],
        default: 'grid'
      },
      sortBy: {
        type: String,
        enum: ['date', 'name', 'type', 'status'],
        default: 'date'
      },
      sortOrder: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      },
      itemsPerPage: {
        type: Number,
        default: 20
      }
    },
    theme: {
      mode: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light'
      },
      primaryColor: {
        type: String,
        default: '#3b82f6'
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    }
  },
  integrations: {
    emailIntegration: {
      enabled: {
        type: Boolean,
        default: false
      },
      provider: {
        type: String,
        enum: ['gmail', 'outlook', 'yahoo', 'other']
      },
      settings: {
        type: mongoose.Schema.Types.Mixed
      }
    },
    calendarIntegration: {
      enabled: {
        type: Boolean,
        default: false
      },
      provider: {
        type: String,
        enum: ['google', 'outlook', 'apple', 'other']
      },
      settings: {
        type: mongoose.Schema.Types.Mixed
      }
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'team'],
      default: 'team'
    },
    activitySharing: {
      type: Boolean,
      default: true
    },
    dataAnalytics: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Create indexes for better performance
userSettingsSchema.index({ user: 1 });

module.exports = mongoose.model('UserSettings', userSettingsSchema); 