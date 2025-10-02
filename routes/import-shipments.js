const express = require('express');
const router = express.Router();
const ImportShipment = require('../schemas/ImportShipment');
const ImportDocument = require('../schemas/ImportDocument');
const ImportCost = require('../schemas/ImportCost');
const auth = require('../middleware/auth');

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

// Get a specific import shipment
router.get('/:id', auth, async (req, res) => {
  try {
    const shipment = await ImportShipment.findOne({
      _id: req.params.id,
      importer: req.user.id
    })
      .populate('importer', 'name email company')
      .populate('createdBy', 'name email');

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
    const shipmentData = {
      ...req.body,
      importer: req.user.id,
      createdBy: req.user.id
    };

    // Generate shipment number
    const count = await ImportShipment.countDocuments();
    shipmentData.shipmentNumber = `IMP-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

    const shipment = new ImportShipment(shipmentData);
    await shipment.save();

    // Create initial cost record
    const costData = {
      importShipment: shipment._id,
      importer: req.user.id,
      goodsValue: shipment.totalValue,
      currency: shipment.currency,
      exchangeRate: 1, // This should be fetched from a currency API
      localCurrencyValue: shipment.totalValue,
      createdBy: req.user.id
    };

    const cost = new ImportCost(costData);
    await cost.save();

    res.status(201).json(shipment);
  } catch (error) {
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

// Get shipment statistics
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

module.exports = router;
