// models/Teachers/ManageProgress/interventionResponseModel.js
const mongoose = require('mongoose');

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
    type: String,
    required: true
  },
  selectedChoice: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number,
    default: 0,
    comment: 'Response time in seconds'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'intervention_responses'
});

const InterventionResponse = mongoose.models.InterventionResponse || mongoose.model('InterventionResponse', interventionResponseSchema);

module.exports = InterventionResponse;