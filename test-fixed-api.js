require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const jwt = require('jsonwebtoken');

async function testFixedAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find a specific sub-forwarder user (Abhishek)
    const user = await User.findOne({ name: 'Abhishek' });
    
    if (!user) {
      console.log('No sub-forwarder found');
      return;
    }
    
    console.log('Testing with user:', user.name, '(' + user.email + ')');
    console.log('User ID:', user._id);
    
    // Test the query that the API uses
    console.log('\n=== Testing ForwarderAssignment query ===');
    const assignments = await ForwarderAssignment.find({
      'assignedForwarders.forwarderId': user._id
    }).populate('orderId', 'orderNumber status products origin destination expectedDelivery')
    .populate('assignedForwarders.forwarderId', 'name email company specialization');
    
    console.log('Found assignments:', assignments.length);
    
    if (assignments.length > 0) {
      console.log('\nFirst assignment details:');
      console.log('Assignment ID:', assignments[0]._id);
      console.log('Order:', assignments[0].orderId?.orderNumber);
      console.log('Assigned Forwarders:', assignments[0].assignedForwarders.length);
      
      // Test the new comparison logic
      const myAssignment = assignments[0].assignedForwarders.find(
        f => {
          // Handle both populated and non-populated forwarderId
          const forwarderId = f.forwarderId._id || f.forwarderId;
          return forwarderId.toString() === user._id.toString();
        }
      );
      
      console.log('\nMy assignment found:', myAssignment ? 'Yes' : 'No');
      if (myAssignment) {
        console.log('My assignment stage:', myAssignment.stage);
        console.log('My assignment status:', myAssignment.status);
        
        // Test the task transformation
        const task = {
          _id: assignments[0]._id,
          orderId: assignments[0].orderId,
          stage: myAssignment.stage,
          status: myAssignment.status,
          assignedDate: myAssignment.assignedAt,
          dueDate: myAssignment.estimatedCompletion,
          location: myAssignment.location,
          notes: myAssignment.notes,
          priority: 'medium',
          estimatedDuration: 24,
          actualDuration: null
        };
        
        console.log('\nTransformed task:');
        console.log('Task ID:', task._id);
        console.log('Order Number:', task.orderId?.orderNumber);
        console.log('Stage:', task.stage);
        console.log('Status:', task.status);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFixedAPI();
