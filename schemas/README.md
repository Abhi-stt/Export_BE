# MongoDB Schemas

This directory contains all the MongoDB schemas for the AI-Powered Export Project, organized in separate files for better maintainability.

## Complete Schema Coverage

### Core Entities
- **User.js** - User accounts and authentication
- **Client.js** - Client management for CA and forwarder operations
- **Document.js** - Document upload and AI processing results
- **Shipment.js** - Shipment tracking and management

### Validation & Processing
- **BOEValidation.js** - Bill of Entry validation results
- **InvoiceValidation.js** - Invoice compliance and validation
- **HSCodeSuggestion.js** - AI-powered HS code recommendations
- **DocumentReview.js** - Document review and approval workflow
- **ComplianceRule.js** - Compliance rules and validation logic

### System & Analytics
- **AuditTrail.js** - Complete activity logging
- **SystemHealth.js** - Service monitoring
- **SystemSettings.js** - Global configuration
- **ERPIntegration.js** - Third-party system connections
- **ComplianceReport.js** - Generated reports storage
- **Analytics.js** - Metrics and data analysis
- **AuditReport.js** - Audit reports and findings

### API & Security
- **APIKey.js** - API key management and access control
- **UserSettings.js** - User preferences and settings
- **Notification.js** - System notifications and alerts

## Role-Based Schema Coverage

### Admin Role
- ✅ User Management (User)
- ✅ System Settings (SystemSettings)
- ✅ System Health (SystemHealth)
- ✅ API Management (APIKey)
- ✅ Analytics (Analytics)
- ✅ Audit Reports (AuditReport)
- ✅ Compliance Reports (ComplianceReport)
- ✅ Audit Trail (AuditTrail)

### Exporter Role
- ✅ Document Upload (Document)
- ✅ Document Validation (InvoiceValidation, BOEValidation)
- ✅ HS Code Suggestions (HSCodeSuggestion)
- ✅ Shipment Tracking (Shipment)
- ✅ User Settings (UserSettings)
- ✅ Notifications (Notification)

### CA (Chartered Accountant) Role
- ✅ Client Management (Client)
- ✅ Document Review (DocumentReview)
- ✅ Audit Reports (AuditReport)
- ✅ Compliance Reports (ComplianceReport)
- ✅ Document Validation (InvoiceValidation, BOEValidation)
- ✅ User Settings (UserSettings)
- ✅ Notifications (Notification)

### Forwarder Role
- ✅ Shipment Tracking (Shipment)
- ✅ Document Management (Document)
- ✅ Client Management (Client)
- ✅ User Settings (UserSettings)
- ✅ Notifications (Notification)

## Page-Specific Schema Coverage

### Dashboard Pages
- ✅ Dashboard (Analytics, Document, Shipment, User)
- ✅ Analytics (Analytics)
- ✅ Admin Analytics (Analytics, SystemHealth)

### Document Management
- ✅ Document Upload (Document)
- ✅ Document Validation (InvoiceValidation, BOEValidation)
- ✅ Document Review (DocumentReview)
- ✅ BOE Validator (BOEValidation)
- ✅ Invoice Validator (InvoiceValidation)
- ✅ HS Code Copilot (HSCodeSuggestion)

### User & Client Management
- ✅ User Management (User)
- ✅ Client Management (Client)
- ✅ Settings (UserSettings)

### Compliance & Auditing
- ✅ Compliance Reports (ComplianceReport)
- ✅ Compliance Analytics (Analytics, ComplianceReport)
- ✅ Audit Reports (AuditReport)
- ✅ Audit Trail (AuditTrail)

### System Management
- ✅ System Health (SystemHealth)
- ✅ Admin Settings (SystemSettings)
- ✅ API Management (APIKey)
- ✅ ERP Integration (ERPIntegration)

### Shipment & Tracking
- ✅ Shipment Tracking (Shipment)

## Usage

### Import Individual Schemas
```javascript
const User = require('./schemas/User');
const Document = require('./schemas/Document');
```

### Import All Schemas
```javascript
const {
  User,
  Client,
  Document,
  Shipment,
  BOEValidation,
  InvoiceValidation,
  HSCodeSuggestion,
  AuditTrail,
  SystemHealth,
  SystemSettings,
  ERPIntegration,
  ComplianceReport,
  Analytics,
  APIKey,
  DocumentReview,
  AuditReport,
  UserSettings,
  Notification,
  ComplianceRule
} = require('./schemas');
```

## Features

### Each Schema Includes:
- **Data Validation** - Required fields, enums, ranges
- **Indexes** - Performance-optimized database indexes
- **Timestamps** - Automatic createdAt and updatedAt fields
- **References** - Proper MongoDB ObjectId references
- **Type Safety** - Mongoose schema validation

### Performance Optimizations:
- Strategic indexing on frequently queried fields
- Compound indexes for complex queries
- Optimized for read-heavy operations

### Security Features:
- Password hashing support
- Encrypted storage for sensitive data
- Role-based access control structure
- Comprehensive audit trail

## Database Connection

```javascript
const mongoose = require('mongoose');
const { User, Document } = require('./schemas');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.MONGODB_DB_NAME
});
```

## Example Usage

### Creating a User
```javascript
const user = new User({
  name: "John Doe",
  email: "john@example.com",
  password: "hashedPassword",
  phone: "+1234567890",
  company: "ABC Exports",
  role: "exporter"
});
await user.save();
```

### Creating a Document
```javascript
const document = new Document({
  fileName: "invoice_001.pdf",
  originalName: "Commercial Invoice.pdf",
  fileType: "application/pdf",
  fileSize: 1024000,
  documentType: "invoice",
  uploadedBy: userId,
  client: clientId,
  filePath: "/uploads/invoice_001.pdf"
});
await document.save();
```

### Creating an API Key
```javascript
const apiKey = new APIKey({
  name: "Production API Key",
  key: "sk_live_1234567890abcdef",
  permissions: ["read", "write"],
  createdBy: userId,
  rateLimit: 1000
});
await apiKey.save();
```

### Creating a Document Review
```javascript
const review = new DocumentReview({
  documentType: "invoice",
  document: documentId,
  client: clientId,
  assignedTo: reviewerId,
  priority: "high",
  reviewNotes: "Please review for compliance issues"
});
await review.save();
```

### Querying with Population
```javascript
const documents = await Document.find({ uploadedBy: userId })
  .populate('client', 'name company')
  .populate('uploadedBy', 'name email')
  .sort({ createdAt: -1 });
```

## Maintenance

### Adding New Fields
1. Update the schema file
2. Add appropriate validation
3. Create migration script if needed
4. Update documentation

### Adding New Indexes
1. Add index in schema file
2. Test performance impact
3. Monitor index usage
4. Update documentation

### Schema Changes
1. Version control all changes
2. Create migration scripts
3. Test thoroughly
4. Update related code
5. Update documentation

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/export_project
MONGODB_DB_NAME=export_project
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

## Schema Relationships

### Primary Relationships:
1. **User → Documents**: One user can upload many documents
2. **User → Clients**: One CA can manage many clients
3. **Client → Documents**: One client can have many documents
4. **Document → Validations**: One document can have multiple validations
5. **Document → Reviews**: One document can have multiple reviews
6. **Shipment → Documents**: One shipment can have multiple documents
7. **User → Audit Trail**: One user can have many audit entries
8. **User → Settings**: One user has one settings record
9. **User → Notifications**: One user can have many notifications
10. **User → API Keys**: One user can have many API keys

This modular approach makes the codebase more maintainable and allows for easier testing and development. All schemas are designed to support the complete functionality of the AI-Powered Export Project across all user roles and pages. 