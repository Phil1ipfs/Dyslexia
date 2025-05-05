// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Use your existing User model
const User = require('../models/userModel');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  /* ── 1. quick validation ─────────────────────────────── */
  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  try {
    console.log('🔑 Login attempt:', email);

    /* ── 2. fetch user ──────────────────────────────────── */
    console.log('Searching for user in collection:', User.collection.name);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.email);
    console.log('User roles:', user.roles);

    /* ── 3. password check with bcrypt ─────────────────── */
    // FOR TESTING ONLY - Make sure password check is working properly
    // Remove this in production or set to false
    const bypassPasswordCheck = false;
    
    let isMatch = bypassPasswordCheck;
    
    if (!bypassPasswordCheck) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
        console.log('Password check result:', isMatch ? '✅ Valid' : '❌ Invalid');
      } catch (error) {
        console.error('❌ Bcrypt error:', error.message);
        return res.status(500).json({ message: 'Password verification error' });
      }
    } else {
      console.log('⚠️ DEV MODE: Password check bypassed, allowing login');
    }

    if (!isMatch) {
      console.log('❌ Wrong password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    /* ── 4. sign JWT ───────────────────────────────────── */
    const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret_key';
    
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        roles: user.roles || ['user'] 
      },
      secretKey,
      { expiresIn: '1h' }
    );

    console.log('✅ Login success for:', email);
    console.log('User roles for redirection:', user.roles);

    /* ── 5. success response ───────────────────────────── */
    return res.json({
      token,
      user: { id: user._id, email: user.email, roles: user.roles || ['user'] }
    });

  } catch (err) {
    console.error('💥 Login handler error:\n', err.stack);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate role
    const validRoles = ['parent', 'teacher', 'admin', 'user', 'magulang', 'guro'];
    const userRole = validRoles.includes(role) ? role : 'user';
    
    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      roles: [userRole]
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, roles: newUser.roles },
      process.env.JWT_SECRET_KEY || 'fallback_secret_key',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, email: newUser.email, roles: newUser.roles }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};