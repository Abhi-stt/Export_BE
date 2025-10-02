require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const jwt = require('jsonwebtoken');

async function testSubForwarderTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find a sub-forwarder user
    const user = await User.findOne({ 
      role: 'forwarder',
      designation: { $not: { $regex: /admin/i } },
      email: { $ne: 'forwarder@export.com' }
    });
    
    if (!user) {
      console.log('No sub-forwarder found');
      return;
    }
    
    console.log('Found sub-forwarder:', user.name, '(' + user.email + ')');
    console.log('User ID:', user._id);
    console.log('User ID type:', typeof user._id);
    console.log('User ID string:', user._id.toString());
    
    // Create a JWT token
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\nGenerated token for testing');
    
    // Decode the token to see its structure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token structure:', JSON.stringify(decoded, null, 2));
    
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
      
      assignments[0].assignedForwarders.forEach((f, i) => {
        console.log(`  ${i + 1}. Stage: ${f.stage}, Status: ${f.status}`);
        console.log(`     Forwarder ID: ${f.forwarderId}`);
        console.log(`     Forwarder ID type: ${typeof f.forwarderId}`);
        console.log(`     Forwarder ID string: ${f.forwarderId.toString()}`);
        console.log(`     Is populated: ${f.forwarderId?.name ? 'Yes' : 'No'}`);
        console.log(`     Matches user ID: ${f.forwarderId.toString() === user._id.toString()}`);
      });
      
      // Test the find logic
      const myAssignment = assignments[0].assignedForwarders.find(
        f => f.forwarderId._id.toString() === user._id.toString()
      );
      
      console.log('\nMy assignment found:', myAssignment ? 'Yes' : 'No');
      if (myAssignment) {
        console.log('My assignment stage:', myAssignment.stage);
        console.log('My assignment status:', myAssignment.status);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSubForwarderTasks();
