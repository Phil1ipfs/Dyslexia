const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const s3Client = require('./config/s3');
const app = express();

// Define userSchema at the module level so it's available throughout the file
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
    type: String, 
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users' 
});

const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true 
}));
app.use(express.json());
app.use(requestLogger);


const connectDB = async () => {
  try {
    // FIRST connect to the database
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'test',
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000
    });

    console.log('✅ MongoDB Connected to test database');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections in test:');
    collections.forEach(c => console.log(`- ${c.name}`));
    
    // NOW initialize the ManageProgress module
    const progressController = require('./controllers/Teachers/ManageProgress/progressController');
    await progressController.initializeCollections();
    
    try {
      const manageProgressRoutes = require('./routes/Teachers/ManageProgress/progressRoutes');
      app.use('/api/progress', manageProgressRoutes);
      console.log('✅ Loaded manage progress routes');
    } catch (error) {
      console.warn('⚠️ Could not load manage progress routes:', error.message);
    }

    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};


// Authentication middleware
const authenticateToken = (req, res, next) => {
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

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
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

    // Map Tagalog roles to English
    const normalizedUserRoles = userRoles.map(role => roleMap[role] || role);

    // Check if user has required role
    const hasRole = allowedRoles.some(role =>
      normalizedUserRoles.includes(role) ||
      normalizedUserRoles.includes(roleMap[role])
    );

    if (!hasRole) {
      return res.status(403).json({ message: 'Not authorized for this resource' });
    }

    next();
  };
};

// Connect to MongoDB first - then register routes after connection is established
connectDB().then(() => {
  // Create User model after connection is established
  const User = mongoose.models.User || mongoose.model('User', userSchema);

  console.log('Database connected successfully - registering routes');
  console.log('User model is targeting collection:', User.collection.name);

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

  console.log('Registering routes for /api/auth');
  try {
    app.use('/api/auth', require('./routes/auth/authRoutes'));
    console.log('✅ Loaded auth routes');
  } catch (error) {
    console.warn('⚠️ Could not load auth routes:', error.message);
  }

  try {
    app.use('/api/dashboard', require('./routes/Teachers/dashboardRoutes'));
    console.log('✅ Loaded dashboard routes');
  } catch (error) {
    console.warn('⚠️ Could not load dashboard routes:', error.message);
  }

  // Add to your existing error handling middleware at the end of server.js
  app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(500).json({ error: 'Server error', message: err.message });
  });

  try {
    app.use('/api/parents', require('./routes/Parents/parentProfile'));
    console.log('✅ Loaded parents routes');
  } catch (error) {
    console.warn('⚠️ Could not load parents routes:', error.message);
  }

  // Register roles routes right after auth routes
  try {
    app.use('/api/roles', require('./routes/rolesRoutes'));
    console.log('✅ Loaded roles routes');
  } catch (error) {
    console.warn('⚠️ Could not load roles routes:', error.message);
  }

  // Login route - adapted to work with string roles
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    /* ── 1. quick validation ─────────────────────────────── */
    if (!email || !password) {
      return res.status(400).json({ message: 'Email & password required' });
    }

    try {
      console.log('🔑 Login attempt:', email);
      console.log('Searching for user in DB:', mongoose.connection.db.databaseName);
      console.log('Collection:', User.collection.name);

      /* ── 2. fetch user ──────────────────────────────────── */
      // Extra debug logging to see what we're querying
      console.log('Query:', { email });

      const user = await User.findOne({ email });

      console.log('User query result:', user ? 'Found' : 'Not found');

      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      console.log('✅ User found:', user.email);
      console.log('User document:', JSON.stringify(user));


      /* ── 4. sign JWT ───────────────────────────────────── */
      const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret_key';

      // Handle roles which might be a string (from DB) or array (converted)
      let userRoles = user.roles;
      if (typeof userRoles === 'string') {
        userRoles = [userRoles]; // Convert string to array for consistency in token
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          roles: userRoles // Now always an array in the token
        },
        secretKey,
        { expiresIn: '1h' }
      );

      console.log('✅ Login success for:', email);
      console.log('User roles for redirection:', userRoles);

      /* ── 5. success response ───────────────────────────── */
      return res.json({
        token,
        user: { id: user._id, email: user.email, roles: userRoles }
      });

    } catch (err) {
      console.error('💥 Login handler error:\n', err.stack);
      return res.status(500).json({ message: 'Server error' });
    }
  });


  // Protected route to test authentication
  app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({
      message: 'Protected route accessed successfully',
      user: req.user
    });
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

      // Handle roles which might be a string (from DB) or array (converted)
      let userRoles = user.roles;
      if (typeof userRoles === 'string') {
        userRoles = [userRoles]; // Convert string to array for consistency
      }

      return res.json({
        isMatch,
        message: isMatch ? 'Password is valid' : 'Password is invalid',
        user: { id: user._id, email: user.email, roles: userRoles }
      });
    } catch (error) {
      console.error('Error testing password:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Try to load teacher profile routes
  try {
    app.use('/api/teachers', require('./routes/Teachers/teacherProfile'));
    console.log('✅ Loaded teacher profile routes');
  } catch (error) {
    console.warn('⚠️ Could not load teacher profile routes:', error.message);
  }

  try {
    app.use('/api/student', require('./routes/Teachers/studentRoutes'));
    console.log('✅ Loaded student routes');
  } catch (error) {
    console.warn('⚠️ Could not load student routes:', error.message);
  }

  // Try to load chatbot routes
  try {
    app.use('/api/chatbot', require('./routes/Teachers/chatbot'));
    console.log('✅ Loaded chatbot routes');
  } catch (error) {
    console.warn('⚠️ Could not load chatbot routes:', error.message);
  }
  
  // Route to handle activity updates
  try {
    app.use('/api/student', require('./routes/Teachers/dashboardRoutes'));
    console.log('✅ Loaded student activity routes');
  } catch (error) {
    console.warn('⚠️ Could not load student activity routes:', error.message);
  }
  
  app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(500).json({ error: 'Server error', message: err.message });
  });

  app.get('/', (_req, res) => res.send('API is running…'));

  app.use((req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(500).json({ error: 'Server error', message: err.message });
  });

  // Add S3 image proxy endpoint
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url) {
        return res.status(400).send('Missing URL parameter');
      }
      
      // Only allow proxying from your S3 bucket for security
      if (!url.includes('literexia-bucket.s3.ap-southeast-2.amazonaws.com')) {
        return res.status(403).send('Unauthorized image source');
      }
      
      // Fetch the image
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
      });
      
      // Set proper content type
      const contentType = response.headers['content-type'];
      res.setHeader('Content-Type', contentType);
      
      // Add cache headers
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Return the image data
      res.send(response.data);
    } catch (error) {
      console.error('Error proxying image:', error);
      res.status(404).send('Image not found');
    }
  });

  // Start server on the specified port
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to connect to database. Server not started.', err);
});