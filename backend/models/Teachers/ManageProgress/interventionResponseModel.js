const mongoose = require('mongoose');

/**
 * Model for the test.intervention_responses collection  
 * Records student responses to intervention assessment questions
 * Based on actual data structure from database - similar to student_responses but for interventions
 */
const interventionResponseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.Mixed, // Can be integer or string
    required: true
  },
  interventionResultsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  interventionAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  response: {
    type: mongoose.Schema.Types.Mixed, // Array with different formats per question type
    required: true
  },
  // For Phonological Awareness questions only
  correctMatches: {
    type: Number
  },
  totalMatches: {
    type: Number
  },

  // For Reading Comprehension questions only
  correctSentenceQuestions: {
    type: Number
  },
  totalSentenceQuestions: {
    type: Number
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number, // Critical for time prediction service
    required: false
  },
  answeredAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },

  // VERSION TRACKING: Critical for revision validation
  revisionNumber: {
    type: Number,
    required: true,
    default: 1, // Which version of the intervention was taken (1, 2, 3...)
    validate: {
      validator: function(v) {
        return v >= 1 && Number.isInteger(v);
      },
      message: 'Revision number must be a positive integer starting from 1'
    }
  },

  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level']
  }
}, {
  collection: 'intervention_responses'
});

// Index for performance optimization on common queries
interventionResponseSchema.index({ studentId: 1, category: 1 });
interventionResponseSchema.index({ studentId: 1, answeredAt: -1 });
interventionResponseSchema.index({ category: 1, readingLevel: 1 });

module.exports = mongoose.models.InterventionResponse || mongoose.model('InterventionResponse', interventionResponseSchema);