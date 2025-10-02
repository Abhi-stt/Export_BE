const mongoose = require('mongoose');
const NotificationService = require('./services/notificationService');
const { User, Notification } = require('./schemas');
require('dotenv').config();

async function testNotifications() {
  try {
    console.log('🧪 Testing Notification System...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-export-system');
    console.log('✅ Connected to MongoDB\n');

    // Initialize notification service
    const notificationService = new NotificationService();

    // Find or create a test CA user
    let testCA = await User.findOne({ email: 'test-ca@example.com' });
    if (!testCA) {
      testCA = new User({
        name: 'Test CA',
        email: 'test-ca@example.com',
        password: 'hashedpassword',
        role: 'ca',
        company: 'Test CA Company'
      });
      await testCA.save();
      console.log('✅ Created test CA user');
    } else {
      console.log('✅ Found existing test CA user');
    }

    // Test 1: Send shipment order notification
    console.log('\n📦 Test 1: Sending shipment order notification...');
    const shipmentNotification = await notificationService.sendShipmentOrderNotification(
      testCA._id,
      'order123',
      'Test Exporter Company'
    );
    console.log('✅ Shipment order notification created:', shipmentNotification._id);

    // Test 2: Send document review notification
    console.log('\n📋 Test 2: Sending document review notification...');
    const docReviewNotification = await notificationService.sendDocumentReviewNotification(
      testCA._id,
      'doc123',
      'Test Client Company',
      'Invoice'
    );
    console.log('✅ Document review notification created:', docReviewNotification._id);

    // Test 3: Get notification stats
    console.log('\n📊 Test 3: Getting notification statistics...');
    const stats = await notificationService.getNotificationStats(testCA._id);
    console.log('✅ Notification stats:', stats);

    // Test 4: Get user notifications
    console.log('\n📋 Test 4: Fetching user notifications...');
    const userNotifications = await notificationService.getUserNotifications(testCA._id, {
      limit: 10
    });
    console.log(`✅ Found ${userNotifications.notifications.length} notifications for CA user`);

    console.log('\n✅ All notification tests completed successfully!');
    console.log('\n🎉 Notification system is working properly!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Shipment order notifications');
    console.log('- ✅ Document review notifications');
    console.log('- ✅ Notification statistics');
    console.log('- ✅ User notification retrieval');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testNotifications();
