const express = require('express');
const ForwarderAssignment = require('../schemas/ForwarderAssignment');
const ForwarderProfile = require('../schemas/ForwarderProfile');
const ShipmentOrder = require('../schemas/ShipmentOrder');
const User = require('../schemas/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/forwarder-assignments
// @desc    Get forwarder assignments for the authenticated user
// @access  Private (Forwarder only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { stage, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const userId = req.user._id || req.user.id;
    let query = {
      'assignedForwarders.forwarderId': userId
    };

    if (stage) {
      query['assignedForwarders.stage'] = stage;
    }

    if (status) {
      query['assignedForwarders.status'] = status;
    }

    const assignments = await ForwarderAssignment.find(query)
      .populate('orderId', 'orderNumber status client exporter')
      .populate('assignedForwarders.forwarderId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await ForwarderAssignment.countDocuments(query);

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching forwarder assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forwarder-assignments/:id
// @desc    Get specific forwarder assignment
// @access  Private (Forwarder only)
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const assignment = await ForwarderAssignment.findById(req.params.id)
      .populate('orderId')
      .populate('assignedForwarders.forwarderId', 'name email')
      .populate('tracking.updatedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if this forwarder is assigned to this assignment
    const isAssigned = assignment.assignedForwarders.some(
      f => f.forwarderId.toString() === req.user.id
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'Access denied. You are not assigned to this shipment.' });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forwarder-assignments/:id/start
// @desc    Start a forwarder stage
// @access  Private (Forwarder only)
router.put('/:id/start', auth, async (req, res) => {
  console.log('🚀 PUT /api/forwarder-assignments/:id/start endpoint called');
  console.log('🚀 Assignment ID:', req.params.id);
  console.log('🚀 Request body:', req.body);
  console.log('🚀 User from JWT:', req.user);
  
  try {
    if (req.user.role !== 'forwarder') {
      console.log('❌ Access denied - not a forwarder');
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { stage } = req.body;
    console.log('🔍 Starting stage:', stage);

    const assignment = await ForwarderAssignment.findById(req.params.id);
    if (!assignment) {
      console.log('❌ Assignment not found:', req.params.id);
      return res.status(404).json({ message: 'Assignment not found' });
    }
    console.log('✅ Assignment found');

    // Find the forwarder assignment for this stage
    const currentUserId = req.user._id || req.user.id;
    console.log('🔍 Looking for forwarder assignment:');
    console.log('   Current user ID:', currentUserId);
    console.log('   Stage:', stage);
    console.log('   Available assignments:', assignment.assignedForwarders.map(f => ({
      forwarderId: f.forwarderId.toString(),
      stage: f.stage,
      status: f.status
    })));
    
    const forwarderAssignment = assignment.assignedForwarders.find(
      f => f.forwarderId.toString() === currentUserId.toString() && f.stage === stage
    );

    if (!forwarderAssignment) {
      console.log('❌ Forwarder assignment not found for this stage');
      return res.status(403).json({ message: 'You are not assigned to this stage' });
    }
    console.log('✅ Forwarder assignment found:', forwarderAssignment);

    if (forwarderAssignment.status !== 'assigned') {
      console.log('❌ Stage already started or completed:', forwarderAssignment.status);
      return res.status(400).json({ message: 'Stage is already started or completed' });
    }
    console.log('✅ Stage can be started');

    // Update forwarder status
    forwarderAssignment.status = 'in_progress';
    forwarderAssignment.startedAt = new Date();
    console.log('✅ Updated forwarder status to in_progress');

    // Update overall assignment status
    if (assignment.status === 'assigned') {
      assignment.status = 'in_progress';
      assignment.timeline.startedAt = new Date();
      console.log('✅ Updated overall assignment status to in_progress');
    }

    // Add tracking update
    assignment.tracking.push({
      stage,
      status: 'started',
      location: req.body.location || 'Unknown',
      notes: req.body.notes || 'Stage started',
      updatedBy: currentUserId
    });
    console.log('✅ Added tracking update');

    // Add to audit trail
    assignment.auditTrail.push({
      action: 'Stage Started',
      performedBy: currentUserId,
      details: `${stage} stage started`,
      previousStatus: 'assigned',
      newStatus: 'in_progress'
    });
    console.log('✅ Added audit trail entry');

    console.log('🔍 Saving assignment...');
    await assignment.save();
    console.log('✅ Assignment saved successfully');

    console.log('✅ Sending success response');
    res.json({
      success: true,
      message: 'Stage started successfully',
      data: assignment
    });
  } catch (error) {
    console.error('❌ Error starting stage:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/forwarder-assignments/:id/update-status
// @desc    Update forwarder stage status
// @access  Private (Forwarder only)
router.put('/:id/update-status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { stage, status, location, notes, documents } = req.body;

    const assignment = await ForwarderAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Find the forwarder assignment for this stage
    const forwarderAssignment = assignment.assignedForwarders.find(
      f => f.forwarderId.toString() === req.user.id && f.stage === stage
    );

    if (!forwarderAssignment) {
      return res.status(403).json({ message: 'You are not assigned to this stage' });
    }

    // Update forwarder status
    forwarderAssignment.status = status;
    if (documents && Array.isArray(documents)) {
      forwarderAssignment.documents.push(...documents);
    }
    if (notes) {
      forwarderAssignment.notes = notes;
    }
    if (location) {
      forwarderAssignment.location = location;
    }

    // Add tracking update
    assignment.tracking.push({
      stage,
      status,
      location: location || forwarderAssignment.location,
      notes: notes || `Status updated to ${status}`,
      updatedBy: req.user.id,
      documents: documents || []
    });

    // If stage is completed, update overall assignment
    if (status === 'completed') {
      forwarderAssignment.completedAt = new Date();
      
      // Check if all stages are completed
      const allCompleted = assignment.assignedForwarders.every(
        f => f.status === 'completed'
      );
      
      if (allCompleted) {
        assignment.status = 'completed';
        assignment.timeline.actualCompletion = new Date();
      }
    }

    // Add to audit trail
    assignment.auditTrail.push({
      action: 'Status Updated',
      performedBy: req.user.id,
      details: `${stage} stage status updated to ${status}`,
      previousStatus: forwarderAssignment.status,
      newStatus: status
    });

    await assignment.save();

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forwarder-assignments/:id/complete
// @desc    Complete a forwarder stage
// @access  Private (Forwarder only)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { stage, notes, documents } = req.body;

    const assignment = await ForwarderAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Find the forwarder assignment for this stage
    const forwarderAssignment = assignment.assignedForwarders.find(
      f => f.forwarderId.toString() === req.user.id && f.stage === stage
    );

    if (!forwarderAssignment) {
      return res.status(403).json({ message: 'You are not assigned to this stage' });
    }

    if (forwarderAssignment.status !== 'in_progress') {
      return res.status(400).json({ message: 'Stage must be in progress to complete' });
    }

    // Complete the stage
    forwarderAssignment.status = 'completed';
    forwarderAssignment.completedAt = new Date();
    if (notes) {
      forwarderAssignment.notes = notes;
    }
    if (documents && Array.isArray(documents)) {
      forwarderAssignment.documents.push(...documents);
    }

    // Add tracking update
    assignment.tracking.push({
      stage,
      status: 'completed',
      location: forwarderAssignment.location,
      notes: notes || `${stage} stage completed`,
      updatedBy: req.user.id,
      documents: documents || []
    });

    // Check if all stages are completed
    const allCompleted = assignment.assignedForwarders.every(
      f => f.status === 'completed'
    );

    if (allCompleted) {
      assignment.status = 'completed';
      assignment.timeline.actualCompletion = new Date();
    }

    // Add to audit trail
    assignment.auditTrail.push({
      action: 'Stage Completed',
      performedBy: req.user.id,
      details: `${stage} stage completed`,
      previousStatus: 'in_progress',
      newStatus: 'completed'
    });

    await assignment.save();

    res.json({
      success: true,
      message: 'Stage completed successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error completing stage:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forwarder-assignments/:id/tracking
// @desc    Get tracking information for an assignment
// @access  Private (Forwarder only)
router.get('/:id/tracking', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const assignment = await ForwarderAssignment.findById(req.params.id)
      .populate('tracking.updatedBy', 'name email')
      .populate('tracking.documents', 'originalName fileType');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if this forwarder is assigned to this assignment
    const isAssigned = assignment.assignedForwarders.some(
      f => f.forwarderId.toString() === req.user.id
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'Access denied. You are not assigned to this shipment.' });
    }

    res.json({
      success: true,
      data: {
        tracking: assignment.tracking,
        currentStage: assignment.currentStage,
        status: assignment.status
      }
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
