// Role-based authorization middleware
exports.checkRole = (allowedRoles) => {
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

    // Convert any Tagalog roles to English equivalents
    userRoles = userRoles.map(role => roleMap[role] || role);

    // Check if user has at least one of the allowed roles
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasAllowedRole) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
    }

    next();
  };
}; 