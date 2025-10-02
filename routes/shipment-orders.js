const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShipmentOrder = require('../schemas/ShipmentOrder');
const Document = require('../schemas/Document');
const User = require('../schemas/User');
const ForwarderAssignment = require('../schemas/ForwarderAssignment');

// @route   GET /api/shipment-orders
// @desc    Get all shipment orders for the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    console.log('📋 Fetching shipment orders for user:', {
      userId: req.user.id,
      role: req.user.role
    });
    
    // Filter based on user role
    if (req.user.role === 'exporter') {
      query.exporter = req.user.id;
    } else if (req.user.role === 'forwarder') {
      query.assignedForwarder = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin can see all orders
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('🔍 Query:', query);

    const orders = await ShipmentOrder.find(query)
      .populate('exporter', 'name email company')
      .populate('assignedForwarder', 'name email company designation')
      .populate('client', 'name company')
      .populate('documents.commercialInvoice', 'fileName originalName')
      .populate('documents.packingList', 'fileName originalName')
      .populate('documents.certificates', 'fileName originalName')
      .sort({ createdAt: -1 });

    console.log('📦 Found orders:', orders.length);
    if (orders.length > 0) {
      console.log('📦 First order:', {
        orderNumber: orders[0].orderNumber,
        assignedForwarder: orders[0].assignedForwarder
      });
    }

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching shipment orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shipment-orders/:id
// @desc    Get single shipment order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await ShipmentOrder.findById(req.params.id)
      .populate('exporter', 'name email company')
      .populate('assignedForwarder', 'name email company designation')
      .populate('client', 'name company')
      .populate('documents.commercialInvoice')
      .populate('documents.packingList')
      .populate('documents.certificates')
      .populate('documents.otherDocuments');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check access permissions
    if (req.user.role === 'exporter' && order.exporter._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Allow forwarders to view orders assigned to them
    if (req.user.role === 'forwarder' && order.assignedForwarder && order.assignedForwarder._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This order is not assigned to you.' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching shipment order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shipment-orders
// @desc    Create new shipment order
// @access  Private (Exporter only)
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Creating new shipment order...');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    if (req.user.role !== 'exporter') {
      console.log('❌ Access denied: User is not an exporter');
      return res.status(403).json({ message: 'Only exporters can create orders' });
    }

    const {
      orderDetails,
      products,
      client,
      notes
    } = req.body;

    // Validate required fields
    if (!orderDetails || !products || products.length === 0) {
      console.log('❌ Validation failed: Missing required fields');
      console.log('Order details:', orderDetails);
      console.log('Products:', products);
      return res.status(400).json({ 
        message: 'Order details and products are required' 
      });
    }

    // Create new order
    const order = new ShipmentOrder({
      exporter: req.user.id,
      client,
      orderDetails,
      products,
      notes,
      status: 'draft'
    });

    // Calculate totals
    order.calculateTotals();

    // Add to audit trail
    order.auditTrail.push({
      action: 'Order created',
      performedBy: req.user.id,
      details: 'New shipment order created',
      newStatus: 'draft'
    });

    console.log('💾 Saving order to database...');
    await order.save();
    console.log('✅ Order saved successfully with ID:', order._id);

    // Populate the response
    await order.populate('exporter', 'name email company');
    if (client) {
      await order.populate('client', 'name company');
    }

    console.log('📤 Sending response...');
    res.status(201).json({ 
      message: 'Order created successfully',
      order 
    });
  } catch (error) {
    console.error('❌ Error creating shipment order:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/shipment-orders/:id
// @desc    Update shipment order
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await ShipmentOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'exporter' && order.exporter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow updates if order is already submitted
    if (order.status !== 'draft' && req.user.role === 'exporter') {
      return res.status(400).json({ 
        message: 'Cannot update submitted orders' 
      });
    }

    const {
      orderDetails,
      products,
      client,
      notes
    } = req.body;

    // Update fields
    if (orderDetails) order.orderDetails = orderDetails;
    if (products) {
      order.products = products;
      order.calculateTotals();
    }
    if (client !== undefined) order.client = client;
    if (notes !== undefined) order.notes = notes;

    // Add to audit trail
    order.auditTrail.push({
      action: 'Order updated',
      performedBy: req.user.id,
      details: 'Order details updated'
    });

    await order.save();

    res.json({ 
      message: 'Order updated successfully',
      order 
    });
  } catch (error) {
    console.error('Error updating shipment order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shipment-orders/:id/submit
// @desc    Submit order for processing
// @access  Private (Exporter only)
router.post('/:id/submit', auth, async (req, res) => {
  try {
    console.log('🚀 Submit order request received');
    console.log('User:', req.user);
    console.log('Order ID:', req.params.id);
    
    if (req.user.role !== 'exporter') {
      console.log('❌ Access denied: User is not an exporter');
      return res.status(403).json({ message: 'Only exporters can submit orders' });
    }

    const order = await ShipmentOrder.findById(req.params.id);
    
    if (!order) {
      console.log('❌ Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('📦 Order found:', {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      exporter: order.exporter,
      hasDocuments: {
        commercialInvoice: !!order.documents.commercialInvoice,
        packingList: !!order.documents.packingList,
        certificates: order.documents.certificates?.length || 0,
        otherDocuments: order.documents.otherDocuments?.length || 0
      }
    });

    if (order.exporter.toString() !== req.user.id) {
      console.log('❌ Access denied: User does not own this order');
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'draft') {
      console.log('❌ Order is not in draft status:', order.status);
      return res.status(400).json({ 
        message: 'Only draft orders can be submitted' 
      });
    }

    // Check if at least one document is uploaded
    const hasDocuments = order.documents.commercialInvoice || 
                        order.documents.packingList || 
                        (order.documents.certificates && order.documents.certificates.length > 0) ||
                        (order.documents.otherDocuments && order.documents.otherDocuments.length > 0);
    
    if (!hasDocuments) {
      return res.status(400).json({ 
        message: 'At least one document must be uploaded before submission' 
      });
    }

    // Find forwarder admin to assign the order
    const forwarderAdmin = await User.findOne({ 
      role: 'forwarder',
      designation: { $regex: /admin/i },
      status: { $ne: 'inactive' }
    });

    let assignedForwarder;
    
    if (!forwarderAdmin) {
      // If no forwarder admin found, find any active forwarder
      const anyForwarder = await User.findOne({ 
        role: 'forwarder',
        status: { $ne: 'inactive' }
      });
      
      if (!anyForwarder) {
        return res.status(400).json({ 
          message: 'No forwarder available to process this order' 
        });
      }
      
      assignedForwarder = anyForwarder;
      order.assignedForwarder = anyForwarder._id;
      console.log('📦 Assigned to forwarder:', anyForwarder.name);
    } else {
      assignedForwarder = forwarderAdmin;
      order.assignedForwarder = forwarderAdmin._id;
      console.log('📦 Assigned to forwarder admin:', forwarderAdmin.name);
    }

    // Update order status to APPROVED (so exporter sees it as approved)
    order.status = 'approved';
    order.compliance.status = 'approved';

    // Add to audit trail
    order.auditTrail.push({
      action: 'Order submitted',
      performedBy: req.user.id,
      details: `Order submitted and approved, assigned to forwarder: ${assignedForwarder.name}`,
      previousStatus: 'draft',
      newStatus: 'approved'
    });

    await order.save();

    // Send notification to forwarder admin
    try {
      const NotificationService = require('../services/notificationService');
      const notificationService = new NotificationService();
      
      await notificationService.sendNotification(
        assignedForwarder._id,
        'new_order_assignment',
        `New order ${order.orderNumber} has been assigned to you for processing`,
        { orderId: order._id }
      );
      console.log('✅ Notification sent to forwarder admin');
    } catch (notificationError) {
      console.error('❌ Failed to send notification:', notificationError);
    }

    res.json({ 
      message: 'Order submitted and approved successfully',
      order 
    });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shipment-orders/:id/documents
// @desc    Upload document to order
// @access  Private
router.post('/:id/documents', auth, async (req, res) => {
  try {
    const order = await ShipmentOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'exporter' && order.exporter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { documentId, documentType } = req.body;

    if (!documentId || !documentType) {
      return res.status(400).json({ 
        message: 'Document ID and type are required' 
      });
    }

    // Verify document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Add document to appropriate category
    switch (documentType) {
      case 'commercial_invoice':
        order.documents.commercialInvoice = documentId;
        break;
      case 'packing_list':
        order.documents.packingList = documentId;
        break;
      case 'certificate':
        order.documents.certificates.push(documentId);
        break;
      case 'other':
        order.documents.otherDocuments.push(documentId);
        break;
      default:
        return res.status(400).json({ 
          message: 'Invalid document type' 
        });
    }

    // Add to audit trail
    order.auditTrail.push({
      action: 'Document uploaded',
      performedBy: req.user.id,
      details: `${documentType} uploaded: ${document.fileName}`
    });

    await order.save();

    res.json({ 
      message: 'Document uploaded successfully',
      order 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/shipment-orders/:id/documents/:docId
// @desc    Remove document from order
// @access  Private
router.delete('/:id/documents/:docId', auth, async (req, res) => {
  try {
    const order = await ShipmentOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'exporter' && order.exporter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const docId = req.params.docId;

    // Remove from all document arrays
    if (order.documents.commercialInvoice?.toString() === docId) {
      order.documents.commercialInvoice = null;
    }
    if (order.documents.packingList?.toString() === docId) {
      order.documents.packingList = null;
    }
    order.documents.certificates = order.documents.certificates.filter(
      id => id.toString() !== docId
    );
    order.documents.otherDocuments = order.documents.otherDocuments.filter(
      id => id.toString() !== docId
    );

    // Add to audit trail
    order.auditTrail.push({
      action: 'Document removed',
      performedBy: req.user.id,
      details: `Document removed from order`
    });

    await order.save();

    res.json({ 
      message: 'Document removed successfully',
      order 
    });
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shipment-orders/:id/assign-stages
// @desc    Assign sub-forwarders to different stages of a shipment order
// @access  Private (Forwarder Admin only)
router.post('/:id/assign-stages', auth, async (req, res) => {
  console.log('🚀 POST /api/shipment-orders/:id/assign-stages endpoint called');
  console.log('🚀 Order ID:', req.params.id);
  console.log('🚀 Request body:', req.body);
  console.log('🚀 User from JWT:', req.user);
  
  try {
    const { stageAssignments } = req.body;
    const orderId = req.params.id;

    // Validate input
    console.log('🔍 Validating input...');
    console.log('   stageAssignments:', stageAssignments);
    console.log('   isArray:', Array.isArray(stageAssignments));
    console.log('   length:', stageAssignments?.length);
    
    if (!stageAssignments || !Array.isArray(stageAssignments) || stageAssignments.length === 0) {
      console.log('❌ Invalid stage assignments input');
      return res.status(400).json({ 
        success: false,
        message: 'stageAssignments array is required and cannot be empty' 
      });
    }
    console.log('✅ Input validation passed');

    // Check if user is a forwarder admin
    console.log('🔍 User validation for stage assignment:', {
      userId: req.user._id,
      role: req.user.role,
      designation: req.user.designation,
      email: req.user.email
    });

    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ 
        success: false,
        message: 'Only forwarders can assign stages' 
      });
    }

    // Get full user data from database to check designation and email
    let fullUser;
    try {
      const userId = req.user._id || req.user.id;
      console.log('🔍 Fetching user data for ID:', userId);
      fullUser = await User.findById(userId).select('name email role designation');
      if (!fullUser) {
        console.log('❌ User not found in database:', userId);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      console.log('🔍 Full user data from database:', {
        id: fullUser._id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        designation: fullUser.designation
      });
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error fetching user data' 
      });
    }
    
    // Check if user is admin forwarder (either by designation or email)
    const isAdminForwarder = fullUser.designation?.toLowerCase().includes('admin') || 
                           fullUser.email === 'forwarder@export.com';
    
    console.log('🔍 Backend admin validation:');
    console.log('   designation:', fullUser.designation);
    console.log('   email:', fullUser.email);
    console.log('   designation includes admin:', fullUser.designation?.toLowerCase().includes('admin'));
    console.log('   email matches forwarder@export.com:', fullUser.email === 'forwarder@export.com');
    console.log('   isAdminForwarder:', isAdminForwarder);
    
    if (!isAdminForwarder) {
      return res.status(403).json({ 
        success: false,
        message: 'Only forwarder admins can assign stages' 
      });
    }

    // Find the shipment order
    console.log('🔍 Looking for order:', orderId);
    const order = await ShipmentOrder.findById(orderId);
    if (!order) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ 
        success: false,
        message: 'Shipment order not found' 
      });
    }
    console.log('✅ Order found:', order.orderNumber);

    // Check if order is assigned to this forwarder
    const currentUserId = req.user._id || req.user.id;
    console.log('🔍 Checking order assignment:');
    console.log('   Order assignedForwarder:', order.assignedForwarder);
    console.log('   Current user ID:', currentUserId);
    console.log('   Current user object:', req.user);
    console.log('   IDs match:', order.assignedForwarder?.toString() === currentUserId?.toString());
    
    if (!currentUserId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ 
        success: false,
        message: 'User ID not found in token' 
      });
    }
    
    if (order.assignedForwarder?.toString() !== currentUserId.toString()) {
      console.log('❌ Order not assigned to current user');
      return res.status(403).json({ 
        success: false,
        message: 'You can only assign stages for orders assigned to you' 
      });
    }
    console.log('✅ Order assignment check passed');

    // Validate stage assignments
    const validStages = ['pickup', 'transit', 'port_loading', 'on_ship', 'destination'];
    for (const assignment of stageAssignments) {
      if (!assignment.stage || !assignment.forwarderId) {
        return res.status(400).json({ 
          success: false,
          message: 'Each assignment must have stage and forwarderId' 
        });
      }
      if (!validStages.includes(assignment.stage)) {
        return res.status(400).json({ 
          success: false,
          message: `Invalid stage: ${assignment.stage}. Valid stages are: ${validStages.join(', ')}` 
        });
      }
    }

    // Verify all forwarders exist and are sub-forwarders
    const forwarderIds = stageAssignments.map(a => a.forwarderId);
    console.log('🔍 Forwarder IDs received:', forwarderIds);
    console.log('🔍 Stage assignments received:', stageAssignments);
    
    let forwarders;
    try {
      forwarders = await User.find({ 
        _id: { $in: forwarderIds },
        role: 'forwarder',
        $and: [
          { designation: { $not: { $regex: /admin/i } } },
          { email: { $ne: 'forwarder@export.com' } }
        ]
      });
      
      console.log('🔍 Found forwarders:', forwarders.map(f => ({ name: f.name, email: f.email, id: f._id })));

      if (forwarders.length !== forwarderIds.length) {
        console.log('❌ Forwarder count mismatch:', forwarders.length, 'vs', forwarderIds.length);
        return res.status(400).json({ 
          success: false,
          message: 'One or more forwarders not found or not valid sub-forwarders' 
        });
      }
      console.log('✅ Forwarder validation passed');
    } catch (error) {
      console.error('❌ Error validating forwarders:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error validating forwarders' 
      });
    }

    // Create or update ForwarderAssignment
    let assignment = await ForwarderAssignment.findOne({ orderId });
    
    if (!assignment) {
      assignment = new ForwarderAssignment({
        orderId,
        currentStage: 'pickup',
        status: 'assigned',
        assignedForwarders: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    }

    // Clear existing assignments for this order
    assignment.assignedForwarders = [];

    // Add new assignments
    for (const stageAssignment of stageAssignments) {
      const forwarder = forwarders.find(f => f._id.toString() === stageAssignment.forwarderId);
      
      assignment.assignedForwarders.push({
        stage: stageAssignment.stage,
        forwarderId: stageAssignment.forwarderId,
        forwarderName: forwarder.name,
        assignedAt: new Date(),
        status: 'assigned'
      });
    }

    // Add to audit trail
    assignment.auditTrail.push({
      action: 'Stages Assigned',
      performedBy: req.user._id,
      details: `Assigned ${stageAssignments.length} stages to sub-forwarders`,
      previousStatus: assignment.status,
      newStatus: 'assigned'
    });

    await assignment.save();

    // Populate the response
    const populatedAssignment = await ForwarderAssignment.findById(assignment._id)
      .populate('orderId', 'orderNumber status')
      .populate('assignedForwarders.forwarderId', 'name email company designation');

    res.json({
      success: true,
      message: 'Stages assigned successfully',
      assignment: populatedAssignment
    });

  } catch (error) {
    console.error('❌ Error assigning stages:', error);
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

module.exports = router;
