require('dotenv').config();
const mongoose = require('mongoose');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const User = require('./schemas/User');
const Client = require('./schemas/Client');

async function fixShipmentOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the forwarder admin
    const forwarderAdmin = await User.findOne({ email: 'forwarder@export.com' });
    if (!forwarderAdmin) {
      console.log('❌ Forwarder admin not found!');
      return;
    }
    console.log(`✅ Found forwarder admin: ${forwarderAdmin.name}`);

    // Get or create an exporter
    let exporter = await User.findOne({ email: 'user@export.com' });
    if (!exporter) {
      console.log('❌ Exporter not found!');
      return;
    }
    console.log(`✅ Found exporter: ${exporter.name}`);

    // Get or create a client
    let client = await Client.findOne({});
    if (!client) {
      console.log('📝 Creating test client...');
      client = new Client({
        name: 'Test Client Company',
        company: 'Test Client Company',
        email: 'client@test.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City',
        status: 'active'
      });
      await client.save();
      console.log('✅ Created test client');
    }
    console.log(`✅ Found client: ${client.name}`);

    // Get all shipment orders
    const orders = await ShipmentOrder.find({});
    console.log(`\n📦 Found ${orders.length} shipment orders to fix:`);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log(`\n${i + 1}. Fixing order: ${order.orderNumber || 'No Order Number'}`);
      
      // Update the order with proper data
      order.exporter = exporter._id;
      order.assignedForwarder = forwarderAdmin._id;
      order.client = client._id;
      order.status = 'approved'; // Set to approved so it shows up in forwarder dashboard
      
      // Add some basic order details if missing
      if (!order.orderDetails) {
        order.orderDetails = {
          destination: {
            country: 'USA',
            port: 'Los Angeles',
            city: 'Los Angeles'
          },
          consignee: {
            name: 'Test Consignee',
            address: '456 Destination Street',
            contact: '+1987654321',
            email: 'consignee@test.com'
          },
          transportMode: 'sea',
          estimatedShipmentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          specialInstructions: 'Handle with care'
        };
      }
      
      // Add some products if missing
      if (!order.products || order.products.length === 0) {
        order.products = [{
          name: 'Test Product',
          description: 'A test product for export',
          quantity: 100,
          unit: 'pieces',
          hsCode: '1234567890',
          value: 5000,
          weight: 1000,
          origin: 'India',
          specifications: 'High quality test product'
        }];
      }
      
      await order.save();
      console.log(`   ✅ Updated order: ${order.orderNumber}`);
      console.log(`   📧 Exporter: ${exporter.name}`);
      console.log(`   🚛 Forwarder: ${forwarderAdmin.name}`);
      console.log(`   🏢 Client: ${client.name}`);
      console.log(`   📊 Status: ${order.status}`);
    }

    console.log('\n🎉 Shipment orders fixed successfully!');
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix:');
    const updatedOrders = await ShipmentOrder.find({ assignedForwarder: forwarderAdmin._id })
      .populate('exporter', 'name email')
      .populate('assignedForwarder', 'name email designation')
      .populate('client', 'name company');
    
    console.log(`   Found ${updatedOrders.length} orders assigned to forwarder admin`);
    updatedOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderNumber} - ${order.status} (${order.exporter?.name} → ${order.client?.name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixShipmentOrders();
