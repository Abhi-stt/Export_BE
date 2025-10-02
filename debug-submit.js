const mongoose = require('mongoose');
const { User, ShipmentOrder } = require('./schemas');
require('dotenv').config();

async function debugSubmit() {
  try {
    console.log('🔍 Debugging Submit to CA functionality...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-export-system');
    console.log('✅ Connected to MongoDB\n');

    // Check CA users
    console.log('📋 Checking CA users...');
    const cas = await User.find({ role: 'ca' });
    console.log(`Found ${cas.length} CA users:`);
    cas.forEach(ca => {
      console.log(`  - ID: ${ca._id}, Name: ${ca.name}, Email: ${ca.email}, Status: ${ca.status || 'active'}`);
    });

    // Check exporter users
    console.log('\n📋 Checking Exporter users...');
    const exporters = await User.find({ role: 'exporter' });
    console.log(`Found ${exporters.length} Exporter users:`);
    exporters.forEach(exporter => {
      console.log(`  - ID: ${exporter._id}, Name: ${exporter.name}, Email: ${exporter.email}`);
    });

    // Check draft orders
    console.log('\n📦 Checking draft orders...');
    const draftOrders = await ShipmentOrder.find({ status: 'draft' });
    console.log(`Found ${draftOrders.length} draft orders:`);
    draftOrders.forEach(order => {
      console.log(`  - Order: ${order.orderNumber}, Status: ${order.status}`);
      console.log(`    Exporter: ${order.exporter} (${typeof order.exporter})`);
      console.log(`    Assigned CA: ${order.assignedCA || 'None'}`);
      console.log(`    Documents: CI=${!!order.documents.commercialInvoice}, PL=${!!order.documents.packingList}`);
      console.log(`    Certificates: ${order.documents.certificates?.length || 0}`);
      console.log(`    Other Docs: ${order.documents.otherDocuments?.length || 0}`);
    });

    // Check submitted orders
    console.log('\n📤 Checking submitted orders...');
    const submittedOrders = await ShipmentOrder.find({ status: 'submitted' });
    console.log(`Found ${submittedOrders.length} submitted orders:`);
    submittedOrders.forEach(order => {
      console.log(`  - Order: ${order.orderNumber}, Status: ${order.status}`);
      console.log(`    Assigned CA: ${order.assignedCA || 'None'}`);
    });

    // Test notification service
    console.log('\n🔔 Testing notification service...');
    try {
      const NotificationService = require('./services/notificationService');
      const notificationService = new NotificationService();
      console.log('✅ Notification service loaded successfully');
      
      if (cas.length > 0 && exporters.length > 0) {
        console.log('✅ Can test notification sending');
      } else {
        console.log('❌ Cannot test notification - missing CA or Exporter users');
      }
    } catch (error) {
      console.error('❌ Error loading notification service:', error.message);
    }

    console.log('\n🎯 Summary:');
    console.log(`- CA Users: ${cas.length}`);
    console.log(`- Exporter Users: ${exporters.length}`);
    console.log(`- Draft Orders: ${draftOrders.length}`);
    console.log(`- Submitted Orders: ${submittedOrders.length}`);

    if (cas.length === 0) {
      console.log('\n⚠️  ISSUE: No CA users found. Create a CA user to test submission.');
    }
    
    if (exporters.length === 0) {
      console.log('\n⚠️  ISSUE: No Exporter users found. Create an Exporter user to test submission.');
    }
    
    if (draftOrders.length === 0) {
      console.log('\n⚠️  ISSUE: No draft orders found. Create a draft order to test submission.');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugSubmit();
