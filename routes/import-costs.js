const express = require('express');
const router = express.Router();
const ImportCost = require('../schemas/ImportCost');
const ImportShipment = require('../schemas/ImportShipment');
const auth = require('../middleware/auth');

// Get cost breakdown for an import shipment
router.get('/shipment/:shipmentId', auth, async (req, res) => {
  try {
    // Verify the import shipment belongs to the user
    const shipment = await ImportShipment.findOne({
      _id: req.params.shipmentId,
      importer: req.user.id
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    const cost = await ImportCost.findOne({
      importShipment: req.params.shipmentId
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost breakdown not found' });
    }

    res.json(cost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update cost breakdown
router.post('/shipment/:shipmentId', auth, async (req, res) => {
  try {
    // Verify the import shipment belongs to the user
    const shipment = await ImportShipment.findOne({
      _id: req.params.shipmentId,
      importer: req.user.id
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Import shipment not found' });
    }

    // Check if cost breakdown already exists
    let cost = await ImportCost.findOne({
      importShipment: req.params.shipmentId
    });

    if (cost) {
      // Update existing cost breakdown
      Object.assign(cost, req.body);
      cost.calculations.lastUpdated = new Date();
      await cost.save();
    } else {
      // Create new cost breakdown
      const costData = {
        ...req.body,
        importShipment: req.params.shipmentId,
        importer: req.user.id,
        createdBy: req.user.id
      };

      cost = new ImportCost(costData);
      await cost.save();
    }

    res.json(cost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Calculate duties and taxes
router.post('/calculate', auth, async (req, res) => {
  try {
    const { goodsValue, hsCode, originCountry, destinationCountry, currency } = req.body;

    // This is a simplified calculation - in a real system, you would:
    // 1. Look up duty rates from a customs database
    // 2. Apply trade agreements and preferences
    // 3. Calculate taxes based on local regulations
    // 4. Consider additional duties and fees

    const dutyRate = 0.1; // 10% - this should come from a database
    const taxRate = 0.18; // 18% GST - this should come from a database

    const basicDuty = goodsValue * dutyRate;
    const gst = (goodsValue + basicDuty) * taxRate;
    const totalDutyTax = basicDuty + gst;

    const calculation = {
      goodsValue,
      currency,
      duties: {
        basicDuty,
        totalDuty: basicDuty
      },
      taxes: {
        gst,
        totalTax: gst
      },
      totals: {
        totalDutyTax,
        grandTotal: goodsValue + totalDutyTax
      },
      rates: {
        dutyRate: dutyRate * 100,
        taxRate: taxRate * 100
      }
    };

    res.json(calculation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { status, paymentMethod, paidAmount, paymentReference, bankDetails } = req.body;

    const cost = await ImportCost.findOne({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost breakdown not found' });
    }

    cost.payment = {
      ...cost.payment,
      status,
      paymentMethod,
      paidAmount: paidAmount || cost.payment.paidAmount,
      paymentReference,
      bankDetails: bankDetails || cost.payment.bankDetails,
      paymentDate: status === 'paid' ? new Date() : cost.payment.paymentDate
    };

    // Calculate remaining amount
    cost.payment.remainingAmount = cost.totals.grandTotal - cost.payment.paidAmount;

    await cost.save();

    res.json(cost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get cost statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await ImportCost.aggregate([
      { $match: { importer: req.user._id } },
      {
        $group: {
          _id: null,
          totalCosts: { $sum: 1 },
          totalGoodsValue: { $sum: '$goodsValue' },
          totalDutyTax: { $sum: '$totals.totalDutyTax' },
          totalFees: { $sum: '$totals.totalFees' },
          totalLogistics: { $sum: '$totals.totalLogistics' },
          grandTotal: { $sum: '$totals.grandTotal' },
          averageDutyRate: { $avg: '$calculations.dutyRate' },
          averageTaxRate: { $avg: '$calculations.taxRate' },
          paymentStatus: {
            $push: '$payment.status'
          }
        }
      }
    ]);

    const paymentStatusCounts = {};
    if (stats.length > 0) {
      stats[0].paymentStatus.forEach(status => {
        paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1;
      });
    }

    res.json({
      totalCosts: stats[0]?.totalCosts || 0,
      totalGoodsValue: stats[0]?.totalGoodsValue || 0,
      totalDutyTax: stats[0]?.totalDutyTax || 0,
      totalFees: stats[0]?.totalFees || 0,
      totalLogistics: stats[0]?.totalLogistics || 0,
      grandTotal: stats[0]?.grandTotal || 0,
      averageDutyRate: stats[0]?.averageDutyRate || 0,
      averageTaxRate: stats[0]?.averageTaxRate || 0,
      paymentStatusCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cost breakdown by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cost = await ImportCost.findOne({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost breakdown not found' });
    }

    res.json(cost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cost breakdown
router.put('/:id', auth, async (req, res) => {
  try {
    const cost = await ImportCost.findOneAndUpdate(
      { _id: req.params.id, importer: req.user.id },
      {
        ...req.body,
        'calculations.lastUpdated': new Date()
      },
      { new: true, runValidators: true }
    );

    if (!cost) {
      return res.status(404).json({ message: 'Cost breakdown not found' });
    }

    res.json(cost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete cost breakdown
router.delete('/:id', auth, async (req, res) => {
  try {
    const cost = await ImportCost.findOneAndDelete({
      _id: req.params.id,
      importer: req.user.id
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost breakdown not found' });
    }

    res.json({ message: 'Cost breakdown deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
