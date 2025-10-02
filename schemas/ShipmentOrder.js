const mongoose = require('mongoose');

const shipmentOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  },
  exporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  assignedForwarder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'ready_for_forwarder', 'assigned_to_forwarder'],
    default: 'draft'
  },
  complianceStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  
  // Basic Order Information
  orderDetails: {
    destination: {
      country: {
        type: String,
        required: true
      },
      port: String,
      city: String
    },
    consignee: {
      name: {
        type: String,
        required: true
      },
      address: String,
      contact: String,
      email: String
    },
    transportMode: {
      type: String,
      enum: ['sea', 'air', 'road'],
      required: true
    },
    estimatedShipmentDate: {
      type: Date,
      required: true
    },
    specialInstructions: String
  },

  // Product Details
  products: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    hsCode: String,
    suggestedHsCode: String,
    value: {
      type: Number,
      required: true
    },
    weight: Number,
    origin: String,
    specifications: String
  }],

  // Document Management
  documents: {
    commercialInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    packingList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    certificates: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }],
    otherDocuments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }]
  },

  // Compliance Review
  compliance: {
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    comments: String,
    issues: [{
      type: String,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      },
      field: String
    }],
    complianceScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },

  // Financial Summary
  financial: {
    totalValue: Number,
    totalWeight: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Related Shipment (created after CA approval)
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  },

  // Audit Trail
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: String,
    previousStatus: String,
    newStatus: String
  }],

  notes: String
}, {
  timestamps: true
});

// Create indexes for better performance
shipmentOrderSchema.index({ orderNumber: 1 });
shipmentOrderSchema.index({ exporter: 1 });
shipmentOrderSchema.index({ status: 1 });
shipmentOrderSchema.index({ assignedForwarder: 1 });
shipmentOrderSchema.index({ 'orderDetails.destination.country': 1 });

// Pre-save middleware to generate order number
shipmentOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      // Get the count of existing orders
      const count = await this.constructor.countDocuments();
      // Generate order number with timestamp for uniqueness
      const timestamp = Date.now().toString().slice(-6);
      this.orderNumber = `SO${String(count + 1).padStart(4, '0')}${timestamp}`;
      console.log('Generated order number:', this.orderNumber);
    } catch (error) {
      console.error('Error generating order number:', error);
      // Fallback to timestamp-based number
      this.orderNumber = `SO${Date.now()}`;
    }
  }
  next();
});

// Method to calculate totals
shipmentOrderSchema.methods.calculateTotals = function() {
  this.financial.totalValue = this.products.reduce((sum, product) => sum + (product.value || 0), 0);
  this.financial.totalWeight = this.products.reduce((sum, product) => sum + (product.weight || 0), 0);
};

module.exports = mongoose.model('ShipmentOrder', shipmentOrderSchema);
