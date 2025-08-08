const express = require('express');
const { HSCodeSuggestion, User } = require('../schemas');
const auth = require('../middleware/auth');
const AIProcessor = require('../services/aiProcessor');
const router = express.Router();

// Initialize AI processor
const aiProcessor = new AIProcessor();

// @route   POST /api/hs-codes/suggest
// @desc    Get HS code suggestions for product description
// @access  Private
router.post('/suggest', auth, async (req, res) => {
  try {
    const { productDescription, additionalInfo } = req.body;

    if (!productDescription) {
      return res.status(400).json({ message: 'Product description is required' });
    }

      // Get AI-powered HS code suggestions
  const startTime = Date.now();
  const aiResult = await aiProcessor.getHSCodeSuggestions(productDescription, additionalInfo);

  if (!aiResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate HS code suggestions',
      error: aiResult.error
    });
  }

  const processingTime = Math.floor((Date.now() - startTime) / 1000) || 2;

  // Create new HS code suggestion request with AI results
  const hsCodeSuggestion = new HSCodeSuggestion({
    productDescription,
    additionalInfo,
    suggestions: aiResult.suggestions || [],
    processingTime: processingTime,
    requestedBy: req.user.id,
    aiMetadata: aiResult.metadata,
    reasoning: aiResult.reasoning
  });

    await hsCodeSuggestion.save();

    const populatedSuggestion = await HSCodeSuggestion.findById(hsCodeSuggestion.id)
      .populate('requestedBy', 'name email');

    res.json({
      message: 'HS code suggestions generated successfully',
      suggestion: populatedSuggestion
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hs-codes/suggestions
// @desc    Get all HS code suggestions with pagination
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { productDescription: { $regex: search, $options: 'i' } },
        { additionalInfo: { $regex: search, $options: 'i' } }
      ];
    }

    // If user is not admin, only show their suggestions
    if (req.user.role !== 'admin') {
      query.requestedBy = req.user.id;
    }

    const suggestions = await HSCodeSuggestion.find(query)
      .populate('requestedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await HSCodeSuggestion.countDocuments(query);

    res.json({
      suggestions,
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

// @route   GET /api/hs-codes/suggestions/:id
// @desc    Get HS code suggestion by ID
// @access  Private
router.get('/suggestions/:id', auth, async (req, res) => {
  try {
    const suggestion = await HSCodeSuggestion.findById(req.params.id)
      .populate('requestedBy', 'name email');

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user has access to this suggestion
    if (req.user.role !== 'admin' && suggestion.requestedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(suggestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/hs-codes/suggestions/:id
// @desc    Delete HS code suggestion
// @access  Private
router.delete('/suggestions/:id', auth, async (req, res) => {
  try {
    const suggestion = await HSCodeSuggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user has access to delete this suggestion
    if (req.user.role !== 'admin' && suggestion.requestedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await HSCodeSuggestion.findByIdAndDelete(req.params.id);

    res.json({ message: 'Suggestion deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hs-codes/search
// @desc    Search HS codes by description
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    // Mock HS code database search
    const mockHSCodes = [
      {
        code: '8517.12.00',
        description: 'Smartphones and mobile phones',
        category: 'Electronics',
        dutyRate: '10%'
      },
      {
        code: '8517.13.00',
        description: 'Telephones for cellular networks',
        category: 'Electronics',
        dutyRate: '12%'
      },
      {
        code: '8517.14.00',
        description: 'Other telephones',
        category: 'Electronics',
        dutyRate: '15%'
      },
      {
        code: '8528.72.00',
        description: 'Monitors and projectors',
        category: 'Electronics',
        dutyRate: '8%'
      },
      {
        code: '8471.30.00',
        description: 'Portable automatic data processing machines',
        category: 'Electronics',
        dutyRate: '7%'
      }
    ];

    // Filter based on search query
    const filteredCodes = mockHSCodes.filter(code =>
      code.description.toLowerCase().includes(q.toLowerCase()) ||
      code.code.includes(q)
    );

    res.json(filteredCodes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hs-codes/stats/overview
// @desc    Get HS code suggestion statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.requestedBy = req.user.id;
    }

    const totalSuggestions = await HSCodeSuggestion.countDocuments(query);
    const avgProcessingTime = await HSCodeSuggestion.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' }
        }
      }
    ]);

    const recentSuggestions = await HSCodeSuggestion.find(query)
      .populate('requestedBy', 'name email')
      .select('productDescription createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalSuggestions,
      avgProcessingTime: avgProcessingTime[0]?.avgTime || 0,
      recentSuggestions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 