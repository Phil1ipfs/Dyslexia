// models/Teachers/ManageProgress/interventionResultsModel.js
// Comprehensive intervention_results schema matching prescriptive_analysis complexity
const mongoose = require('mongoose');

const interventionResultsSchema = new mongoose.Schema({
  studentId: {
    type: Number,
    required: true,
    index: true
  },
  interventionAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterventionAssessment',
    required: true
  },
  prescriptiveAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrescriptiveAnalysis',
    required: false
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
  },
  assessmentDate: {
    type: Date,
    required: false, // Made optional - will default to completedAt if not provided
    default: Date.now
  },
  assessmentType: {
    type: String,
    default: 'intervention'
  },
  readingLevel: {
    type: String,
    required: true
  },

  // ===== VERSION TRACKING (CRITICAL for revision awareness) =====
  revisionNumber: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1;
      },
      message: 'Revision number must be a positive integer starting from 1'
    }
  },

  // ===== INTERVENTION PERFORMANCE (Basic Metrics) =====
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  totalPossibleMatches: {
    type: Number,
    default: 0 // For Phonological Awareness matching questions
  },
  correctMatches: {
    type: Number,
    default: 0 // For Phonological Awareness matching questions
  },
  totalSentenceQuestions: {
    type: Number,
    default: 0 // For Reading Comprehension sentence questions
  },
  correctSentenceQuestions: {
    type: Number,
    default: 0 // For Reading Comprehension sentence questions
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isPassed: {
    type: Boolean,
    required: true
  },
  passThreshold: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },

  // ===== IMPROVEMENT TRACKING =====
  previousScore: {
    type: Number,
    required: false, // Made optional - will be calculated from main assessment if available
    min: 0,
    max: 100,
    default: 0
  },
  improvement: {
    type: Number,
    required: false, // Made optional - will be calculated if previousScore available
    default: 0
  },
  improvementPercentage: {
    type: Number,
    required: false, // Made optional - will be calculated if previousScore available
    default: 0
  },

  // ===== COMPREHENSIVE BKT SKILL MASTERY ANALYSIS =====
  skillMastery: {
    type: mongoose.Schema.Types.Mixed, // FIXED: Use Mixed type for dynamic category keys
    default: {}
  },

  // ===== IRT ABILITY ESTIMATES (Updated after intervention) =====
  abilityEstimates: {
    type: mongoose.Schema.Types.Mixed, // FIXED: Use Mixed type for dynamic category keys
    default: {}
  },

  // ===== COMPREHENSIVE ERROR PATTERN ANALYSIS =====
  errorPatterns: {
    type: mongoose.Schema.Types.Mixed, // FIXED: Use Mixed type for dynamic category keys
    default: {}
  },

  // ===== INTERVENTION EFFECTIVENESS ANALYSIS =====
  interventionEffectiveness: {
    overallEffectiveness: {
      type: String,
      enum: ['HIGHLY_EFFECTIVE', 'MODERATELY_EFFECTIVE', 'MINIMALLY_EFFECTIVE', 'INEFFECTIVE'],
      required: false, // Made optional - will be calculated when comprehensive analysis available
      default: 'MINIMALLY_EFFECTIVE'
    },
    errorPatternResolution: {
      resolved: [String],
      improved: [String],
      persistent: [String],
      new_patterns: [String]
    },
    skillProgression: {
      masteryGrowth: Number,
      responseTimeImprovement: Number,
      consistencyImprovement: Number
    },
    interventionInsights: {
      strengths: [String],
      weaknesses: [String],
      teachingApproachEffectiveness: String
    }
  },

  // ===== RESEARCH-BASED PRESCRIPTIONS (Updated after intervention) =====
  researchBasedPrescriptions: {
    type: mongoose.Schema.Types.Mixed, // FIXED: Use Mixed type for dynamic category keys
    default: {}
  },

  // ===== COMPREHENSIVE ANALYTICS METRICS =====
  analyticsMetrics: {
    fatigueIndicators: {
      performanceDecline: Boolean,
      responseTimeIncrease: Boolean,
      errorPatternShift: Boolean,
      attentionDropoff: Boolean
    },
    confidenceMetrics: {
      skillMasteryConfidence: Number,
      interventionSuccessProbability: Number,
      teacherRevisionLikelihood: Number
    },
    totalQuestions: Number,
    totalCorrect: Number,
    averageResponseTime: Number,
    consistencyIndex: Number,
    improvementTrajectory: {
      type: String,
      enum: ['rapid_improvement', 'steady_improvement', 'minimal_improvement', 'no_improvement', 'decline']
    }
  },

  // ===== LEARNING PROGRESS COMPARISON =====
  progressComparison: {
    mainAssessmentPerformance: {
      score: Number,
      masteryProbability: Number,
      errorPatterns: [String]
    },
    interventionPerformance: {
      score: Number,
      masteryProbability: Number,
      errorPatterns: [String]
    },
    progressIndicators: {
      scoreImprovement: Number,
      masteryGrowth: Number,
      errorReduction: Number,
      skillTransfer: {
        type: String,
        enum: ['excellent', 'good', 'limited', 'poor']
      }
    }
  },

  // ===== INSIGHTS AND RECOMMENDATIONS =====
  insights: {
    strengths: [String],
    weaknesses: [String],
    overallReadiness: String,
    recommendedAction: {
      type: String,
      enum: ['category_completion', 'teacher_revision', 'face_to_face_intervention', 'intensive_escalation'],
      required: false, // Made optional - will be determined based on intervention results
      default: 'teacher_revision'
    },
    interventionImpact: String,
    nextStepsRationale: String
  },

  strengths: [String],
  weaknesses: [String],
  recommendations: [String],

  // ===== INTERVENTION HISTORY TRACKING =====
  interventionHistory: [{
    category: String,
    interventionId: mongoose.Schema.Types.ObjectId,
    dateTaken: Date,
    passed: Boolean,
    score: Number,
    attempt: Number
  }],

  // ===== TIMESTAMPS =====
  completedAt: {
    type: Date,
    required: true
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
  collection: 'intervention_results',
  strict: false // Allow dynamic category keys in skillMastery and errorPatterns
});

