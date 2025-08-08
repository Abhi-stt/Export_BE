const mongoose = require('mongoose');

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

// Create indexes for better performance
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ createdBy: 1 });
shipmentSchema.index({ estimatedDelivery: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema); 