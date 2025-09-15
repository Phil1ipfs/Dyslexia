// models/Teachers/ManageProgress/interventionResultsModel.js
const mongoose = require('mongoose');

const interventionResultsSchema = new mongoose.Schema({
  studentId: {
    type: Number, // Changed to Number to match actual usage
    required: true,
    index: true
  },
  interventionAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterventionAssessment',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
  },
  interventionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterventionPlan',
    required: false // Make optional since we're using interventionAssessmentId
  },
  completedActivities: {
    type: Number,
    default: 0
  },
  totalActivities: {
    type: Number,
    default: 0
  },
  percentComplete: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
    default: 0,
    min: 0,
    max: 100
  },
  passedThreshold: {
    type: Boolean,
    default: false
  },

  // NEW: Essential fields for teacher re-editing and category_results connection
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  passThreshold: {
    type: Number,
    default: 75
  },

  // Teacher re-editing tracking
  assessmentRevision: {
    type: Number,
    default: 1 // Which revision of the assessment was taken
  },
  isPostRevision: {
    type: Boolean,
    default: false // Was this attempt after teacher re-edited the assessment?
  },

  lastActivity: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
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
  collection: 'intervention_results'
});

// Update timestamp on save
interventionResultsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// NEW: Automatically trigger category_results update when intervention passes
interventionResultsSchema.post('save', async function(doc) {
  // Only trigger if this is a newly saved document and it passed
  if (doc.isPassed && doc.score >= doc.passThreshold) {
    try {
      const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');

      console.log(`[INTERVENTION RESULTS] Triggering category_results update for student ${doc.studentId}, category ${doc.category}`);

      const updateResult = await CategoryResultsService.updateCategoryFromIntervention(
        doc.studentId,
        doc.category,
        doc.score,
        doc._id
      );

      if (updateResult.success) {
        console.log(`[INTERVENTION RESULTS] Successfully updated category_results for ${doc.category}`);
      } else {
        console.error(`[INTERVENTION RESULTS] Failed to update category_results:`, updateResult.error);
      }
    } catch (error) {
      console.error(`[INTERVENTION RESULTS] Error triggering category_results update:`, error);
    }
  }
});

// Instance method to check if this should trigger category update
interventionResultsSchema.methods.shouldUpdateCategoryResults = function() {
  return this.isPassed && this.score >= this.passThreshold;
};

// Static method to find results by student and category
interventionResultsSchema.statics.findByStudentAndCategory = function(studentId, category) {
  return this.find({
    studentId: parseInt(studentId),
    category: category
  }).sort({ createdAt: -1 });
};

const InterventionResults = mongoose.models.InterventionResults || mongoose.model('InterventionResults', interventionResultsSchema);

module.exports = InterventionResults;