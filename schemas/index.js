// Export all MongoDB schemas
const User = require('./User');
const Client = require('./Client');
const Document = require('./Document');
const Shipment = require('./Shipment');
const BOEValidation = require('./BOEValidation');
const InvoiceValidation = require('./InvoiceValidation');
const HSCodeSuggestion = require('./HSCodeSuggestion');
const AuditTrail = require('./AuditTrail');
const SystemHealth = require('./SystemHealth');
const SystemSettings = require('./SystemSettings');
const ERPIntegration = require('./ERPIntegration');
const ComplianceReport = require('./ComplianceReport');
const Analytics = require('./Analytics');
const APIKey = require('./APIKey');
const DocumentReview = require('./DocumentReview');
const AuditReport = require('./AuditReport');
const UserSettings = require('./UserSettings');
const Notification = require('./Notification');
const ComplianceRule = require('./ComplianceRule');

module.exports = {
  User,
  Client,
  Document,
  Shipment,
  BOEValidation,
  InvoiceValidation,
  HSCodeSuggestion,
  AuditTrail,
  SystemHealth,
  SystemSettings,
  ERPIntegration,
  ComplianceReport,
  Analytics,
  APIKey,
  DocumentReview,
  AuditReport,
  UserSettings,
  Notification,
  ComplianceRule
}; 