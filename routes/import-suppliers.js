const express = require('express');
const router = express.Router();
const ImportSupplier = require('../schemas/ImportSupplier');
const auth = require('../middleware/auth');

// Get all suppliers for the authenticated importer
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, riskLevel } = req.query;
    const query = { importer: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (riskLevel) {
      query['compliance.riskLevel'] = riskLevel;
    }
    
    if (search) {
      query.$or = [
        { 'supplierInfo.name': { $regex: search, $options: 'i' } },
        { 'supplierInfo.company': { $regex: search, $options: 'i' } },
        { 'supplierInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await ImportSupplier.find(query)
      .populate('importer', 'name email company')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ImportSupplier.countDocuments(query);

    res.json({
      suppliers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific supplier
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await ImportSupplier.findOne({
      _id: req.params.id,
      importer: req.user.id
    })
      .populate('importer', 'name email company')
      .populate('createdBy', 'name email');

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new supplier
router.post('/', auth, async (req, res) => {
  try {
    const supplierData = {
      ...req.body,
      importer: req.user.id,
      createdBy: req.user.id
    };

    const supplier = new ImportSupplier(supplierData);
    await supplier.save();

    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a supplier
router.put('/:id', auth, async (req, res) => {
  try {
    const supplier = await ImportSupplier.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a supplier
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplier = await ImportSupplier.findOneAndDelete({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update supplier performance
router.patch('/:id/performance', auth, async (req, res) => {
  try {
    const { onTimeDelivery, qualityRating, communicationRating, overallRating } = req.body;

    const supplier = await ImportSupplier.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      {
        'performance.onTimeDelivery': onTimeDelivery,
        'performance.qualityRating': qualityRating,
        'performance.communicationRating': communicationRating,
        'performance.overallRating': overallRating
      },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update supplier compliance
router.patch('/:id/compliance', auth, async (req, res) => {
  try {
    const { isBlacklisted, blacklistReason, sanctionsCheck, dueDiligence, riskLevel } = req.body;

    const updateData = {};
    if (isBlacklisted !== undefined) {
      updateData['compliance.isBlacklisted'] = isBlacklisted;
    }
    if (blacklistReason !== undefined) {
      updateData['compliance.blacklistReason'] = blacklistReason;
    }
    if (sanctionsCheck !== undefined) {
      updateData['compliance.sanctionsCheck'] = {
        ...sanctionsCheck,
        checkedAt: new Date()
      };
    }
    if (dueDiligence !== undefined) {
      updateData['compliance.dueDiligence'] = {
        ...dueDiligence,
        completedAt: new Date()
      };
    }
    if (riskLevel !== undefined) {
      updateData['compliance.riskLevel'] = riskLevel;
    }

    const supplier = await ImportSupplier.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      updateData,
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a product to supplier
router.post('/:id/products', auth, async (req, res) => {
  try {
    const supplier = await ImportSupplier.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      { $push: { products: req.body } },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a product
router.put('/:id/products/:productId', auth, async (req, res) => {
  try {
    const supplier = await ImportSupplier.findOne({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const product = supplier.products.id(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    Object.assign(product, req.body);
    await supplier.save();

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product
router.delete('/:id/products/:productId', auth, async (req, res) => {
  try {
    const supplier = await ImportSupplier.findOne({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    supplier.products.pull(req.params.productId);
    await supplier.save();

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get supplier statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await ImportSupplier.aggregate([
      { $match: { importer: req.user._id } },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          totalValue: { $sum: '$performance.totalValue' },
          averageRating: { $avg: '$performance.overallRating' },
          statusCounts: {
            $push: '$status'
          },
          riskLevels: {
            $push: '$compliance.riskLevel'
          }
        }
      }
    ]);

    const statusCounts = {};
    const riskLevelCounts = {};

    if (stats.length > 0) {
      stats[0].statusCounts.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      stats[0].riskLevels.forEach(risk => {
        riskLevelCounts[risk] = (riskLevelCounts[risk] || 0) + 1;
      });
    }

    res.json({
      totalSuppliers: stats[0]?.totalSuppliers || 0,
      totalValue: stats[0]?.totalValue || 0,
      averageRating: stats[0]?.averageRating || 0,
      statusCounts,
      riskLevelCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
