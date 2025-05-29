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
    enum: ['pre-assessment', 'post-assessment', 'intervention'],
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