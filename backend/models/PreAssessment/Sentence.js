// models/PreAssessment/Sentence.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sentenceSchema = new Schema({
  sentenceID: {
    type: String,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  optionAnswers: {
    type: [String],
    required: true
  },
  words: {
    type: [String],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isEditable: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'sentences_collection'
});

// Use a different connection for Pre_Assessment database
module.exports = mongoose.connection.useDb('Pre_Assessment').model('Sentence', sentenceSchema);
