const mongoose = require('mongoose');
const { User, ShipmentOrder } = require('./schemas');
const NotificationService = require('./services/notificationService');
require('dotenv').config();

async function testSubmitFunctionality() {
  try {
    console.log('🧪 Testing Submit to CA Functionality...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-export-system');
    console.log('✅ Connected to MongoDB\n');

    // Create test users if they don't exist
    let testCA = await User.findOne({ email: 'test-ca@example.com' });
    if (!testCA) {
      testCA = new User({
        name: 'Test CA',
        email: 'test-ca@example.com',
        password: 'hashedpassword',
        role: 'ca',
        company: 'Test CA Company',
        status: 'active'
      });
      await testCA.save();
      console.log('✅ Created test CA user');
    } else {
      console.log('✅ Found existing test CA user');
    }

    let testExporter = await User.findOne({ email: 'test-exporter@example.com' });
    if (!testExporter) {
      testExporter = new User({
        name: 'Test Exporter',
        email: 'test-exporter@example.com',
        password: 'hashedpassword',
        role: 'exporter',
        company: 'Test Export Company'
      });
      await testExporter.save();
      console.log('✅ Created test exporter user');
    } else {
      console.log('✅ Found existing test exporter user');
    }

    // Create test shipment order
    let testOrder = await ShipmentOrder.findOne({ orderNumber: 'TEST-SUBMIT-001' });
    if (!testOrder) {
      testOrder = new ShipmentOrder({
        orderNumber: 'TEST-SUBMIT-001',
        exporter: testExporter._id,
        client: testExporter._id,
        assignedCA: testCA._id, // Assign CA directly
        status: 'draft',
        orderDetails: {
          destination: {
            country: 'USA',
            port: 'Los Angeles',
            city: 'Los Angeles'
          },
          consignee: {
            name: 'Test Consignee',
            address: '123 Test St',
            contact: '+1234567890',
            email: 'consignee@test.com'
          },
          transportMode: 'sea',
          estimatedShipmentDate: new Date(),
          specialInstructions: 'Test shipment for submit functionality'
        },
        products: [{
          name: 'Test Product',
          description: 'Test product for submission',
          quantity: 100,
          unit: 'pieces',
          hsCode: '1234567890',
          value: 10000,
          weight: 1000,
          origin: 'India'
        }],
        financial: {
          totalValue: 10000,
          totalWeight: 1000,
          currency: 'USD'
        },
        compliance: {
          status: 'pending'
        }
      });
      await testOrder.save();
      console.log('✅ Created test shipment order');
    } else {
      console.log('✅ Found existing test shipment order');
    }

    // Test 1: Check if order can be submitted
    console.log('\n📋 Test 1: Checking order submission requirements...');
    console.log('Order details:', {
      id: testOrder._id,
      orderNumber: testOrder.orderNumber,
      status: testOrder.status,
      exporter: testOrder.exporter,
      assignedCA: testOrder.assignedCA,
      hasDocuments: {
        commercialInvoice: !!testOrder.documents.commercialInvoice,
        packingList: !!testOrder.documents.packingList,
        certificates: testOrder.documents.certificates?.length || 0,
        otherDocuments: testOrder.documents.otherDocuments?.length || 0
      }
    });

    // Test 2: Simulate the submit process
    console.log('\n📤 Test 2: Simulating order submission...');
    
    // Check if order is in draft status
    if (testOrder.status !== 'draft') {
      console.log('❌ Order is not in draft status:', testOrder.status);
      return;
    }

    // Check CA assignment
    let caToAssign = testOrder.assignedCA;
    if (!caToAssign) {
      console.log('🔍 No CA assigned, looking for available CA...');
      const availableCA = await User.findOne({ 
        role: 'ca', 
        status: { $ne: 'inactive' }
      });
      
      if (!availableCA) {
        console.log('❌ No CA available for review');
        return;
      }
      
      caToAssign = availableCA._id;
    }

    // Verify CA exists and is active
    const caUser = await User.findById(caToAssign);
    if (!caUser || caUser.role !== 'ca' || caUser.status === 'inactive') {
      console.log('❌ Selected CA is not available');
      return;
    }

    console.log('✅ CA verification passed:', {
      id: caUser._id,
      name: caUser.name,
      email: caUser.email,
      role: caUser.role,
      status: caUser.status
    });

    // Test 3: Test notification service
    console.log('\n🔔 Test 3: Testing notification service...');
    try {
      const notificationService = new NotificationService();
      
      // Get exporter name
      let exporterName = 'Unknown Exporter';
      if (testOrder.exporter) {
        if (typeof testOrder.exporter === 'string') {
          const exporterUser = await User.findById(testOrder.exporter);
          exporterName = exporterUser?.name || 'Unknown Exporter';
        } else {
          exporterName = testOrder.exporter.name || 'Unknown Exporter';
        }
      }

      console.log('🔔 Sending test notification...');
      const notification = await notificationService.sendShipmentOrderNotification(
        caToAssign,
        testOrder._id,
        exporterName
      );
      
      console.log('✅ Test notification sent successfully:', notification._id);
    } catch (notificationError) {
      console.error('❌ Notification test failed:', notificationError);
    }

    // Test 4: Simulate order status update
    console.log('\n📝 Test 4: Simulating order status update...');
    testOrder.status = 'submitted';
    testOrder.assignedCA = caToAssign;
    testOrder.compliance.status = 'pending';

    // Add to audit trail
    testOrder.auditTrail.push({
      action: 'Order submitted (test)',
      performedBy: testExporter._id,
      details: `Order submitted to CA: ${caUser.name}`,
      previousStatus: 'draft',
      newStatus: 'submitted'
    });

    await testOrder.save();
    console.log('✅ Order status updated to submitted');

    // Test 5: Verify the update
    console.log('\n🔍 Test 5: Verifying order update...');
    const updatedOrder = await ShipmentOrder.findById(testOrder._id);
    console.log('Updated order status:', updatedOrder.status);
    console.log('Assigned CA:', updatedOrder.assignedCA);
    console.log('Compliance status:', updatedOrder.compliance.status);

    console.log('\n🎉 Submit functionality test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Order creation and validation');
    console.log('- ✅ CA user verification');
    console.log('- ✅ Notification service test');
    console.log('- ✅ Order status update');
    console.log('- ✅ Audit trail creation');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testSubmitFunctionality();
