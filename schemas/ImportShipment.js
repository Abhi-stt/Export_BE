const mongoose = require('mongoose');

const importShipmentSchema = new mongoose.Schema({
  shipmentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  importer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplier: {
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
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  origin: {
    country: {
      type: String,
      required: true,
      trim: true
    },
    port: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    }
  },
  destination: {
    country: {
      type: String,
      required: true,
      trim: true
    },
    port: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    warehouse: {
      name: String,
      address: String
    }
  },
  goods: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    hsCode: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    unitValue: {
      type: Number,
      required: true
    },
    totalValue: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  }],
  documents: [{
    type: {
      type: String,
      enum: ['commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin', 'insurance_certificate', 'import_license', 'customs_declaration', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'validated', 'rejected', 'under_review'],
      default: 'pending'
    }
  }],
  customs: {
    declarationNumber: String,
    customsBroker: {
      name: String,
      license: String,
      contact: String
    },
    dutyAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalDutyTax: {
      type: Number,
      default: 0
    },
    clearanceStatus: {
      type: String,
      enum: ['pending', 'submitted', 'under_review', 'approved', 'rejected', 'released'],
      default: 'pending'
    },
    clearanceDate: Date,
    inspectionRequired: {
      type: Boolean,
      default: false
    },
    inspectionDate: Date,
    inspectionResult: String
  },
  logistics: {
    vessel: {
      name: String,
      voyage: String,
      imo: String
    },
    container: {
      number: String,
      type: { type: String },
      size: String
    },
    trackingNumber: String,
    estimatedArrival: Date,
    actualArrival: Date,
    portOperations: {
      unloading: {
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending'
        },
        startTime: Date,
        endTime: Date
      },
      customsExamination: {
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'not_required'],
          default: 'pending'
        },
        startTime: Date,
        endTime: Date
      },
      release: {
        status: {
          type: String,
          enum: ['pending', 'released', 'held'],
          default: 'pending'
        },
        releaseTime: Date
      }
    }
  },
  delivery: {
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'in_transit', 'delivered', 'exception'],
      default: 'pending'
    },
    scheduledDate: Date,
    actualDate: Date,
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    deliveryNotes: String,
    recipient: {
      name: String,
      phone: String,
      signature: String
    }
  },
  // Forwarder Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected', 'none'],
    default: 'pending_approval'
  },
  forwarderAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'in_progress', 'in_transit', 'at_port', 'customs_clearance', 'released', 'delivered', 'exception', 'rejected'],
    default: 'draft'
  },
  totalValue: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for better performance
importShipmentSchema.index({ shipmentNumber: 1 });
importShipmentSchema.index({ importer: 1 });
importShipmentSchema.index({ status: 1 });
importShipmentSchema.index({ approvalStatus: 1 });
importShipmentSchema.index({ forwarderAdmin: 1 });
importShipmentSchema.index({ 'origin.country': 1 });
importShipmentSchema.index({ 'destination.country': 1 });
importShipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImportShipment', importShipmentSchema);