// BULLETPROOF PRE-SAVE MIDDLEWARE - GUARANTEES revisionNumber is ALWAYS set
interventionResultsSchema.pre('save', async function(next) {
  try {
    console.log(`[INTERVENTION RESULTS] 🔍 PRE-SAVE MIDDLEWARE TRIGGERED for ${this._id || 'new record'}`);
    console.log(`[INTERVENTION RESULTS] 🔍 Current revisionNumber: ${this.revisionNumber}`);
    console.log(`[INTERVENTION RESULTS] 🔍 interventionAssessmentId: ${this.interventionAssessmentId}`);
    
    // Update timestamp
    this.updatedAt = new Date();

    // CRITICAL: ENSURE revisionNumber is ALWAYS set
    if (!this.revisionNumber || this.revisionNumber < 1) {
      console.log(`[INTERVENTION RESULTS] 🚨 CRITICAL: Missing revisionNumber detected for ${this._id || 'new record'}`);

      // Try to get revisionNumber from linked intervention_assessment
      if (this.interventionAssessmentId) {
        console.log(`[INTERVENTION RESULTS] 🔍 Fetching revisionNumber from intervention_assessment ${this.interventionAssessmentId}`);

        try {
          const InterventionAssessment = require('./interventionAssessmentModel');
          const intervention = await InterventionAssessment.findById(this.interventionAssessmentId);

          if (intervention && intervention.revisionNumber) {
            this.revisionNumber = intervention.revisionNumber;
            console.log(`[INTERVENTION RESULTS] ✅ AUTOMATIC FIX: Set revisionNumber to ${this.revisionNumber} from intervention_assessment`);
          } else {
            this.revisionNumber = 1;
            console.log(`[INTERVENTION RESULTS] ⚠️ FALLBACK: Set revisionNumber to 1 (intervention_assessment not found or missing revisionNumber)`);
          }
        } catch (linkError) {
          console.error(`[INTERVENTION RESULTS] ❌ Error fetching intervention_assessment:`, linkError.message);
          this.revisionNumber = 1;
          console.log(`[INTERVENTION RESULTS] ⚠️ EMERGENCY FALLBACK: Set revisionNumber to 1 due to error`);
        }
      } else {
        this.revisionNumber = 1;
        console.log(`[INTERVENTION RESULTS] ⚠️ DEFAULT: Set revisionNumber to 1 (no interventionAssessmentId provided)`);
      }
    } else {
      console.log(`[INTERVENTION RESULTS] ✅ revisionNumber already set: ${this.revisionNumber}`);
    }

    next();
  } catch (error) {
    console.error(`[INTERVENTION RESULTS] ❌ Critical error in pre-save middleware:`, error);
    // NEVER let save fail due to revisionNumber issues - always provide fallback
    if (!this.revisionNumber || this.revisionNumber < 1) {
      this.revisionNumber = 1;
      console.log(`[INTERVENTION RESULTS] 🚨 EMERGENCY: Set revisionNumber to 1 to prevent save failure`);
    }
    next();
  }
});

