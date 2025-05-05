// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
    console.log('Password in DB:', user.password ? 'Hash present' : 'No password');

    /* ── 3. password check (dev bypass vs real bcrypt) ── */
    // DEV MODE – bypass password check (this works for testing):
    const isMatch = true;
    console.log('⚠️ DEV MODE: Password check bypassed, allowing login');

    // PROD MODE – use bcrypt compare (uncomment for production):
    // let isMatch = false;
    // try {
    //   isMatch = await bcrypt.compare(password, user.password);
    //   console.log('Password check result:', isMatch ? '✅ Valid' : '❌ Invalid');
    // } catch (error) {
    //   console.error('❌ Bcrypt error:', error.message);
    //   return res.status(500).json({ message: 'Password verification error' });
    // }

    if (!isMatch) {
      console.log('❌ Wrong password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    /* ── 4. sign JWT ───────────────────────────────────── */
    const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret_key';
    console.log(`Using JWT Secret: ${secretKey.substring(0, 3)}...`);
    
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles || ['user'] },
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