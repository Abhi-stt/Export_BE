// MongoDB Schema for AI-Powered Export Project
// Generated from frontend codebase analysis

const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true
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
  role: {
    type: String,
    enum: ['admin', 'exporter', 'ca', 'forwarder'],
    default: 'exporter'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  },
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Client Schema
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

// Document Schema
const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  documentType: {
    type: String,
    enum: ['invoice', 'boe', 'packing_list', 'certificate', 'shipping_bill', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'error', 'validated', 'rejected'],
    default: 'uploading'
  },
  uploadedBy: {
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
  filePath: {
    type: String,
    required: true
  },
  processingTime: {
    type: Number
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  language: {
    type: String,
    default: 'en'
  },
  pages: {
    type: Number,
    default: 1
  },
  errors: [{
    type: {
      type: String,
      enum: ['missing_field', 'invalid_format', 'incomplete_info', 'compliance_issue']
    },
    field: String,
    message: String,
    suggestion: String
  }],
  suggestions: [{
    type: {
      type: String,
      enum: ['hs_code', 'compliance', 'format', 'completion']
    },
    message: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  extractedText: {
    type: String
  },
  entities: [{
    type: {
      type: String,
      enum: ['company', 'person', 'date', 'amount', 'hs_code', 'product', 'location']
    },
    value: String,
    confidence: Number,
    position: {
      start: Number,
      end: Number
    }
  }],
  validation: {
    isValid: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    checks: [{
      name: String,
      passed: Boolean,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      }
    }]
  }
}, {
  timestamps: true
});

// Shipment Schema
const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  exporter: {
    type: String,
    required: true
  },
  consignee: {
    type: String,
    required: true
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ['sea', 'air', 'road'],
    required: true
  },
  status: {
    type: String,
    enum: ['in-transit', 'customs', 'delivered', 'delayed', 'pending'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  actualDelivery: {
    type: Date
  },
  documentsStatus: {
    type: String,
    enum: ['complete', 'pending', 'issues'],
    default: 'pending'
  },
  value: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  containers: [{
    type: String
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// BOE Validation Schema
const boeValidationSchema = new mongoose.Schema({
  invoiceDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  boeDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  boeNumber: {
    type: String,
    required: true
  },
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  overallStatus: {
    type: String,
    enum: ['passed', 'failed', 'warning'],
    default: 'pending'
  },
  results: [{
    field: {
      type: String,
      required: true
    },
    invoiceValue: String,
    boeValue: String,
    status: {
      type: String,
      enum: ['match', 'mismatch', 'missing']
    },
    variance: String,
    suggestion: String
  }],
  metadata: {
    invoiceFileName: String,
    boeFileName: String,
    processingTime: Number,
    invoiceFields: Number,
    boeFields: Number
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Invoice Validation Schema
const invoiceValidationSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  success: {
    type: Boolean,
    default: false
  },
  text: {
    type: String
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  entities: [{
    type: String,
    value: mongoose.Schema.Types.Mixed,
    confidence: Number,
    position: {
      start: Number,
      end: Number
    }
  }],
  compliance: {
    isValid: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    checks: [{
      name: String,
      passed: Boolean,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      },
      requirement: String
    }]
  },
  errors: [{
    type: {
      type: String,
      enum: ['compliance_error', 'missing_entity', 'format_error', 'calculation_error']
    },
    field: String,
    message: String,
    severity: {
      type: String,
      enum: ['error', 'warning']
    },
    requirement: String
  }],
  corrections: [{
    type: {
      type: String,
      enum: ['add_field', 'format_field', 'recalculate', 'compliance_fix']
    },
    field: String,
    message: String,
    suggestion: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  metadata: {
    fileName: String,
    confidence: Number,
    language: String,
    pages: Number,
    processingTime: Number
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// HS Code Suggestions Schema
const hsCodeSuggestionSchema = new mongoose.Schema({
  productDescription: {
    type: String,
    required: true
  },
  additionalInfo: {
    type: String
  },
  suggestions: [{
    code: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    category: String,
    dutyRate: String,
    restrictions: [String],
    similarProducts: [String]
  }],
  processingTime: {
    type: Number
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Audit Trail Schema
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

// System Health Schema
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

// System Settings Schema
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

// ERP Integration Schema
const erpIntegrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Accounting', 'ERP', 'Cloud ERP'],
    required: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'syncing', 'error'],
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

// Compliance Report Schema
const complianceReportSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true
  },
  totalDocuments: {
    type: Number,
    default: 0
  },
  complianceScore: {
    type: Number,
    min: 0,
    max: 100
  },
  errorsReduced: {
    type: Number,
    default: 0
  },
  avgProcessingTime: {
    type: Number
  },
  monthlyData: [{
    month: String,
    documents: Number,
    errors: Number,
    compliance: Number
  }],
  errorTypes: [{
    name: String,
    value: Number,
    color: String
  }],
  topIssues: [{
    issue: String,
    frequency: Number,
    severity: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  exportedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Analytics Schema
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
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ company: 1 });

clientSchema.index({ email: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ assignedCA: 1 });

documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ createdAt: -1 });

shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ createdBy: 1 });
shipmentSchema.index({ estimatedDelivery: 1 });

boeValidationSchema.index({ invoiceDocument: 1 });
boeValidationSchema.index({ boeDocument: 1 });
boeValidationSchema.index({ overallStatus: 1 });

invoiceValidationSchema.index({ document: 1 });
invoiceValidationSchema.index({ 'compliance.isValid': 1 });

auditTrailSchema.index({ user: 1 });
auditTrailSchema.index({ action: 1 });
auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ status: 1 });

systemHealthSchema.index({ service: 1 });
systemHealthSchema.index({ status: 1 });

erpIntegrationSchema.index({ name: 1 });
erpIntegrationSchema.index({ status: 1 });

complianceReportSchema.index({ period: 1 });
complianceReportSchema.index({ generatedBy: 1 });

analyticsSchema.index({ type: 1 });
analyticsSchema.index({ period: 1 });

// Export models
module.exports = {
  User: mongoose.model('User', userSchema),
  Client: mongoose.model('Client', clientSchema),
  Document: mongoose.model('Document', documentSchema),
  Shipment: mongoose.model('Shipment', shipmentSchema),
  BOEValidation: mongoose.model('BOEValidation', boeValidationSchema),
  InvoiceValidation: mongoose.model('InvoiceValidation', invoiceValidationSchema),
  HSCodeSuggestion: mongoose.model('HSCodeSuggestion', hsCodeSuggestionSchema),
  AuditTrail: mongoose.model('AuditTrail', auditTrailSchema),
  SystemHealth: mongoose.model('SystemHealth', systemHealthSchema),
  SystemSettings: mongoose.model('SystemSettings', systemSettingsSchema),
  ERPIntegration: mongoose.model('ERPIntegration', erpIntegrationSchema),
  ComplianceReport: mongoose.model('ComplianceReport', complianceReportSchema),
  Analytics: mongoose.model('Analytics', analyticsSchema)
}; 