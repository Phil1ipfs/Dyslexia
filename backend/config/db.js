// config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the main database
const connectDB = async () => {
  try {
    // Check if MONGO_URI is defined
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      throw new Error('MONGO_URI is not defined');
    }

    console.log('Attempting to connect to MongoDB...');
    
    // Connect to the main database
    const conn = await mongoose.connect(mongoUri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000
    });
    
    console.log(`✅ MongoDB Connected to ${conn.connection.host}`);
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

// Specialized function to connect to teachers database
const connectTeachersDB = async () => {
  try {
    // First, ensure we have a basic connection
    await connectDB();
    
    const mongoUri = process.env.MONGO_URI;
    
    // Create a separate connection specifically for teachers database
    const teachersConn = await mongoose.createConnection(mongoUri, {
      dbName: 'teachers', // Explicitly connect to 'teachers' database
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000
    });
    
    console.log(`✅ Connected to teachers database`);
    return teachersConn;
  } catch (err) {
    console.error('❌ Teachers database connection failed:', err.message);
    throw err;
  }
};

// For backward compatibility
module.exports = {
  connectDB,
  connectTeachersDB,
  connectParentDB: connectDB,
  connectMainDB: connectDB,
  connectAdminDB: connectDB,
  connectPreAssessmentDB: connectDB,
  connectAllDatabases: async () => {
    const connection = await connectDB();
    return { mainDB: connection };
  }
};