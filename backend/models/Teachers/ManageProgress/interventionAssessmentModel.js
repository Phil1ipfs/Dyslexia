const mongoose = require('mongoose');

/**
 * Intervention Assessment Model - Complete Schema from CLAUDE.md
 * This model represents the one-time intervention questions generated based on prescriptive analysis
 */

// Define interventionTechniqueSchema to match prescriptive analysis
const interventionTechniqueSchema = new mongoose.Schema({
  technique: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  materials: { type: String, required: true },
  progressCriteria: { type: String, required: true },
  researchBasis: { type: String, required: true }
}, { _id: false });

// Question selection strategy schema
const questionSelectionStrategySchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['adaptive_irt', 'error_focused', 'general_practice'],
    default: 'error_focused'
  },
  targetDifficulty: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.7
  },
  focusAreas: {
    type: Map,
    of: Number, // percentage allocation
    default: {}
  }
}, { _id: false });

// Question set schema for matching questions (Phonological Awareness)
const questionSetSchema = new mongoose.Schema({
  audioTexts: [String], // Audio elements to be matched ["H", "T", "N"]
  matchingOptions: [String], // All available matching options ["Hh", "Tt", "Nn", "Ll"]
  correctPairs: [mongoose.Schema.Types.Mixed] // Correct pairs [{ "H": "Hh" }, { "T": "Tt" }, { "N": "Nn" }]
}, { _id: false });

// Individual question schema
const interventionQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['custom', 'template', 'template_question', 'main_assessment'],
    default: 'custom'
  },
  sourceQuestionId: {
    type: String,
    default: null
  },
  questionType: {
    type: String,
    required: true,
    enum: ['multiple_choice', 'malapantig', 'drag_drop', 'fill_blank', 'text_input', 'patinig', 'katinig', 'complete_word_identification', 'fill_missing_letter', 'sentence_completion', 'rhyming_words']
  },
  questionText: {
    type: String,
    required: true
  },
  questionImage: {
    type: String,
    default: null
  },
  questionValue: {
    type: String,
    default: null
  },
  
  // For matching questions (Phonological Awareness)
  questionSet: questionSetSchema,
  
  // For drag-drop questions (Decoding)
  displaySequence: [String],
  dragElements: [String],
  correctSequence: [String],
  blankPosition: Number,
  
  // For fill-blank questions (Word Recognition)
  displayWord: String,
  blankOptions: [String],
  correctAnswer: [String],
  
  // For multiple choice questions (Alphabet Knowledge)
  choiceOptions: [{
    optionId: String,
    optionText: String,
    isCorrect: Boolean
  }],

  // For Reading Comprehension questions
  storyTitle: String,
  passages: [{
    pageNumber: Number,
    text: String,
    image: String
  }],
  sentenceQuestions: [{
    questionNumber: Number,
    questionText: String,
    sentenceCorrectAnswer: String,
    // Note: sentenceOptionAnswers removed - doesn't exist in main assessment
    sentenceAcceptableAnswer: [String]
  }],
  
  // IRT parameters for adaptive difficulty
  difficulty: {
    type: Number,
    min: -3,
    max: 3,
    default: 0
  },
  discrimination: {
    type: Number,
    min: 0,
    max: 3,
    default: 1.0
  },
  targetSkill: String,
  targetElement: String
}, { _id: false });

