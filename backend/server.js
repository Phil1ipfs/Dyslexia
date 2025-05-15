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

// Apply middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  // Check if URL has /api/api pattern
  if (req.url.startsWith('/api/api/')) {
    // Remove one /api prefix
    req.url = req.url.replace('/api/api/', '/api/');
    console.log(`[URL Rewritten] ${req.method} ${req.url}`);
  }

  // Path proxy for direct API requests that should be routed to student or assessment routes
  if (req.url === '/api/students' || req.url.startsWith('/api/students?')) {
    // Forward to /api/student/students
    req.url = req.url.replace('/api/students', '/api/student/students');
    console.log(`[Path Proxied] ${req.method} ${req.url}`);
  }
  else if (req.url.startsWith('/api/assessment-assignments/')) {
    // Forward to /api/student/assessment-assignments/
    req.url = req.url.replace('/api/assessment-assignments/', '/api/student/assessment-assignments/');
    console.log(`[Path Proxied] ${req.method} ${req.url}`);
  }
  else if (req.url.startsWith('/api/category-progress/')) {
    // Forward to /api/student/category-progress/
    req.url = req.url.replace('/api/category-progress/', '/api/student/category-progress/');
    console.log(`[Path Proxied] ${req.method} ${req.url}`);
  }
  else if (req.url.startsWith('/api/reading-level-progression/')) {
    // Forward to /api/student/reading-level-progression/
    req.url = req.url.replace('/api/reading-level-progression/', '/api/student/reading-level-progression/');
    console.log(`[Path Proxied] ${req.method} ${req.url}`);
  }

  next();
});

// Helper function to convert string IDs to MongoDB ObjectId
const toObjectId = (id) => {
  return new mongoose.Types.ObjectId(id);
};

// Enhanced logging middleware to debug route issues
const requestLogger = (req, res, next) => {
  const originalUrl = req.originalUrl;
  console.log(`[${new Date().toISOString()}] ${req.method} ${originalUrl}`);

  // Track response for logging
  const originalSend = res.send;
  res.send = function (body) {
    // Log status code on response
    console.log(`[${new Date().toISOString()}] ${req.method} ${originalUrl} - Status: ${res.statusCode}`);
    return originalSend.call(this, body);
  };

  next();
};

app.use(requestLogger);

