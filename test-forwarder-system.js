const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderProfile = require('./schemas/ForwarderProfile');
const ForwarderAssignment = require('./schemas/ForwarderAssignment');
const ShipmentOrder = require('./schemas/ShipmentOrder');
const DocumentReview = require('./schemas/DocumentReview');
const ForwarderAssignmentService = require('./services/forwarderAssignmentService');

async function testForwarderSystem() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-export-project');
    console.log('🔍 TESTING FORWARDER SYSTEM');
    console.log('============================\n');

    // 1. Check forwarder users
    console.log('👥 Step 1: Checking Forwarder Users...');
    const forwarders = await User.find({ role: 'forwarder' });
    console.log(`✅ Found ${forwarders.length} forwarder users:`);
    forwarders.forEach((forwarder, index) => {
      console.log(`  ${index + 1}. ${forwarder.name} (${forwarder.email})`);
    });

    // 2. Check forwarder profiles
    console.log('\n📋 Step 2: Checking Forwarder Profiles...');
    const profiles = await ForwarderProfile.find({}).populate('userId', 'name email');
    console.log(`✅ Found ${profiles.length} forwarder profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.userId.name} - Specializations: ${profile.specialization.join(', ')}`);
      console.log(`     Service Areas: ${profile.serviceAreas.map(area => area.city).join(', ')}`);
      console.log(`     Status: ${profile.status}, Active: ${profile.availability.isActive}`);
    });

    // 3. Check approved orders
    console.log('\n📦 Step 3: Checking Approved Orders...');
    const approvedOrders = await ShipmentOrder.find({ status: 'approved' })
      .populate('exporter', 'name email')
      .populate('assignedCA', 'name email');
    
    console.log(`✅ Found ${approvedOrders.length} approved orders:`);
    approvedOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.orderNumber} from ${order.exporter.name}`);
      console.log(`     CA: ${order.assignedCA.name}, Status: ${order.status}`);
    });

    // 4. Check document reviews
    console.log('\n📄 Step 4: Checking Document Reviews...');
    const reviews = await DocumentReview.find({ status: 'approved' });
    console.log(`✅ Found ${reviews.length} approved document reviews`);

    // 5. Check existing forwarder assignments
    console.log('\n🚚 Step 5: Checking Forwarder Assignments...');
    const assignments = await ForwarderAssignment.find({})
      .populate('orderId', 'orderNumber status')
      .populate('assignedForwarders.forwarderId', 'name email');
    
    console.log(`✅ Found ${assignments.length} forwarder assignments:`);
    assignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. Order: ${assignment.orderId.orderNumber}`);
      console.log(`     Current Stage: ${assignment.currentStage}`);
      console.log(`     Status: ${assignment.status}`);
      console.log(`     Assigned Forwarders: ${assignment.assignedForwarders.length}`);
      assignment.assignedForwarders.forEach(f => {
        console.log(`       - ${f.stage}: ${f.forwarderName} (${f.status})`);
      });
    });

    // 6. Test forwarder assignment creation
    if (approvedOrders.length > 0 && assignments.length === 0) {
      console.log('\n🔧 Step 6: Creating Forwarder Assignment...');
      const forwarderService = new ForwarderAssignmentService();
      
      try {
        const assignment = await forwarderService.createAssignment(approvedOrders[0]._id);
        console.log(`✅ Forwarder assignment created: ${assignment._id}`);
        console.log(`   Order: ${assignment.orderId}`);
        console.log(`   Current Stage: ${assignment.currentStage}`);
        console.log(`   Assigned Forwarders: ${assignment.assignedForwarders.length}`);
      } catch (error) {
        console.log(`❌ Failed to create assignment: ${error.message}`);
      }
    }

    // 7. Test forwarder assignment API
    console.log('\n🌐 Step 7: Testing Forwarder Assignment API...');
    const http = require('http');
    const jwt = require('jsonwebtoken');

    // Generate token for a forwarder
    const forwarder = forwarders[0];
    if (forwarder) {
      const token = jwt.sign(
        { user: { id: forwarder._id, email: forwarder.email, role: forwarder.role } },
        'your_super_secret_jwt_key_here_make_it_long_and_random_12345',
        { expiresIn: '24h' }
      );

      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/forwarder-assignments',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        console.log(`📊 API Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log(`✅ API working! Found ${response.data.assignments.length} assignments`);
            } else {
              console.log('❌ API error:', response.message);
            }
          } catch (error) {
            console.log('❌ API response error:', error.message);
          }
        });
      });

      req.on('error', (error) => {
        console.log('❌ API request failed:', error.message);
        console.log('🔧 Make sure backend is running: node BE/start-server.js');
      });

      req.end();
    }

    console.log('\n🎯 FORWARDER SYSTEM STATUS:');
    console.log('==========================');
    console.log(`✅ Forwarder Users: ${forwarders.length}`);
    console.log(`✅ Forwarder Profiles: ${profiles.length}`);
    console.log(`✅ Approved Orders: ${approvedOrders.length}`);
    console.log(`✅ Document Reviews: ${reviews.length}`);
    console.log(`✅ Forwarder Assignments: ${assignments.length}`);

    console.log('\n🚀 NEXT STEPS:');
    console.log('==============');
    console.log('1. Start backend: node BE/start-server.js');
    console.log('2. Start frontend: cd FE && npm run dev');
    console.log('3. Login as forwarder: pickup@forwarder.com / test123');
    console.log('4. Go to Forwarder Dashboard to see assignments');
    console.log('5. Test the complete workflow: Exporter → CA → Forwarder');

    console.log('\n📋 TEST CREDENTIALS:');
    console.log('===================');
    forwarders.forEach((forwarder, index) => {
      console.log(`${index + 1}. ${forwarder.name}: ${forwarder.email} / test123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testForwarderSystem();
