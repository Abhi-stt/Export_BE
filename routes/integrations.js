const express = require('express');
const { ERPIntegration, User } = require('../schemas');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/integrations
// @desc    Create a new ERP integration
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      type,
      endpoint,
      apiKey,
      username,
      password,
      description,
      settings
    } = req.body;

    // Create new integration
    const integration = new ERPIntegration({
      name,
      type,
      apiEndpoint: endpoint,
      apiKey,
      credentials: {
        username,
        password
      },
      description,
      settings: settings || {},
      configuredBy: req.user.id,
      status: 'active'
    });

    await integration.save();

    // Test connection (simulate)
    setTimeout(async () => {
      try {
        integration.lastSync = new Date();
        integration.syncStatus = 'success';
        await integration.save();
      } catch (error) {
        console.error('Integration sync error:', error);
      }
    }, 2000);

    const populatedIntegration = await ERPIntegration.findById(integration._id)
      .populate('configuredBy', 'name email')
      .select('-credentials.password -apiKey'); // Don't return sensitive data

    res.json({
      success: true,
      data: populatedIntegration,
      message: 'ERP integration created successfully'
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

// @route   GET /api/integrations
// @desc    Get all integrations for the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show user's integrations
    if (req.user.role !== 'admin') {
      query.configuredBy = req.user.id;
    }

    const integrations = await ERPIntegration.find(query)
      .populate('configuredBy', 'name email')
      .select('-credentials.password -apiKey') // Don't return sensitive data
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: integrations,
      message: 'Integrations retrieved successfully'
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

// @route   GET /api/integrations/:id
// @desc    Get integration by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const integration = await ERPIntegration.findById(req.params.id)
      .populate('configuredBy', 'name email')
      .select('-credentials.password -apiKey');

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check if user has access to this integration
    if (req.user.role !== 'admin' && integration.configuredBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: integration,
      message: 'Integration retrieved successfully'
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

// @route   PUT /api/integrations/:id
// @desc    Update integration
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const integration = await ERPIntegration.findById(req.params.id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check if user has access to this integration
    if (req.user.role !== 'admin' && integration.configuredBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const {
      name,
      type,
      endpoint,
      apiKey,
      username,
      password,
      description,
      settings,
      status
    } = req.body;

    // Update fields
    if (name) integration.name = name;
    if (type) integration.type = type;
    if (endpoint) integration.apiEndpoint = endpoint;
    if (apiKey) integration.apiKey = apiKey;
    if (username || password) {
      integration.credentials = integration.credentials || {};
      if (username) integration.credentials.username = username;
      if (password) integration.credentials.password = password;
    }
    if (description) integration.description = description;
    if (settings) integration.settings = settings;
    if (status) integration.status = status;

    integration.updatedAt = new Date();

    await integration.save();

    const populatedIntegration = await ERPIntegration.findById(integration._id)
      .populate('configuredBy', 'name email')
      .select('-credentials.password -apiKey');

    res.json({
      success: true,
      data: populatedIntegration,
      message: 'Integration updated successfully'
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

// @route   DELETE /api/integrations/:id
// @desc    Delete integration
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const integration = await ERPIntegration.findById(req.params.id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check if user has access to this integration
    if (req.user.role !== 'admin' && integration.configuredBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await ERPIntegration.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Integration deleted successfully'
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

// @route   POST /api/integrations/:id/test
// @desc    Test integration connection
// @access  Private
router.post('/:id/test', auth, async (req, res) => {
  try {
    const integration = await ERPIntegration.findById(req.params.id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check if user has access to this integration
    if (req.user.role !== 'admin' && integration.configuredBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Simulate connection test
    const isConnected = Math.random() > 0.2; // 80% success rate

    integration.lastSync = new Date();
    integration.syncStatus = isConnected ? 'success' : 'failed';
    await integration.save();

    res.json({
      success: true,
      data: {
        connected: isConnected,
        message: isConnected ? 'Connection successful' : 'Connection failed',
        lastSync: integration.lastSync,
        syncStatus: integration.syncStatus
      },
      message: 'Connection test completed'
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

// @route   POST /api/integrations/:id/sync
// @desc    Sync integration data
// @access  Private
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const integration = await ERPIntegration.findById(req.params.id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check if user has access to this integration
    if (req.user.role !== 'admin' && integration.configuredBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Simulate sync process
    integration.lastSync = new Date();
    integration.syncStatus = 'syncing';
    await integration.save();

    // Simulate async sync completion
    setTimeout(async () => {
      try {
        integration.syncStatus = 'success';
        integration.lastSync = new Date();
        await integration.save();
      } catch (error) {
        console.error('Sync completion error:', error);
      }
    }, 3000);

    res.json({
      success: true,
      data: {
        syncStatus: 'syncing',
        lastSync: integration.lastSync
      },
      message: 'Sync started successfully'
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