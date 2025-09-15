// models/Teachers/ManageProgress/prescriptiveAnalysisModel.js
const mongoose = require('mongoose');

// Response history subdocument schema
const responseHistorySchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  correct: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  masteryAfter: { type: Number, min: 0, max: 1 }
}, { _id: false });

// Research-based prescription subdocument schemas
const maintenanceActivitySchema = new mongoose.Schema({
  activity: { type: String, required: true },
  purpose: { type: String, required: true },
  target: { type: String },
  frequency: { type: String },
  implementation: { type: String },
  rationale: { type: String },
  researchEvidence: { type: String }
}, { _id: false });

const accelerationOpportunitySchema = new mongoose.Schema({
  strategy: { type: String, required: true },
  description: { type: String, required: true },
  implementation: { type: String },
  progression: { type: String },
  examples: [String],
  researchBasis: { type: String },
  researchEvidence: { type: String }
}, { _id: false });

const strengthBasedScaffoldingSchema = new mongoose.Schema({
  leverageFor: { type: String, required: true },
  method: { type: String, required: true },
  rationale: { type: String, required: true },
  implementation: { type: String }
}, { _id: false });

const prescriptionPassedSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['maintenance_and_acceleration', 'strength_leveraging'],
    default: 'maintenance_and_acceleration'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  researchBasis: { type: String, required: true },
  maintenanceActivities: [maintenanceActivitySchema],
  accelerationOpportunities: [accelerationOpportunitySchema],
  strengthBasedScaffolding: strengthBasedScaffoldingSchema
}, { _id: false });

const specificDeficitSchema = new mongoose.Schema({
  deficit: { type: String, required: true },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    required: true
  },
  manifestation: { type: String, required: true },
  errorRate: { type: String },
  cognitiveLoad: { type: String },
  workingMemoryDemand: { type: String },
  researchEvidence: { type: String, required: true },
  researchBasis: { type: String }
}, { _id: false });

const interventionComponentSchema = new mongoose.Schema({
  visual: [String],
  tactile: [String],
  kinesthetic: [String],
  auditory: [String]
}, { _id: false });

const evidenceBasedInterventionSchema = new mongoose.Schema({
  intervention: { type: String, required: true },
  researchSupport: { type: String, required: true },
  targetSkills: [String],
  progressionSequence: [String],
  dosage: { type: String },
  successCriteria: { type: String },
  components: interventionComponentSchema,
  individualizedModifications: {
    reason: { type: String },
    adaptations: [String]
  }
}, { _id: false });

const escalationTechniqueSchema = new mongoose.Schema({
  technique: { type: String, required: true },
  purpose: { type: String, required: true },
  implementation: { type: String, required: true },
  materials: [String],
  progression: { type: String },
  researchBasis: { type: String, required: true },
  researchEvidence: { type: String }
}, { _id: false });

// Define missing accelerationActivitySchema
const accelerationActivitySchema = new mongoose.Schema({
  skill: { type: String, required: true },
  targetMastery: { type: String, required: true },
  timeframe: { type: String, required: true },
  prerequisiteCheck: { type: String, required: true },
  progressIndicators: [String]
}, { _id: false });

// Define missing interventionTechniqueSchema
const interventionTechniqueSchema = new mongoose.Schema({
  technique: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  materials: { type: String, required: true },
  progressCriteria: { type: String, required: true },
  researchBasis: { type: String, required: true }
}, { _id: false });

const escalationProtocolSchema = new mongoose.Schema({
  trigger: { type: String, required: true },
  approach: { type: String, required: true },
  researchFoundation: { type: String, required: true },
  specificTechniques: [escalationTechniqueSchema],
  intensityRecommendations: {
    duration: { type: String },
    frequency: { type: String },
    totalIntervention: { type: String },
    researchSupport: { type: String }
  }
}, { _id: false });

const prescriptionFailedSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['intensive_intervention_required', 'targeted_remediation'],
    default: 'intensive_intervention_required'
  },
  urgencyLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  interventionIntensity: {
    type: String,
    enum: ['TIER_1', 'TIER_2', 'TIER_3'],
    default: 'TIER_3'
  },
  researchBasis: { type: String, required: true },
  specificDeficits: [specificDeficitSchema],
  evidenceBasedInterventions: [evidenceBasedInterventionSchema],
  faceToFaceEscalationProtocol: escalationProtocolSchema
}, { _id: false });

