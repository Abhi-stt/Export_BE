const express = require('express');
const { Shipment, Document, User, Client } = require('../schemas');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/shipments
// @desc    Get all shipments with pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const mode = req.query.mode || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { exporter: { $regex: search, $options: 'i' } },
        { consignee: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (mode) query.mode = mode;

    // If user is not admin, only show their shipments
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const shipments = await Shipment.find(query)
      .populate('createdBy', 'name email')
      .populate('client', 'name company')
      .populate('documents', 'originalName fileName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Shipment.countDocuments(query);

    res.json({
      shipments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shipments/:id
// @desc    Get shipment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('client', 'name company')
      .populate('documents', 'originalName fileName status');

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if user has access to this shipment
    if (req.user.role !== 'admin' && shipment.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shipments
// @desc    Create a new shipment
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      trackingNumber,
      exporter,
      consignee,
      origin,
      destination,
      mode,
      estimatedDelivery,
      value,
      weight,
      containers,
      client,
      documents,
      notes
    } = req.body;

    // Check if tracking number already exists
    let shipment = await Shipment.findOne({ trackingNumber });
    if (shipment) {
      return res.status(400).json({ message: 'Tracking number already exists' });
    }

    // Create new shipment
    shipment = new Shipment({
      trackingNumber,
      exporter,
      consignee,
      origin,
      destination,
      mode,
      estimatedDelivery,
      value,
      weight,
      containers,
      client,
      documents,
      notes,
      createdBy: req.user.id
    });

    await shipment.save();

    const populatedShipment = await Shipment.findById(shipment.id)
      .populate('createdBy', 'name email')
      .populate('client', 'name company')
      .populate('documents', 'originalName fileName');

    res.json({
      message: 'Shipment created successfully',
      shipment: populatedShipment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/shipments/:id
// @desc    Update shipment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      trackingNumber,
      exporter,
      consignee,
      origin,
      destination,
      mode,
      status,
      progress,
      estimatedDelivery,
      actualDelivery,
      documentsStatus,
      value,
      weight,
      containers,
      client,
      documents,
      notes
    } = req.body;

    // Check if shipment exists
    let shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if user has access to update this shipment
    if (req.user.role !== 'admin' && shipment.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if tracking number is already taken by another shipment
    if (trackingNumber && trackingNumber !== shipment.trackingNumber) {
      const existingShipment = await Shipment.findOne({ trackingNumber });
      if (existingShipment) {
        return res.status(400).json({ message: 'Tracking number already in use' });
      }
    }

    // Update fields
    if (trackingNumber) shipment.trackingNumber = trackingNumber;
    if (exporter) shipment.exporter = exporter;
    if (consignee) shipment.consignee = consignee;
    if (origin) shipment.origin = origin;
    if (destination) shipment.destination = destination;
    if (mode) shipment.mode = mode;
    if (status) shipment.status = status;
    if (progress !== undefined) shipment.progress = progress;
    if (estimatedDelivery) shipment.estimatedDelivery = estimatedDelivery;
    if (actualDelivery) shipment.actualDelivery = actualDelivery;
    if (documentsStatus) shipment.documentsStatus = documentsStatus;
    if (value) shipment.value = value;
    if (weight) shipment.weight = weight;
    if (containers) shipment.containers = containers;
    if (client) shipment.client = client;
    if (documents) shipment.documents = documents;
    if (notes !== undefined) shipment.notes = notes;

    await shipment.save();

    const updatedShipment = await Shipment.findById(shipment.id)
      .populate('createdBy', 'name email')
      .populate('client', 'name company')
      .populate('documents', 'originalName fileName');

    res.json({
      message: 'Shipment updated successfully',
      shipment: updatedShipment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/shipments/:id
// @desc    Delete shipment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if user has access to delete this shipment
    if (req.user.role !== 'admin' && shipment.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Shipment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Shipment deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shipments/:id/update-status
// @desc    Update shipment status and progress
// @access  Private
router.post('/:id/update-status', auth, async (req, res) => {
  try {
    const { status, progress, actualDelivery } = req.body;

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if user has access to update this shipment
    if (req.user.role !== 'admin' && shipment.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update status and progress
    if (status) shipment.status = status;
    if (progress !== undefined) shipment.progress = progress;
    if (actualDelivery) shipment.actualDelivery = actualDelivery;

    await shipment.save();

    const updatedShipment = await Shipment.findById(shipment.id)
      .populate('createdBy', 'name email')
      .populate('client', 'name company');

    res.json({
      message: 'Shipment status updated successfully',
      shipment: updatedShipment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shipments/:id/add-document
// @desc    Add document to shipment
// @access  Private
router.post('/:id/add-document', auth, async (req, res) => {
  try {
    const { documentId } = req.body;

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if user has access to update this shipment
    if (req.user.role !== 'admin' && shipment.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Add document to shipment
    if (!shipment.documents.includes(documentId)) {
      shipment.documents.push(documentId);
      await shipment.save();
    }

    const updatedShipment = await Shipment.findById(shipment.id)
      .populate('createdBy', 'name email')
      .populate('client', 'name company')
      .populate('documents', 'originalName fileName');

    res.json({
      message: 'Document added to shipment successfully',
      shipment: updatedShipment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shipments/tracking/:trackingNumber
// @desc    Get shipment by tracking number (public)
// @access  Public
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber })
      .populate('client', 'name company')
      .select('-createdBy -notes'); // Don't expose sensitive info

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shipments/stats/overview
// @desc    Get shipment statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const totalShipments = await Shipment.countDocuments(query);
    const inTransitShipments = await Shipment.countDocuments({ ...query, status: 'in-transit' });
    const deliveredShipments = await Shipment.countDocuments({ ...query, status: 'delivered' });
    const delayedShipments = await Shipment.countDocuments({ ...query, status: 'delayed' });

    const modeStats = await Shipment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$mode',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentShipments = await Shipment.find(query)
      .populate('createdBy', 'name email')
      .populate('client', 'name company')
      .select('trackingNumber exporter consignee status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalShipments,
      inTransitShipments,
      deliveredShipments,
      delayedShipments,
      modeStats,
      recentShipments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 