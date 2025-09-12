// models/Teachers/ManageProgress/prescriptiveAnalysisModel.js
const mongoose = require('mongoose');

const prescriptiveAnalysisSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryResult',
    required: false  
  },
  categoryId: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level', 'Independent']
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  assessmentType: {
    type: String,
    enum: ['main', 'intervention'],
    default: 'main'
  },
  
  // BKT tracking for each category with complete metrics
  skillMastery: {
    type: Map,
    of: {
      masteryProbability: { type: Number, min: 0, max: 1, default: 0.5 },
      lastUpdated: { type: Date, default: Date.now },
      totalQuestions: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      totalPossibleMatches: { type: Number, default: 0 },
      correctMatches: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      isPassed: { type: Boolean, default: false },
      responseHistory: [{
        questionId: String,
        correct: Boolean,
        timestamp: { type: Date, default: Date.now },
        masteryAfter: Number
      }]
    },
    default: {}
  },
  
  // IRT ability estimates (-3 to +3 scale)
  abilityEstimates: {
    type: Map,
    of: { type: Number, min: -3, max: 3, default: 0 },
    default: {}
  },
  
  // Detailed error pattern analysis
  errorPatterns: {
    type: Map,
    of: {
      patinig_errors: {
        count: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        specific_letters: [String],
        error_type: String,
        questionIds: [String]
      },
      katinig_errors: {
        count: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        specific_letters: [String],
        error_type: String,
        questionIds: [String]
      },
      matching_errors: {
        count: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        avg_partial_success: { type: Number, default: 0 },
        error_type: String,
        questionIds: [String]
      },
      decoding_errors: {
        count: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        error_type: String,
        most_error_position: { type: Number, default: 0 },
        questionIds: [String]
      }
    },
    default: {}
  },
  
  // Intervention recommendations
  interventionPlan: {
    required: { type: Boolean, default: false },
    priority: [String],
    specificFocus: {
      type: Map,
      of: {
        focus: String,
        targetSounds: [String],
        targetPatterns: [String],
        recommendedActivities: [String],
        questionDistribution: {
          type: Map,
          of: Number,
          default: {}
        }
      },
      default: {}
    }
  },
  
  // Performance insights
  insights: {
    strengths: [String],
    weaknesses: [String],
    overallReadiness: String,
    recommendedAction: {
      type: String,
      enum: ['continue_assessment', 'immediate_intervention', 'face_to_face_required', 'success_ready']
    },
    passedCategories: { type: Number, default: 0 },
    failedCategories: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 }
  },
  
  // Intervention tracking
  interventionHistory: [{
    category: String,
    interventionId: mongoose.Schema.Types.ObjectId,
    dateTaken: Date,
    passed: Boolean,
    score: Number,
    attempt: { type: Number, default: 1 }
  }],
  
  // Legacy fields for backward compatibility
  strengths: {
    type: [String],
    default: [],
    required: false
  },
  weaknesses: {
    type: [String],
    default: [],
    required: false
  },
  recommendations: {
    type: [String],
    default: [],
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  collection: 'prescriptive_analysis'
});

// Update the 'updatedAt' field on save
prescriptiveAnalysisSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for student + category to ensure uniqueness
prescriptiveAnalysisSchema.index({ studentId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('PrescriptiveAnalysis', prescriptiveAnalysisSchema);