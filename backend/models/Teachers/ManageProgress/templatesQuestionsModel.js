// models/Teachers/ManageProgress/templatesQuestionsModel.js
const mongoose = require('mongoose');

// Question set schema for Phonological Awareness matching questions
const questionSetSchema = new mongoose.Schema({
  audioTexts: [String], // Audio elements to be matched ["H", "T", "N"]
  matchingOptions: [String], // All available matching options ["Hh", "Tt", "Nn", "Ll"]
  correctPairs: [mongoose.Schema.Types.Mixed] // Correct pairs [{ "H": "Hh" }, { "T": "Tt" }, { "N": "Nn" }]
}, { _id: false });

const templateQuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding']
  },
  questionType: {
    type: String,
    required: true,
    enum: ['patinig', 'katinig', 'malapantig', 'complete_word_identification', 'fill_missing_letter', 'sentence_completion', 'rhyming_words', 'fill_blank', 'word']
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionImage: {
    type: String,
    default: null
  },
  questionValue: {
    type: String,
    default: null
  },

  // For Alphabet Knowledge questions (patinig, katinig)
  choiceOptions: [{
    optionId: String,
    optionText: String,
    isCorrect: Boolean
  }],

  // For Phonological Awareness questions (malapantig)
  questionSet: questionSetSchema,
  matchCount: {
    type: Number,
    default: null
  },

  // For Decoding questions (complete_word_identification, fill_missing_letter)
  displaySequence: [String],
  dragElements: [String],
  correctSequence: [String],
  blankPosition: {
    type: Number,
    default: null
  },

  // For Word Recognition questions (sentence_completion, rhyming_words)
  displayWord: {
    type: String,
    default: null
  },
  blankOptions: [String],
  correctAnswer: [String],

  // Template metadata
  targetSkills: [String], // For error pattern matching
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  collection: 'templates_questions'
});

// Validation middleware
templateQuestionSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Category-specific validation
  if (this.category === 'Alphabet Knowledge' && (!this.choiceOptions || this.choiceOptions.length === 0)) {
    return next(new Error('Alphabet Knowledge questions must have choiceOptions'));
  }

  if (this.category === 'Phonological Awareness' && !this.questionSet) {
    return next(new Error('Phonological Awareness questions must have questionSet'));
  }

  if (this.category === 'Decoding' && (!this.dragElements || !this.correctSequence)) {
    return next(new Error('Decoding questions must have dragElements and correctSequence'));
  }

  if (this.category === 'Word Recognition' && (!this.blankOptions || !this.correctAnswer)) {
    return next(new Error('Word Recognition questions must have blankOptions and correctAnswer'));
  }

  next();
});

// Static methods for querying templates by category
templateQuestionSchema.statics.findByCategory = function(category, isActive = true) {
  return this.find({ category, isActive }).sort({ createdAt: -1 });
};

templateQuestionSchema.statics.findByQuestionType = function(questionType, isActive = true) {
  return this.find({ questionType, isActive }).sort({ createdAt: -1 });
};

templateQuestionSchema.statics.findByTargetSkills = function(targetSkills, category = null) {
  const query = { targetSkills: { $in: targetSkills }, isActive: true };
  if (category) query.category = category;
  return this.find(query).sort({ createdAt: -1 });
};

// Instance methods
templateQuestionSchema.methods.isCompleteTemplate = function() {
  switch (this.category) {
    case 'Alphabet Knowledge':
      return this.choiceOptions && this.choiceOptions.length > 0;
    case 'Phonological Awareness':
      return this.questionSet && this.questionSet.audioTexts && this.questionSet.correctPairs;
    case 'Decoding':
      return this.dragElements && this.correctSequence;
    case 'Word Recognition':
      return this.blankOptions && this.correctAnswer;
    default:
      return false;
  }
};

templateQuestionSchema.methods.toInterventionQuestion = function() {
  const baseQuestion = {
    questionId: `template_${this._id}_${Date.now()}`,
    source: 'template_question',
    sourceQuestionId: this._id.toString(),
    questionType: this.questionType,
    questionText: this.questionText,
    questionImage: this.questionImage,
    questionValue: this.questionValue
  };

  // Add category-specific fields
  switch (this.category) {
    case 'Alphabet Knowledge':
      baseQuestion.choiceOptions = this.choiceOptions;
      break;
    case 'Phonological Awareness':
      baseQuestion.questionSet = this.questionSet;
      break;
    case 'Decoding':
      baseQuestion.displaySequence = this.displaySequence;
      baseQuestion.dragElements = this.dragElements;
      baseQuestion.correctSequence = this.correctSequence;
      baseQuestion.blankPosition = this.blankPosition;
      break;
    case 'Word Recognition':
      baseQuestion.displayWord = this.displayWord;
      baseQuestion.blankOptions = this.blankOptions;
      baseQuestion.correctAnswer = this.correctAnswer;
      break;
  }

  return baseQuestion;
};

const TemplateQuestion = mongoose.models.TemplateQuestion || mongoose.model('TemplateQuestion', templateQuestionSchema);

module.exports = TemplateQuestion;