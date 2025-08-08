const express = require('express');
const bcrypt = require('bcryptjs');
const { User, APIKey } = require('../schemas');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

// @route   POST /api/admin/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin)
router.post('/users', auth, admin, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      company,
      role,
      status,
      department,
      designation
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      company,
      role: role || 'exporter',
      status: status || 'active',
      department,
      designation
    });

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          company: user.company,
          department: user.department,
          designation: user.designation,
          createdAt: user.createdAt
        }
      },
      message: 'User created successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/admin/settings
// @desc    Get admin settings
// @access  Private (Admin)
router.get('/settings', auth, admin, async (req, res) => {
  try {
    // Get system statistics for reference (optional)
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Get API keys count
    const totalAPIKeys = await APIKey.countDocuments();
    const activeAPIKeys = await APIKey.countDocuments({ status: 'active' });

    // Return the settings structure that matches frontend expectations
    const settings = {
      emailNotifications: true,
      smsNotifications: false,
      maintenanceMode: false,
      autoBackup: true,
      dataRetention: '1-year',
      timezone: 'IST',
      currency: 'INR',
      language: 'en',
      apiRateLimit: 1000,
      sessionDuration: 24,
      maxFileUploadSize: '50MB',
      databaseConnectionPool: 10,
      twoFactorAuth: true,
      sessionTimeout: true,
      passwordPolicy: 'strong'
    };

    // Include system stats for admin dashboard reference
    const systemStats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      totalAPIKeys,
      activeAPIKeys
    };

    res.json({
      success: true,
      data: {
        settings,
        stats: systemStats
      },
      message: 'Admin settings retrieved successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update admin settings
// @access  Private (Admin)
router.put('/settings', auth, admin, async (req, res) => {
  try {
    const { settings } = req.body;

    // Validate required settings fields
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data provided'
      });
    }

    // In a real application, you would save these settings to database
    // For now, we'll validate and return the updated settings
    const updatedSettings = {
      emailNotifications: settings.emailNotifications ?? true,
      smsNotifications: settings.smsNotifications ?? false,
      maintenanceMode: settings.maintenanceMode ?? false,
      autoBackup: settings.autoBackup ?? true,
      dataRetention: settings.dataRetention || '1-year',
      timezone: settings.timezone || 'IST',
      currency: settings.currency || 'INR',
      language: settings.language || 'en',
      apiRateLimit: settings.apiRateLimit || 1000,
      sessionDuration: settings.sessionDuration || 24,
      maxFileUploadSize: settings.maxFileUploadSize || '50MB',
      databaseConnectionPool: settings.databaseConnectionPool || 10,
      twoFactorAuth: settings.twoFactorAuth ?? true,
      sessionTimeout: settings.sessionTimeout ?? true,
      passwordPolicy: settings.passwordPolicy || 'strong'
    };

    res.json({
      success: true,
      data: {
        settings: updatedSettings
      },
      message: 'Admin settings updated successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   POST /api/admin/api-keys
// @desc    Create a new API key
// @access  Private (Admin)
router.post('/api-keys', auth, admin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Generate API key
    const apiKey = `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newAPIKey = new APIKey({
      name,
      description,
      key: apiKey,
      permissions: permissions || ['read'],
      createdBy: req.user.id,
      status: 'active'
    });

    await newAPIKey.save();

    res.json({
      success: true,
      data: {
        apiKey: {
          id: newAPIKey._id,
          name: newAPIKey.name,
          description: newAPIKey.description,
          key: apiKey, // Only show on creation
          permissions: newAPIKey.permissions,
          status: newAPIKey.status,
          createdAt: newAPIKey.createdAt
        }
      },
      message: 'API key created successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/admin/api-keys
// @desc    Get all API keys
// @access  Private (Admin)
router.get('/api-keys', auth, admin, async (req, res) => {
  try {
    const apiKeys = await APIKey.find()
      .populate('createdBy', 'name email')
      .select('-key') // Don't return actual key values
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: apiKeys,
      message: 'API keys retrieved successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   DELETE /api/admin/api-keys/:id
// @desc    Delete an API key
// @access  Private (Admin)
router.delete('/api-keys/:id', auth, admin, async (req, res) => {
  try {
    const apiKey = await APIKey.findById(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    await APIKey.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

module.exports = router;