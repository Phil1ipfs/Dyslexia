const mongoose = require('mongoose');

/**
 * Intervention Assessment Model - Complete Schema from CLAUDE.md
 * This model represents the one-time intervention questions generated based on prescriptive analysis
 */

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

// Question set schema for matching questions (PA)
const questionSetSchema = new mongoose.Schema({
  audioTexts: [String], // For TTS generation
  matchingOptions: [String], // Options to match with
  correctPairs: [{
    audio: String,
    match: String
  }]
}, { _id: false });

// Individual question schema
const interventionQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['custom', 'template_question', 'main_assessment'],
    default: 'custom'
  },
  sourceQuestionId: {
    type: String,
    default: null
  },
  questionType: {
    type: String,
    required: true,
    enum: ['multiple_choice', 'malapantig', 'drag_drop', 'fill_blank', 'text_input']
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
    required: true
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
  interventionResultsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterventionResults',
    default: null
  }
}, {
  collection: 'intervention_assessment_new',
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

// Instance method to get question by ID
interventionAssessmentSchema.methods.getQuestionById = function(questionId) {
  return this.questions.find(q => q.questionId === questionId);
};

// Instance method to validate completion
interventionAssessmentSchema.methods.isReadyForCompletion = function() {
  return this.questions.length === 10 && this.status === 'active';
};

module.exports = mongoose.model('InterventionAssessment', interventionAssessmentSchema);