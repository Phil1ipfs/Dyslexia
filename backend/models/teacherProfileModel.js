// models/teacherProfileModel.js - Updated version
const mongoose = require('mongoose');
const { connectTeachersDB } = require('../config/db');

// Define the teacher profile schema
const teacherProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  contact: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  civilStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', '']
  },
  dob: {
    type: String
  },
  address: {
    type: String
  },
  emergencyContact: {
    name: String,
    number: String
  },
  passwordHash: {
    type: String
  },
  profileImageUrl: {
    type: String
  },
  profileImage: {
    data: Buffer,
    contentType: String,
    filename: String,
    uploadDate: Date
  },
  name: {
    type: String
  },
  lastPasswordChange: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'profile', // Ensure this matches your actual collection name
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
teacherProfileSchema.virtual('fullName').get(function() {
  const parts = [this.firstName];
  if (this.middleName) parts.push(this.middleName);
  parts.push(this.lastName);
  return parts.join(' ');
});

// Initialize the model (prevent duplicate model errors)
let TeacherProfile;

// Function to get the TeacherProfile model with proper connection
const getTeacherProfileModel = async () => {
  if (TeacherProfile) {
    return TeacherProfile;
  }

  try {
    // Get connection to teachers database
    const connection = await connectTeachersDB();
    
    // Create the model with this specific connection
    // Make sure we're not recreating the model if it already exists
    TeacherProfile = mongoose.models.TeacherProfile || 
                     connection.model('TeacherProfile', teacherProfileSchema);
    
    console.log('Teacher profile model initialized with collection:', 
                TeacherProfile.collection.name,
                'in database:', connection.db.databaseName);
    
    return TeacherProfile;
  } catch (error) {
    console.error('Error initializing TeacherProfile model:', error);
    throw error;
  }
};

module.exports = getTeacherProfileModel;