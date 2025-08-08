/**
 * Force populate database with comprehensive test data
 * This will ensure your MongoDB collections have data
 * Run with: node force-populate-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all schemas
const { 
  User, 
  Document, 
  HSCodeSuggestion, 
  InvoiceValidation,
  BOEValidation,
  Client,
  ERPIntegration,
  Shipment,
  ComplianceRule,
  DocumentReview,
  Notification,
  SystemHealth,
  SystemSettings,
  UserSetting
} = require('./schemas');

async function forcePopulateDatabase() {
  try {
    console.log('🚀 Force Populating Database with Test Data\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', mongoose.connection.name);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Document.deleteMany({});
    await HSCodeSuggestion.deleteMany({});
    await InvoiceValidation.deleteMany({});
    await BOEValidation.deleteMany({});
    await Client.deleteMany({});
    await ERPIntegration.deleteMany({});
    await Shipment.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('\n👥 Creating users...');
    const users = [];
    
    const userData = [
      { name: 'Admin User', email: 'admin@export.com', password: 'admin123', role: 'admin', company: 'Export Admin Co.' },
      { name: 'Exporter User', email: 'user@export.com', password: 'user123', role: 'exporter', company: 'ABC Exports Ltd' },
      { name: 'CA User', email: 'ca@export.com', password: 'ca123', role: 'ca', company: 'CA Services Inc' },
      { name: 'Forwarder User', email: 'forwarder@export.com', password: 'forwarder123', role: 'forwarder', company: 'Freight Forwarders LLC' }
    ];

    for (const user of userData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = new User({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        phone: '+1234567890',
        company: user.company,
        role: user.role,
        status: 'active',
        department: 'Operations',
        designation: user.role === 'admin' ? 'Administrator' : 'User'
      });
      
      await newUser.save();
      users.push(newUser);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Create documents
    console.log('\n📄 Creating documents...');
    const documents = [];
    
    for (let i = 1; i <= 5; i++) {
      const doc = new Document({
        originalName: `sample-invoice-${i}.pdf`,
        fileName: `invoice-${Date.now()}-${i}.pdf`,
        filePath: `/uploads/invoice-${i}.pdf`,
        fileType: 'application/pdf',
        fileSize: 1024 * (i + 1),
        documentType: i % 2 === 0 ? 'boe' : 'invoice',
        status: 'completed',
        extractedText: `Sample extracted text for document ${i}\nInvoice Number: INV-2024-${i.toString().padStart(3, '0')}\nAmount: $${(i * 1000).toFixed(2)}`,
        confidence: 80 + (i * 2),
        entities: [
          { type: 'invoice_number', value: `INV-2024-${i.toString().padStart(3, '0')}`, confidence: 90 },
          { type: 'amount', value: (i * 1000).toFixed(2), confidence: 85 }
        ],
        complianceAnalysis: {
          isValid: i % 3 !== 0,
          score: 70 + (i * 5),
          checks: [
            { name: 'Format Check', passed: true, message: 'Valid format', severity: 'info' },
            { name: 'Required Fields', passed: i % 3 !== 0, message: 'All required fields present', severity: i % 3 !== 0 ? 'info' : 'error' }
          ]
        },
        uploadedBy: users[i % users.length]._id
      });
      
      await doc.save();
      documents.push(doc);
      console.log(`✅ Created document: ${doc.originalName}`);
    }

    // Create HS Code suggestions
    console.log('\n🏷️  Creating HS Code suggestions...');
    for (let i = 1; i <= 3; i++) {
      const hsCode = new HSCodeSuggestion({
        productDescription: `Electronic component type ${i}`,
        suggestions: [
          {
            code: `847${i}.30.0${i}`,
            description: `Electronic component category ${i}`,
            confidence: 80 + i,
            category: 'Electronics',
            dutyRate: `${i * 2}%`
          }
        ],
        processingTime: i + 1,
        requestedBy: users[i % users.length]._id
      });
      
      await hsCode.save();
      console.log(`✅ Created HS Code suggestion for: ${hsCode.productDescription}`);
    }

    // Create clients
    console.log('\n🏢 Creating clients...');
    for (let i = 1; i <= 4; i++) {
      const client = new Client({
        name: `Client Company ${i} Ltd`,
        email: `client${i}@example.com`,
        phone: `+123456789${i}`,
        company: `Client ${i} Corporation`,
        address: {
          street: `${i * 100} Client Street`,
          city: `Client City ${i}`,
          state: `State ${i}`,
          zipCode: `1234${i}`,
          country: 'India'
        },
        contactPerson: `Contact Person ${i}`,
        businessType: i % 2 === 0 ? 'Importer' : 'Exporter',
        registrationNumber: `REG${Date.now()}${i}`,
        taxId: `TAX${Date.now()}${i}`,
        createdBy: users[2]._id // CA user
      });
      
      await client.save();
      console.log(`✅ Created client: ${client.name}`);
    }

    // Create invoice validations
    console.log('\n✅ Creating invoice validations...');
    for (let i = 0; i < 3; i++) {
      const validation = new InvoiceValidation({
        document: documents[i]._id,
        success: true,
        extractedText: documents[i].extractedText,
        confidence: documents[i].confidence,
        entities: documents[i].entities,
        complianceAnalysis: documents[i].complianceAnalysis,
        validatedBy: users[i % users.length]._id
      });
      
      await validation.save();
      console.log(`✅ Created invoice validation for: ${documents[i].originalName}`);
    }

    // Create BOE validations
    console.log('\n📋 Creating BOE validations...');
    if (documents.length >= 2) {
      const boeValidation = new BOEValidation({
        invoiceDocument: documents[0]._id,
        boeDocument: documents[1]._id,
        invoiceNumber: 'INV-2024-001',
        boeNumber: 'BOE-2024-001',
        matchPercentage: 85,
        overallStatus: 'passed',
        results: [
          {
            field: 'Invoice Number',
            invoiceValue: 'INV-2024-001',
            boeValue: 'INV-2024-001',
            status: 'match',
            variance: '0%',
            suggestion: 'Perfect match'
          }
        ],
        validatedBy: users[0]._id
      });
      
      await boeValidation.save();
      console.log('✅ Created BOE validation');
    }

    // Create ERP integrations
    console.log('\n🔗 Creating ERP integrations...');
    const integrations = ['SAP', 'Oracle', 'Microsoft Dynamics'];
    for (let i = 0; i < integrations.length; i++) {
      const integration = new ERPIntegration({
        name: `${integrations[i]} Integration`,
        type: integrations[i],
        apiEndpoint: `https://${integrations[i].toLowerCase()}.example.com/api`,
        description: `Integration with ${integrations[i]} ERP system`,
        settings: {
          timeout: 30000,
          retries: 3,
          apiVersion: '2.0'
        },
        createdBy: users[3]._id, // Forwarder user
        status: 'active',
        lastSync: new Date()
      });
      
      await integration.save();
      console.log(`✅ Created ERP integration: ${integration.name}`);
    }

    // Create shipments
    console.log('\n🚢 Creating shipments...');
    for (let i = 1; i <= 3; i++) {
      const shipment = new Shipment({
        trackingNumber: `SHIP${Date.now()}${i}`,
        exporter: `Exporter Company ${i}`,
        consignee: `Consignee Company ${i}`,
        origin: `Mumbai, India - Port INMUN`,
        destination: `New York, USA - Port USNYC`,
        mode: ['sea', 'air', 'road'][i % 3],
        status: ['pending', 'in-transit', 'delivered'][i - 1],
        weight: (i * 100) + 50, // kg
        value: (i * 10000) + 5000, // USD
        estimatedDelivery: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)),
        createdBy: users[i % users.length]._id
      });
      
      await shipment.save();
      console.log(`✅ Created shipment: ${shipment.trackingNumber}`);
    }

    // Create system settings
    console.log('\n⚙️  Creating system settings...');
    const systemSettings = [
      { key: 'max_file_size', value: '10485760', category: 'upload' },
      { key: 'ai_processing_timeout', value: '300', category: 'ai' },
      { key: 'default_currency', value: 'USD', category: 'general' }
    ];

    for (const setting of systemSettings) {
      const systemSetting = new SystemSettings({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        description: `System setting for ${setting.key}`,
        updatedBy: users[0]._id
      });
      
      await systemSetting.save();
      console.log(`✅ Created system setting: ${setting.key}`);
    }

    // Create notifications
    console.log('\n🔔 Creating notifications...');
    for (let i = 1; i <= 5; i++) {
      const notification = new Notification({
        title: `Test Notification ${i}`,
        message: `This is a test notification message ${i}`,
        type: ['info', 'warning', 'error', 'success'][i % 4],
        category: ['document', 'compliance', 'system', 'user', 'general'][i % 5],
        user: users[i % users.length]._id,
        status: i % 2 === 0 ? 'read' : 'unread'
      });
      
      await notification.save();
      console.log(`✅ Created notification: ${notification.title}`);
    }

    // Verify all collections
    console.log('\n📊 Final Collection Counts:');
    const collections = [
      { name: 'users', model: User },
      { name: 'documents', model: Document },
      { name: 'hscodesuggestions', model: HSCodeSuggestion },
      { name: 'invoicevalidations', model: InvoiceValidation },
      { name: 'clients', model: Client },
      { name: 'erpintegrations', model: ERPIntegration },
      { name: 'shipments', model: Shipment },
      { name: 'systemsettings', model: SystemSettings },
      { name: 'notifications', model: Notification }
    ];

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      console.log(`📊 ${collection.name}: ${count} documents`);
    }

    console.log('\n🎉 Database populated successfully!');
    console.log('🔑 Test Login Credentials:');
    console.log('- Admin: admin@export.com / admin123');
    console.log('- Exporter: user@export.com / user123');
    console.log('- CA: ca@export.com / ca123');
    console.log('- Forwarder: forwarder@export.com / forwarder123');

  } catch (error) {
    console.error('❌ Database population failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the script
forcePopulateDatabase();