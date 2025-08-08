const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  autoBackup: {
    type: Boolean,
    default: true
  },
  dataRetention: {
    type: String,
    default: '7 years'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  language: {
    type: String,
    default: 'en'
  },
  apiRateLimit: {
    type: Number,
    default: 1000
  },
  sessionDuration: {
    type: Number,
    default: 24 // hours
  },
  maxFileUploadSize: {
    type: String,
    default: '10MB'
  },
  databaseConnectionPool: {
    type: Number,
    default: 10
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema); 