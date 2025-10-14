const express = require('express');
const router = express.Router();
const ImportShipment = require('../schemas/ImportShipment');
const ImportDocument = require('../schemas/ImportDocument');
const ImportCost = require('../schemas/ImportCost');
const User = require('../schemas/User');
const Notification = require('../schemas/Notification');
const auth = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

// Get all import shipments for the authenticated importer
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = { importer: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { shipmentNumber: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } },
        { 'supplier.company': { $regex: search, $options: 'i' } }
      ];
    }

    const shipments = await ImportShipment.find(query)
      .populate('importer', 'name email company')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ImportShipment.countDocuments(query);

    res.json({
      shipments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== FORWARDER ADMIN ROUTES (Must come before /:id) ====================

// Get pending approval shipments for forwarder admin
router.get('/pending-approval', auth, async (req, res) => {
  try {
    console.log('📋 Getting pending approval shipments for forwarder admin');
    console.log('User:', req.user);

    if (req.user.role !== 'forwarder' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const shipments = await ImportShipment.find({
      approvalStatus: 'pending_approval'
    })
      .populate('importer', 'name email company phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await ImportShipment.countDocuments({
      approvalStatus: 'pending_approval'
    });

    console.log(`✅ Found ${shipments.length} pending approval shipments`);

    res.json({
      success: true,
      shipments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching pending approval shipments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get approved/in-progress shipments for forwarder admin
router.get('/forwarder-shipments', auth, async (req, res) => {
  try {
    console.log('📋 Getting forwarder shipments');
    console.log('User:', req.user);

    if (req.user.role !== 'forwarder' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      forwarderAdmin: req.user.id,
      approvalStatus: 'approved'
    };

    if (status) {
      query.status = status;
    }

    const shipments = await ImportShipment.find(query)
      .populate('importer', 'name email company phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await ImportShipment.countDocuments(query);

    console.log(`✅ Found ${shipments.length} forwarder shipments`);

    res.json({
      success: true,
      shipments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching forwarder shipments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get shipment statistics (Must come before /:id)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await ImportShipment.aggregate([
      { $match: { importer: req.user._id } },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          averageValue: { $avg: '$totalValue' },
          statusCounts: {
            $push: '$status'
          }
        }
      }
    ]);

    const statusCounts = {};
    if (stats.length > 0) {
      stats[0].statusCounts.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    res.json({
      totalShipments: stats[0]?.totalShipments || 0,
      totalValue: stats[0]?.totalValue || 0,
      averageValue: stats[0]?.averageValue || 0,
      statusCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== DYNAMIC ROUTES (Must come after specific routes) ====================

// Get a specific import shipment
router.get('/:id', auth, async (req, res) => {
  try {
    // Build query based on user role
    let query = { _id: req.params.id };
    
    // Importers can only see their own shipments
    // Forwarder admins can see shipments assigned to them
    if (req.user.role === 'importer') {
      query.importer = req.user.id;
    } else if (req.user.role === 'forwarder') {
      // Forwarders can see shipments pending approval or assigned to them
      query.$or = [
        { forwarderAdmin: req.user.id },
        { approvalStatus: 'pending_approval' }
      ];
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const shipment = await ImportShipment.findOne(query)
      .populate('importer', 'name email company')
      .populate('createdBy', 'name email')
      .populate('forwarderAdmin', 'name email company')
      .populate('approvedBy', 'name email');

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    // Get related documents
    const documents = await ImportDocument.find({ importShipment: shipment._id });
    
    // Get cost breakdown
    const costs = await ImportCost.findOne({ importShipment: shipment._id });

    res.json({
      shipment,
      documents,
      costs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new import shipment
router.post('/', auth, async (req, res) => {
  try {
    console.log('📦 Creating new import shipment...');
    console.log('User:', req.user);

    // Find the forwarder admin (forwarder@export.com)
    const forwarderAdmin = await User.findOne({ 
      email: 'forwarder@export.com',
      role: 'forwarder'
    });

    if (!forwarderAdmin) {
      console.log('⚠️ Warning: Forwarder admin not found');
    }

    const shipmentData = {
      ...req.body,
      importer: req.user.id,
      createdBy: req.user.id,
      status: 'pending_approval',
      approvalStatus: 'pending_approval',
      forwarderAdmin: forwarderAdmin?._id
    };

    // Generate shipment number
    const count = await ImportShipment.countDocuments();
    shipmentData.shipmentNumber = `IMP-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

    const shipment = new ImportShipment(shipmentData);
    await shipment.save();
    console.log('✅ Import shipment created:', shipment.shipmentNumber);

    // Create initial cost record with all required fields
    const costData = {
      importShipment: shipment._id,
      importer: req.user.id,
      goodsValue: shipment.totalValue,
      currency: shipment.currency,
      exchangeRate: 1, // This should be fetched from a currency API
      localCurrencyValue: shipment.totalValue,
      duties: {
        basicDuty: 0,
        additionalDuty: 0,
        antiDumpingDuty: 0,
        countervailingDuty: 0,
        safeguardDuty: 0,
        totalDuty: 0
      },
      taxes: {
        gst: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        cess: 0,
        totalTax: 0
      },
      fees: {
        customsFee: 0,
        handlingFee: 0,
        examinationFee: 0,
        storageFee: 0,
        demurrageFee: 0,
        detentionFee: 0,
        totalFees: 0
      },
      logistics: {
        freight: 0,
        insurance: 0,
        portCharges: 0,
        terminalCharges: 0,
        documentationFee: 0,
        totalLogistics: 0
      },
      other: {
        bankCharges: 0,
        inspectionFee: 0,
        testingFee: 0,
        certificationFee: 0,
        miscellaneous: 0,
        totalOther: 0
      },
      totals: {
        totalDutyTax: 0,
        totalFees: 0,
        totalLogistics: 0,
        totalOther: 0,
        grandTotal: shipment.totalValue
      },
      calculations: {
        dutyRate: 0,
        taxRate: 0,
        totalRate: 0,
        calculationMethod: 'automated',
        calculatedAt: new Date(),
        lastUpdated: new Date()
      },
      payment: {
        status: 'pending',
        paidAmount: 0,
        remainingAmount: shipment.totalValue
      },
      status: 'draft',
      createdBy: req.user.id
    };

    const cost = new ImportCost(costData);
    await cost.save();
    console.log('✅ Import cost record created');

    // Send notification to forwarder admin
    if (forwarderAdmin) {
      try {
        const notificationService = new NotificationService();
        await notificationService.createNotification({
          user: forwarderAdmin._id,
          type: 'alert',
          category: 'general',
          title: 'New Import Shipment Approval Request',
          message: `${req.user.name || 'An importer'} has submitted import shipment ${shipment.shipmentNumber} for approval. Please review and approve.`,
          priority: 'high',
          actionUrl: `/import-shipment-approvals/${shipment._id}`,
          actionText: 'Review Shipment',
          metadata: {
            customData: {
              shipmentId: shipment._id,
              shipmentNumber: shipment.shipmentNumber,
              importerName: req.user.name
            }
          },
          tags: ['import_shipment', 'approval_request']
        });
        console.log('✅ Notification sent to forwarder admin');
      } catch (notificationError) {
        console.error('❌ Failed to send notification:', notificationError);
      }
    }

    res.status(201).json(shipment);
  } catch (error) {
    console.error('❌ Error creating import shipment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update an import shipment
router.put('/:id', auth, async (req, res) => {
  try {
    const shipment = await ImportShipment.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an import shipment
router.delete('/:id', auth, async (req, res) => {
  try {
    const shipment = await ImportShipment.findOneAndDelete({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    // Delete related documents and costs
    await ImportDocument.deleteMany({ importShipment: shipment._id });
    await ImportCost.deleteMany({ importShipment: shipment._id });

    res.json({ message: 'Import shipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update shipment status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const shipment = await ImportShipment.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      { 
        status,
        ...(notes && { notes })
      },
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== APPROVAL ACTIONS ====================

// Approve an import shipment (Forwarder Admin only)
router.post('/:id/approve', auth, async (req, res) => {
  try {
    console.log('✅ Approving import shipment:', req.params.id);
    console.log('Forwarder:', req.user);

    if (req.user.role !== 'forwarder' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const shipment = await ImportShipment.findById(req.params.id)
      .populate('importer', 'name email');

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    if (shipment.approvalStatus !== 'pending_approval') {
      return res.status(400).json({ 
        message: `Shipment cannot be approved. Current status: ${shipment.approvalStatus}` 
      });
    }

    // Update shipment
    shipment.approvalStatus = 'approved';
    shipment.status = 'in_progress';
    shipment.approvedBy = req.user.id;
    shipment.approvedAt = new Date();
    shipment.forwarderAdmin = req.user.id;

    await shipment.save();
    console.log('✅ Import shipment approved successfully');

    // Send notification to importer
    try {
      const notificationService = new NotificationService();
      await notificationService.createNotification({
        user: shipment.importer._id,
        type: 'success',
        category: 'general',
        title: 'Import Shipment Approved',
        message: `Your import shipment ${shipment.shipmentNumber} has been approved by ${req.user.name} and is now in progress.`,
        priority: 'high',
        actionUrl: `/import-shipments/${shipment._id}`,
        actionText: 'View Shipment',
        metadata: {
          customData: {
            shipmentId: shipment._id,
            shipmentNumber: shipment.shipmentNumber,
            forwarderName: req.user.name
          }
        },
        tags: ['import_shipment', 'approved']
      });
      console.log('✅ Notification sent to importer');
    } catch (notificationError) {
      console.error('❌ Failed to send notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Import shipment approved successfully',
      shipment
    });
  } catch (error) {
    console.error('❌ Error approving shipment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reject an import shipment (Forwarder Admin only)
router.post('/:id/reject', auth, async (req, res) => {
  try {
    console.log('❌ Rejecting import shipment:', req.params.id);
    console.log('Forwarder:', req.user);

    if (req.user.role !== 'forwarder' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const shipment = await ImportShipment.findById(req.params.id)
      .populate('importer', 'name email');

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    if (shipment.approvalStatus !== 'pending_approval') {
      return res.status(400).json({ 
        message: `Shipment cannot be rejected. Current status: ${shipment.approvalStatus}` 
      });
    }

    // Update shipment
    shipment.approvalStatus = 'rejected';
    shipment.status = 'rejected';
    shipment.rejectionReason = reason;
    shipment.rejectedAt = new Date();
    shipment.approvedBy = req.user.id;

    await shipment.save();
    console.log('✅ Import shipment rejected successfully');

    // Send notification to importer
    try {
      const notificationService = new NotificationService();
      await notificationService.createNotification({
        user: shipment.importer._id,
        type: 'error',
        category: 'general',
        title: 'Import Shipment Rejected',
        message: `Your import shipment ${shipment.shipmentNumber} has been rejected by ${req.user.name}. Reason: ${reason}`,
        priority: 'high',
        actionUrl: `/import-shipments/${shipment._id}`,
        actionText: 'View Shipment',
        metadata: {
          customData: {
            shipmentId: shipment._id,
            shipmentNumber: shipment.shipmentNumber,
            forwarderName: req.user.name,
            rejectionReason: reason
          }
        },
        tags: ['import_shipment', 'rejected']
      });
      console.log('✅ Notification sent to importer');
    } catch (notificationError) {
      console.error('❌ Failed to send notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Import shipment rejected',
      shipment
    });
  } catch (error) {
    console.error('❌ Error rejecting shipment:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