// Enhanced skill mastery schema with detailed prescriptions
const skillMasterySchema = new mongoose.Schema({
  masteryProbability: { type: Number, min: 0, max: 1, default: 0.5 },
  lastUpdated: { type: Date, default: Date.now },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  totalPossibleMatches: { type: Number, default: 0 },
  correctMatches: { type: Number, default: 0 },
  score: { type: Number, min: 0, max: 100, default: 0 },
  isPassed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['STRENGTH', 'ADEQUATE', 'NEEDS_SUPPORT', 'CRITICAL_INTERVENTION_NEEDED'],
    default: 'ADEQUATE'
  },
  responseHistory: [responseHistorySchema],
  prescription: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return (v.constructor === Object);
      },
      message: 'Prescription must be an object'
    }
  }
}, { _id: false });

// Enhanced error pattern schemas with cognitive implications
const confusionPairSchema = new mongoose.Schema({
  sounds: [String],
  confusionRate: { type: Number, min: 0, max: 100 },
  linguisticBasis: { type: String },
  interventionFocus: { type: String }
}, { _id: false });

const sequentialDifficultySchema = new mongoose.Schema({
  twoSounds: { type: Number, min: 0, max: 100 },
  threeSounds: { type: Number, min: 0, max: 100 },
  fourSounds: { type: Number, min: 0, max: 100 },
  workingMemoryCapacity: { type: String }
}, { _id: false });

const enhancedMatchingErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  avg_partial_success: { type: Number, default: 0 },
  error_type: { type: String, default: "sound_discrimination" },
  questionIds: [String],
  confusionPairs: [confusionPairSchema],
  sequentialDifficulty: sequentialDifficultySchema,
  cognitiveImplications: {
    workingMemory: { type: String },
    auditoryProcessing: { type: String },
    visualStrengths: { type: String },
    attentionFactors: { type: String }
  }
}, { _id: false });

const patinigErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  specific_letters: [String],
  error_type: { type: String, default: "visual_confusion" },
  questionIds: [String],
  researchClassification: { type: String },
  interventionFocus: { type: String }
}, { _id: false });

const katinigErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  specific_letters: [String],
  error_type: { type: String, default: "sound_discrimination" },
  questionIds: [String],
  researchClassification: { type: String },
  interventionFocus: { type: String }
}, { _id: false });

const positionAnalysisSchema = new mongoose.Schema({
  beginning: { type: Number, default: 0 },
  middle: { type: Number, default: 0 },
  end: { type: Number, default: 0 }
}, { _id: false });

const patternTypeSchema = new mongoose.Schema({
  pattern: { type: String, required: true },
  errorRate: { type: Number, min: 0, max: 100 }
}, { _id: false });

const decodingErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  error_type: { type: String, default: "specific_pattern" },
  most_error_position: { type: Number, default: 0 },
  questionIds: [String],
  positionAnalysis: positionAnalysisSchema,
  patternTypes: [patternTypeSchema],
  linguisticSignificance: { type: String },
  interventionFocus: { type: String }
}, { _id: false });

const comprehensionSkillSchema = new mongoose.Schema({
  errorCount: { type: Number, default: 0 },
  description: { type: String }
}, { _id: false });

const comprehensionErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  error_type: { type: String },
  questionIds: [String],
  literalComprehension: comprehensionSkillSchema,
  inferentialComprehension: comprehensionSkillSchema,
  criticalAnalysis: comprehensionSkillSchema
}, { _id: false });

const wordRecognitionErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  error_type: { type: String },
  secondary_type: { type: String },
  questionIds: [String],
  sentenceCompletionErrors: { type: Number, default: 0 },
  rhymingErrors: { type: Number, default: 0 }
}, { _id: false });

