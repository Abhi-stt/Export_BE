const mongoose = require('mongoose');

const forwarderProfileSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Forwarder specialization
  specialization: [{
    type: String,
    enum: ['pickup', 'transit', 'port_loading', 'on_ship', 'destination'],
    required: true
  }],
  
  // Service areas (geographic coverage)
  serviceAreas: [{
    country: {
      type: String,
      required: true
    },
    state: String,
    city: String,
    port: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }],
  
  // Business information
  businessInfo: {
    companyName: {
      type: String,
      required: true
    },
    registrationNumber: String,
    taxId: String,
    licenseNumber: String,
    website: String,
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  
  // Certifications and licenses
  certifications: [{
    name: String,
    issuingAuthority: String,
    issueDate: Date,
    expiryDate: Date,
    certificateNumber: String,
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  }],
  
  // Capacity and workload management
  capacity: {
    maxConcurrentShipments: {
      type: Number,
      default: 10
    },
    currentLoad: {
      type: Number,
      default: 0
    },
    averageProcessingTime: {
      type: Number, // in hours
      default: 24
    }
  },
  
  // Performance metrics
  performance: {
    totalShipments: {
      type: Number,
      default: 0
    },
    completedShipments: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    onTimeDelivery: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    customerSatisfaction: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Availability and working hours
  availability: {
    isActive: {
      type: Boolean,
      default: true
    },
    workingHours: {
      start: String, // "09:00"
      end: String,   // "18:00"
      timezone: String
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    holidays: [Date],
    vacationPeriods: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }]
  },
  
  // Equipment and capabilities
  equipment: [{
    type: {
      type: String,
      enum: ['truck', 'container', 'crane', 'forklift', 'refrigerated_truck', 'hazardous_materials'],
      required: true
    },
    capacity: String,
    specifications: String,
    registrationNumber: String,
    lastInspection: Date,
    nextInspection: Date
  }],
  
  // Insurance and compliance
  insurance: {
    provider: String,
    policyNumber: String,
    coverageAmount: Number,
    expiryDate: Date,
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  },
  
  // Financial information
  financial: {
    bankAccount: {
      accountNumber: String,
      bankName: String,
      routingNumber: String,
      currency: String
    },
    paymentTerms: {
      type: String,
      enum: ['net_15', 'net_30', 'net_45', 'net_60', 'cash_on_delivery'],
      default: 'net_30'
    },
    creditLimit: Number,
    currentBalance: Number
  },
  
  // Communication preferences
  communication: {
    preferredLanguage: {
      type: String,
      default: 'en'
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    emergencyContact: {
      name: String,
      phone: String,
      email: String,
      relationship: String
    }
  },
  
  // Status and verification
  status: {
    type: String,
    enum: ['pending', 'verified', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },
  
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationNotes: String
  },
  
  // Audit trail
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
forwarderProfileSchema.index({ userId: 1 });
forwarderProfileSchema.index({ specialization: 1 });
forwarderProfileSchema.index({ 'serviceAreas.country': 1 });
forwarderProfileSchema.index({ 'serviceAreas.city': 1 });
forwarderProfileSchema.index({ status: 1 });
forwarderProfileSchema.index({ 'availability.isActive': 1 });

// Virtual for availability status
forwarderProfileSchema.virtual('isAvailable').get(function() {
  return this.availability.isActive && 
         this.status === 'active' && 
         this.capacity.currentLoad < this.capacity.maxConcurrentShipments;
});

// Method to update current load
forwarderProfileSchema.methods.updateLoad = function(change) {
  this.capacity.currentLoad += change;
  if (this.capacity.currentLoad < 0) this.capacity.currentLoad = 0;
  if (this.capacity.currentLoad > this.capacity.maxConcurrentShipments) {
    this.capacity.currentLoad = this.capacity.maxConcurrentShipments;
  }
  return this.save();
};

// Method to add performance metrics
forwarderProfileSchema.methods.addPerformanceMetrics = function(shipmentCompleted, rating, onTime) {
  this.performance.totalShipments += 1;
  if (shipmentCompleted) {
    this.performance.completedShipments += 1;
  }
  
  // Update average rating
  const totalRatings = this.performance.completedShipments;
  this.performance.averageRating = 
    ((this.performance.averageRating * (totalRatings - 1)) + rating) / totalRatings;
  
  // Update on-time delivery percentage
  if (onTime) {
    this.performance.onTimeDelivery = 
      ((this.performance.onTimeDelivery * (totalRatings - 1)) + 100) / totalRatings;
  } else {
    this.performance.onTimeDelivery = 
      (this.performance.onTimeDelivery * (totalRatings - 1)) / totalRatings;
  }
  
  return this.save();
};

// Method to check if forwarder can handle a specific stage
forwarderProfileSchema.methods.canHandleStage = function(stage) {
  return this.specialization.includes(stage) && this.isAvailable;
};

// Method to check if forwarder serves a specific location
forwarderProfileSchema.methods.servesLocation = function(country, city) {
  return this.serviceAreas.some(area => 
    area.country === country && (!city || area.city === city)
  );
};

module.exports = mongoose.model('ForwarderProfile', forwarderProfileSchema);
