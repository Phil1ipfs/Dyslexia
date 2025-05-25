// models/Teachers/sentenceTemplateModel.js
const mongoose = require('mongoose');

const sentenceTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Reading Comprehension'
  },
  readingLevel: {
    type: String,
    required: true
  },
  sentenceText: [{
    pageNumber: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: null
    }
  }],
  sentenceQuestions: [{
    questionNumber: {
      type: Number,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    sentenceCorrectAnswer: {
      type: String,
      required: true
    },
    sentenceOptionAnswers: [{
      type: String
    }]
  }],
  isApproved: {
    type: Boolean,
    default: false
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
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'sentence_templates'
});

// Update timestamp on save
sentenceTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const SentenceTemplate = mongoose.models.SentenceTemplate || mongoose.model('SentenceTemplate', sentenceTemplateSchema);

module.exports = SentenceTemplate;