// Enhanced category error patterns schema
const categoryErrorSchema = new mongoose.Schema({
  primaryErrorType: { type: String },
  researchClassification: { type: String },
  detailedErrorAnalysis: [{
    errorPattern: { type: String, required: true },
    specificPairs: [String],
    frequency: { type: String },
    linguisticSignificance: { type: String },
    articulatoryBasis: { type: String },
    interventionFocus: { type: String, required: true }
  }],
  patinig_errors: patinigErrorSchema,
  katinig_errors: katinigErrorSchema,
  matching_errors: enhancedMatchingErrorSchema,
  decoding_errors: decodingErrorSchema,
  word_errors: wordRecognitionErrorSchema,
  comprehension_errors: comprehensionErrorSchema
}, { _id: false });

// Intervention plan subdocument schemas
const specificFocusSchema = new mongoose.Schema({
  focus: String,
  targetSounds: [String],
  targetPatterns: [String],
  recommendedActivities: [String],
  questionDistribution: { type: Map, of: Number }
}, { _id: false });

const interventionPlanSchema = new mongoose.Schema({
  required: { type: Boolean, default: false },
  priority: [String],
  specificFocus: { type: Map, of: specificFocusSchema }
}, { _id: false });

// Performance insights schema
const insightsSchema = new mongoose.Schema({
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
}, { _id: false });

// Intervention history schema
const interventionHistorySchema = new mongoose.Schema({
  category: String,
  interventionId: mongoose.Schema.Types.ObjectId,
  dateTaken: Date,
  passed: Boolean,
  score: Number,
  attempt: { type: Number, default: 1 }
}, { _id: false });

// Student cognitive profile schema
const studentProfileSchema = new mongoose.Schema({
  cognitiveStrengths: [String],
  cognitiveWeaknesses: [String],
  learningStyleIndicators: {
    primary: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'visual_kinesthetic', 'auditory_visual', 'multisensory']
    },
    evidenceBasis: { type: String },
    implications: { type: String }
  },
  motivationalProfile: {
    respondsToBest: [String],
    avoidancePatterns: [String],
    optimalSessionLength: { type: String }
  },
  processingProfile: {
    workingMemoryCapacity: {
      type: String,
      enum: ['below_average', 'average', 'above_average']
    },
    auditoryProcessingLevel: {
      type: String,
      enum: ['impaired', 'below_average', 'average', 'above_average']
    },
    visualProcessingLevel: {
      type: String,
      enum: ['impaired', 'below_average', 'average', 'above_average']
    },
    attentionCapacity: {
      type: String,
      enum: ['limited', 'moderate', 'sustained', 'excellent']
    }
  }
}, { _id: false });

// Research evidence schema
const researchEvidenceSchema = new mongoose.Schema({
  citation: { type: String, required: true },
  relevantFinding: { type: String, required: true },
  applicationToStudent: { type: String, required: true },
  strengthOfEvidence: {
    type: String,
    enum: ['emerging', 'moderate', 'strong', 'very_strong'],
    default: 'moderate'
  }
}, { _id: false });

// Research foundation schema
const researchFoundationSchema = new mongoose.Schema({
  primaryEvidence: [researchEvidenceSchema],
  theoreticalFramework: { type: String },
  interventionApproach: { type: String },
  assessmentBasis: [String]
}, { _id: false });

