// routes/auth/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { auth } = require('../../middleware/auth'); // Import auth middleware
const router = express.Router();

/**
 * Checks if a string is a valid bcrypt hash
 * @param {string} str - String to check
 * @returns {boolean} - True if valid bcrypt hash
 */
const isBcryptHash = (str) => {
  return typeof str === 'string' && /^\$2[abxy]\$\d+\$/.test(str);
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login attempt for:', email);
    console.log('Password provided:', password ? `${password.substring(0, 3)}...` : 'none');
    
    // Get User model from users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    
    // Fetch user
    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.log('User not found:', email);
      // Use consistent error messages to prevent username enumeration
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', user.email);
    console.log('User document:', JSON.stringify(user));
    
    // Determine which field contains the password hash
    let passwordHash = null;
    
    if (user.passwordHash && isBcryptHash(user.passwordHash)) {
      passwordHash = user.passwordHash;
      console.log('Using passwordHash field for verification:', user.passwordHash.substring(0, 10) + '...');
    } else if (user.password && isBcryptHash(user.password)) {
      passwordHash = user.password;
      console.log('Using password field for verification (contains hash):', user.password.substring(0, 10) + '...');
    } else {
      console.error('No valid password hash found for user:', email);
      return res.status(500).json({ message: 'Account configuration error' });
    }
    
    // Verify the password using bcrypt
    let passwordIsValid = false;
    
    try {
      console.log('Comparing password with hash using bcrypt...');
      passwordIsValid = await bcrypt.compare(password, passwordHash);
      console.log('bcrypt comparison result:', passwordIsValid ? 'Valid' : 'Invalid');
      
      if (!passwordIsValid) {
        console.log('FAILED LOGIN: Invalid password for user:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      return res.status(500).json({ message: 'Authentication error' });
    }

    console.log('Password verification successful');
    
    // Get user roles
    let userRoles = [];
    
    if (user.roles) {
      if (mongoose.Types.ObjectId.isValid(user.roles)) {
        console.log('Role is a valid ObjectId:', user.roles);
        
        // Fetch the role from roles collection
        const rolesCollection = usersDb.collection('roles');
        const role = await rolesCollection.findOne({ _id: new mongoose.Types.ObjectId(user.roles) });
        
        if (role && role.name) {
          userRoles.push(role.name);
          console.log('Resolved role from ObjectId:', role.name);
        } else {
          // If role name not found, use the ID as fallback
          userRoles.push(user.roles);
          console.log('Using role ID as fallback:', user.roles);
        }
      } else if (typeof user.roles === 'string') {
        userRoles = [user.roles];
        console.log('Role is a string:', user.roles);
      } else if (Array.isArray(user.roles)) {
        userRoles = user.roles;
        console.log('Roles is an array:', user.roles);
      } else if (user.roles.$oid) {
        console.log('Role is in MongoDB extended JSON format:', user.roles.$oid);
        
        // It's an ObjectId in extended JSON format
        const rolesCollection = usersDb.collection('roles');
        const role = await rolesCollection.findOne({ _id: new mongoose.Types.ObjectId(user.roles.$oid) });
        
        if (role && role.name) {
          userRoles.push(role.name);
          console.log('Resolved role from $oid:', role.name);
        } else {
          userRoles.push(user.roles.$oid);
          console.log('Using role $oid as fallback:', user.roles.$oid);
        }
      }
    }
    
    console.log('Final user roles array:', userRoles);

    // Sign JWT with proper secret key from environment variables
    const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret_key';
    
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        roles: userRoles
      },
      secretKey,
      { 
        expiresIn: '1h',
        issuer: 'literexia-api'
      }
    );

    console.log('Login successful for:', email);
    console.log('=== END LOGIN ===');

    // Success response
    return res.json({
      token,
      user: { 
        id: user._id.toString(), 
        email: user.email, 
        roles: userRoles 
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
router.post('/update-password', auth, async (req, res) => {
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
      return res.status(400).json({ message: 'Current password is incorrect' });
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

module.exports = router;