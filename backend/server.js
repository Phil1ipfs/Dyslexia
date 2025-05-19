// server.js - Main Express application
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const s3Client = require('./config/s3');
const app = express();
const PORT = process.env.PORT || 5002;

// Apply middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Add pre-flight handling for all routes
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Test route to verify server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Define database connection with better error handling
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017', {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });

    console.log('MongoDB Connected:', mongoose.connection.host);
    
    // Test database connections
    const testDb = mongoose.connection.useDb('test');
    const teachersDb = mongoose.connection.useDb('teachers');
    const parentDb = mongoose.connection.useDb('parent');
    
    // Verify collections exist
    const collections = {
      test: [],
      teachers: [],
      parent: []
    };

    try {
      // Get collections for each database
      const [testCols, teacherCols, parentCols] = await Promise.all([
        testDb.db.listCollections().toArray(),
        teachersDb.db.listCollections().toArray(),
        parentDb.db.listCollections().toArray()
      ]);
      
      collections.test = testCols;
      collections.teachers = teacherCols;
      collections.parent = parentCols;
    } catch (error) {
      console.error('Error listing collections:', error);
    }

    console.log('\nVerifying database structure:');
    console.log('test database collections:', collections.test.map(c => c.name));
    console.log('teachers database collections:', collections.teachers.map(c => c.name));
    console.log('parent database collections:', collections.parent.map(c => c.name));

    // Test collection counts
    const counts = {
      students: 0,
      teachers: 0,
      parents: 0
    };

    try {
      [counts.students, counts.teachers, counts.parents] = await Promise.all([
        testDb.collection('users').countDocuments(),
        teachersDb.collection('profile').countDocuments(),
        parentDb.collection('parent_profile').countDocuments()
      ]);
    } catch (error) {
      console.error('Error counting documents:', error);
    }

    console.log('\nInitial collection counts:');
    console.log('- Students (test/users):', counts.students);
    console.log('- Teachers (teachers/profile):', counts.teachers);
    console.log('- Parents (parent/parent_profile):', counts.parents);
    console.log('Total users:', counts.students + counts.teachers + counts.parents);

    console.log('\n✅ Database setup complete');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Connect to MongoDB first
connectDB().then(async (connected) => {
  if (!connected) {
    console.error('Failed to connect to database. Server not started.');
    process.exit(1);
  }

  // Register routes
  try {
    // Register auth routes first
    const authRouter = require('./routes/auth/authRoutes');
    app.use('/api/auth', authRouter);
    console.log('✅ Auth routes registered at /api/auth/*');

    // Register admin routes
    const teacherRoutes = require('./routes/Admin/teacherRoutes');
    app.use('/api/admin/manage', teacherRoutes);
    console.log('✅ Teacher and student routes registered at /api/admin/manage/*');

    // Register parent routes
    const parentRoutes = require('./routes/Parents/parentProfile');
    app.use('/api/parents', parentRoutes);
    console.log('✅ Parent routes registered at /api/parents/*');

    // Register admin profile routes
    const adminProfileRoutes = require('./routes/Admin/adminProfile');
    const adminDashboardRoutes = require('./routes/Admin/adminDashboard');
    app.use('/api/admin', adminProfileRoutes);
    app.use('/api/dashboard', adminDashboardRoutes);
    console.log('✅ Admin routes registered at /api/admin/* and /api/dashboard/*');

    // Add a test route for the students endpoint
    app.get('/api/admin/manage/students/test', (req, res) => {
      res.json({ message: 'Students endpoint is accessible' });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`\n✅ Server is running on port ${PORT}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error registering routes:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  }
});