// Main prescriptive analysis schema - EXACT from CLAUDE.md
const prescriptiveAnalysisSchema = new mongoose.Schema({
  // Core identification
  studentId: {
    type: Number, // INT as specified in CLAUDE.md
    required: true,
    index: true
  },
  categoryResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryResult',
    required: false
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
  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level', 'Independent']
  },
  
  // BKT tracking for each category with complete metrics
  skillMastery: {
    type: Map,
    of: skillMasterySchema,
    default: {}
  },
  
  // IRT ability estimates (-3 to +3 scale)
  abilityEstimates: {
    type: Map,
    of: { type: Number, min: -3, max: 3 },
    default: {}
  },
  
  // Detailed error pattern analysis
  errorPatterns: {
    type: Map,
    of: categoryErrorSchema,
    default: {}
  },
  
  // Intervention recommendations
  interventionPlan: interventionPlanSchema,
  
  // Performance insights
  insights: insightsSchema,
  
  // Intervention tracking
  interventionHistory: [interventionHistorySchema],

  // Research-Based Prescriptions - ENHANCED ANALYTICS
  researchBasedPrescriptions: {
    type: Map,
    of: {
      categoryStatus: {
        type: String,
        enum: ['passed', 'failed'],
        required: true
      },

      // For PASSED categories - Maintenance & Acceleration
      maintenanceRecommendations: {
        activities: [maintenanceActivitySchema],
        researchFoundation: researchFoundationSchema,
        implementationGuidance: {
          frequency: { type: String },
          duration: { type: String },
          integration: { type: String },
          monitoringIndicators: [String]
        }
      },

      accelerationRecommendations: {
        nextLevelSkills: [accelerationActivitySchema],
        bridgingActivities: [String],
        enrichmentFocus: { type: String },
        timelineGuidance: { type: String },
        researchEvidence: [researchEvidenceSchema]
      },

      // For FAILED categories - Intensive Intervention
      deficitAnalysis: {
        specificDeficits: [specificDeficitSchema],
        rootCauseAnalysis: { type: String },
        cognitiveFactors: [String],
        linguisticFactors: [String],
        researchClassification: { type: String }
      },

      interventionPrescription: {
        primaryApproach: {
          type: String,
          enum: ['multisensory_structured', 'phonics_based', 'whole_language_support', 'balanced_literacy', 'orton_gillingham'],
          required: true
        },
        specificTechniques: [interventionTechniqueSchema],
        intensityLevel: {
          type: String,
          enum: ['standard', 'intensive', 'highly_intensive'],
          default: 'standard'
        },
        sessionStructure: {
          optimalLength: { type: String },
          sessionComponents: [String],
          breakPattern: { type: String }
        },
        materialRecommendations: [String],
        progressMonitoring: {
          frequency: { type: String },
          keyIndicators: [String],
          dataCollectionMethod: { type: String }
        }
      },

      escalationProtocol: {
        triggers: [escalationProtocolSchema],
        referralGuidance: { type: String },
        parentCommunication: { type: String },
        timelineExpectations: { type: String }
      }
    },
    default: {}
  },

  // Student Cognitive Profile - COMPREHENSIVE ANALYSIS
  studentCognitiveProfile: studentProfileSchema,

  // Research Evidence Foundation
  researchFoundation: researchFoundationSchema,

  // Detailed Analytics Summary
  analyticsMetrics: {
    totalQuestions: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    consistencyIndex: { type: Number, default: 0 },
    fatigueIndicators: {
      performanceDecline: { type: Boolean, default: false },
      responseTimeIncrease: { type: Boolean, default: false },
      errorPatternShift: { type: Boolean, default: false }
    },
    confidenceMetrics: {
      skillMasteryConfidence: { type: Number, default: 0 },
      interventionSuccessProbability: { type: Number, default: 0 },
      timeToMasteryEstimate: { type: String }
    }
  },

  // Legacy fields for backward compatibility (from original implementation)
  categoryId: {
    type: String,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  recommendations: {
    type: [String],
    default: []
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
  collection: 'prescriptive_analysis',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  suppressReservedKeysWarning: true
});

// Update the 'updatedAt' field on save
prescriptiveAnalysisSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient querying
prescriptiveAnalysisSchema.index({ studentId: 1, assessmentType: 1 });
prescriptiveAnalysisSchema.index({ studentId: 1, categoryId: 1 }, { sparse: true });
prescriptiveAnalysisSchema.index({ categoryResultId: 1 }, { sparse: true });

// Static method to find by category result ID
prescriptiveAnalysisSchema.statics.findByCategoryResult = function(categoryResultId) {
  return this.findOne({ categoryResultId: categoryResultId });
};

// Instance method to get latest intervention attempt for a category
prescriptiveAnalysisSchema.methods.getLatestInterventionAttempt = function(category) {
  return this.interventionHistory
    .filter(h => h.category === category)
    .sort((a, b) => b.dateTaken - a.dateTaken)[0];
};

// Instance method to get intervention attempt count for a category
prescriptiveAnalysisSchema.methods.getInterventionAttemptCount = function(category) {
  return this.interventionHistory.filter(h => h.category === category).length;
};

// Instance method to check if escalation is needed for a category
prescriptiveAnalysisSchema.methods.needsEscalation = function(category) {
  const attempts = this.interventionHistory.filter(h => h.category === category && !h.passed);
  return attempts.length >= 2; // Face-to-face after 2 failed attempts
};

module.exports = mongoose.model('PrescriptiveAnalysis', prescriptiveAnalysisSchema);