// Define database connection
const connectDB = async () => {
  try {
    // First try Atlas connection
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'users_web',
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000
    });

    console.log('✅ MongoDB Connected to users_web database via Atlas');
    return true;
  } catch (atlasErr) {
    console.warn('⚠️ MongoDB Atlas connection failed:', atlasErr.message);

    try {
      // Try local MongoDB as a fallback
      console.log('Attempting to connect to local MongoDB...');
      await mongoose.connect('mongodb://localhost:27017/users_web', {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000
      });

      console.log('✅ MongoDB Connected to users_web database via local MongoDB');
      return true;
    } catch (localErr) {
      console.error('❌ All MongoDB connection attempts failed:');
      console.error('Atlas error:', atlasErr.message);
      console.error('Local error:', localErr.message);
      return false;
    }
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
      'magulang': 'parent',
      'admin': 'admin',
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

  // Debug route to test the API connection
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });

  // URL debug route to help troubleshoot path issues
  app.get('/api/debug-url', (req, res) => {
    res.json({
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      query: req.query,
      hostname: req.hostname,
      protocol: req.protocol,
      headers: req.headers
    });
  });

  // Debug route to list all registered routes
  app.get('/api/routes-debug', (req, res) => {
    const routes = [];

    // This will get all registered routes
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        // Routes registered directly
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        // Router middleware
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            const path = handler.route.path;
            routes.push({
              path: middleware.regexp.toString().includes('/api')
                ? `/api${path}`
                : path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });

    res.json({
      registered_routes: routes,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl
    });
  });



  // Add this to your server.js file directly, after your middleware definitions

  // Direct endpoint handlers for category progress
  app.get('/api/category-progress/:id', async (req, res) => {
    try {
      const studentId = req.params.id;
      console.log(`Direct endpoint handler for category progress: ${studentId}`);

      const testDb = mongoose.connection.useDb('test');
      const categoryProgressCollection = testDb.collection('category_progress');

      // Try to find existing progress
      let progress;
      try {
        // Try with ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          progress = await categoryProgressCollection.findOne({
            userId: new mongoose.Types.ObjectId(studentId)
          });
        }

        // If not found, try with string ID
        if (!progress && typeof studentId === 'string') {
          progress = await categoryProgressCollection.findOne({
            userId: studentId
          });
        }
      } catch (findError) {
        console.error('Error finding category progress:', findError);
      }

      // If progress exists, return it
      if (progress) {
        return res.json(progress);
      }

      // Get student info to help create initial progress
      let student;
      try {
        const usersCollection = testDb.collection('users');

        if (mongoose.Types.ObjectId.isValid(studentId)) {
          student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
        }

        if (!student && typeof studentId === 'string') {
          student = await usersCollection.findOne({
            $or: [
              { idNumber: studentId },
              { email: studentId }
            ]
          });
        }
      } catch (userError) {
        console.warn('Error finding student:', userError);
      }

      // Create a new progress record
      const now = new Date();
      const readingLevel = student?.readingLevel || 'Not Assessed';

      const newProgress = {
        userId: mongoose.Types.ObjectId.isValid(studentId)
          ? new mongoose.Types.ObjectId(studentId)
          : studentId,
        studentName: student?.name || student?.firstName || `Student ${studentId}`,
        readingLevel: readingLevel,
        categories: [
          {
            categoryId: 1,
            categoryName: "Alphabet Knowledge",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 2,
            categoryName: "Phonological Awareness",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 3,
            categoryName: "Decoding",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 4,
            categoryName: "Word Recognition",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 5,
            categoryName: "Reading Comprehension",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "locked"
          }
        ],
        completedCategories: 0,
        totalCategories: 5,
        overallProgress: 0,
        nextCategory: {
          categoryId: 1,
          categoryName: "Alphabet Knowledge",
          assessmentId: null
        },
        createdAt: now,
        updatedAt: now
      };

      try {
        // Try to insert the new progress record
        const result = await categoryProgressCollection.insertOne(newProgress);
        console.log(`Created new category progress with ID: ${result.insertedId}`);

        // Add the _id field to the object before returning
        newProgress._id = result.insertedId;
        return res.json(newProgress);
      } catch (insertError) {
        console.error('Error creating category progress:', insertError);

        // Return the object even if we failed to save it to the database
        return res.json(newProgress);
      }
    } catch (error) {
      console.error('Error in category progress endpoint:', error);

      // Return a default object even if everything fails
      const defaultProgress = {
        userId: req.params.id,
        categories: [],
        completedCategories: 0,
        totalCategories: 5,
        overallProgress: 0,
        nextCategory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json(defaultProgress);
    }
  });

  // Also handle the student-specific path with the SAME HANDLER
  // This avoids the infinite recursion issue
  app.get('/api/student/category-progress/:id', async (req, res) => {
    // Use the exact same logic as the main handler
    try {
      const studentId = req.params.id;
      console.log(`Student API endpoint handler for category progress: ${studentId}`);

      const testDb = mongoose.connection.useDb('test');
      const categoryProgressCollection = testDb.collection('category_progress');

      // Try to find existing progress
      let progress;
      try {
        // Try with ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          progress = await categoryProgressCollection.findOne({
            userId: new mongoose.Types.ObjectId(studentId)
          });
        }

        // If not found, try with string ID
        if (!progress && typeof studentId === 'string') {
          progress = await categoryProgressCollection.findOne({
            userId: studentId
          });
        }
      } catch (findError) {
        console.error('Error finding category progress:', findError);
      }

      // If progress exists, return it
      if (progress) {
        return res.json(progress);
      }

      // Get student info to help create initial progress
      let student;
      try {
        const usersCollection = testDb.collection('users');

        if (mongoose.Types.ObjectId.isValid(studentId)) {
          student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
        }

        if (!student && typeof studentId === 'string') {
          student = await usersCollection.findOne({
            $or: [
              { idNumber: studentId },
              { email: studentId }
            ]
          });
        }
      } catch (userError) {
        console.warn('Error finding student:', userError);
      }

      // Create a new progress record
      const now = new Date();
      const readingLevel = student?.readingLevel || 'Not Assessed';

      const newProgress = {
        userId: mongoose.Types.ObjectId.isValid(studentId)
          ? new mongoose.Types.ObjectId(studentId)
          : studentId,
        studentName: student?.name || student?.firstName || `Student ${studentId}`,
        readingLevel: readingLevel,
        categories: [
          {
            categoryId: 1,
            categoryName: "Alphabet Knowledge",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 2,
            categoryName: "Phonological Awareness",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 3,
            categoryName: "Decoding",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 4,
            categoryName: "Word Recognition",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "pending"
          },
          {
            categoryId: 5,
            categoryName: "Reading Comprehension",
            preAssessmentCompleted: false,
            preAssessmentScore: null,
            preAssessmentDate: null,
            mainAssessmentCompleted: false,
            mainAssessmentId: null,
            mainAssessmentScore: null,
            passed: false,
            passingThreshold: 75,
            attemptCount: 0,
            lastAttemptDate: null,
            completionDate: null,
            status: "locked"
          }
        ],
        completedCategories: 0,
        totalCategories: 5,
        overallProgress: 0,
        nextCategory: {
          categoryId: 1,
          categoryName: "Alphabet Knowledge",
          assessmentId: null
        },
        createdAt: now,
        updatedAt: now
      };

      try {
        // Try to insert the new progress record
        const result = await categoryProgressCollection.insertOne(newProgress);
        console.log(`Created new category progress with ID: ${result.insertedId}`);

        // Add the _id field to the object before returning
        newProgress._id = result.insertedId;
        return res.json(newProgress);
      } catch (insertError) {
        console.error('Error creating category progress:', insertError);

        // Return the object even if we failed to save it to the database
        return res.json(newProgress);
      }
    } catch (error) {
      console.error('Error in student category progress endpoint:', error);

      // Return a default object even if everything fails
      const defaultProgress = {
        userId: req.params.id,
        categories: [],
        completedCategories: 0,
        totalCategories: 5,
        overallProgress: 0,
        nextCategory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json(defaultProgress);
    }
  });


  app.get('/api/student/category-progress/:id', async (req, res) => {
    console.log(`Redirecting from /api/student/category-progress/${req.params.id} to main handler`);
    req.url = `/api/category-progress/${req.params.id}`;
    app._router.handle(req, res);
  });

  // Route to initialize collections
  app.post('/api/debug/init-collections', async (req, res) => {
    try {
      const result = await initializeCollections();

      if (result) {
        res.json({
          success: true,
          message: 'Collections initialized successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error initializing collections'
        });
      }
    } catch (error) {
      console.error('Error initializing collections:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing collections',
        error: error.message
      });
    }
  });

  // Simple home route
  app.get('/', (_req, res) => res.send('API is running…'));

  // Register all route modules
  console.log('Registering routes...');

  // Auth routes
  try {
    app.use('/api/auth', require('./routes/auth/authRoutes'));
    console.log('✅ Loaded auth routes');
  } catch (error) {
    console.warn('⚠️ Could not load auth routes:', error.message);
  }

  // Dashboard routes
  try {
    app.use('/api/dashboard', require('./routes/Teachers/dashboardRoutes'));
    console.log('✅ Loaded dashboard routes');
  } catch (error) {
    console.warn('⚠️ Could not load dashboard routes:', error.message);
  }

  // Parent routes
  try {
    app.use('/api/parents', require('./routes/Parents/parentProfile'));
    console.log('✅ Loaded parents routes');
  } catch (error) {
    console.warn('⚠️ Could not load parents routes:', error.message);
  }

  // Roles routes
  try {
    app.use('/api/roles', require('./routes/rolesRoutes'));
    console.log('✅ Loaded roles routes');
  } catch (error) {
    console.warn('⚠️ Could not load roles routes:', error.message);
  }

  // Teacher profile routes
  try {
    app.use('/api/teachers', require('./routes/Teachers/teacherProfile'));
    console.log('✅ Loaded teacher profile routes');
  } catch (error) {
    console.warn('⚠️ Could not load teacher profile routes:', error.message);
  }

  // Student routes
  try {
    app.use('/api/student', require('./routes/Teachers/studentRoutes'));
    console.log('✅ Loaded student routes');
  } catch (error) {
    console.warn('⚠️ Could not load student routes:', error.message);
  }

  // Assessment routes
  try {
    app.use('/api/assessment', require('./routes/Teachers/assessmentRoutes'));
    console.log('✅ Loaded assessment routes');
  } catch (error) {
    console.warn('⚠️ Could not load assessment routes:', error.message);
  }


  // Teacher progress routes
  try {
    app.use('/api/teacher/progress', require('./routes/Teachers/progressRoutes'));
    console.log('✅ Loaded teacher progress routes');
  } catch (error) {
    console.warn('⚠️ Could not load teacher progress routes:', error.message);
  }


  // Teacher progress routes
  try {
    app.use('/api/teacher/progress', require('./routes/Teachers/progressRoutes'));
    console.log('✅ Loaded teacher progress routes');




    // Add API route for main assessments
    app.get('/api/teacher/progress/main-assessments', async (req, res) => {
      try {
        const testDb = mongoose.connection.useDb('test');
        const assessmentsCollection = testDb.collection('main_assessment');

        const mainAssessments = await assessmentsCollection.find({}).toArray();

        res.json(mainAssessments || []);
      } catch (error) {
        console.error('Error fetching main assessments:', error);
        res.status(500).json({
          message: 'Error retrieving main assessments',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.warn('⚠️ Could not load teacher progress routes:', error.message);
  }

  try {
    app.use('/api/student', require('./routes/Teachers/categoryProgressRoutes'));
    console.log('✅ Loaded category progress routes');
  } catch (error) {
    console.warn('⚠️ Could not load category progress routes:', error.message);
  }


  // Content provider routes
  try {
    app.use('/api/teacher/content', require('./routes/Teachers/contentProviderRoutes'));
    console.log('✅ Loaded content provider routes');
  } catch (error) {
    console.warn('⚠️ Could not load content provider routes:', error.message);
  }

  // Customized assessment routes
  try {
    app.use('/api/teacher/customized-assessment', require('./routes/Teachers/customizedAssessmentRoutes'));
    console.log('✅ Loaded customized assessment routes');
  } catch (error) {
    console.warn('⚠️ Could not load customized assessment routes:', error.message);
  }

  // Chatbot routes
  try {
    app.use('/api/chatbot', require('./routes/Teachers/chatbot'));
    console.log('✅ Loaded chatbot routes');
  } catch (error) {
    console.warn('⚠️ Could not load chatbot routes:', error.message);
  }

  // Special student assessment routes
  // Add these routes after the standard student routes
  try {
    // These routes need to match the pattern in StudentApiService
    const studentAssessmentRouter = express.Router();

    // Route for category progress
    studentAssessmentRouter.get('/category-progress/:id', async (req, res) => {
      const studentId = req.params.id;
      console.log(`Student category progress endpoint called for ID: ${studentId}`);

      try {
        const testDb = mongoose.connection.useDb('test');
        const categoryProgressCollection = testDb.collection('category_progress');

        // Get student's category progress
        const categoryProgress = await categoryProgressCollection.findOne({
          userId: toObjectId(studentId)
        });

        if (!categoryProgress) {
          return res.status(404).json({
            message: 'Category progress not found'
          });
        }

        res.json(categoryProgress);
      } catch (error) {
        console.error(`Error getting category progress for ID ${studentId}:`, error);
        res.status(500).json({
          message: 'Error retrieving category progress',
          error: error.message
        });
      }
    });

    // Route for student assessment API pattern
    studentAssessmentRouter.get('/assessment/:id', async (req, res) => {
      const studentId = req.params.id;
      console.log(`Student assessment endpoint called for ID: ${studentId}`);

      try {
        const testDb = mongoose.connection.useDb('test');
        const responsesCollection = testDb.collection('assessment_responses');
        const categoryProgressCollection = testDb.collection('category_progress');

        // Get student's responses
        const responses = await responsesCollection.find({
          userId: toObjectId(studentId),
          completed: true
        }).toArray();

        // Get student's category progress
        const categoryProgress = await categoryProgressCollection.findOne({
          userId: toObjectId(studentId)
        });

        // Create assessment summary from responses and progress
        const assessmentSummary = {
          studentId: studentId,
          completedAt: responses.length > 0 ? responses[0].completedAt : new Date(),
          readingLevel: categoryProgress?.readingLevel || "Not Assessed",
          categoryScores: [],
          totalScore: 0,
          maxScore: 0,
          totalPercentage: 0,
          recommendations: []
        };

        // Create category scores from responses
        if (responses.length > 0) {
          // Group responses by category
          const categoriesMap = {};

          responses.forEach(resp => {
            if (!categoriesMap[resp.categoryId]) {
              categoriesMap[resp.categoryId] = {
                categoryId: resp.categoryId,
                categoryName: resp.categoryName,
                score: 0,
                maxScore: 0,
                responses: []
              };
            }

            categoriesMap[resp.categoryId].responses.push(resp);
          });

          // Calculate scores for each category
          for (const [categoryId, category] of Object.entries(categoriesMap)) {
            // Use latest response for each category
            category.responses.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
            const latestResponse = category.responses[0];

            category.score = latestResponse.rawScore || 0;
            category.maxScore = latestResponse.totalQuestions || 0;
            category.percentage = category.maxScore > 0 ? (category.score / category.maxScore) * 100 : 0;

            // Add to category scores
            assessmentSummary.categoryScores.push({
              categoryId: parseInt(categoryId),
              categoryName: category.categoryName,
              score: category.score,
              maxScore: category.maxScore,
              percentage: category.percentage
            });

            // Add to total scores
            assessmentSummary.totalScore += category.score;
            assessmentSummary.maxScore += category.maxScore;
          }

          // Calculate total percentage
          assessmentSummary.totalPercentage = assessmentSummary.maxScore > 0 ? (assessmentSummary.totalScore / assessmentSummary.maxScore) * 100 : 0;
        } else if (categoryProgress && categoryProgress.categories) {
          // If no responses, use category progress data if available
          categoryProgress.categories.forEach(cat => {
            if (cat.mainAssessmentScore !== null) {
              assessmentSummary.categoryScores.push({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                score: (cat.mainAssessmentScore / 100) * 5, // Estimate a score out of 5
                maxScore: 5, // Assume 5 questions per category
                percentage: cat.mainAssessmentScore || 0
              });

              // Add to total scores
              assessmentSummary.totalScore += (cat.mainAssessmentScore / 100) * 5;
              assessmentSummary.maxScore += 5;
            }
          });

          // Calculate total percentage
          assessmentSummary.totalPercentage = categoryProgress.overallProgress || 0;
        }

        // Add basic recommendations based on scores
        if (assessmentSummary.categoryScores.length > 0) {
          // Find weakest category
          assessmentSummary.categoryScores.sort((a, b) => a.percentage - b.percentage);
          const weakestCategory = assessmentSummary.categoryScores[0];

          if (weakestCategory.percentage < 60) {
            assessmentSummary.recommendations.push({
              categoryId: weakestCategory.categoryId,
              categoryName: weakestCategory.categoryName,
              message: `Focus on improving skills in ${weakestCategory.categoryName}`,
              priority: 'high'
            });
          }
        }

        res.json(assessmentSummary);
      } catch (error) {
        console.error(`Error getting student assessment for ID ${studentId}:`, error);
        res.status(500).json({
          message: 'Error retrieving student assessment',
          error: error.message
        });
      }
    });


    // Content routes
    try {
      app.use('/api/content', require('./routes/Teachers/contentRoutes'));
      console.log('✅ Loaded content routes');
    } catch (error) {
      console.warn('⚠️ Could not load content routes:', error.message);
    }

    // Route for student progress
    studentAssessmentRouter.get('/progress/:id', async (req, res) => {
      const studentId = req.params.id;
      console.log(`Student progress endpoint called for ID: ${studentId}`);

      try {
        const testDb = mongoose.connection.useDb('test');
        const responsesCollection = testDb.collection('assessment_responses');
        const categoryProgressCollection = testDb.collection('category_progress');
        const usersCollection = testDb.collection('users');

        // Get student info
        const student = await usersCollection.findOne({
          _id: toObjectId(studentId)
        });

        // Get student's category progress
        const categoryProgress = await categoryProgressCollection.findOne({
          userId: toObjectId(studentId)
        });

        // Get student's responses
        const responses = await responsesCollection.find({
          userId: toObjectId(studentId),
          completed: true
        }).toArray();

        // Create progress summary
        const progressSummary = {
          studentId: studentId,
          readingLevel: student?.readingLevel || "Not Assessed",
          progressPoints: 0,
          totalAssessments: responses.length,
          completedAssessments: responses.length,
          averageScore: 0,
          categories: [],
          lastUpdated: new Date()
        };

        // Calculate average score
        if (responses.length > 0) {
          const totalScore = responses.reduce((sum, resp) => sum + (resp.percentageScore || 0), 0);
          progressSummary.averageScore = totalScore / responses.length;

          // Sort responses by most recent
          responses.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
          progressSummary.lastUpdated = responses[0].completedAt || new Date();
        }

        // Add category progress
        if (categoryProgress && categoryProgress.categories) {
          progressSummary.categories = categoryProgress.categories.map(cat => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            status: cat.status,
            score: cat.mainAssessmentScore,
            passed: cat.passed,
            completionDate: cat.completionDate
          }));

          progressSummary.progressPoints = categoryProgress.overallProgress || 0;
        }

        res.json(progressSummary);
      } catch (error) {
        console.error(`Error getting student progress for ID ${studentId}:`, error);
        res.status(500).json({
          message: 'Error retrieving student progress',
          error: error.message
        });
      }
    });

    // Apply the router to student API path
    app.use('/api/student', studentAssessmentRouter);
    console.log('✅ Loaded student assessment routes');
  } catch (error) {
    console.warn('⚠️ Could not load student assessment routes:', error.message);
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

  // S3 image proxy endpoint
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

  // 404 handler should come after all routes
  app.use((req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Route not found' });
  });

  // Global error handler with more detailed information - MUST be last
  app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Prepare response
    const response = {
      error: 'Server error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    };

    res.status(statusCode).json(response);
  });

  // Start server on the specified port
  const PORT = process.env.PORT || 5002;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Print registered routes
    console.log("\n=== Registered Routes ===");
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        console.log(`Direct route: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        const basePath = middleware.regexp.toString();
        console.log(`Router at: ${basePath}`);

        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            console.log(`  - ${Object.keys(handler.route.methods)} ${handler.route.path}`);
          }
        });
      }
    });
    console.log("=======================\n");
  });
}).catch(err => {
  console.error('Failed to connect to database. Server not started.', err);
});


// Initialize database collections if they don't exist
const initializeCollections = async () => {
  console.log('Ensuring required collections exist...');

  try {
    // Test DB collections
    const testDb = mongoose.connection.useDb('test');

    // Check if main_assessment collection exists, if not create it
    const collections = await testDb.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('main_assessment')) {
      console.log('Creating main_assessment collection...');
      await testDb.createCollection('main_assessment');
      console.log('main_assessment collection created');

      const assessmentData = JSON.parse(fs.readFileSync('./data/test.main_assessment.json', 'utf8'));
      if (assessmentData && assessmentData.length > 0) {
        await testDb.collection('main_assessment').insertMany(assessmentData);
        console.log('Inserted test assessment data');
      }
    }

    // Check for other collections
    const requiredCollections = [
      'assessment_assignments',
      'assessment_responses',
      'category_progress',
      'reading_level_progression',
      'student_profile_updates'
    ];

    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        console.log(`Creating ${collection} collection...`);
        await testDb.createCollection(collection);
        console.log(`${collection} collection created`);
      }
    }

    // Pre_Assessment DB collections
    const preAssessmentDb = mongoose.connection.useDb('Pre_Assessment');
    const preAssessmentCollections = await preAssessmentDb.listCollections().toArray();
    const preAssessmentCollectionNames = preAssessmentCollections.map(c => c.name);

    const preAssessmentRequiredCollections = [
      'assessment_categories',
      'letters_collection',
      'syllables_collection',
      'words_collection',
      'sentences_collection',
      'shortstory_collection',
      'question_types'
    ];

    for (const collection of preAssessmentRequiredCollections) {
      if (!preAssessmentCollectionNames.includes(collection)) {
        console.log(`Creating ${collection} collection in Pre_Assessment...`);
        await preAssessmentDb.createCollection(collection);
        console.log(`${collection} collection created in Pre_Assessment`);

        // Add test data from JSON files if available
        try {
          const dataFile = `./data/Pre_Assessment.${collection}.json`;
          if (fs.existsSync(dataFile)) {
            const collectionData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            if (collectionData && collectionData.length > 0) {
              await preAssessmentDb.collection(collection).insertMany(collectionData);
              console.log(`Inserted test data into ${collection}`);
            }
          }
        } catch (dataError) {
          console.warn(`Error loading test data for ${collection}:`, dataError);
        }
      }
    }

    console.log('Database collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    return false;
  }
};

app.get('/api/debug/check-collections', async (req, res) => {
  try {
    const testDb = mongoose.connection.useDb('test');
    const preAssessmentDb = mongoose.connection.useDb('Pre_Assessment');

    const testCollections = await testDb.listCollections().toArray();
    const testCollectionNames = testCollections.map(c => c.name);

    const preAssessmentCollections = await preAssessmentDb.listCollections().toArray();
    const preAssessmentCollectionNames = preAssessmentCollections.map(c => c.name);

    const requiredTestCollections = [
      'main_assessment',
      'assessment_assignments',
      'assessment_responses',
      'category_progress',
      'reading_level_progression',
      'student_profile_updates'
    ];

    const requiredPreAssessmentCollections = [
      'assessment_categories',
      'letters_collection',
      'syllables_collection',
      'words_collection',
      'sentences_collection',
      'shortstory_collection',
      'question_types'
    ];

    const missingTestCollections = requiredTestCollections.filter(c => !testCollectionNames.includes(c));
    const missingPreAssessmentCollections = requiredPreAssessmentCollections.filter(c => !preAssessmentCollectionNames.includes(c));

    const missingCollections = [
      ...missingTestCollections.map(c => `test.${c}`),
      ...missingPreAssessmentCollections.map(c => `Pre_Assessment.${c}`)
    ];

    res.json({
      status: missingCollections.length === 0 ? 'complete' : 'incomplete',
      missingCollections
    });
  } catch (error) {
    console.error('Error checking collections:', error);
    res.status(500).json({
      message: 'Error checking collections',
      error: error.message
    });
  }
});


// Direct endpoint handler for prescriptive recommendations
app.get('/api/assessment/prescriptive-recommendations/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`Getting prescriptive recommendations for student: ${studentId}`);
    
    const testDb = mongoose.connection.useDb('test');
    const recommendationsCollection = testDb.collection('prescriptive_recommendations');
    
    // Try to find existing recommendations
    let recommendations = [];
    try {
      // Try with ObjectId if valid
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        recommendations = await recommendationsCollection.find({
          userId: new mongoose.Types.ObjectId(studentId)
        }).toArray();
      }
      
      // If not found, try with string ID
      if ((!recommendations || recommendations.length === 0) && typeof studentId === 'string') {
        recommendations = await recommendationsCollection.find({
          userId: studentId
        }).toArray();
      }
    } catch (findError) {
      console.error('Error finding prescriptive recommendations:', findError);
    }
    
    // If recommendations exist, return them
    if (recommendations && recommendations.length > 0) {
      return res.json(recommendations);
    }
    
    // Get student info to help create initial recommendations
    let student;
    try {
      const usersCollection = testDb.collection('users');
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        student = await usersCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(studentId) 
        });
      }
      
      if (!student && typeof studentId === 'string') {
        student = await usersCollection.findOne({
          $or: [
            { idNumber: studentId },
            { email: studentId }
          ]
        });
      }
    } catch (userError) {
      console.warn('Error finding student:', userError);
    }
    
    // Try to get category progress to help generate recommendations
    let categoryProgress;
    try {
      const categoryProgressCollection = testDb.collection('category_progress');
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        categoryProgress = await categoryProgressCollection.findOne({
          userId: new mongoose.Types.ObjectId(studentId)
        });
      }
      
      if (!categoryProgress && typeof studentId === 'string') {
        categoryProgress = await categoryProgressCollection.findOne({
          userId: studentId
        });
      }
    } catch (progressError) {
      console.warn('Error finding category progress:', progressError);
    }
    
    // Create default recommendation based on student and progress data
    const now = new Date();
    const readingLevel = student?.readingLevel || categoryProgress?.readingLevel || 'Transitioning';
    
    // Create recommendations based on categories that need improvement
    const defaultRecommendations = [];
    
    if (categoryProgress && categoryProgress.categories) {
      // Find categories that need attention (score < 75 or not completed)
      const categoriesNeedingAttention = categoryProgress.categories.filter(cat => 
        !cat.passed && cat.status !== 'locked'
      );
      
      // Create a recommendation for each category needing attention
      categoriesNeedingAttention.forEach(category => {
        const newRecommendation = {
          _id: new mongoose.Types.ObjectId(),
          userId: mongoose.Types.ObjectId.isValid(studentId) 
            ? new mongoose.Types.ObjectId(studentId) 
            : studentId,
          title: `Improve ${category.categoryName} Skills`,
          category: category.categoryName,
          categoryId: category.categoryId,
          description: `Activities to help improve skills in ${category.categoryName}.`,
          status: "pending",
          priorityLevel: "medium",
          readingLevel: readingLevel,
          activities: [
            {
              id: `activity-${category.categoryId}-1`,
              title: `Practice ${category.categoryName}`,
              description: `Interactive activities for ${category.categoryName} at ${readingLevel} level.`,
              type: "practice",
              status: "pending",
              timeEstimate: 15,
              instructions: `Complete the following activities to improve your ${category.categoryName} skills.`,
              contentReferences: []
            }
          ],
          contentReferences: [],
          isCustom: false,
          questionIds: [],
          notes: `Generated automatically for ${category.categoryName}.`,
          generatedAt: now,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          updatedBy: null
        };
        
        defaultRecommendations.push(newRecommendation);
      });
    }
    
    // If we couldn't generate recommendations from categories, provide a generic one
    if (defaultRecommendations.length === 0) {
      const genericRecommendation = {
        _id: new mongoose.Types.ObjectId(),
        userId: mongoose.Types.ObjectId.isValid(studentId) 
          ? new mongoose.Types.ObjectId(studentId) 
          : studentId,
        title: "Improve Reading Skills",
        category: "General",
        description: "Activities to help improve overall reading skills.",
        status: "pending",
        priorityLevel: "medium",
        readingLevel: readingLevel,
        activities: [
          {
            id: `activity-general-1`,
            title: "Reading Practice",
            description: `Reading practice activities at ${readingLevel} level.`,
            type: "practice",
            status: "pending",
            timeEstimate: 20,
            instructions: "Read the provided materials and answer the questions.",
            contentReferences: []
          }
        ],
        contentReferences: [],
        isCustom: false,
        questionIds: [],
        notes: "Generic recommendation for reading improvement.",
        generatedAt: now,
        createdBy: null,
        createdAt: now,
        updatedAt: now,
        updatedBy: null
      };
      
      defaultRecommendations.push(genericRecommendation);
    }
    
    // Try to insert the recommendations into the database
    try {
      if (defaultRecommendations.length > 0) {
        await recommendationsCollection.insertMany(defaultRecommendations);
        console.log(`Created ${defaultRecommendations.length} new recommendations for student ${studentId}`);
      }
    } catch (insertError) {
      console.error('Error inserting recommendations:', insertError);
      // Continue with returning the recommendations even if insertion fails
    }
    
    // Return the recommendations
    res.json(defaultRecommendations);
  } catch (error) {
    console.error('Error in prescriptive recommendations endpoint:', error);
    
    // Return empty array as fallback
    res.json([]);
  }
});

// Direct endpoint for reading level progression
app.get('/api/reading-level-progression/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`Getting reading level progression for student: ${studentId}`);
    
    const testDb = mongoose.connection.useDb('test');
    const readingLevelCollection = testDb.collection('reading_level_progression');
    const usersCollection = testDb.collection('users');
    
    // Try to find progression first
    let progressionQuery = {};
    
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      progressionQuery.userId = new mongoose.Types.ObjectId(studentId);
    } else {
      // Try numeric ID if not valid ObjectId
      const studentIdNum = parseInt(studentId);
      if (!isNaN(studentIdNum)) {
        // If we're dealing with a numeric ID, we need to find the user first to get the ObjectId
        const user = await usersCollection.findOne({ idNumber: studentIdNum });
        if (user) {
          progressionQuery.userId = user._id;
        } else {
          progressionQuery.userId = studentId; // Fallback to using the string directly
        }
      } else {
        progressionQuery.userId = studentId;
      }
    }
    
    let progression = await readingLevelCollection.findOne(progressionQuery);
    
    // If not found, try to create a new progression
    if (!progression) {
      console.log(`No reading level progression found, checking if student exists`);
      
      // Try to find the student in users collection
      let student = null;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        student = await usersCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(studentId) 
        });
      } 
      
      if (!student) {
        const studentIdNum = parseInt(studentId);
        if (!isNaN(studentIdNum)) {
          student = await usersCollection.findOne({ idNumber: studentIdNum });
        }
      }
      
      // If student exists, create a new progression for them
      if (student) {
        console.log(`Found student, creating new reading level progression`);
        const readingLevel = student.readingLevel || 'Transitioning';
        const now = new Date();
        
        const newProgression = {
          userId: student._id,
          currentReadingLevel: readingLevel,
          initialReadingLevel: readingLevel,
          levelHistory: [{
            readingLevel: readingLevel,
            startDate: now
          }],
          advancementRequirements: calculateAdvancementRequirements(readingLevel),
          overallProgress: 0,
          createdAt: now,
          updatedAt: now
        };
        
        try {
          // Insert into database
          const result = await readingLevelCollection.insertOne(newProgression);
          newProgression._id = result.insertedId;
          
          console.log(`Created new reading level progression with ID: ${result.insertedId}`);
          return res.json(newProgression);
        } catch (insertError) {
          console.error('Error creating reading level progression:', insertError);
          return res.json(newProgression);
        }
      } else {
        // If student doesn't exist, create a placeholder record
        console.log(`Student not found, creating placeholder progression`);
        
        // Determine if this is a student ID that isn't in ObjectId format
        const userId = mongoose.Types.ObjectId.isValid(studentId) ?
          new mongoose.Types.ObjectId(studentId) : studentId;
          
        const now = new Date();
        const readingLevel = 'Transitioning'; // Default to transitioning as that's what UI expects
        
        const placeholderProgression = {
          userId: userId,
          currentReadingLevel: readingLevel,
          initialReadingLevel: readingLevel,
          levelHistory: [{
            readingLevel: readingLevel,
            startDate: now
          }],
          advancementRequirements: calculateAdvancementRequirements(readingLevel),
          overallProgress: 0,
          createdAt: now,
          updatedAt: now
        };
        
        try {
          // Insert into database
          const result = await readingLevelCollection.insertOne(placeholderProgression);
          placeholderProgression._id = result.insertedId;
          
          console.log(`Created placeholder reading level progression with ID: ${result.insertedId}`);
          return res.json(placeholderProgression);
        } catch (insertError) {
          console.error('Error creating placeholder progression:', insertError);
          // If we can't even create a placeholder, return something that matches the schema
          return res.json(placeholderProgression);
        }
      }
    }
    
    // Return existing progression
    return res.json(progression);
  } catch (error) {
    console.error('Error in getProgression:', error);
    
    // Create a default progression as fallback
    const now = new Date();
    const defaultProgression = {
      userId: req.params.id,
      currentReadingLevel: 'Transitioning',
      initialReadingLevel: 'Transitioning',
      levelHistory: [{
        readingLevel: 'Transitioning',
        startDate: now
      }],
      advancementRequirements: {
        currentLevel: 'Transitioning',
        nextLevel: 'At Grade Level',
        requiredCategories: [4, 5],
        completedCategories: [],
        remainingCategories: [4, 5]
      },
      overallProgress: 0,
      createdAt: now,
      updatedAt: now
    };
    
    res.json(defaultProgression);
  }
});

// Helper function for reading level progression
function calculateAdvancementRequirements(currentLevel) {
  const nextLevelMap = {
    'Low Emerging': 'High Emerging',
    'High Emerging': 'Developing',
    'Developing': 'Transitioning',
    'Transitioning': 'At Grade Level',
    'At Grade Level': 'At Grade Level',
    'Not Assessed': 'Low Emerging'
  };
  
  const requiredCategoriesMap = {
    'Low Emerging': [1, 2, 3],      // Alphabet Knowledge, Phonological Awareness, Decoding
    'High Emerging': [2, 3, 4],     // Phonological Awareness, Decoding, Word Recognition
    'Developing': [3, 4, 5],        // Decoding, Word Recognition, Reading Comprehension
    'Transitioning': [4, 5],        // Word Recognition, Reading Comprehension
    'At Grade Level': [5],          // Reading Comprehension
    'Not Assessed': [1, 2, 3]       // Same as Low Emerging
  };
  
  return {
    currentLevel: currentLevel,
    nextLevel: nextLevelMap[currentLevel] || 'Transitioning',
    requiredCategories: requiredCategoriesMap[currentLevel] || [4, 5],
    completedCategories: [],
    remainingCategories: requiredCategoriesMap[currentLevel] || [4, 5]
  };
}