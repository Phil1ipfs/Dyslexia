const mongoose = require('mongoose');
const User = require('../../userModel');

/**
 * Model for the test.category_results collection
 * Stores assessment results by category for students
 */
const categoryResultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.Mixed, // Can be string or number
    required: true
  },
  assessmentDate: {
    type: Date,
    required: true
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
      default: 0
    },
    // For Phonological Awareness - matching questions
    totalPossibleMatches: {
      type: Number
    },
    correctMatches: {
      type: Number
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
    },
    isCompleted: {
      type: Boolean,
      required: true
    },
    lastQuestionAnswered: {
      type: String
    },
    // Intervention fields
    interventionRequired: {
      type: Boolean,
      default: false
    },
    interventionAttempts: {
      type: Number,
      default: 0
    },
    interventionCompleted: {
      type: Boolean,
      default: false
    },
    currentInterventionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    interventionHistory: [{
      attemptNumber: {
        type: Number,
        required: true
      },
      interventionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      interventionResultId: {
        type: mongoose.Schema.Types.ObjectId,
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
      attemptedAt: {
        type: Date,
        required: true
      },
      completedAt: {
        type: Date,
        required: true
      }
    }]
  }],
  overallScore: {
    type: Number,
    required: true
  },
  completedCategories: {
    type: Number,
    required: true
  },
  totalCategories: {
    type: Number,
    required: true
  },
  allCategoriesPassed: {
    type: Boolean,
    required: true
  },
  readingLevel: {
    type: String,
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

// Update the updatedAt field before saving
categoryResultSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});



const PrescriptiveAnalysisService = require('../../../services/Teachers/PrescriptiveAnalysisService');

// After a new category result is saved, generate prescriptive analyses
categoryResultSchema.post('save', async function(doc) {
  try {
    // Import service
    const PrescriptiveAnalysisService = require('../../../services/Teachers/PrescriptiveAnalysisService');
    
    console.log(`CategoryResult post-save hook triggered for student ${doc.studentId}`);
    
    // Step 1: Ensure the student has analysis records for all categories
    await PrescriptiveAnalysisService.ensureStudentHasAllAnalyses(
      doc.studentId, 
      doc.readingLevel || 'Low Emerging'
    );
    
    // Step 2: Generate analyses based on the category result
    await PrescriptiveAnalysisService.generateAnalysesFromCategoryResults(
      doc.studentId,
      doc
    );
    
    // Step 3: Make sure all analyses have content (even empty ones)
    await PrescriptiveAnalysisService.regenerateEmptyAnalyses(doc.studentId);
    
    console.log(`Successfully generated prescriptive analyses for student ${doc.studentId}`);
  } catch (error) {
    console.error('Error in CategoryResult post-save hook:', error);
  }
});

module.exports = mongoose.models.CategoryResult || mongoose.model('CategoryResult', categoryResultSchema);