// Intervention parameters schema
const interventionParametersSchema = new mongoose.Schema({
  fixedQuestions: {
    type: Number,
    default: 10
  },
  allowSkip: {
    type: Boolean,
    default: false
  },
  showProgress: {
    type: Boolean,
    default: true
  },
  immediateFeeback: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Main intervention assessment schema
const interventionAssessmentSchema = new mongoose.Schema({
  studentId: {
    type: Number, // INT as specified in CLAUDE.md
    required: true,
    index: true
  },
  prescriptiveAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrescriptiveAnalysis',
    required: true    // Required per CLAUDE.md - all interventions must be based on prescriptive analysis
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
  },
  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level']
  },
  passThreshold: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },

  // DOCTOR'S PRESCRIPTION (from prescriptive analytics) - CLAUDE.md requirement
  doctorPrescription: {
    deficitAnalysis: {
      specificDeficits: [String],
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate'
      },
      errorRate: String,
      confusionPairs: [mongoose.Schema.Types.Mixed]
    },
    interventionPrescription: {
      primaryApproach: String,
      recommendedQuestionCount: Number,
      intensityLevel: {
        type: String,
        enum: ['low', 'moderate', 'high', 'highly_intensive'],
        default: 'moderate'
      },
      sessionStructure: {
        optimalLength: String,
        sessionComponents: [String],
        breakPattern: String
      },
      specificTechniques: [interventionTechniqueSchema]
    },
    materialRecommendations: [String]
  },

  // TEACHER IMPLEMENTATION (based on prescription) - CLAUDE.md requirement
  teacherImplementation: {
    implementedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    implementationDate: {
      type: Date,
      default: Date.now
    },
    prescriptionFollowed: {
      type: Boolean,
      default: true
    },
    questionDistribution: {
      type: mongoose.Schema.Types.Mixed, // Changed from Map to Mixed to handle both Object and Map types
      default: {}
    }
  },

  // QUESTION COUNT CALCULATION DETAILS - CLAUDE.md requirement
  questionCountCalculation: {
    finalCount: Number,
    rationale: String,
    factors: {
      base: Number,
      errorSeverity: {
        level: String,
        adjustment: Number,
        percentage: Number
      },
      masteryLevel: {
        score: Number,
        adjustment: Number
      },
      categoryComplexity: {
        multiplier: Number,
        adjustment: Number
      },
      interventionHistory: {
        attemptCount: Number,
        adjustment: Number
      }
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Smart question selection based on error analysis
  questionSelectionStrategy: questionSelectionStrategySchema,
  
  totalQuestions: {
    type: Number,
    default: 10 // Fixed number for one-time intervention
  },
  
  // Generated questions based on prescriptive analysis
  questions: [interventionQuestionSchema],
  
  // No adaptive parameters - fixed one-time intervention
  interventionParameters: interventionParametersSchema,
  
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'active'
  },

  // NEW: Teacher re-editing tracking
  revisionNumber: {
    type: Number,
    default: 1
  },
  revisionHistory: [{
    version: Number,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: Date,
    changes: String
  }],
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastEditedAt: {
    type: Date,
    default: null
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
  },
  
  // Completion tracking
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },

  // UPDATED: Track multiple intervention results for retakes/revisions
  interventionResultsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterventionResults',
    default: null
  },

  // NEW: Track all intervention attempts/results
  interventionResults: [{
    attemptNumber: {
      type: Number,
      required: true
    },
    interventionResultsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterventionResults',
      required: true
    },
    revisionNumber: {
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
    completedAt: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ['initial_attempt', 'teacher_revision', 'student_retake'],
      default: 'initial_attempt'
    }
  }]
}, {
  collection: 'intervention_assessment',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Update the 'updatedAt' field on save
interventionAssessmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient querying
interventionAssessmentSchema.index({ studentId: 1, category: 1 });
interventionAssessmentSchema.index({ prescriptiveAnalysisId: 1 });
interventionAssessmentSchema.index({ status: 1 });
interventionAssessmentSchema.index({ createdAt: -1 });

// Static method to find active interventions for student
interventionAssessmentSchema.statics.findActiveForStudent = function(studentId) {
  return this.find({ 
    studentId: studentId, 
    status: 'active' 
  }).sort({ createdAt: -1 });
};

// Instance method to mark as started
interventionAssessmentSchema.methods.markAsStarted = function() {
  this.startedAt = new Date();
  this.status = 'active';
  return this.save();
};

// Instance method to mark as completed
interventionAssessmentSchema.methods.markAsCompleted = function(interventionResultsId) {
  this.completedAt = new Date();
  this.status = 'completed';
  if (interventionResultsId) {
    this.interventionResultsId = interventionResultsId;
  }
  return this.save();
};

// NEW: Add intervention result to tracking array
interventionAssessmentSchema.methods.addInterventionResult = function(interventionResultsId, score, isPassed, reason = 'initial_attempt') {
  const attemptNumber = (this.interventionResults || []).length + 1;

  if (!this.interventionResults) {
    this.interventionResults = [];
  }

  this.interventionResults.push({
    attemptNumber: attemptNumber,
    interventionResultsId: interventionResultsId,
    revisionNumber: this.revisionNumber,
    score: score,
    isPassed: isPassed,
    completedAt: new Date(),
    reason: reason
  });

  // Update primary reference to latest result
  this.interventionResultsId = interventionResultsId;
  this.completedAt = new Date();

  return this.save();
};

// Get all intervention attempts for this assessment
interventionAssessmentSchema.methods.getAllInterventionAttempts = function() {
  return this.interventionResults || [];
};

// Get latest intervention result
interventionAssessmentSchema.methods.getLatestInterventionResult = function() {
  const results = this.interventionResults || [];
  return results.length > 0 ? results[results.length - 1] : null;
};

// Check if student has passed any intervention attempt
interventionAssessmentSchema.methods.hasPassedAnyAttempt = function() {
  const results = this.interventionResults || [];
  return results.some(result => result.isPassed);
};

// Get attempt count
interventionAssessmentSchema.methods.getAttemptCount = function() {
  return (this.interventionResults || []).length;
};

// Instance method to get question by ID
interventionAssessmentSchema.methods.getQuestionById = function(questionId) {
  return this.questions.find(q => q.questionId === questionId);
};

// Instance method to validate completion
interventionAssessmentSchema.methods.isReadyForCompletion = function() {
  return this.questions.length > 0 && this.status === 'active';
};

// NEW: Teacher re-editing methods
interventionAssessmentSchema.methods.createRevision = function(teacherId, changes, newQuestions) {
  console.log(`[INTERVENTION MODEL] 🔄 CREATING REVISION:`);
  console.log(`[INTERVENTION MODEL] - Current revisionNumber: ${this.revisionNumber || 1}`);
  console.log(`[INTERVENTION MODEL] - teacherId: ${teacherId}`);
  console.log(`[INTERVENTION MODEL] - changes: ${changes}`);
  console.log(`[INTERVENTION MODEL] - newQuestions count: ${newQuestions?.length || 0}`);

  const currentRevision = this.revisionNumber || 1;
  const newRevision = currentRevision + 1;

  console.log(`[INTERVENTION MODEL] - Calculated newRevision: ${newRevision}`);

  // Initialize revisionHistory if it doesn't exist
  if (!this.revisionHistory) {
    this.revisionHistory = [];
  }

  // Add to revision history (record the NEW revision being created)
  const historyEntry = {
    version: newRevision,  // Fixed: should be newRevision, not this.revisionNumber
    editedBy: teacherId,
    editedAt: new Date(),
    changes: changes
  };

  this.revisionHistory.push(historyEntry);
  console.log(`[INTERVENTION MODEL] - Added history entry:`, historyEntry);
  console.log(`[INTERVENTION MODEL] - Revision history length: ${this.revisionHistory.length}`);

  // Update current revision info
  this.revisionNumber = newRevision;
  this.lastEditedBy = teacherId;
  this.lastEditedAt = new Date();

  console.log(`[INTERVENTION MODEL] - Updated revisionNumber to: ${this.revisionNumber}`);

  // Update questions if provided
  if (newQuestions && newQuestions.length > 0) {
    this.questions = newQuestions;
    console.log(`[INTERVENTION MODEL] - Updated questions (${newQuestions.length} questions)`);
  }

  console.log(`[INTERVENTION MODEL] - Saving intervention with revision ${this.revisionNumber}...`);
  return this.save().then(saved => {
    console.log(`[INTERVENTION MODEL] ✅ REVISION SAVED SUCCESSFULLY:`);
    console.log(`[INTERVENTION MODEL] - Final revisionNumber: ${saved.revisionNumber}`);
    console.log(`[INTERVENTION MODEL] - Final revision history length: ${saved.revisionHistory?.length || 0}`);
    return saved;
  }).catch(error => {
    console.error(`[INTERVENTION MODEL] ❌ ERROR SAVING REVISION:`, error);
    throw error;
  });
};

// Check if assessment has been revised
interventionAssessmentSchema.methods.hasBeenRevised = function() {
  return this.revisionNumber > 1;
};

// Get latest revision info
interventionAssessmentSchema.methods.getLatestRevisionInfo = function() {
  return {
    revisionNumber: this.revisionNumber,
    lastEditedBy: this.lastEditedBy,
    lastEditedAt: this.lastEditedAt,
    hasBeenRevised: this.hasBeenRevised()
  };
};

module.exports = mongoose.model('InterventionAssessment', interventionAssessmentSchema);