// config/db.js
const mongoose = require('mongoose');
const Models = require('../models');
require('dotenv').config();

let models = null;
let mainConnection = null;

// Connect to the MongoDB server
const connectToMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      throw new Error('MONGO_URI is not defined');
    }
    
    console.log('Connecting to MongoDB...');
    
    // Create the main connection to MongoDB
    mainConnection = await mongoose.connect(mongoUri, {
      dbName: 'users_web', // Default to users_web database
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000
    });
    
    console.log('✅ Connected to MongoDB server');
    
    // Create models for all databases
    models = Models.createModels(mongoose.connection);
    
    // Check database connections
    await checkDatabaseConnections();
    
    return { connection: mainConnection, models };
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Check that all database connections are working
const checkDatabaseConnections = async () => {
  console.log('Checking database connections...');
  
  try {
    // Test users_web connection - use parent profile collection
    const parentCount = await models.ParentProfile.estimatedDocumentCount();
    console.log(`✅ Connected to users_web database (${parentCount} parent profiles)`);
    
    // Test test database connection - use students collection
    const studentCount = await models.Student.estimatedDocumentCount();
    console.log(`✅ Connected to test database (${studentCount} students)`);
    
    // Test mobile_literexia connection - use user responses collection
    const responseCount = await models.UserResponse.estimatedDocumentCount();
    console.log(`✅ Connected to mobile_literexia database (${responseCount} assessment responses)`);
    
    console.log('All database connections verified successfully');
  } catch (error) {
    console.error('❌ Error checking database connections:', error);
    throw error;
  }
};

// Get models for use in routes
const getModels = () => {
  if (!models) {
    throw new Error('Database connection not initialized. Call connectToMongoDB() first.');
  }
  return models;
};

// Close database connection when application exits
const closeDatabaseConnection = async () => {
  if (mainConnection) {
    try {
      await mongoose.disconnect();
      console.log('✅ MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }
};

const mainConnection   = mongoose.createConnection(process.env.MONGO_URI, { dbName: 'users_web' });
const testConnection   = mongoose.createConnection(process.env.MONGO_URI, { dbName: 'test' });
const mobileConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: 'mobile_literexia' });

// Setup event handlers for graceful shutdown
process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

module.exports = {
  connectToMongoDB,
  getModels,
  closeDatabaseConnection
};