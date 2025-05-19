const mongoose = require('mongoose');

/**
 * Model for the test.intervention_progress collection
 * Tracks student progress through intervention plans
 */
const interventionProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interventionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterventionPlan',
    required: true
  },
  completedActivities: {
    type: Number,
    default: 0
  },
  totalActivities: {
    type: Number,
    required: true
  },
  percentComplete: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  percentCorrect: {
    type: Number,
    default: 0
  },
  passedThreshold: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'intervention_progress'
});

module.exports = mongoose.models.InterventionProgress || mongoose.model('InterventionProgress', interventionProgressSchema);