// models/Teachers/ManageProgress/templatesChoicesModel.js
const mongoose = require('mongoose');

/**
 * Template Choices - Choice Library for Template Creation
 * Serves as a reusable library of choice options that teachers can use when creating complete templates
 */

const templateChoiceSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding']
  },
  choiceType: {
    type: String,
    required: true,
    enum: [
      // Alphabet Knowledge
      'patinigSmallLetter', 'patinigBigLetter', 'katinigSmallLetter', 'katinigBigLetter',
      // Phonological Awareness
      'malapantigText', 'audioSound',
      // Word Recognition
      'wordOption', 'syllableOption', 'rhymingWord',
      // Decoding
      'letter', 'completeWord', 'dragElement'
    ]
  },
  choiceValue: {
    type: String,
    required: true
  },

  // Additional properties for different choice types
  choiceImage: {
    type: String,
    default: null
  },
  soundText: {
    type: String,
    default: null
  },

  // For Phonological Awareness matching
  correctMatch: {
    type: String,
    default: null
  },

  // For Word Recognition rhyming
  correctRhyme: [String],

  // For Decoding
  correctSequence: [String],

  // Choice metadata
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  targetSkills: [String], // For error pattern matching
  usageCount: {
    type: Number,
    default: 0
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
  collection: 'templates_choices'
});

// Update timestamp on save
templateChoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods for choice library management
templateChoiceSchema.statics.findByCategory = function(category, isActive = true) {
  return this.find({ category, isActive }).sort({ usageCount: -1, createdAt: -1 });
};

templateChoiceSchema.statics.findByChoiceType = function(choiceType, category = null) {
  const query = { choiceType, isActive: true };
  if (category) query.category = category;
  return this.find(query).sort({ usageCount: -1, createdAt: -1 });
};

templateChoiceSchema.statics.findByTargetSkills = function(targetSkills, category = null) {
  const query = { targetSkills: { $in: targetSkills }, isActive: true };
  if (category) query.category = category;
  return this.find(query).sort({ usageCount: -1 });
};

// Get popular choices for template building
templateChoiceSchema.statics.getPopularChoices = function(category, limit = 10) {
  return this.find({ category, isActive: true })
    .sort({ usageCount: -1, createdAt: -1 })
    .limit(limit);
};

// Instance methods
templateChoiceSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

templateChoiceSchema.methods.isCompatibleWith = function(questionType) {
  const compatibility = {
    'patinig': ['patinigSmallLetter', 'patinigBigLetter'],
    'katinig': ['katinigSmallLetter', 'katinigBigLetter'],
    'malapantig': ['malapantigText', 'audioSound'],
    'sentence_completion': ['wordOption'],
    'rhyming_words': ['rhymingWord', 'syllableOption'],
    'complete_word_identification': ['letter', 'dragElement'],
    'fill_missing_letter': ['letter', 'completeWord', 'dragElement']
  };

  return compatibility[questionType] && compatibility[questionType].includes(this.choiceType);
};

// Build choice structure for specific categories
templateChoiceSchema.methods.toAlphabetChoice = function() {
  return {
    optionId: this._id.toString().slice(-3),
    optionText: this.choiceValue,
    isCorrect: false // Will be set by template creator
  };
};

templateChoiceSchema.methods.toPhonologicalChoice = function() {
  return {
    audio: this.choiceValue,
    match: this.correctMatch || this.choiceValue
  };
};

templateChoiceSchema.methods.toWordRecognitionChoice = function() {
  return this.choiceValue;
};

templateChoiceSchema.methods.toDecodingChoice = function() {
  if (this.choiceType === 'completeWord') {
    return {
      word: this.choiceValue,
      sequence: this.correctSequence || this.choiceValue.split('')
    };
  }
  return this.choiceValue;
};

const TemplateChoice = mongoose.models.TemplateChoice || mongoose.model('TemplateChoice', templateChoiceSchema);

module.exports = TemplateChoice;