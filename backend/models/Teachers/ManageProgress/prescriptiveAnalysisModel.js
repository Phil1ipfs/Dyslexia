// models/Teachers/ManageProgress/prescriptiveAnalysisModel.js
const mongoose = require('mongoose');

// Response history subdocument schema
const responseHistorySchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  correct: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  masteryAfter: { type: Number, min: 0, max: 1 }
}, { _id: false });

// Skill mastery subdocument schema
const skillMasterySchema = new mongoose.Schema({
  masteryProbability: { type: Number, min: 0, max: 1, default: 0.5 },
  lastUpdated: { type: Date, default: Date.now },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  totalPossibleMatches: { type: Number, default: 0 },
  correctMatches: { type: Number, default: 0 },
  score: { type: Number, min: 0, max: 100, default: 0 },
  isPassed: { type: Boolean, default: false },
  responseHistory: [responseHistorySchema]
}, { _id: false });

// Error pattern subdocuments
const patinigErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  specific_letters: [String],
  error_type: { type: String, default: "visual_confusion" },
  questionIds: [String]
}, { _id: false });

const katinigErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  specific_letters: [String],
  error_type: { type: String, default: "sound_discrimination" },
  questionIds: [String]
}, { _id: false });

const matchingErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  avg_partial_success: { type: Number, default: 0 },
  error_type: { type: String, default: "sound_discrimination" },
  questionIds: [String]
}, { _id: false });

const decodingErrorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  error_type: { type: String, default: "specific_pattern" },
  most_error_position: { type: Number, default: 0 },
  questionIds: [String]
}, { _id: false });

// Category error patterns schema
const categoryErrorSchema = new mongoose.Schema({
  patinig_errors: patinigErrorSchema,
  katinig_errors: katinigErrorSchema,
  matching_errors: matchingErrorSchema,
  decoding_errors: decodingErrorSchema
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
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
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