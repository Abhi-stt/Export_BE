const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  console.log('🔐 Auth middleware called for:', req.method, req.path);
  
  // Get token from header - support both x-auth-token and Authorization Bearer
  let token = req.header('x-auth-token');
  
  // If no x-auth-token, try Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  console.log('Token found:', token ? 'Yes' : 'No');

  // Check if no token
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified');
    console.log('🔍 Decoded token structure:', JSON.stringify(decoded, null, 2));
    console.log('🔍 Decoded.user:', decoded.user);
    console.log('🔍 Decoded.user._id:', decoded.user?._id);
    console.log('🔍 Decoded.user.id:', decoded.user?.id);
    
    // Handle different JWT token structures
    if (decoded.user) {
      req.user = decoded.user;
    } else if (decoded.id) {
      // If the token structure is different, create user object
      req.user = { _id: decoded.id, role: decoded.role };
    } else {
      console.log('❌ Invalid token structure');
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    console.log('🔍 Final req.user:', req.user);
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 