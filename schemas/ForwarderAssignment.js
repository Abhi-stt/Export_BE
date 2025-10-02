const mongoose = require('mongoose');

const forwarderAssignmentSchema = new mongoose.Schema({
  // Reference to the shipment order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShipmentOrder',
    required: true
  },
  
  // Current stage of the shipment
  currentStage: {
    type: String,
    enum: ['pickup', 'transit', 'port_loading', 'on_ship', 'destination'],
    default: 'pickup'
  },
  
  // Overall status of the forwarding process
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  
  // Assigned forwarders for each stage
  assignedForwarders: [{
    stage: {
      type: String,
      enum: ['pickup', 'transit', 'port_loading', 'on_ship', 'destination'],
      required: true
    },
    forwarderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    forwarderName: {
      type: String,
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'assigned'
    },
    startedAt: Date,
    completedAt: Date,
    documents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }],
    notes: String,
    location: String,
    estimatedCompletion: Date
  }],
  
  // Tracking information for each stage
  tracking: [{
    stage: {
      type: String,
      enum: ['pickup', 'transit', 'port_loading', 'on_ship', 'destination'],
      required: true
    },
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }]
  }],
  
  // Route information
  route: {
    origin: {
      country: String,
      city: String,
      port: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    destination: {
      country: String,
      city: String,
      port: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    estimatedDuration: Number, // in days
    actualDuration: Number, // in days
    distance: Number // in kilometers
  },
  
  // Timeline and milestones
  timeline: {
    assignedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: Date,
    estimatedCompletion: Date,
    actualCompletion: Date,
    milestones: [{
      stage: String,
      plannedDate: Date,
      actualDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'delayed'],
        default: 'pending'
      }
    }]
  },
  
  // Communication and notifications
  notifications: [{
    type: {
      type: String,
      enum: ['stage_update', 'document_upload', 'status_change', 'delay', 'completion'],
      required: true
    },
    message: String,
    sentTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentAt: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }]
  }],
  
  // Audit trail
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    previousStatus: String,
    newStatus: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
forwarderAssignmentSchema.index({ orderId: 1 });
forwarderAssignmentSchema.index({ currentStage: 1 });
forwarderAssignmentSchema.index({ status: 1 });
forwarderAssignmentSchema.index({ 'assignedForwarders.forwarderId': 1 });
forwarderAssignmentSchema.index({ 'tracking.timestamp': -1 });

// Virtual for getting current forwarder
forwarderAssignmentSchema.virtual('currentForwarder').get(function() {
  return this.assignedForwarders.find(f => f.stage === this.currentStage);
});

// Method to add tracking update
forwarderAssignmentSchema.methods.addTrackingUpdate = function(stage, status, location, notes, updatedBy) {
  this.tracking.push({
    stage,
    status,
    location,
    notes,
    updatedBy
  });
  return this.save();
};

// Method to update stage
forwarderAssignmentSchema.methods.updateStage = function(newStage, forwarderId) {
  this.currentStage = newStage;
  
  // Update the forwarder status for the new stage
  const forwarder = this.assignedForwarders.find(f => f.stage === newStage);
  if (forwarder) {
    forwarder.status = 'in_progress';
    forwarder.startedAt = new Date();
  }
  
  return this.save();
};

// Method to complete a stage
forwarderAssignmentSchema.methods.completeStage = function(stage, forwarderId) {
  const forwarder = this.assignedForwarders.find(f => f.stage === stage);
  if (forwarder) {
    forwarder.status = 'completed';
    forwarder.completedAt = new Date();
  }
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'Stage Completed',
    performedBy: forwarderId,
    details: `${stage} stage completed`,
    previousStatus: 'in_progress',
    newStatus: 'completed'
  });
  
  return this.save();
};

module.exports = mongoose.model('ForwarderAssignment', forwarderAssignmentSchema);
