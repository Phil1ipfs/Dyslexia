// middleware/auth.js
const jwt = require('jsonwebtoken');

// Basic authentication middleware
const auth = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret_key';
    const decoded = jwt.verify(token, secretKey);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is invalid' });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Handle roles which might be a string or array from the token
    let userRoles = req.user.roles;
    if (typeof userRoles === 'string') {
      userRoles = [userRoles]; // Convert string to array for consistency
    } else if (!Array.isArray(userRoles)) {
      userRoles = []; // Default to empty array if undefined
    }
    
    // Add support for Tagalog role names
    const roleMap = {
      'guro': 'teacher',
      'magulang': 'parent'
    };
    
    // Map Tagalog roles to English
    const normalizedUserRoles = userRoles.map(role => roleMap[role] || role);
    
    // Check if user has required role
    const hasRole = allowedRoles.some(role => 
      normalizedUserRoles.includes(role) || 
      normalizedUserRoles.includes(roleMap[role])
    );
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Not authorized for this resource' });
    }
    
    next();
  };
};

module.exports = { auth, authorize };