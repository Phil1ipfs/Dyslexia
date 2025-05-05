// routes/auth/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/userModel');
const { auth } = require('../../middleware/auth');

// Login route - using functions directly within the route handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  /* ── 1. quick validation ─────────────────────────────── */
  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  try {
    console.log('🔑 Login attempt:', email);

    /* ── 2. fetch user ──────────────────────────────────── */
    console.log('Searching for user in collection: web_users');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.email);
    console.log('User roles:', user.roles);

    /* ── 3. password check with bcrypt ─────────────────── */
    let isMatch = false;
    
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log('Password check result:', isMatch ? '✅ Valid' : '❌ Invalid');
    } catch (error) {
      console.error('❌ Bcrypt error:', error.message);
      return res.status(500).json({ message: 'Password verification error' });
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
});

// Register route
router.post('/register', async (req, res) => {
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
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test password route
router.post('/test-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Test the password
    const isMatch = await bcrypt.compare(password, user.password);
    
    return res.json({ 
      isMatch,
      message: isMatch ? 'Password is valid' : 'Password is invalid',
      user: { id: user._id, email: user.email, roles: user.roles }
    });
  } catch (error) {
    console.error('Error testing password:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;