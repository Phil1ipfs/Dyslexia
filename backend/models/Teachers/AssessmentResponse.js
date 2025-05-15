// models/Teachers/AssessmentResponse.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assessmentResponseSchema = new Schema({
  assessmentId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  categoryId: {
    type: Number,
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  readingLevel: {
    type: String,
    required: true
  },
  startTime: Date,
  endTime: Date,
  completed: {
    type: Boolean,
    default: false
  },
  answers: {
    type: Map,
    of: String
  },
  rawScore: Number,
  totalQuestions: {
    type: Number,
    default: 0
  },
  percentageScore: Number,
  passed: Boolean,
  attemptNumber: {
    type: Number,
    default: 0
  },
  correctAnswers: [String],
  incorrectAnswers: [String],
  timeSpent: {
    type: Number,
    default: 0
  },
  completedAt: Date,
  reviewedAt: Date,
  teacherFeedback: String,
  teacherReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    // This references a teacher in the users_web.users collection
  },
  nextSteps: String
}, {
  collection: 'assessment_responses'
});

// Use the test database connection
module.exports = mongoose.connection.useDb('test').model('AssessmentResponse', assessmentResponseSchema);
