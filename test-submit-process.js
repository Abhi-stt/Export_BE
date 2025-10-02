const mongoose = require('mongoose');
const { User, ShipmentOrder } = require('./schemas');
const NotificationService = require('./services/notificationService');

async function testSubmitProcess() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-export-project');
    console.log('Connected to MongoDB');

    // Find an exporter
    const exporter = await User.findOne({ role: 'exporter' });
    if (!exporter) {
      console.log('❌ No exporter found!');
      return;
    }
    console.log('✅ Exporter found:', exporter.name, exporter.email);

    // Find a CA
    const ca = await User.findOne({ role: 'ca' });
    if (!ca) {
      console.log('❌ No CA found!');
      return;
    }
    console.log('✅ CA found:', ca.name, ca.email);

    // Find a draft order
    const draftOrder = await ShipmentOrder.findOne({ status: 'draft' })
      .populate('exporter', 'name email');
    
    if (!draftOrder) {
      console.log('❌ No draft orders found!');
      return;
    }
    console.log('✅ Draft order found:', draftOrder.orderNumber);

    // Check if order has documents
    const hasDocuments = draftOrder.documents.commercialInvoice || 
                        draftOrder.documents.packingList || 
                        (draftOrder.documents.certificates && draftOrder.documents.certificates.length > 0) ||
                        (draftOrder.documents.otherDocuments && draftOrder.documents.otherDocuments.length > 0);
    
    console.log('📄 Order has documents:', hasDocuments);
    console.log('📄 Document details:', {
      commercialInvoice: !!draftOrder.documents.commercialInvoice,
      packingList: !!draftOrder.documents.packingList,
      certificates: draftOrder.documents.certificates?.length || 0,
      otherDocuments: draftOrder.documents.otherDocuments?.length || 0
    });

    if (!hasDocuments) {
      console.log('❌ Order has no documents - cannot submit');
      return;
    }

    // Test notification service
    console.log('\n🔔 Testing notification service...');
    const notificationService = new NotificationService();
    
    try {
      const notification = await notificationService.sendShipmentOrderNotification(
        ca._id,
        draftOrder._id,
        exporter.name
      );
      console.log('✅ Notification sent successfully:', notification._id);
    } catch (notificationError) {
      console.error('❌ Notification failed:', notificationError.message);
    }

    // Simulate the submit process
    console.log('\n🚀 Simulating submit process...');
    
    // Update order status
    draftOrder.status = 'submitted';
    draftOrder.assignedCA = ca._id;
    draftOrder.compliance.status = 'pending';
    
    // Add to audit trail
    draftOrder.auditTrail.push({
      action: 'Order submitted',
      performedBy: exporter._id,
      details: `Order submitted to CA: ${ca.name}`,
      previousStatus: 'draft',
      newStatus: 'submitted'
    });

    await draftOrder.save();
    console.log('✅ Order status updated to submitted');

    // Check if CA can see the order
    const caOrders = await ShipmentOrder.find({ 
      assignedCA: ca._id,
      status: { $in: ['submitted', 'under_review'] }
    });
    
    console.log('📦 CA can see orders:', caOrders.length);
    caOrders.forEach(order => {
      console.log(`  - Order ${order.orderNumber} (${order.status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSubmitProcess();
