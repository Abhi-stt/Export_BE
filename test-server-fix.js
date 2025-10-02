require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middleware/auth');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');

const app = express();
const PORT = 5001; // Use different port

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test endpoint with the FIXED code
app.get('/api/forwarder/my-tasks', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    console.log('🚀 FIXED SERVER - /api/forwarder/my-tasks called for user:', currentUser);
    console.log('🚀 User ID:', currentUser._id);
    
    // Find all assignments where this forwarder is assigned
    const assignments = await ForwarderAssignment.find({
      'assignedForwarders.forwarderId': currentUser._id
    }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
    .populate('assignedForwarders.forwarderId', 'name email company specialization');
    
    console.log('🚀 Found assignments:', assignments.length);

    // Transform assignments into tasks with FIXED logic
    const tasks = [];
    
    for (const assignment of assignments) {
      console.log('🚀 Processing assignment:', assignment._id);
      
      const myAssignment = assignment.assignedForwarders.find(
        f => {
          // FIXED: Handle both populated and non-populated forwarderId
          const forwarderId = f.forwarderId._id || f.forwarderId;
          const matches = forwarderId.toString() === currentUser._id.toString();
          console.log('🚀 Checking forwarder:', forwarderId.toString(), 'vs', currentUser._id.toString(), 'matches:', matches);
          return matches;
        }
      );
      
      if (myAssignment) {
        console.log('✅ Found my assignment:', myAssignment.stage, myAssignment.status);
        tasks.push({
          _id: assignment._id,
          orderId: assignment.orderId,
          stage: myAssignment.stage,
          status: myAssignment.status,
          assignedDate: myAssignment.assignedAt,
          dueDate: myAssignment.estimatedCompletion,
          location: myAssignment.location,
          notes: myAssignment.notes,
          priority: 'medium',
          estimatedDuration: 24,
          actualDuration: null
        });
      } else {
        console.log('❌ No assignment found for current user in this assignment');
      }
    }
    
    console.log('🚀 Final tasks count:', tasks.length);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching sub-forwarder tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FIXED SERVER running on port ${PORT}`);
  console.log('🚀 Test the API at: http://localhost:5001/api/forwarder/my-tasks');
});
