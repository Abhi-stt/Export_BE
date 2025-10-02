const mongoose = require('mongoose');

const importSupplierSchema = new mongoose.Schema({
  importer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplierInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    taxId: {
      type: String,
      trim: true
    },
    registrationNumber: {
      type: String,
      trim: true
    }
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  businessDetails: {
    industry: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      enum: ['manufacturer', 'trader', 'distributor', 'agent', 'other'],
      default: 'manufacturer'
    },
    establishedYear: Number,
    employeeCount: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+']
    },
    annualRevenue: {
      type: String,
      enum: ['under_1m', '1m_5m', '5m_10m', '10m_50m', '50m_100m', '100m+']
    }
  },
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuingBody: {
      type: String,
      required: true,
      trim: true
    },
    certificateNumber: {
      type: String,
      trim: true
    },
    issueDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'pending', 'suspended'],
      default: 'active'
    },
    documentUrl: String
  }],
  products: [{
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    hsCode: {
      type: String,
      trim: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1
    },
    leadTime: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    }
  }],
  performance: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    onTimeDelivery: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    communicationRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    }
  },
  compliance: {
    isBlacklisted: {
      type: Boolean,
      default: false
    },
    blacklistReason: String,
    sanctionsCheck: {
      status: {
        type: String,
        enum: ['pending', 'passed', 'failed'],
        default: 'pending'
      },
      checkedAt: Date,
      notes: String
    },
    dueDiligence: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      completedAt: Date,
      documents: [String],
      notes: String
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  payment: {
    preferredMethod: {
      type: String,
      enum: ['letter_of_credit', 'bank_transfer', 'cash', 'cheque', 'other'],
      default: 'bank_transfer'
    },
    paymentTerms: {
      type: String,
      enum: ['net_30', 'net_60', 'net_90', 'advance', 'on_delivery', 'custom'],
      default: 'net_30'
    },
    customTerms: String,
    creditLimit: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  contact: {
    primary: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      designation: {
        type: String,
        trim: true
      }
    },
    secondary: [{
      name: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      designation: {
        type: String,
        trim: true
      }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
    default: 'active'
  },
  notes: String,
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for better performance
importSupplierSchema.index({ importer: 1 });
importSupplierSchema.index({ 'supplierInfo.email': 1 });
importSupplierSchema.index({ 'supplierInfo.company': 1 });
importSupplierSchema.index({ status: 1 });
importSupplierSchema.index({ 'compliance.riskLevel': 1 });
importSupplierSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImportSupplier', importSupplierSchema);
