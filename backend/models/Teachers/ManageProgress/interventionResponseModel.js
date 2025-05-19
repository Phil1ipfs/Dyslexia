const mongoose = require('mongoose');

/**
 * Model for the test.intervention_responses collection
 * Records student responses to intervention activities
 */
const interventionResponseSchema = new mongoose.Schema({
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
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedChoice: {
    type: String
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'intervention_responses'
});

module.exports = mongoose.models.InterventionResponse || mongoose.model('InterventionResponse', interventionResponseSchema);