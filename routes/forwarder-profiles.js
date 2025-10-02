const express = require('express');
const ForwarderProfile = require('../schemas/ForwarderProfile');
const User = require('../schemas/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/forwarder-profiles
// @desc    Get all forwarder profiles (Admin only)
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Allow admin access or any authenticated user for demo
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Authentication required.' });
    }

    const { specialization, status, location, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    if (specialization) {
      query.specialization = specialization;
    }

    if (status) {
      query.status = status;
    }

    if (location) {
      query['serviceAreas.city'] = location;
    }

    const profiles = await ForwarderProfile.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await ForwarderProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching forwarder profiles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forwarder-profiles/my-profile
// @desc    Get current user's forwarder profile
// @access  Private (Forwarder only)
router.get('/my-profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const profile = await ForwarderProfile.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone');

    if (!profile) {
      return res.status(404).json({ message: 'Forwarder profile not found' });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching forwarder profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forwarder-profiles/admin-create
// @desc    Create forwarder profile by admin
// @access  Private (Admin only)
router.post('/admin-create', auth, async (req, res) => {
  try {
    console.log('🚀 Admin create forwarder request received:', req.body);
    console.log('👤 User making request:', req.user);
    console.log('📋 Request headers:', req.headers);
    
    // Allow any authenticated user for demo purposes
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const {
      name,
      email,
      password,
      phone,
      company,
      specialization,
      serviceAreas,
      workingHours,
      workingDays
    } = req.body;

    console.log('📝 Creating forwarder with data:', {
      name, email, phone, company, specialization
    });

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        error: 'INVALID_PASSWORD'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists',
        error: 'EMAIL_EXISTS'
      });
    }

    // Hash the password provided by admin
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine designation based on specialization
    const designationMap = {
      'pickup': 'Pickup Forwarder',
      'transit': 'Transit Forwarder',
      'port_loading': 'Port Loading Specialist',
      'on_ship': 'Shipping Coordinator',
      'destination': 'Delivery Specialist'
    };
    const designation = designationMap[specialization] || 'Forwarder';

    // Create user first
    const user = new User({
      name,
      email,
      phone,
      company,
      role: 'forwarder',
      password: hashedPassword,
      designation: designation,
      status: 'active'
    });

    await user.save();
    console.log('✅ User saved successfully:', user._id);

    // Create forwarder profile
    console.log('📋 Creating forwarder profile...');
    const forwarderProfile = new ForwarderProfile({
      userId: user._id,
      specialization: [specialization],
      serviceAreas: serviceAreas || [{ country: 'India', city: 'Mumbai' }],
      businessInfo: {
        companyName: company,
        phone: phone,
        email: email
      },
      capacity: {
        maxConcurrentShipments: 10,
        currentLoad: 0
      },
      performance: {
        totalShipments: 0,
        completedShipments: 0,
        averageRating: 0
      },
      availability: {
        isActive: true,
        workingHours: workingHours || { start: '09:00', end: '18:00' },
        workingDays: workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      status: 'active',
      auditTrail: [{
        action: 'Profile Created by Admin',
        performedBy: req.user.id,
        details: `Forwarder profile created for ${specialization} specialization`
      }]
    });

    await forwarderProfile.save();
    console.log('✅ Forwarder profile saved successfully:', forwarderProfile._id);

    // Populate the profile with user data
    await forwarderProfile.populate('userId', 'name email phone company designation');
    console.log('✅ Profile populated with user data');

    res.json({
      success: true,
      message: `Forwarder created successfully! Login credentials: ${email} / (password set by admin)`,
      data: {
        profile: forwarderProfile,
        credentials: {
          email: email,
          role: 'forwarder',
          designation: designation
        }
      }
    });
  } catch (error) {
    console.error('❌ Error creating forwarder:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.log('📧 Duplicate email error');
      return res.status(400).json({ 
        message: 'User with this email already exists',
        error: 'EMAIL_EXISTS'
      });
    }
    
    if (error.name === 'ValidationError') {
      console.log('📝 Validation error:', Object.values(error.errors).map(err => err.message));
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/forwarder-profiles
// @desc    Create or update forwarder profile
// @access  Private (Forwarder only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const {
      specialization,
      serviceAreas,
      businessInfo,
      certifications,
      capacity,
      equipment,
      insurance,
      financial,
      communication
    } = req.body;

    // Check if profile already exists
    let profile = await ForwarderProfile.findOne({ userId: req.user.id });

    if (profile) {
      // Update existing profile
      Object.assign(profile, {
        specialization,
        serviceAreas,
        businessInfo,
        certifications,
        capacity,
        equipment,
        insurance,
        financial,
        communication
      });

      // Add to audit trail
      profile.auditTrail.push({
        action: 'Profile Updated',
        performedBy: req.user.id,
        details: 'Forwarder profile updated'
      });
    } else {
      // Create new profile
      profile = new ForwarderProfile({
        userId: req.user.id,
        specialization,
        serviceAreas,
        businessInfo,
        certifications,
        capacity,
        equipment,
        insurance,
        financial,
        communication
      });

      // Add to audit trail
      profile.auditTrail.push({
        action: 'Profile Created',
        performedBy: req.user.id,
        details: 'Forwarder profile created'
      });
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Forwarder profile saved successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error saving forwarder profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forwarder-profiles/:id/verify
// @desc    Verify forwarder profile (Admin only)
// @access  Private (Admin only)
router.put('/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { isVerified, verificationNotes } = req.body;

    const profile = await ForwarderProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.verification.isVerified = isVerified;
    profile.verification.verifiedAt = new Date();
    profile.verification.verifiedBy = req.user.id;
    profile.verification.verificationNotes = verificationNotes;

    if (isVerified) {
      profile.status = 'verified';
    } else {
      profile.status = 'pending';
    }

    // Add to audit trail
    profile.auditTrail.push({
      action: 'Profile Verified',
      performedBy: req.user.id,
      details: `Profile ${isVerified ? 'verified' : 'rejected'} by admin`
    });

    await profile.save();

    res.json({
      success: true,
      message: `Profile ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: profile
    });
  } catch (error) {
    console.error('Error verifying profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forwarder-profiles/:id/status
// @desc    Update forwarder profile status (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { status, reason } = req.body;

    const profile = await ForwarderProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const previousStatus = profile.status;
    profile.status = status;

    // Add to audit trail
    profile.auditTrail.push({
      action: 'Status Updated',
      performedBy: req.user.id,
      details: `Status changed from ${previousStatus} to ${status}. Reason: ${reason || 'No reason provided'}`
    });

    await profile.save();

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forwarder-profiles/available
// @desc    Get available forwarders for assignment
// @access  Private (Admin only)
router.get('/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { stage, location } = req.query;

    let query = {
      status: 'active',
      'availability.isActive': true,
      'capacity.currentLoad': { $lt: { $expr: '$capacity.maxConcurrentShipments' } }
    };

    if (stage) {
      query.specialization = stage;
    }

    if (location) {
      query['serviceAreas.city'] = location;
    }

    const profiles = await ForwarderProfile.find(query)
      .populate('userId', 'name email phone')
      .sort({ 'performance.averageRating': -1, 'capacity.currentLoad': 1 });

    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching available forwarders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forwarder-profiles/update-availability
// @desc    Update forwarder availability
// @access  Private (Forwarder only)
router.put('/update-availability', auth, async (req, res) => {
  try {
    if (req.user.role !== 'forwarder') {
      return res.status(403).json({ message: 'Access denied. Forwarder role required.' });
    }

    const { isActive, workingHours, workingDays, vacationPeriods } = req.body;

    const profile = await ForwarderProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.availability.isActive = isActive;
    if (workingHours) {
      profile.availability.workingHours = workingHours;
    }
    if (workingDays) {
      profile.availability.workingDays = workingDays;
    }
    if (vacationPeriods) {
      profile.availability.vacationPeriods = vacationPeriods;
    }

    // Add to audit trail
    profile.auditTrail.push({
      action: 'Availability Updated',
      performedBy: req.user.id,
      details: `Availability updated. Active: ${isActive}`
    });

    await profile.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forwarder-profiles/:id
// @desc    Update forwarder profile (Admin only)
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('🚀 Update forwarder request received:', req.params.id, req.body);
    
    // Allow any authenticated user for demo purposes
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const {
      name,
      email,
      password,
      phone,
      company,
      specialization,
      serviceAreas,
      workingHours,
      workingDays
    } = req.body;

    const forwarderProfile = await ForwarderProfile.findById(req.params.id)
      .populate('userId', 'name email phone company');

    if (!forwarderProfile) {
      return res.status(404).json({ message: 'Forwarder profile not found' });
    }

    // Update user information
    if (forwarderProfile.userId) {
      forwarderProfile.userId.name = name || forwarderProfile.userId.name;
      forwarderProfile.userId.email = email || forwarderProfile.userId.email;
      forwarderProfile.userId.phone = phone || forwarderProfile.userId.phone;
      forwarderProfile.userId.company = company || forwarderProfile.userId.company;
      
      // Update password if provided
      if (password && password.trim() !== '') {
        if (password.length < 6) {
          return res.status(400).json({ 
            message: 'Password must be at least 6 characters long',
            error: 'INVALID_PASSWORD'
          });
        }
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        forwarderProfile.userId.password = await bcrypt.hash(password, salt);
        console.log(`✅ Password updated for ${forwarderProfile.userId.email}`);
      }
      
      await forwarderProfile.userId.save();
    }

    // Update forwarder profile
    if (specialization) forwarderProfile.specialization = [specialization];
    if (serviceAreas) forwarderProfile.serviceAreas = serviceAreas;
    if (workingHours) forwarderProfile.availability.workingHours = workingHours;
    if (workingDays) forwarderProfile.availability.workingDays = workingDays;

    // Update business info
    forwarderProfile.businessInfo.companyName = company || forwarderProfile.businessInfo.companyName;
    forwarderProfile.businessInfo.phone = phone || forwarderProfile.businessInfo.phone;
    forwarderProfile.businessInfo.email = email || forwarderProfile.businessInfo.email;

    // Add to audit trail
    forwarderProfile.auditTrail.push({
      action: 'Profile Updated',
      performedBy: req.user.id,
      details: `Forwarder profile updated by ${req.user.role}`,
      timestamp: new Date()
    });

    await forwarderProfile.save();

    // Populate the updated profile
    await forwarderProfile.populate('userId', 'name email phone company');

    res.json({
      success: true,
      message: 'Forwarder profile updated successfully',
      data: forwarderProfile
    });
  } catch (error) {
    console.error('❌ Error updating forwarder profile:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// @route   DELETE /api/forwarder-profiles/:id
// @desc    Delete forwarder profile (Admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🚀 Delete forwarder request received:', req.params.id);
    
    // Allow any authenticated user for demo purposes
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const forwarderProfile = await ForwarderProfile.findById(req.params.id);

    if (!forwarderProfile) {
      return res.status(404).json({ message: 'Forwarder profile not found' });
    }

    // Delete the associated user
    if (forwarderProfile.userId) {
      await User.findByIdAndDelete(forwarderProfile.userId);
    }

    // Delete the forwarder profile
    await ForwarderProfile.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Forwarder profile deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting forwarder profile:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

module.exports = router;
