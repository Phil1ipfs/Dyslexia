// config/db.js - Multiple database connections
const mongoose = require('mongoose');

// Connect to auth database
const connectAuthDB = async () => {
  try {
    const authConnection = await mongoose.createConnection(
      'mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0',
      { dbName: 'test' }
    );
    console.log('✅ Auth DB Connected');
    return authConnection;
  } catch (err) {
    console.error('❌ Auth DB connection failed:', err.message);
    throw err;
  }
};

// Connect to teacher database
const connectTeacherDB = async () => {
  try {
    const teacherConnection = await mongoose.createConnection(
      'mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/teachers?retryWrites=true&w=majority&appName=Cluster0',
      { dbName: 'teachers' }
    );
    console.log('✅ Teacher DB Connected');
    return teacherConnection;
  } catch (err) {
    console.error('❌ Teacher DB connection failed:', err.message);
    throw err;
  }
};

// Function to connect to all databases
const connectDB = async () => {
  try {
    const connections = {
      authDB: await connectAuthDB(),
      teacherDB: await connectTeacherDB()
    };
    return connections;
  } catch (err) {
    console.error('Failed to connect to databases:', err);
    process.exit(1);
  }
};

module.exports = connectDB;