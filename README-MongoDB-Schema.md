# MongoDB Schema Documentation

## Overview

This document describes the MongoDB schema for the AI-Powered Export Project backend. The schema is designed to support all the functionality present in the frontend modules, including user management, document processing, shipment tracking, compliance validation, and analytics.

## Database Collections

### 1. Users Collection
**Purpose**: Store user accounts and authentication data

**Key Fields**:
- `name`, `email`, `password`, `phone`, `company` (required)
- `role`: admin, exporter, ca, forwarder
- `status`: active, inactive, pending, suspended
- `department`, `designation` (optional)
- `lastLogin`, `loginAttempts`, `lockUntil` (security)

**Indexes**:
- `email` (unique)
- `role`, `status`, `company`

### 2. Clients Collection
**Purpose**: Store client information for CA and forwarder management

**Key Fields**:
- `name`, `email`, `phone`, `company` (required)
- `complianceScore`: 0-100
- `documentsProcessed`, `issues` (counters)
- `industry`, `monthlyFee`, `contractEnd`
- `type`: exporter, importer, both
- `assignedCA`: Reference to User (CA)

**Indexes**:
- `email` (unique)
- `company`, `status`, `assignedCA`

### 3. Documents Collection
**Purpose**: Store uploaded documents and their processing results

**Key Fields**:
- `fileName`, `originalName`, `fileType`, `fileSize`
- `documentType`: invoice, boe, packing_list, certificate, shipping_bill, other
- `status`: uploading, processing, completed, error, validated, rejected
- `uploadedBy`: Reference to User
- `client`: Reference to Client
- `filePath`, `processingTime`, `confidence`
- `extractedText`, `entities`, `validation` (AI processing results)
- `errors`, `suggestions` (validation results)

**Indexes**:
- `uploadedBy`, `documentType`, `status`
- `createdAt` (descending)

### 4. Shipments Collection
**Purpose**: Track shipment information and status

**Key Fields**:
- `trackingNumber` (unique)
- `exporter`, `consignee`, `origin`, `destination`
- `mode`: sea, air, road
- `status`: in-transit, customs, delivered, delayed, pending
- `progress`: 0-100
- `estimatedDelivery`, `actualDelivery`
- `value`, `weight`, `containers`
- `documents`: Array of Document references
- `createdBy`: Reference to User

**Indexes**:
- `trackingNumber` (unique)
- `status`, `createdBy`, `estimatedDelivery`

### 5. BOE Validations Collection
**Purpose**: Store BOE (Bill of Entry) validation results

**Key Fields**:
- `invoiceDocument`, `boeDocument`: References to Documents
- `invoiceNumber`, `boeNumber`
- `matchPercentage`: 0-100
- `overallStatus`: passed, failed, warning
- `results`: Array of field comparison results
- `metadata`: Processing metadata
- `validatedBy`: Reference to User

**Indexes**:
- `invoiceDocument`, `boeDocument`
- `overallStatus`

### 6. Invoice Validations Collection
**Purpose**: Store invoice validation and compliance results

**Key Fields**:
- `document`: Reference to Document
- `success`, `text`, `confidence`
- `entities`: Extracted entities
- `compliance`: Validation results with checks
- `errors`, `corrections`: Issues and suggestions
- `metadata`: Processing metadata
- `validatedBy`: Reference to User

**Indexes**:
- `document`
- `compliance.isValid`

### 7. HS Code Suggestions Collection
**Purpose**: Store HS code suggestions and recommendations

**Key Fields**:
- `productDescription` (required)
- `additionalInfo`
- `suggestions`: Array of HS code suggestions
- `processingTime`
- `requestedBy`: Reference to User

### 8. Audit Trail Collection
**Purpose**: Track all system activities for compliance and security

**Key Fields**:
- `timestamp`, `user`: Reference to User
- `action`: Description of the action
- `document`: Reference to Document (optional)
- `details`: Detailed description
- `status`: success, warning, error
- `ipAddress`, `userAgent`
- `metadata`: Additional context

**Indexes**:
- `user`, `action`, `timestamp` (descending)
- `status`

### 9. System Health Collection
**Purpose**: Monitor system services and performance

**Key Fields**:
- `service`: Service name
- `status`: healthy, warning, error, offline
- `uptime`: 0-100
- `responseTime`, `lastCheck`
- `details`: Service-specific details

**Indexes**:
- `service`, `status`

### 10. System Settings Collection
**Purpose**: Store global system configuration

**Key Fields**:
- `emailNotifications`, `smsNotifications`
- `maintenanceMode`, `autoBackup`
- `dataRetention`, `timezone`, `currency`, `language`
- `apiRateLimit`, `sessionDuration`
- `maxFileUploadSize`, `databaseConnectionPool`
- `updatedBy`: Reference to User

### 11. ERP Integrations Collection
**Purpose**: Store ERP system connections and sync status