// Create comprehensive indexes for efficient queries
interventionResultsSchema.index({ studentId: 1, category: 1 });
interventionResultsSchema.index({ interventionAssessmentId: 1 });
interventionResultsSchema.index({ prescriptiveAnalysisId: 1 });
interventionResultsSchema.index({ assessmentDate: 1 });
interventionResultsSchema.index({ isPassed: 1 });
interventionResultsSchema.index({ 'insights.recommendedAction': 1 });
interventionResultsSchema.index({ 'interventionEffectiveness.overallEffectiveness': 1 });

// Automatically trigger category_results update when intervention passes
interventionResultsSchema.post('save', async function(doc) {
  console.log(`[INTERVENTION RESULTS] 🔍 POST-SAVE HOOK TRIGGERED for intervention result ${doc._id}`);
  console.log(`[INTERVENTION RESULTS] 🔍 Student: ${doc.studentId}, Category: ${doc.category}, Reading Level: ${doc.readingLevel}`);
  console.log(`[INTERVENTION RESULTS] 🔍 Score: ${doc.score}%, Passed: ${doc.isPassed}, Threshold: ${doc.passThreshold}%`);
  console.log(`[INTERVENTION RESULTS] 🔍 Revision Number: ${doc.revisionNumber}`);
  console.log(`[INTERVENTION RESULTS] 🔍 Should trigger update? ${doc.isPassed && doc.score >= doc.passThreshold}`);

  if (doc.isPassed && doc.score >= doc.passThreshold) {
    try {
      const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');

      console.log(`[INTERVENTION RESULTS] ✅ Intervention passed - triggering category_results update for student ${doc.studentId}, category ${doc.category}, reading level ${doc.readingLevel}`);

      const updateResult = await CategoryResultsService.updateCategoryFromIntervention(
        doc.studentId,
        doc.category,
        doc.score,
        doc._id,
        doc.readingLevel  // 🎯 FIX: Pass reading level to prevent cross-level contamination
      );

      console.log(`[INTERVENTION RESULTS] 🔍 Update result:`, JSON.stringify(updateResult, null, 2));

      if (updateResult.success) {
        console.log(`[INTERVENTION RESULTS] ✅ Successfully updated category_results for ${doc.category}`);
      } else {
        console.error(`[INTERVENTION RESULTS] ❌ Failed to update category_results:`, updateResult.error);
      }
    } catch (error) {
      console.error(`[INTERVENTION RESULTS] ❌ Error triggering category_results update:`, error);
      console.error(`[INTERVENTION RESULTS] ❌ Error stack:`, error.stack);
    }
  } else {
    console.log(`[INTERVENTION RESULTS] ℹ️ Intervention failed (${doc.score}%) - preparing revision guidance`);
  }
});

// Instance methods
interventionResultsSchema.methods.shouldUpdateCategoryResults = function() {
  return this.isPassed && this.score >= this.passThreshold;
};

interventionResultsSchema.methods.needsTeacherRevision = function() {
  return !this.isPassed && this.improvement > 10; // Near-miss cases
};

interventionResultsSchema.methods.needsEscalation = function() {
  return !this.isPassed && this.improvement <= 5; // Minimal improvement
};

// Static methods
interventionResultsSchema.statics.findByStudentAndCategory = function(studentId, category) {
  return this.find({
    studentId: parseInt(studentId),
    category: category
  }).sort({ createdAt: -1 });
};

interventionResultsSchema.statics.getInterventionHistory = function(studentId) {
  return this.find({
    studentId: parseInt(studentId)
  }).sort({ assessmentDate: -1 });
};

interventionResultsSchema.statics.getComprehensiveAnalysis = function(studentId, category) {
  return this.findOne({
    studentId: parseInt(studentId),
    category: category
  })
  .populate('interventionAssessmentId')
  .populate('prescriptiveAnalysisId')
  .sort({ createdAt: -1 });
};


const InterventionResults = mongoose.models.InterventionResults || mongoose.model('InterventionResults', interventionResultsSchema);

module.exports = InterventionResults;