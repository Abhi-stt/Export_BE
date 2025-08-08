/**
 * Test script to verify database connection and data operations
 * Run with: node test-connection.js
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
  Client,
  ERPIntegration,
  Shipment
} = require('./schemas');

async function testDatabaseConnection() {
  try {
    console.log('🧪 Testing Database Connection and Operations\n');

    // Test connection
    console.log('1️⃣ Testing MongoDB Connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);
    console.log('✅ Host:', mongoose.connection.host);

    // Test user creation
    console.log('\n2️⃣ Testing User Creation...');
    const testUser = new User({
      name: 'Test User',
      email: 'test-' + Date.now() + '@example.com',
      password: await bcrypt.hash('test123', 10),
      phone: '+1234567890',
      company: 'Test Company',
      role: 'exporter',
      status: 'active',
      department: 'Testing',
      designation: 'Test User'
    });

    await testUser.save();
    console.log('✅ User created:', testUser.email);

    // Test document creation
    console.log('\n3️⃣ Testing Document Creation...');
    const testDoc = new Document({
      originalName: 'test-document.pdf',
      fileName: 'test-doc-' + Date.now() + '.pdf',
      filePath: '/uploads/test-doc.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      documentType: 'invoice',
      status: 'completed',
      extractedText: 'Test extracted text content',
      confidence: 85,
      entities: [
        { type: 'invoice_number', value: 'INV-001', confidence: 90 },
        { type: 'amount', value: '1000.00', confidence: 85 }
      ],
      uploadedBy: testUser._id
    });

    await testDoc.save();
    console.log('✅ Document created:', testDoc.originalName);

    // Test HS Code suggestion creation
    console.log('\n4️⃣ Testing HS Code Suggestion Creation...');
    const testHSCode = new HSCodeSuggestion({
      productDescription: 'Electronic components',
      suggestions: [
        {
          code: '8471.30.01',
          description: 'Electronic components',
          confidence: 85,
          category: 'Electronics'
        }
      ],
      processingTime: 2,
      requestedBy: testUser._id
    });

    await testHSCode.save();
    console.log('✅ HS Code suggestion created');

    // Test client creation
    console.log('\n5️⃣ Testing Client Creation...');
    const testClient = new Client({
      name: 'Test Client Ltd',
      email: 'client-' + Date.now() + '@example.com',
      phone: '+1234567891',
      company: 'Test Client Company',
      address: {
        street: '123 Client Street',
        city: 'Client City',
        state: 'Client State',
        zipCode: '12345',
        country: 'India'
      },
      contactPerson: 'John Doe',
      businessType: 'Importer',
      registrationNumber: 'REG' + Date.now(),
      taxId: 'TAX' + Date.now(),
      createdBy: testUser._id
    });

    await testClient.save();
    console.log('✅ Client created:', testClient.name);

    // Test invoice validation creation
    console.log('\n6️⃣ Testing Invoice Validation Creation...');
    const testValidation = new InvoiceValidation({
      document: testDoc._id,
      success: true,
      extractedText: 'Sample invoice text',
      confidence: 80,
      entities: [
        { type: 'invoice_number', value: 'INV-001', confidence: 90 }
      ],
      complianceAnalysis: {
        isValid: true,
        score: 85,
        checks: [
          {
            name: 'Format Check',
            passed: true,
            message: 'Format is valid',
            severity: 'info'
          }
        ]
      },
      validatedBy: testUser._id
    });

    await testValidation.save();
    console.log('✅ Invoice validation created');

    // Test ERP integration creation
    console.log('\n7️⃣ Testing ERP Integration Creation...');
    const testIntegration = new ERPIntegration({
      name: 'Test SAP Integration',
      type: 'SAP',
      endpoint: 'https://test-sap.example.com/api',
      description: 'Test integration',
      settings: {
        timeout: 30000,
        retries: 3
      },
      createdBy: testUser._id,
      status: 'active'
    });

    await testIntegration.save();
    console.log('✅ ERP Integration created:', testIntegration.name);

    // Test shipment creation
    console.log('\n8️⃣ Testing Shipment Creation...');
    const testShipment = new Shipment({
      trackingNumber: 'SHIP' + Date.now(),
      origin: {
        address: '123 Origin St',
        city: 'Mumbai',
        country: 'India',
        port: 'INMUN'
      },
      destination: {
        address: '456 Dest Ave',
        city: 'New York',
        country: 'USA',
        port: 'USNYC'
      },
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: testUser._id
    });

    await testShipment.save();
    console.log('✅ Shipment created:', testShipment.trackingNumber);

    // Verify all collections have data
    console.log('\n9️⃣ Verifying Collections...');
    const collections = [
      { name: 'users', model: User },
      { name: 'documents', model: Document },
      { name: 'hscodesuggestions', model: HSCodeSuggestion },
      { name: 'invoicevalidations', model: InvoiceValidation },
      { name: 'clients', model: Client },
      { name: 'erpintegrations', model: ERPIntegration },
      { name: 'shipments', model: Shipment }
    ];

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      console.log(`📊 ${collection.name}: ${count} documents`);
    }

    console.log('\n✅ All database operations completed successfully!');
    console.log('🎉 Your MongoDB collections now have test data');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection();