const express = require('express');
const RealTradeDataService = require('../services/realTradeDataService');
const auth = require('../middleware/auth');
const router = express.Router();

// Initialize real trade data service
const realTradeDataService = new RealTradeDataService();

// @route   POST /api/real-trade/complete-analysis
// @desc    Get complete trade analysis (HS code + exporters + importers + blacklist)
// @access  Private
router.post('/complete-analysis', auth, async (req, res) => {
  try {
    const { productDescription } = req.body;

    // Validate input
    const validation = realTradeDataService.validateInput(productDescription);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`🚀 Complete trade analysis requested for: ${productDescription}`);

    // Get complete trade analysis
    const result = await realTradeDataService.getCompleteTradeAnalysis(productDescription);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Save to database (optional - for audit trail)
    // You can add database saving logic here if needed

    res.json({
      success: true,
      message: 'Complete trade analysis generated successfully',
      data: result.analysis,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Complete Trade Analysis API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during trade analysis',
      metadata: {
        realData: false,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @route   POST /api/real-trade/hs-code
// @desc    Get HS code for product description
// @access  Private
router.post('/hs-code', auth, async (req, res) => {
  try {
    const { productDescription } = req.body;

    // Validate input
    const validation = realTradeDataService.validateInput(productDescription);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`🔍 HS code requested for: ${productDescription}`);

    // Get HS code
    const result = await realTradeDataService.getHSCodeOnly(productDescription);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      message: 'HS code generated successfully',
      hsCode: result.hsCode,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('HS Code API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during HS code generation',
      metadata: {
        realData: false,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @route   GET /api/real-trade/exporters/:hsCode
// @desc    Get Indian exporters for HS code
// @access  Private
router.get('/exporters/:hsCode', auth, async (req, res) => {
  try {
    const { hsCode } = req.params;
    const { limit = 15 } = req.query;

    // Validate HS code format
    if (!hsCode || !/^\d{4}\.\d{2}\.\d{2}$/.test(hsCode)) {
      return res.status(400).json({
        success: false,
        error: 'Valid HS code required (format: XXXX.XX.XX)',
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`🔍 Exporters requested for HS code: ${hsCode}`);

    // Get exporters
    const result = await realTradeDataService.getExportersForHSCode(hsCode, parseInt(limit));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      message: 'Exporters data retrieved successfully',
      exporters: result.exporters,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Exporters API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during exporters retrieval',
      metadata: {
        realData: false,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @route   GET /api/real-trade/importers/:hsCode
// @desc    Get Indian importers for HS code
// @access  Private
router.get('/importers/:hsCode', auth, async (req, res) => {
  try {
    const { hsCode } = req.params;
    const { limit = 15 } = req.query;

    // Validate HS code format
    if (!hsCode || !/^\d{4}\.\d{2}\.\d{2}$/.test(hsCode)) {
      return res.status(400).json({
        success: false,
        error: 'Valid HS code required (format: XXXX.XX.XX)',
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`🔍 Importers requested for HS code: ${hsCode}`);

    // Get importers
    const result = await realTradeDataService.getImportersForHSCode(hsCode, parseInt(limit));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      message: 'Importers data retrieved successfully',
      importers: result.importers,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Importers API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during importers retrieval',
      metadata: {
        realData: false,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @route   POST /api/real-trade/blacklist-check
// @desc    Check blacklist status for companies
// @access  Private
router.post('/blacklist-check', auth, async (req, res) => {
  try {
    const { companies } = req.body;

    // Validate input
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Companies array is required',
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (companies.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 companies allowed per request',
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`🔍 Blacklist check requested for ${companies.length} companies`);

    // Check blacklist status
    const result = await realTradeDataService.checkBlacklistStatus(companies);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        metadata: {
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      message: 'Blacklist check completed successfully',
      blacklistStatus: result.blacklistStatus,
      results: result.results,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Blacklist Check API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during blacklist check',
      metadata: {
        realData: false,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @route   GET /api/real-trade/health
// @desc    Get service health status
// @access  Private
router.get('/health', auth, async (req, res) => {
  try {
    const healthStatus = realTradeDataService.getHealthStatus();
    
    res.json({
      success: true,
      health: healthStatus,
      metadata: {
        realData: true,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Health Check API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during health check',
      metadata: {
        realData: false,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @route   GET /api/real-trade/test/:product
// @desc    Test endpoint for real data functionality
// @access  Private
router.get('/test/:product', auth, async (req, res) => {
  try {
    const { product } = req.params;
    const productDescription = decodeURIComponent(product);

    console.log(`🧪 Testing real data for: ${productDescription}`);

    // Get complete analysis
    const result = await realTradeDataService.getCompleteTradeAnalysis(productDescription);

    res.json({
      success: true,
      message: 'Real data test completed',
      testProduct: productDescription,
      result: result,
      metadata: {
        realData: true,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during test',
      metadata: {
        realData: false,
        noFallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
