const mongoose = require('mongoose');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const User = require('./schemas/User');

async function checkExistingOrders() {
  try {
    console.log('🔍 Checking existing shipment orders...');
    
    // Connect to database
    const cloudUri = 'mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export';
    await mongoose.connect(cloudUri);
    console.log('✅ Connected to Cloud MongoDB');

    // Get all shipment orders
    const orders = await ShipmentOrder.find({})
      .populate('exporter', 'name email company')
      .populate('assignedForwarder', 'name email company designation')
      .sort({ createdAt: -1 });

    console.log(`\n📦 Found ${orders.length} shipment orders:`);
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order: ${order.orderNumber || 'N/A'}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Exporter: ${order.exporter?.name || 'N/A'} (${order.exporter?.email || 'N/A'})`);
      console.log(`   Assigned Forwarder: ${order.assignedForwarder?.name || 'N/A'}`);
      console.log(`   Destination: ${order.orderDetails?.destination?.country || 'N/A'}`);
      console.log(`   Products: ${order.products?.length || 0} items`);
      console.log(`   Created: ${order.createdAt}`);
    });

    // Get all users
    const users = await User.find({});
    console.log(`\n👥 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}, Designation: ${user.designation || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

checkExistingOrders();

