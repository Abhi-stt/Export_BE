# Backend Troubleshooting Guide

## Quick Start & Testing

### 1. Setup and Start Backend

```bash
# Navigate to backend directory
cd BE

# Install dependencies
npm install

# Set up environment variables
cp env.example .env

# Edit .env file with your MongoDB credentials
# MONGODB_URI=mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export

# Start the server (includes database seeding)
npm run dev
```

### 2. Test Backend Connection

Open your browser or use curl to test these endpoints:

```bash
# Test if server is running
curl http://localhost:5000/api/test

# Expected response:
{
  "success": true,
  "data": {
    "message": "Backend is working!",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Test endpoint working"
}

# Test health endpoint
curl http://localhost:5000/api/health

# Test login with default user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@export.com","password":"user123"}'
```

### 3. Default Test Users

The system automatically creates these test users:

```
Admin User:
- Email: admin@export.com
- Password: admin123
- Role: admin

Regular User:
- Email: user@export.com
- Password: user123
- Role: exporter

CA User:
- Email: ca@export.com
- Password: ca123
- Role: ca

Forwarder User:
- Email: forwarder@export.com
- Password: forwarder123
- Role: forwarder
```

## Common Issues & Solutions

### Issue 1: "Backend login failed: {}"

**Symptoms:**
- Frontend shows empty response data
- 400 status code
- Console errors in browser

**Solution:**
✅ **Fixed in latest update** - Backend now returns consistent response format:

```javascript
// Correct response format
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@export.com",
      "role": "exporter"
    }
  },
  "message": "Login successful"
}
```

### Issue 2: CORS Errors

**Symptoms:**
- Browser console shows CORS policy errors
- Requests blocked by browser

**Solution:**
Backend is configured to allow requests from `http://localhost:3000`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

**If still having issues:**
1. Ensure frontend is running on port 3000
2. Check if `FRONTEND_URL` environment variable is set correctly

### Issue 3: Database Connection Failed

**Symptoms:**
- "MongoDB connection error" in console
- Server fails to start

**Solutions:**

1. **Check MongoDB URI format:**
   ```env
   # Correct format with URL encoding
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   
   # For passwords with special characters, encode them:
   # @ becomes %40
   # ! becomes %21
   # # becomes %23
   ```

2. **Verify MongoDB Atlas setup:**
   - Check if IP is whitelisted (or use 0.0.0.0/0 for development)
   - Verify username and password
   - Ensure database user has read/write permissions

3. **Test connection manually:**
   ```bash
   npm run seed
   ```

### Issue 4: JWT Token Issues

**Symptoms:**
- "No token, authorization denied"
- Token validation failures

**Solution:**
Ensure `JWT_SECRET` is set in your `.env` file:

```env
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

### Issue 5: API Route Not Found

**Symptoms:**
- 404 errors for API endpoints
- "Route not found" messages

**Solution:**
1. Verify the API endpoint URLs:
   ```
   POST /api/auth/login
   POST /api/auth/register
   GET  /api/auth/me
   GET  /api/users
   GET  /api/documents
   ```

2. Check if server is running on correct port (5000)

3. Ensure frontend is making requests to correct base URL:
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

## Debugging Steps

### 1. Enable Debug Logging

Add to your `.env` file:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

### 2. Check Server Logs

When starting with `npm run dev`, look for:
```
✅ MongoDB Connected successfully
🌱 Checking for initial data...
✅ Admin user created: admin@export.com / admin123
🎯 Starting main server...
Server running on port 5000
```

### 3. Test API Endpoints Manually

Use tools like Postman or curl to test endpoints:

```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "company": "Test Company",
    "role": "exporter"
  }'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Frontend-Backend Communication Test

In your browser console (F12), test the connection:

```javascript
// Test basic connectivity
fetch('http://localhost:5000/api/test')
  .then(response => response.json())
  .then(data => console.log('Backend test:', data));

// Test login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@export.com',
    password: 'user123'
  })
})
.then(response => response.json())
.then(data => console.log('Login test:', data));
```

## Environment Variables Checklist

Ensure these are set in your `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export

# JWT
JWT_SECRET=your_jwt_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# AI Services (optional for basic functionality)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
COMPLIANCE_AI_PROVIDER=openai
```

## Performance Monitoring

### 1. Check Server Performance

```bash
# Monitor server logs
npm run dev

# Check memory usage
node -e "console.log(process.memoryUsage())"

# Check database connections
# Look for "MongoDB Connected successfully" message
```

### 2. Monitor API Response Times

Add logging middleware to track response times:

```javascript
// Already included in server.js
app.use(morgan('combined'));
```

## Getting Help

### 1. Check Logs First

Always check the server console output for error messages.

### 2. Common Error Patterns

- **"Cannot POST /api/auth/login"** → Check if server is running and routes are loaded
- **"User already exists"** → Use different email or existing test users
- **"Invalid credentials"** → Check email/password, ensure user exists and is active
- **"Network error"** → Check if backend server is running on port 5000

### 3. Reset Database

If you need to start fresh:

```bash
# This will recreate test users
npm run seed
```

### 4. Restart Everything

```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C in frontend terminal)

# Restart backend
cd BE
npm run dev

# Restart frontend (in another terminal)
cd FE
npm run dev
```

## Success Indicators

When everything is working correctly, you should see:

### Backend Console:
```
✅ MongoDB Connected successfully
🌱 Checking for initial data...
✅ Admin user created: admin@export.com / admin123
✅ Test user created: user@export.com / user123
✅ CA user created: ca@export.com / ca123
🎯 Starting main server...
Server running on port 5000
Environment: development
```

### Frontend Login Success:
```
✅ Login successful - Role: exporter
💾 Stored userRole in localStorage: exporter
🔑 JWT Token stored: Yes
```

### API Test Success:
```bash
curl http://localhost:5000/api/test
# Returns: {"success":true,"data":{"message":"Backend is working!"},"message":"Test endpoint working"}
```

If you see all these indicators, your backend is working correctly! 🎉