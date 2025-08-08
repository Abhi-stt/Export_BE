const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

console.log('🚀 Starting AI Export Management System...');
console.log('📊 Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- PORT:', process.env.PORT || 5000);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Not configured (fallback will be used)');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configured' : '⚠️  Not configured');
console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '⚠️  Not configured');
console.log('- COMPLIANCE_AI_PROVIDER:', process.env.COMPLIANCE_AI_PROVIDER || 'openai');

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const documentRoutes = require('./routes/documents');
const validationRoutes = require('./routes/validation');
const shipmentRoutes = require('./routes/shipments');
const hsCodeRoutes = require('./routes/hs-codes');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const integrationRoutes = require('./routes/integrations');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection is handled by startup script
// This allows the server to be started independently if needed

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/hs-codes', hsCodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationRoutes);

// Health check endpoint with database test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Test a simple database query
    let userCount = 0;
    let dbTestResult = 'not tested';
    if (dbStatus === 1) {
      try {
        const { User } = require('./schemas');
        userCount = await User.countDocuments();
        dbTestResult = 'success';
      } catch (err) {
        console.error('Database query error:', err);
        dbTestResult = 'query failed: ' + err.message;
      }
    }

    res.json({
      success: true,
      data: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: dbStates[dbStatus] || 'unknown',
          name: mongoose.connection.name || 'not connected',
          host: mongoose.connection.host || 'not connected',
          userCount: userCount,
          testResult: dbTestResult
        },
        apis: {
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
          complianceProvider: process.env.COMPLIANCE_AI_PROVIDER || 'openai'
        }
      },
      message: 'Server is running properly'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Backend is working!',
      timestamp: new Date().toISOString()
    },
    message: 'Test endpoint working'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 