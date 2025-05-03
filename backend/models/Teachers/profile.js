// models/Teachers/profile.js
const mongoose = require('mongoose');

// Schema for emergency contact information
const EmergencyContactSchema = new mongoose.Schema({
  name: String,
  number: String
}, { _id: false });

// Profile image schema with support for storing images directly in MongoDB
const ProfileImageSchema = new mongoose.Schema({
  data: {
    type: Buffer,  
    required: false
  },
  contentType: {
    type: String,   
    required: false
  },
  filename: {
    type: String,   
    required: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Main teacher profile schema with integrated profile image
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

  civilStatus: { type: String, enum: ['Single','Married',''] },

  dob: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  // Using the profile image schema to store the image data in MongoDB
  profileImage: {
    type: ProfileImageSchema,
    default: null
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
  
  next();
});

// Virtual property to get profile image URL for the frontend
TeacherProfileSchema.virtual('profileImageUrl').get(function () {
  // we check contentType instead of data, because contentType is kept
  if (this.profileImage && this.profileImage.contentType) {
    return `/api/teachers/profile/image/${this._id}`;
  }
  return null;
});

// Ensure virtuals are included when converting to JSON
TeacherProfileSchema.set('toJSON', { virtuals: true });
TeacherProfileSchema.set('toObject', { virtuals: true });

// Explicitly use collection name 'profile'
module.exports = mongoose.model('profile', TeacherProfileSchema, 'profile');