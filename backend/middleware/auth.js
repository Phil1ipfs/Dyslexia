// middleware/auth.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Basic authentication middleware
 * Verifies JWT token and adds user data to request
 */
const auth = (req, res, next) => {
  // Check for token in various places
  const token = 
    req.header('Authorization')?.split(' ')[1] || // Authorization: Bearer <token>
    req.cookies?.token ||                         // Cookie
    req.query?.token;                             // URL query parameter
    
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret_key';
    const decoded = jwt.verify(token, secretKey);
    
    // Add user from payload to request object
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

/**
 * Resolves a role ID to its name from the database
 * @param {string|Object} roleId - MongoDB ObjectId as string or object
 * @returns {Promise<string|null>} - Role name or null if not found
 */
const resolveRoleFromId = async (roleId) => {
  try {
    if (!roleId) return null;
    
    // Extract the ID string if it's an ObjectId object
    let idString;
    if (typeof roleId === 'object' && roleId.$oid) {
      idString = roleId.$oid;
    } else if (typeof roleId === 'object') {
      idString = String(roleId);
    } else {
      idString = roleId;
    }
    
    // Connect to roles collection
    const usersDb = mongoose.connection.useDb('users_web');
    const rolesCollection = usersDb.collection('roles');
    
    let roleObjId;
    try {
      roleObjId = new mongoose.Types.ObjectId(idString);
    } catch (err) {
      console.warn('Invalid ObjectId format for role:', idString);
      return null;
    }
    
    // Query the role
    const role = await rolesCollection.findOne({ _id: roleObjId });
    
    return role?.name || null;
  } catch (err) {
    console.error('Error resolving role from ID:', err);
    return null;
  }
};

/**
 * Role-based authorization middleware
 * Checks if authenticated user has required role
 *
 * @param {...string} allowedRoles - Roles that can access the route
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Handle roles which might be a string or array from the token
    let userRoles = req.user.roles || [];
    
    // If roles field doesn't exist or is empty, try to fetch from database
    if ((!userRoles || userRoles.length === 0) && req.user.id) {
      try {
        const usersDb = mongoose.connection.useDb('users_web');
        const usersCollection = usersDb.collection('users');
        const user = await usersCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(req.user.id) 
        });
        
        if (user && user.roles) {
          userRoles = user.roles;
          // Update the request object for future middleware
          req.user.roles = userRoles;
        }
      } catch (err) {
        console.error('Error fetching user roles:', err);
      }
    }
    
    // Convert to array if not already
    const roleArray = Array.isArray(userRoles) ? userRoles : [userRoles];
    
    // Array to hold the normalized role names
    const normalizedRoles = [];
    
    // Process each role (could be ID, name, or object)
    for (const role of roleArray) {
      // If it's already a string name, add it directly
      if (typeof role === 'string' && !mongoose.Types.ObjectId.isValid(role)) {
        normalizedRoles.push(role.toLowerCase());
      } 
      // If it could be an ObjectId or role object, resolve it from database
      else {
        const resolvedRole = await resolveRoleFromId(role);
        if (resolvedRole) {
          normalizedRoles.push(resolvedRole.toLowerCase());
        }
      }
    }
    
    // Support for equivalent Tagalog role names
    const tagalogToEnglish = {
      'guro': 'teacher',
      'magulang': 'parent'
    };
    
    // Check if user has required role - case-insensitive matching
    const hasRole = allowedRoles.some(role => {
      const lowercaseRole = role.toLowerCase();
      return normalizedRoles.includes(lowercaseRole) || 
             normalizedRoles.includes(tagalogToEnglish[lowercaseRole]);
    });
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Not authorized for this resource' });
    }
    
    next();
  };
};

module.exports = { auth, authorize };