const mongoose = require('mongoose');

/**
 * Model for the test.category_results collection
 * Stores assessment results by category for students
 */
const categoryResultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['post-assessment', 'intervention'],
    required: true
  },
  readingLevel: {
    type: String,
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  categories: [{
    categoryName: {
      type: String,
      required: true,
      enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    isPassed: {
      type: Boolean,
      required: true
    },
    passingThreshold: {
      type: Number,
      default: 75
    }
  }],
  overallScore: {
    type: Number,
    required: true
  },
  allCategoriesPassed: {
    type: Boolean,
    required: true
  },
  readingLevelUpdated: {
    type: Boolean,
    default: false
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
  collection: 'category_results'
});

module.exports = mongoose.models.CategoryResult || mongoose.model('CategoryResult', categoryResultSchema);