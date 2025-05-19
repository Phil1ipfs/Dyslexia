const mongoose = require('mongoose');

/**
 * Model for the test.intervention_assessment collection
 * Stores intervention plans created for students who need additional support
 */
const interventionPlanSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptiveAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrescriptiveAnalysis'
  },
  categoryResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryResult'
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  description: {
    type: String
  },
  readingLevel: {
    type: String,
    required: true
  },
  passThreshold: {
    type: Number,
    default: 75
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId
    },
    source: {
      type: String,
      enum: ['main_assessment', 'template'],
      required: true
    },
    sourceQuestionId: {
      type: mongoose.Schema.Types.ObjectId
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId
    },
    questionIndex: Number,
    questionType: {
      type: String,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    questionImage: String,
    questionValue: String,
    choices: [{
      choiceText: String,
      choiceImage: String,
      isCorrect: Boolean
    }]
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
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
  collection: 'intervention_assessment'
});

module.exports = mongoose.models.InterventionPlan || mongoose.model('InterventionPlan', interventionPlanSchema);