// models/parentProfileModel.js
const mongoose = require('mongoose');
const { connectParentDB } = require('../../config/db');

// Define the parent profile schema
const parentProfileSchema = new mongoose.Schema({
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
  address: {
    type: String
  },
  passwordHash: {
    type: String
  },
  childrenInfo: [{
    name: String,
    age: Number,
    grade: String,
    school: String
  }],
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
  }
}, {
  timestamps: true,
  collection: 'profile', // Match your existing collection name
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
parentProfileSchema.virtual('fullName').get(function() {
  const parts = [this.firstName];
  if (this.middleName) parts.push(this.middleName);
  parts.push(this.lastName);
  return parts.join(' ');
});

// Initialize the model (prevent duplicate model errors)
let ParentProfile;

// Function to get the ParentProfile model with proper connection
const getParentProfileModel = async () => {
  if (ParentProfile) {
    return ParentProfile;
  }

  try {
    // Get connection to parent database
    const connection = await connectParentDB();
    
    // Create the model with this specific connection
    ParentProfile = connection.model('ParentProfile', parentProfileSchema);
    
    return ParentProfile;
  } catch (error) {
    console.error('Error initializing ParentProfile model:', error);
    throw error;
  }
};

module.exports = getParentProfileModel;