**Key Fields**:
- `name`, `type`: Accounting, ERP, Cloud ERP
- `status`: connected, disconnected, syncing, error
- `lastSync`, `recordsSynced`
- `version`, `apiEndpoint`, `apiKey`
- `credentials`: Encrypted credentials
- `syncFrequency`, `autoSync`
- `configuredBy`: Reference to User

**Indexes**:
- `name`, `status`

### 12. Compliance Reports Collection
**Purpose**: Store generated compliance reports

**Key Fields**:
- `period`: Report period
- `totalDocuments`, `complianceScore`, `errorsReduced`
- `avgProcessingTime`
- `monthlyData`, `errorTypes`, `topIssues`
- `generatedBy`: Reference to User
- `exportedAt`: Export timestamp

**Indexes**:
- `period`, `generatedBy`

### 13. Analytics Collection
**Purpose**: Store analytics data and metrics

**Key Fields**:
- `type`: user, document, system, compliance
- `period`: Time period
- `data`: Analytics data
- `metrics`: Calculated metrics
- `generatedAt`: Generation timestamp

**Indexes**:
- `type`, `period`

## Relationships

### Primary Relationships:
1. **User → Documents**: One user can upload many documents
2. **User → Clients**: One CA can manage many clients
3. **Client → Documents**: One client can have many documents
4. **Document → Validations**: One document can have multiple validations
5. **Shipment → Documents**: One shipment can have multiple documents
6. **User → Audit Trail**: One user can have many audit entries

### Reference Structure:
```javascript
// Example document with references
{
  _id: ObjectId("..."),
  fileName: "invoice.pdf",
  uploadedBy: ObjectId("user_id"),
  client: ObjectId("client_id"),
  // ... other fields
}
```

## Data Validation

### Built-in Validation:
- Required fields are enforced
- Enum values are restricted to predefined options
- Number ranges are validated (e.g., 0-100 for percentages)
- Email format validation
- Unique constraints on critical fields

### Custom Validation:
- Password strength requirements
- File size limits
- Date range validations
- Business logic validations

## Indexing Strategy

### Performance Indexes:
- **Single Field**: email, trackingNumber, status
- **Compound**: user + status, document + type
- **Text Search**: product descriptions, document content
- **Geospatial**: Origin/destination locations (future)

### Index Considerations:
- Read-heavy operations are prioritized
- Write operations are optimized
- Index size is monitored
- Background index creation for large collections

## Security Considerations

### Data Protection:
- Passwords are hashed (not stored in plain text)
- Sensitive data is encrypted
- API keys are stored securely
- Audit trail for all data modifications

### Access Control:
- Role-based access control (RBAC)
- Document-level permissions
- Client data isolation
- API rate limiting

## Usage Examples

### Creating a New User:
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

### Uploading a Document:
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

### Creating a Shipment:
```javascript
const shipment = new Shipment({
  trackingNumber: "SH2024001",
  exporter: "ABC Exports Ltd",
  consignee: "Global Imports LLC",
  origin: "Mumbai, India",
  destination: "New York, USA",
  mode: "sea",
  estimatedDelivery: new Date("2024-02-15"),
  value: 125000,
  weight: 15000,
  containers: ["MSKU7834567"],
  createdBy: userId
});
await shipment.save();
```

### Recording Audit Trail:
```javascript
const auditEntry = new AuditTrail({
  user: userId,
  action: "Document Upload",
  document: documentId,
  details: "Commercial invoice uploaded and processed successfully",
  status: "success",
  ipAddress: "192.168.1.100",
  userAgent: "Chrome/120.0.0.0"
});
await auditEntry.save();
```

## Migration and Maintenance

### Database Migration:
- Schema changes are versioned
- Migration scripts are provided
- Data integrity is maintained
- Rollback procedures are available

### Maintenance Tasks:
- Regular index optimization
- Data archival for old records
- Performance monitoring
- Backup and recovery procedures

## Environment Setup

### Required Environment Variables:
```bash
MONGODB_URI=mongodb://localhost:27017/export_project
MONGODB_DB_NAME=export_project
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### Connection Setup:
```javascript
const mongoose = require('mongoose');
const { User, Document, Shipment } = require('./mongodb-schema');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.MONGODB_DB_NAME
});
```

## Performance Optimization

### Query Optimization:
- Use indexes effectively
- Limit result sets
- Use projection to select only needed fields
- Implement pagination for large datasets

### Aggregation Pipeline:
- Use MongoDB aggregation for complex queries
- Optimize pipeline stages
- Use indexes for aggregation operations

### Caching Strategy:
- Cache frequently accessed data
- Implement Redis for session storage
- Use application-level caching

This schema provides a robust foundation for the AI-Powered Export Project, supporting all the features and functionality present in the frontend modules while maintaining data integrity, performance, and security. 