# AI-Powered Export Project - Backend API

A comprehensive Node.js backend API for the AI-Powered Export Project, providing authentication, document processing, validation, shipment tracking, and analytics functionality.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Exporter, CA, Forwarder)
- Password hashing with bcrypt
- Password reset functionality
- Account activation/deactivation

### Document Management
- File upload with multer
- **Two-step AI processing pipeline**:
  - **Step 1**: Gemini 1.5 Pro for OCR and text extraction
  - **Step 2**: GPT-4 Turbo or Claude 3 Sonnet for compliance analysis
- Document validation (Invoice, BOE)
- Document review workflow
- File download and management
- Real-time processing status tracking

### Validation & Compliance
- Invoice validation with compliance checks
- BOE (Bill of Entry) validation
- **AI-powered HS Code suggestions** using GPT-4 Turbo or Claude 3 Sonnet
- Compliance rule management
- Error tracking and corrections
- Automated compliance scoring

### Shipment Tracking
- Shipment creation and management
- Real-time status updates
- Document association
- Public tracking endpoints
- Progress monitoring

### Analytics & Reporting
- Dashboard analytics
- Document processing statistics
- Shipment analytics
- User activity tracking
- Custom report generation

### Client Management
- Client CRUD operations
- CA assignment
- Client statistics
- Search and filtering

### System Management
- User management (Admin only)
- System health monitoring
- API key management
- Audit trail logging

## 📁 Project Structure

```
BE/
├── schemas/                 # MongoDB schemas
│   ├── User.js
│   ├── Client.js
│   ├── Document.js          # Enhanced with AI processing fields
│   ├── Shipment.js
│   ├── InvoiceValidation.js
│   ├── BOEValidation.js
│   ├── HSCodeSuggestion.js  # Enhanced with AI metadata
│   ├── Analytics.js
│   └── index.js
├── routes/                  # API routes
│   ├── auth.js
│   ├── users.js
│   ├── clients.js
│   ├── documents.js         # AI processing integration
│   ├── validation.js
│   ├── shipments.js
│   ├── hs-codes.js          # AI-powered suggestions
│   └── analytics.js
├── services/                # AI services
│   ├── gemini.js           # Gemini 1.5 Pro OCR service
│   ├── compliance.js       # GPT-4/Claude compliance analysis
│   └── aiProcessor.js      # Main AI processing pipeline
├── middleware/              # Custom middleware
│   ├── auth.js
│   └── admin.js
├── server.js               # Main server file
├── package.json            # Updated with AI dependencies
├── env.example             # Updated with AI API keys
└── AI_INTEGRATION.md       # AI integration documentation
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Make sure MongoDB is running
   # The app will automatically create collections
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/export_project
MONGODB_DB_NAME=export_project

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "company": "ABC Exports",
  "role": "exporter"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current user profile

#### POST `/api/auth/logout`
Logout user

#### POST `/api/auth/forgot-password`
Request password reset
```json
{
  "email": "john@example.com"
}
```

### User Management Endpoints

#### GET `/api/users`
Get all users (Admin only)
- Query params: `page`, `limit`, `search`, `role`, `status`

#### POST `/api/users`
Create new user (Admin only)
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "company": "XYZ Trading",
  "role": "ca",
  "department": "Compliance",
  "designation": "Senior CA"
}
```

#### PUT `/api/users/:id`
Update user profile

#### DELETE `/api/users/:id`
Delete user (Admin only)

### Document Management Endpoints

#### GET `/api/documents`
Get all documents
- Query params: `page`, `limit`, `search`, `status`, `documentType`, `client`

#### POST `/api/documents/upload`
Upload new document
- Form data: `document` (file), `documentType`, `description`, `client`

#### GET `/api/documents/:id`
Get document by ID

#### PUT `/api/documents/:id`
Update document

#### DELETE `/api/documents/:id`
Delete document

#### GET `/api/documents/:id/download`
Download document file

#### POST `/api/documents/:id/reprocess`
Reprocess document with AI

### Validation Endpoints

#### POST `/api/validation/invoice`
Validate invoice document
```json
{
  "documentId": "document_id_here"
}
```

