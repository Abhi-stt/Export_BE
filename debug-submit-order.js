const mongoose = require('mongoose');
const { User, ShipmentOrder } = require('./schemas');

async function debugSubmitOrder() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-export-project');
    console.log('Connected to MongoDB');

    // Check if we have exporters
    const exporters = await User.find({ role: 'exporter' });
    console.log('\n=== EXPORTERS ===');
    if (exporters.length === 0) {
      console.log('❌ No exporters found!');
      return;
    }
    exporters.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Status: ${user.status || 'active'}`);
    });

    // Check if we have CAs
    const cas = await User.find({ role: 'ca' });
    console.log('\n=== CA USERS ===');
    if (cas.length === 0) {
      console.log('❌ No CA users found!');
      return;
    }
    cas.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Status: ${user.status || 'active'}`);
    });

    // Check draft orders
    const draftOrders = await ShipmentOrder.find({ status: 'draft' })
      .populate('exporter', 'name email')
      .populate('assignedCA', 'name email');
    
    console.log('\n=== DRAFT ORDERS ===');
    if (draftOrders.length === 0) {
      console.log('❌ No draft orders found!');
    } else {
      draftOrders.forEach(order => {
        console.log(`- Order ${order.orderNumber}:`);
        console.log(`  Exporter: ${order.exporter?.name || 'Unknown'}`);
        console.log(`  Assigned CA: ${order.assignedCA?.name || 'None'}`);
        console.log(`  Documents: ${JSON.stringify({
          commercialInvoice: !!order.documents.commercialInvoice,
          packingList: !!order.documents.packingList,
          certificates: order.documents.certificates?.length || 0,
          otherDocuments: order.documents.otherDocuments?.length || 0
        })}`);
      });
    }

    // Check submitted orders
    const submittedOrders = await ShipmentOrder.find({ status: 'submitted' })
      .populate('exporter', 'name email')
      .populate('assignedCA', 'name email');
    
    console.log('\n=== SUBMITTED ORDERS ===');
    if (submittedOrders.length === 0) {
      console.log('No submitted orders found.');
    } else {
      submittedOrders.forEach(order => {
        console.log(`- Order ${order.orderNumber}:`);
        console.log(`  Exporter: ${order.exporter?.name || 'Unknown'}`);
        console.log(`  Assigned CA: ${order.assignedCA?.name || 'None'}`);
        console.log(`  Submitted at: ${order.updatedAt}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugSubmitOrder();
