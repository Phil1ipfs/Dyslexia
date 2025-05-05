const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const s3Client = require('./config/s3');
const app = express();

// Enhanced logging middleware to debug route issues
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

// Apply middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // allow your frontend origin
  credentials: true // allow cookies and credentials
}));
app.use(express.json());
app.use(requestLogger);

// Define database connection
const connectDB = async () => {
  try {
    // Explicitly set the database name to 'test'
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'test'
    });
    
    console.log('✅ MongoDB Connected');
    
    // List all collections for debugging
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(c => console.log(`- ${c.name}`));
    
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

// Define user schema for authentication
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    default: ['user']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'web_users' // Explicitly set the collection name
});

// User model (create only if not already defined)
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Password hash utility route
app.post('/api/auth/hash-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Find the user by email
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user's password
      user.password = hashedPassword;
      await user.save();
      return res.json({ 
        message: 'Password updated successfully',
        hashedPassword,
        user: { id: user._id, email: user.email, roles: user.roles }
      });
    } else {
      // Create a new user if they don't exist
      user = new User({
        email,
        password: hashedPassword,
        roles: ['user'] // Default role
      });
      
      await user.save();
      return res.json({ 
        message: 'User created successfully',
        hashedPassword,
        user: { id: user._id, email: user.email, roles: user.roles }
      });
    }
  } catch (error) {
    console.error('Error hashing password:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  /* ── 1. quick validation ─────────────────────────────── */
  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  try {
    console.log('🔑 Login attempt:', email);
    console.log('Searching for user in collection: web_users');

    /* ── 2. fetch user ──────────────────────────────────── */
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.email);
    console.log('User roles:', user.roles);

    /* ── 3. password check (dev bypass vs real bcrypt) ── */
    // DEV MODE – bypass password check:
    const isMatch = true;
    console.log('⚠️ DEV MODE: Password check bypassed, allowing login');

    // PROD MODE – use bcrypt compare:
    // const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('❌ Wrong password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    /* ── 4. sign JWT ───────────────────────────────────── */
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles || ['user'] },
      process.env.JWT_SECRET_KEY || 'fallback_secret_key',
      { expiresIn: '1h' }
    );

    console.log('✅ Login success for:', email);

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

// Test password verification route
app.post('/api/auth/test-password', async (req, res) => {
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

// Connect to MongoDB first - then register routes after connection is established
connectDB().then(() => {
  console.log('Database connected successfully - registering routes');

  // Test S3 connection
  if (s3Client.testS3Connection) {
    s3Client.testS3Connection()
      .then(success => {
        if (success) {
          console.log('S3 bucket configuration is working correctly');
        } else {
          console.warn('S3 bucket connection failed - image uploads may not work');
        }
      })
      .catch(err => console.error('Error testing S3 connection:', err));
  }

  // Test route to verify server is running
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });

  // Apply routes with explicit logging
  console.log('Registering routes for /api/teachers');
  app.use('/api/teachers', require('./routes/Teachers/teacherProfile')); 
  app.use('/api/chatbot', require('./routes/Teachers/chatbot'));

  // Register additional authentication routes
  console.log('Registering routes for /api/auth');
  app.use('/api/auth', require('./routes/auth/authRoutes'));

  // Simple home route
  app.get('/', (_req, res) => res.send('API is running…'));

  // List all registered routes for debugging
  app._router.stack.forEach((middleware) => {
    if(middleware.route) { // Routes registered directly on the app
      console.log(`Route: ${Object.keys(middleware.route.methods).join(',')} ${middleware.route.path}`);
    } else if(middleware.name === 'router') { // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if(handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods).join(',');
          console.log(`Route: ${methods} ${middleware.regexp} ${path}`);
        }
      });
    }
  });

  // Handle 404 errors
  app.use((req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(500).json({ error: 'Server error', message: err.message });
  });

  // Start server on the specified port
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to connect to database. Server not started.', err);
});