// controllers/authController.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuditLogger = require('../middleware/auditLogger');

/**
 * Login controller with proper security validation
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  /* ── 1. Basic validation ─────────────────────────────── */
  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  try {
    console.log('🔑 Login attempt for email hash:', email ? email.substring(0, 3) + '***' : 'unknown');
    
    // Get User model from users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    
    /* ── 2. Fetch user ──────────────────────────────────── */
    console.log('Searching for user in users_web.users collection');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      // Use consistent messaging to prevent email enumeration
      console.log('❌ User not found for login attempt');

      // Audit log failed login attempt
      await AuditLogger.logAuth('unknown_user', 'LOGIN_FAILED', req, false, 'User not found');

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found with ID:', user._id.toString());
    
    /* ── 3. Check password ───────────────────────────────── */
    // Determine which field has the password hash
    let passwordField = null;
    let passwordHash = null;
    
    if (user.passwordHash) {
      passwordField = 'passwordHash';
      passwordHash = user.passwordHash;
    } else if (user.password) {
      passwordField = 'password';
      passwordHash = user.password;
    }
    
    if (!passwordHash) {
      console.error('No password hash found for user:', email);
      return res.status(500).json({ message: 'Account configuration error' });
    }
    
    console.log(`Using ${passwordField} field for password verification`);
    
    let passwordIsValid = false;
    
    // Verify the password using bcrypt - NEVER use test password in production
    if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$')) {
      try {
        passwordIsValid = await bcrypt.compare(password, passwordHash);
        console.log('Password bcrypt comparison result:', passwordIsValid ? 'Valid' : 'Invalid');
      } catch (bcryptError) {
        console.error('Bcrypt error:', bcryptError);
        return res.status(500).json({ message: 'Authentication error' });
      }
    } else {
      // If password isn't hashed with bcrypt, it's invalid
      console.error('Invalid password hash format for user ID:', user._id.toString());
      return res.status(500).json({ message: 'Account configuration error' });
    }
    
    if (!passwordIsValid) {
      console.log('❌ Invalid password for user ID:', user._id.toString());

      // Log failed attempt but use consistent messaging
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $inc: { failedLoginAttempts: 1 },
          $set: { lastFailedLogin: new Date() }
        }
      );

      // Audit log failed login attempt
      await AuditLogger.logAuth(user._id.toString(), 'LOGIN_FAILED', req, false, 'Invalid password');

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    /* ── 4. Reset failed login attempts on success ───────── */
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          failedLoginAttempts: 0,
          lastSuccessfulLogin: new Date() 
        } 
      }
    );

    /* ── 5. Get user roles ───────────────────────────────── */
    // Look up the role in the roles collection if it's an ObjectId
    let userRoles = [];
    
    if (user.roles) {
      if (user.roles.$oid) {
        // It's an ObjectId reference - look it up in the roles collection
        const rolesCollection = usersDb.collection('roles');
        const role = await rolesCollection.findOne({ _id: new mongoose.Types.ObjectId(user.roles.$oid) });
        
        if (role && role.name) {
          userRoles.push(role.name);
        }
      } else if (typeof user.roles === 'string') {
        userRoles = [user.roles];
      } else if (Array.isArray(user.roles)) {
        userRoles = user.roles;
      }
    }
    
    console.log('User roles:', userRoles);

    /* ── 6. Sign JWT with appropriate options ───────────── */
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
      console.error('JWT_SECRET environment variable is required');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        roles: userRoles
      },
      secretKey,
      { 
        expiresIn: '1h',
        issuer: 'literexia-api',
        subject: user._id.toString()
      }
    );

    console.log('✅ Login success for user ID:', user._id.toString());
    console.log('User roles for redirection:', userRoles);

    // Audit log successful login
    await AuditLogger.logAuth(user._id.toString(), 'LOGIN_SUCCESS', req, true);

    /* ── 7. Success response ───────────────────────────── */
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        roles: userRoles
      }
    });

  } catch (err) {
    console.error('💥 Login handler error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Change password function with proper validation
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Validate password complexity - at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password does not meet security requirements',
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
    
    // Find the user
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine which field has the password hash
    let passwordField = null;
    let passwordHash = null;
    
    if (user.passwordHash) {
      passwordField = 'passwordHash';
      passwordHash = user.passwordHash;
    } else if (user.password) {
      passwordField = 'password';
      passwordHash = user.password;
    }
    
    if (!passwordHash) {
      return res.status(500).json({ message: 'Account configuration error' });
    }
    
    // Verify current password
    let passwordIsValid = false;
    
    if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$')) {
      try {
        passwordIsValid = await bcrypt.compare(currentPassword, passwordHash);
      } catch (bcryptError) {
        console.error('Bcrypt error:', bcryptError);
        return res.status(500).json({ message: 'Authentication error' });
      }
    }
    
    if (!passwordIsValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12); // Use higher cost factor for better security
    
    // Update the password - always use passwordHash field for consistency
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordHash: newPasswordHash,
          passwordUpdatedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      // Audit log failed password change
      await AuditLogger.logAuth(req.user.id, 'PASSWORD_CHANGE', req, false, 'Database update failed');
      return res.status(500).json({ message: 'Failed to update password' });
    }

    // Audit log successful password change
    await AuditLogger.logAuth(req.user.id, 'PASSWORD_CHANGE', req, true);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};