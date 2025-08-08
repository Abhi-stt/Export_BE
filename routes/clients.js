const express = require('express');
const { Client, User } = require('../schemas');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/clients
// @desc    Get all clients with pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const type = req.query.type || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (type) query.type = type;

    // If user is not admin, only show their assigned clients
    if (req.user.role !== 'admin') {
      query.assignedCA = req.user.id;
    }

    const clients = await Client.find(query)
      .populate('assignedCA', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Client.countDocuments(query);

    res.json({
      clients,
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

// @route   GET /api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedCA', 'name email phone');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has access to this client
    if (req.user.role !== 'admin' && client.assignedCA?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(client);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clients
// @desc    Create a new client
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      industry,
      type,
      monthlyFee,
      contractEnd,
      notes,
      assignedCA
    } = req.body;

    // Check if client already exists
    let client = await Client.findOne({ email });
    if (client) {
      return res.status(400).json({ 
        success: false,
        message: 'Client already exists' 
      });
    }

    // Create new client
    client = new Client({
      name,
      email,
      phone,
      company,
      industry,
      type,
      monthlyFee,
      contractEnd,
      notes,
      assignedCA: assignedCA || req.user.id
    });

    await client.save();

    const populatedClient = await Client.findById(client.id)
      .populate('assignedCA', 'name email');

    res.json({
      success: true,
      data: {
        client: populatedClient
      },
      message: 'Client created successfully'
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

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      industry,
      type,
      monthlyFee,
      contractEnd,
      notes,
      assignedCA,
      status
    } = req.body;

    // Check if client exists
    let client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has access to update this client
    if (req.user.role !== 'admin' && client.assignedCA?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if email is already taken by another client
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ email });
      if (existingClient) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update fields
    if (name) client.name = name;
    if (email) client.email = email;
    if (phone) client.phone = phone;
    if (company) client.company = company;
    if (industry) client.industry = industry;
    if (type) client.type = type;
    if (monthlyFee !== undefined) client.monthlyFee = monthlyFee;
    if (contractEnd) client.contractEnd = contractEnd;
    if (notes !== undefined) client.notes = notes;
    if (assignedCA) client.assignedCA = assignedCA;
    if (status) client.status = status;

    await client.save();

    const updatedClient = await Client.findById(client.id)
      .populate('assignedCA', 'name email');

    res.json({
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete client
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has access to delete this client
    if (req.user.role !== 'admin' && client.assignedCA?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Client.findByIdAndDelete(req.params.id);

    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clients/:id/assign
// @desc    Assign client to CA
// @access  Private (Admin only)
router.post('/:id/assign', auth, async (req, res) => {
  try {
    const { assignedCA } = req.body;

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if assigned CA exists
    const ca = await User.findById(assignedCA);
    if (!ca || ca.role !== 'ca') {
      return res.status(400).json({ message: 'Invalid CA assigned' });
    }

    client.assignedCA = assignedCA;
    await client.save();

    const updatedClient = await Client.findById(client.id)
      .populate('assignedCA', 'name email');

    res.json({
      message: 'Client assigned successfully',
      client: updatedClient
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clients/stats/overview
// @desc    Get client statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.assignedCA = req.user.id;
    }

    const totalClients = await Client.countDocuments(query);
    const activeClients = await Client.countDocuments({ ...query, status: 'active' });
    const inactiveClients = await Client.countDocuments({ ...query, status: 'inactive' });
    const pendingClients = await Client.countDocuments({ ...query, status: 'pending' });

    const typeStats = await Client.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentClients = await Client.find(query)
      .populate('assignedCA', 'name email')
      .select('name company status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalClients,
      activeClients,
      inactiveClients,
      pendingClients,
      typeStats,
      recentClients
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clients/search
// @desc    Search clients
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } }
      ]
    };

    // If user is not admin, only search their assigned clients
    if (req.user.role !== 'admin') {
      query.assignedCA = req.user.id;
    }

    const clients = await Client.find(query)
      .populate('assignedCA', 'name email')
      .select('name email company status')
      .limit(10);

    res.json(clients);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 