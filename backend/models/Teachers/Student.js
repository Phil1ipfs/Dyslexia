// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  idNumber: {
    type: Number,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  middleName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  age: {
    type: Number,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Not specified'],
    default: 'Not specified'
  },
  birthDate: {
    type: Date,
    default: null
  },
  gradeLevel: {
    type: String,
    default: 'Grade 1'
  },

  address: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  completedLessons: {
    type: [Number],
    default: []
  },
  // Reading assessment fields
  readingLevel: {
    type: String,
    enum: [
      'Low Emerging', 
      'High Emerging', 
      'Developing', 
      'Transitioning', 
      'At Grade Level', 
      'Early', 
      'Emergent', 
      'Fluent', 
      'Advanced', 
      'Not Assessed'
    ],
    default: 'Not Assessed'
  },
  readingPercentage: {
    type: Number,
    default: 0
  },
  preAssessmentCompleted: {
    type: Boolean,
    default: false
  },
  lastAssessmentDate: {
    type: Date,
    default: null
  },
  // Parent relationship
  parentId: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  collection: 'users', 
  timestamps: true
});

// Virtual property for full name (useful but not stored in DB)
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName || ''}`.trim();
});

// Helper method to get reading level class
studentSchema.methods.getReadingLevelClass = function() {
  if (!this.readingLevel || this.readingLevel === 'Not Assessed') return 'reading-level-not-assessed';
  
  switch(this.readingLevel.toLowerCase()) {
    case 'low emerging':
    case 'high emerging':
    case 'early':
      return 'reading-level-early';
    case 'developing':
    case 'emergent':
    case 'transitioning':
      return 'reading-level-developing';
    case 'fluent':
    case 'at grade level':
      return 'reading-level-fluent';
    case 'advanced':
      return 'reading-level-advanced';
    default:
      return 'reading-level-not-assessed';
  }
};

module.exports = mongoose.model('Student', studentSchema);