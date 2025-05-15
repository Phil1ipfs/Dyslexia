// models/Teachers/MainAssessment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define schemas
const optionSchema = new Schema({
  optionId: {
    type: String,
    required: true
  },
  optionText: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  explanation: String
}, { _id: false });

const questionSchema = new Schema({
  questionId: {
    type: Number,
    required: true
  },
  questionNumber: Number,
  questionText: {
    type: String,
    required: true
  },
  typeId: {
    type: String,
    required: true
  },
  contentReference: {
    collection: String,
    contentId: mongoose.Schema.Types.ObjectId
  },
  hasImage: {
    type: Boolean,
    default: false
  },
  imageUrl: String,
  imageAlt: String,
  hasAudio: {
    type: Boolean,
    default: false
  },
  displayedText: String,
  options: [optionSchema],
  pointValue: {
    type: Number,
    default: 1
  }
}, { _id: false });

const feedbackSettingsSchema = new Schema({
  showExplanation: {
    type: Boolean,
    default: true
  },
  showCorrectAnswer: {
    type: Boolean,
    default: true
  },
  immediatePerQuestionFeedback: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const mainAssessmentSchema = new Schema({
  assessmentId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  categoryID: {
    type: Number,
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  targetReadingLevel: {
    type: String,
    required: true
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  passingThreshold: {
    type: Number,
    default: 75
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  questions: [questionSchema],
  instructions: String,
  feedbackSettings: {
    type: feedbackSettingsSchema,
    default: {
      showExplanation: true,
      showCorrectAnswer: true,
      immediatePerQuestionFeedback: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
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
  collection: 'main_assessment'
});

// Export the model directly (fixed the circular dependency)
module.exports = mongoose.model('MainAssessment', mainAssessmentSchema);