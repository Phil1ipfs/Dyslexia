// routes/auth/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { authenticateToken } = require('../../middleware/auth');
const {
  loginLimiter,
  aggressiveLoginLimiter,
  createAccountLimiter,
  securityHeaders,
  loginLogger
} = require('../../middleware/rateLimiter');

const {
  accountLockout,
  validatePasswordStrength,
  sanitizeInput,
  advancedSecurityHeaders,
  suspiciousActivityDetector,
  securePasswordCompare
} = require('../../middleware/advancedSecurity');
const router = express.Router();

// Apply advanced security headers to all auth routes
router.use(advancedSecurityHeaders);

/**
 * Checks if a string is a valid bcrypt hash
 * @param {string} str - String to check
 * @returns {boolean} - True if valid bcrypt hash
 */
const isBcryptHash = (str) => {
  return typeof str === 'string' && /^\$2[abxy]\$\d+\$/.test(str);
};

/**
 * Normalizes role strings to handle variations
 * @param {string} role - Role to normalize
 * @returns {string} - Normalized role
 */
const normalizeRole = (role) => {
  if (!role) return '';
  
  const normalized = role.toLowerCase().trim();
  
  // Handle common variations
  switch (normalized) {
    case 'magulang':
    case 'parent':
      return 'parent';
    case 'guro':
    case 'teacher':
      return 'teacher';
    case 'admin':
    case 'administrator':
      return 'admin';
    default:
      return normalized;
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login',
  loginLimiter,
  aggressiveLoginLimiter,
  createAccountLimiter(20, 60 * 1000), // 20 attempts per 1 minute per email
  loginLogger,
  async (req, res) => {
  const { email, password, expectedRole } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  // Enhanced security validation
  if (!expectedRole) {
    console.warn(`[SECURITY] Login attempt without expectedRole for: ${email}`);
    return res.status(400).json({ message: 'Account type must be specified' });
  }

  // Validate expectedRole is one of the allowed values
  const allowedRoles = ['parent', 'teacher', 'admin'];
  if (!allowedRoles.includes(expectedRole.toLowerCase())) {
    console.warn(`[SECURITY] Invalid expectedRole '${expectedRole}' for: ${email}`);
    return res.status(400).json({ message: 'Invalid account type specified' });
  }

  // Advanced input sanitization
  const sanitizedEmail = sanitizeInput(email, 'email');
  const sanitizedRole = sanitizeInput(expectedRole, 'role');

  if (!sanitizedEmail || sanitizedEmail.length < 3) {
    console.warn(`[SECURITY] Invalid email format for: ${email}, IP: ${req.ip}`);
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Check account lockout
  if (accountLockout.isAccountLocked(sanitizedEmail)) {
    const lockoutInfo = accountLockout.getLockoutInfo(sanitizedEmail);
    console.warn(`[SECURITY] Account locked attempt: ${sanitizedEmail}, IP: ${req.ip}, Remaining: ${lockoutInfo.remainingTime} minutes`);
    return res.status(423).json({
      message: 'Account temporarily locked due to multiple failed attempts',
      retryAfter: lockoutInfo.remainingTime
    });
  }

  // Check for suspicious activity
  const activityCheck = suspiciousActivityDetector.recordActivity(req.ip, {
    type: 'login_attempt',
    email: sanitizedEmail,
    userAgent: req.get('User-Agent')
  });

  if (activityCheck.isSuspicious) {
    console.warn(`[SECURITY] Suspicious activity detected: IP ${req.ip}, Score: ${activityCheck.score}, Reasons: ${activityCheck.reasons.join(', ')}`);
    return res.status(429).json({
      message: 'Too many requests detected. Please try again later.',
      retryAfter: '15 minutes'
    });
  }

  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login attempt for:', sanitizedEmail);
    console.log('Expected role:', expectedRole);
    console.log('IP address:', req.ip || req.connection.remoteAddress);
    console.log('User agent:', req.get('User-Agent'));
    
    // Get databases and collections
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    const rolesCollection = usersDb.collection('roles');
    
    // Fetch user from users_web.users
    const user = await usersCollection.findOne({ email: sanitizedEmail });

    if (!user) {
      console.warn(`[SECURITY] User not found: ${sanitizedEmail}, IP: ${req.ip}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('User found:', user.email);
    
    // Secure password verification with timing attack prevention
    let isValidPassword = false;
    try {
      // Check for valid bcrypt hash in passwordHash field first
      if (user.passwordHash && typeof user.passwordHash === 'string' &&
          (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$'))) {
        isValidPassword = await securePasswordCompare(password, user.passwordHash);
      }
      // Fall back to password field if it contains a valid bcrypt hash
      else if (user.password && typeof user.password === 'string' &&
               (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
        isValidPassword = await securePasswordCompare(password, user.password);
      }
    } catch (bcryptError) {
      console.error('Password verification error:', bcryptError);
      return res.status(500).json({ message: 'Authentication error' });
    }

    if (!isValidPassword) {
      // Record failed attempt for account lockout
      const isLocked = accountLockout.recordFailedAttempt(sanitizedEmail, req.ip);

      // Record suspicious activity
      suspiciousActivityDetector.recordActivity(req.ip, {
        type: 'failed_login',
        email: sanitizedEmail,
        userAgent: req.get('User-Agent')
      });

      console.warn(`[SECURITY] Invalid password for user: ${sanitizedEmail}, IP: ${req.ip}${isLocked ? ' - ACCOUNT LOCKED' : ''}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Clear failed attempts on successful password verification
    accountLockout.clearFailedAttempts(sanitizedEmail);

    // Get user's roles by resolving role references
    let userRoles = [];
    if (user.roles) {
      // Convert role references to ObjectIds if they're strings
      const roleIds = Array.isArray(user.roles) ? 
        user.roles.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id) : 
        [typeof user.roles === 'string' ? new mongoose.Types.ObjectId(user.roles) : user.roles];

      console.log('Looking up roles with IDs:', roleIds);

      // Fetch role documents
      const roleDocs = await rolesCollection.find({
        _id: { $in: roleIds }
      }).toArray();

      console.log('Found role documents:', roleDocs);

      // Extract role names
      userRoles = roleDocs.map(role => role.name.toLowerCase());
    }

    console.log('Resolved user roles:', userRoles);

    // Check if user has the expected role
    const normalizedExpectedRole = normalizeRole(expectedRole);
    let isAuthorized = userRoles.includes(normalizedExpectedRole);
    let parentProfile = null;

    // SECURITY FIX: Strict role validation
    if (normalizedExpectedRole === 'parent') {
      // For parent login, user MUST have parent role OR have existing parent profile
      if (userRoles.includes('parent')) {
        isAuthorized = true;
        console.log('User has parent role in users_web.users');
      } else {
        // Only check for existing parent profile, DO NOT create one
        console.log('User does not have parent role, checking for existing parent profile...');
        const parentDatabases = ['parent'];
        const parentCollections = ['parent_profile'];

        for (const dbName of parentDatabases) {
          const db = mongoose.connection.useDb(dbName);
          for (const collName of parentCollections) {
            try {
              const collection = db.collection(collName);
              parentProfile = await collection.findOne({
                $or: [
                  { email: email.toLowerCase() },
                  { userId: user._id },
                  { userId: user._id.toString() }
                ]
              });

              if (parentProfile) {
                console.log(`Found existing parent profile in ${dbName}.${collName}`);
                isAuthorized = true;
                break;
              }
            } catch (err) {
              console.log(`Error checking ${dbName}.${collName}:`, err.message);
            }
          }
          if (parentProfile) break;
        }

        // SECURITY FIX: DO NOT auto-create parent profiles!
        if (!parentProfile) {
          console.warn(`[SECURITY] No parent profile found for ${sanitizedEmail}. Access denied.`);
          isAuthorized = false;
        }
      }
    } else if (normalizedExpectedRole === 'teacher') {
      // For teacher login, check teacher profile exists
      if (userRoles.includes('teacher')) {
        const teachersDb = mongoose.connection.useDb('teachers');
        const teacherProfile = await teachersDb.collection('profile').findOne({
          $or: [
            { email: email.toLowerCase() },
            { userId: user._id },
            { userId: user._id.toString() }
          ]
        });

        if (!teacherProfile) {
          console.warn(`[SECURITY] No teacher profile found for ${sanitizedEmail}. Access denied.`);
          isAuthorized = false;
        } else {
          console.log('[SECURITY] Teacher profile validated');
        }
      }
    } else if (normalizedExpectedRole === 'admin') {
      // Admin validation - must have admin role
      if (!userRoles.includes('admin')) {
        console.warn(`[SECURITY] User ${sanitizedEmail} does not have admin role. Access denied.`);
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      console.warn(`[SECURITY] Authorization failed for ${sanitizedEmail}. Expected: ${normalizedExpectedRole}, Has: ${userRoles.join(', ')}, IP: ${req.ip}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token with verified roles and parent profile ID if applicable
    const tokenPayload = { 
      id: user._id.toString(),
      email: user.email,
      roles: userRoles
    };

    if (parentProfile) {
      tokenPayload.roles = ['parent'];
      tokenPayload.profileId = parentProfile._id.toString();
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log(`[SECURITY] Login successful for: ${sanitizedEmail}, Roles: ${tokenPayload.roles.join(', ')}, IP: ${req.ip}`);
    console.log('=== END LOGIN ===');

    return res.json({
      token,
      user: { 
        id: user._id.toString(), 
        email: user.email,
        roles: tokenPayload.roles,
        ...(parentProfile && { profileId: parentProfile._id.toString() })
      }
    });

  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

/**
 * @route   POST /api/auth/update-password
 * @desc    Update user password
 * @access  Private
 */
router.post('/update-password',
  loginLimiter, // Apply rate limiting to password changes too
  authenticateToken,
  async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password does not meet complexity requirements',
        requirements: [
          'Minimum 8 characters',
          'At least one uppercase letter',
          'At least one lowercase letter',
          'At least one number',
          'At least one special character (!@#$%^&*)'
        ]
      });
    }
    
    // Get User model from users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    
    // Find the user using ID from token
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine which field has the password hash
    let passwordHash = null;
    
    if (user.passwordHash && isBcryptHash(user.passwordHash)) {
      passwordHash = user.passwordHash;
    } else if (user.password && isBcryptHash(user.password)) {
      passwordHash = user.password;
    } else {
      return res.status(500).json({ message: 'Account configuration error' });
    }
    
    // Verify current password
    let passwordIsValid = false;
    
    try {
      passwordIsValid = await bcrypt.compare(currentPassword, passwordHash);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({ message: 'Authentication error' });
    }
    
    if (!passwordIsValid) {
      console.warn(`[SECURITY] Invalid current password attempt for user: ${req.user.email || req.user.id}, IP: ${req.ip}`);
      return res.status(400).json({ message: 'Authentication failed' });
    }
    
    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12); // Using higher cost factor for better security
    
    // Update the password - always use passwordHash field for consistency
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to update password' });
    }
    
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

/**
 * @route   GET /api/auth/check-role
 * @desc    Debugging endpoint to check role resolution
 * @access  Public
 */
router.get('/check-role/:roleId', async (req, res) => {
  try {
    const roleId = req.params.roleId;
    
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: 'Invalid role ID format' });
    }
    
    const usersDb = mongoose.connection.useDb('users_web');
    const rolesCollection = usersDb.collection('roles');
    
    const role = await rolesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(roleId) 
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    return res.json({
      roleId: roleId,
      roleName: role.name,
      description: role.description
    });
  } catch (error) {
    console.error('Error checking role:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Export the router
module.exports = router;