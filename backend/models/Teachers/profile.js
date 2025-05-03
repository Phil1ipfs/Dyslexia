// models/Teachers/profile.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for emergency contact information
const EmergencyContactSchema = new mongoose.Schema({
  name: String,
  number: String
}, { _id: false });

// Main teacher profile schema with S3 image URL
const TeacherProfileSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say', '']
  },
  civilStatus: {
    type: String,
    enum: ['Single', 'Married', '']
  },
  dob: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  profileImageUrl: {
    type: String,
    default: null,
    get: function(value) {
      // Convert "null" string to actual null value
      return value === "null" ? null : value;
    },
    set: function(value) {
      // Convert null to null string (for compatibility)
      return value === null ? null : value;
    }
  },
  // Legacy image storage (for backward compatibility)
  profileImage: {
    data: Buffer,
    contentType: String,
    filename: String,
    uploadDate: Date
  },
  emergencyContact: {
    type: EmergencyContactSchema,
    default: () => ({})
  },
  passwordHash: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastPasswordChange: {
    type: Date,
    default: null
  }
});

// Add a virtual property for the full name
TeacherProfileSchema.virtual('fullName').get(function() {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to update the updatedAt timestamp
TeacherProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // If passwordHash is modified, update lastPasswordChange
  if (this.isModified('passwordHash')) {
    this.lastPasswordChange = Date.now();
  }
  
  // Ensure name is always up to date
  if (this.isModified('firstName') || this.isModified('middleName') || this.isModified('lastName')) {
    this.name = [this.firstName, this.middleName, this.lastName]
      .filter(part => part && part.trim())
      .join(' ');
  }
  
  next();
});

// Ensure virtuals are included when converting to JSON
TeacherProfileSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Convert "null" string to actual null for profileImageUrl
    if (ret.profileImageUrl === "null") {
      ret.profileImageUrl = null;
    }
    return ret;
  }
});

TeacherProfileSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Convert "null" string to actual null for profileImageUrl
    if (ret.profileImageUrl === "null") {
      ret.profileImageUrl = null;
    }
    return ret;
  }
});

// IMPORTANT: Specify the collection name explicitly
module.exports = mongoose.model('TeacherProfile', TeacherProfileSchema, 'profile');