#### POST `/api/validation/boe`
Validate BOE against invoice
```json
{
  "invoiceDocumentId": "invoice_doc_id",
  "boeDocumentId": "boe_doc_id"
}
```

#### GET `/api/validation/invoice`
Get all invoice validations

#### GET `/api/validation/boe`
Get all BOE validations

### Shipment Endpoints

#### GET `/api/shipments`
Get all shipments
- Query params: `page`, `limit`, `search`, `status`, `mode`

#### POST `/api/shipments`
Create new shipment
```json
{
  "trackingNumber": "TRK123456",
  "exporter": "ABC Exports",
  "consignee": "XYZ Imports",
  "origin": "Mumbai, India",
  "destination": "New York, USA",
  "mode": "sea",
  "estimatedDelivery": "2024-02-15",
  "value": 50000,
  "weight": 1000,
  "containers": ["CONT001", "CONT002"],
  "client": "client_id",
  "notes": "Urgent shipment"
}
```

#### GET `/api/shipments/:id`
Get shipment by ID

#### PUT `/api/shipments/:id`
Update shipment

#### DELETE `/api/shipments/:id`
Delete shipment

#### POST `/api/shipments/:id/update-status`
Update shipment status
```json
{
  "status": "in-transit",
  "progress": 75,
  "actualDelivery": "2024-02-10"
}
```

#### GET `/api/shipments/tracking/:trackingNumber`
Public shipment tracking

### HS Code Endpoints

#### POST `/api/hs-codes/suggest`
Get HS code suggestions
```json
{
  "productDescription": "Smartphone with 128GB storage",
  "additionalInfo": "5G enabled, dual SIM"
}
```

#### GET `/api/hs-codes/suggestions`
Get all HS code suggestions

#### GET `/api/hs-codes/search`
Search HS codes
- Query params: `q` (search term)

### Analytics Endpoints

#### GET `/api/analytics/dashboard`
Get dashboard analytics

#### GET `/api/analytics/documents`
Get document analytics

#### GET `/api/analytics/shipments`
Get shipment analytics

#### GET `/api/analytics/users`
Get user analytics (Admin only)

### Client Endpoints

#### GET `/api/clients`
Get all clients
- Query params: `page`, `limit`, `search`, `status`, `type`

#### POST `/api/clients`
Create new client
```json
{
  "name": "Global Traders",
  "email": "contact@globaltraders.com",
  "phone": "+1234567890",
  "company": "Global Trading Co",
  "industry": "Electronics",
  "type": "exporter",
  "monthlyFee": 5000,
  "contractEnd": "2024-12-31",
  "notes": "Premium client"
}
```

#### GET `/api/clients/:id`
Get client by ID

#### PUT `/api/clients/:id`
Update client

#### DELETE `/api/clients/:id`
Delete client

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for frontend integration
- **Helmet**: Security headers for Express
- **Input Validation**: Request validation and sanitization
- **Role-based Access**: Granular permissions based on user roles

## 📊 Database Schema

The application uses MongoDB with the following main collections:

- **Users**: User accounts and authentication
- **Clients**: Client management for CA operations
- **Documents**: Document upload and processing
- **Shipments**: Shipment tracking and management
- **InvoiceValidations**: Invoice compliance validation
- **BOEValidations**: Bill of Entry validation
- **HSCodeSuggestions**: AI-powered HS code recommendations
- **Analytics**: Analytics and reporting data

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t export-backend .
docker run -p 5000:5000 export-backend
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Paginated Response
```json
{
  "data": [
    // Array of items
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

## 🔧 Development

### Adding New Routes
1. Create route file in `routes/` directory
2. Import and register in `server.js`
3. Add authentication middleware as needed
4. Test with appropriate tools

### Adding New Schemas
1. Create schema file in `schemas/` directory
2. Export from `schemas/index.js`
3. Create corresponding routes
4. Update documentation

### Environment Setup
1. Install MongoDB locally or use cloud service
2. Set up environment variables
3. Install dependencies
4. Run database migrations (if any)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This backend is designed to work with the AI-Powered Export Project frontend. Make sure to configure the frontend URL in the environment variables for proper CORS handling. 