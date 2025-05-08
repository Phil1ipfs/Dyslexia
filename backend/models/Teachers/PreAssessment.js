// models/PreAssessment.js
const mongoose = require('mongoose');

const preAssessmentResponseSchema = new mongoose.Schema({
  assessmentId: Number,
  userId: String,
  answers: Object,
  score: Number,
  readingLevel: String,
  readingPercentage: Number,
  completedAt: Date
}, { collection: 'user_responses' });

module.exports = mongoose.model('PreAssessmentResponse', preAssessmentResponseSchema, 'Pre_Assessment.user_responses');