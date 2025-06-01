const jwt = require('jsonwebtoken');

// Authentication middleware
exports.checkAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret_key';
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    console.log('Authenticated user:', req.user.email, 'User roles:', req.user.roles);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}; 