const express = require('express');
const { Analytics, Document, User, Client, Shipment } = require('../schemas');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    let userQuery = {};
    let documentQuery = {};
    let clientQuery = {};
    let shipmentQuery = {};

    // If user is not admin, filter by their data
    if (req.user.role !== 'admin') {
      userQuery = { _id: req.user.id };
      documentQuery = { uploadedBy: req.user.id };
      clientQuery = { assignedCA: req.user.id };
      shipmentQuery = { createdBy: req.user.id };
    }

    // Get user statistics
    const totalUsers = await User.countDocuments(userQuery);
    const activeUsers = await User.countDocuments({ ...userQuery, status: 'active' });

    // Get document statistics
    const totalDocuments = await Document.countDocuments(documentQuery);
    const completedDocuments = await Document.countDocuments({ ...documentQuery, status: 'completed' });
    const processingDocuments = await Document.countDocuments({ ...documentQuery, status: 'processing' });

    // Get client statistics
    const totalClients = await Client.countDocuments(clientQuery);
    const activeClients = await Client.countDocuments({ ...clientQuery, status: 'active' });

    // Get shipment statistics
    const totalShipments = await Shipment.countDocuments(shipmentQuery);
    const inTransitShipments = await Shipment.countDocuments({ ...shipmentQuery, status: 'in-transit' });
    const deliveredShipments = await Shipment.countDocuments({ ...shipmentQuery, status: 'delivered' });

    // Get recent activity
    const recentDocuments = await Document.find(documentQuery)
      .populate('uploadedBy', 'name email')
      .select('originalName documentType status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentShipments = await Shipment.find(shipmentQuery)
      .populate('createdBy', 'name email')
      .select('trackingNumber exporter consignee status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get monthly data for charts
    const currentDate = new Date();
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
    
    const monthlyDocuments = await Document.aggregate([
      { $match: { ...documentQuery, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthlyShipments = await Shipment.aggregate([
      { $match: { ...shipmentQuery, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalDocuments,
        completedDocuments,
        processingDocuments,
        totalClients,
        activeClients,
        totalShipments,
        inTransitShipments,
        deliveredShipments
      },
      recentActivity: {
        documents: recentDocuments,
        shipments: recentShipments
      },
      charts: {
        monthlyDocuments,
        monthlyShipments
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/documents
// @desc    Get document analytics
// @access  Private
router.get('/documents', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user.id;
    }

    const totalDocuments = await Document.countDocuments(query);
    const completedDocuments = await Document.countDocuments({ ...query, status: 'completed' });
    const processingDocuments = await Document.countDocuments({ ...query, status: 'processing' });
    const errorDocuments = await Document.countDocuments({ ...query, status: 'error' });

    // Document type distribution
    const documentTypeStats = await Document.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average processing time
    const avgProcessingTime = await Document.aggregate([
      { $match: { ...query, processingTime: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' }
        }
      }
    ]);

    // Monthly document uploads
    const currentDate = new Date();
    const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, 1);
    
    const monthlyUploads = await Document.aggregate([
      { $match: { ...query, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalDocuments,
      completedDocuments,
      processingDocuments,
      errorDocuments,
      documentTypeStats,
      avgProcessingTime: avgProcessingTime[0]?.avgTime || 0,
      monthlyUploads
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/shipments
// @desc    Get shipment analytics
// @access  Private
router.get('/shipments', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const totalShipments = await Shipment.countDocuments(query);
    const inTransitShipments = await Shipment.countDocuments({ ...query, status: 'in-transit' });
    const deliveredShipments = await Shipment.countDocuments({ ...query, status: 'delivered' });
    const delayedShipments = await Shipment.countDocuments({ ...query, status: 'delayed' });

    // Mode distribution
    const modeStats = await Shipment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$mode',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average delivery time
    const avgDeliveryTime = await Shipment.aggregate([
      { $match: { ...query, actualDelivery: { $exists: true } } },
      {
        $addFields: {
          deliveryTime: {
            $divide: [
              { $subtract: ['$actualDelivery', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$deliveryTime' }
        }
      }
    ]);

    // Monthly shipments
    const currentDate = new Date();
    const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, 1);
    
    const monthlyShipments = await Shipment.aggregate([
      { $match: { ...query, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalShipments,
      inTransitShipments,
      deliveredShipments,
      delayedShipments,
      modeStats,
      avgDeliveryTime: avgDeliveryTime[0]?.avgTime || 0,
      monthlyShipments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/users
// @desc    Get user analytics (Admin only)
// @access  Private (Admin only)
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });

    // Role distribution
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly user registrations
    const currentDate = new Date();
    const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, 1);
    
    const monthlyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent user activity
    const recentUsers = await User.find()
      .select('name email role status lastLogin createdAt')
      .sort({ lastLogin: -1 })
      .limit(10);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingUsers,
      roleStats,
      monthlyRegistrations,
      recentUsers
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/analytics/save
// @desc    Save analytics data
// @access  Private
router.post('/save', auth, async (req, res) => {
  try {
    const { type, period, data, metrics } = req.body;

    const analytics = new Analytics({
      type,
      period,
      data,
      metrics,
      generatedAt: new Date()
    });

    await analytics.save();

    res.json({
      message: 'Analytics data saved successfully',
      analytics
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/reports
// @desc    Get saved analytics reports
// @access  Private
router.get('/reports', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (type) query.type = type;

    const reports = await Analytics.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ generatedAt: -1 });

    const total = await Analytics.countDocuments(query);

    res.json({
      reports,
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

module.exports = router; 