// models/PreAssessment/Word.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wordSchema = new Schema({
  wordID: {
    type: String,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  imageUrl: String,
  syllables: {
    type: [String],
    required: true
  },
  meaning: String,
  category: String,
  soundText: String,
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
  collection: 'words_collection'
});

// Use a different connection for Pre_Assessment database
module.exports = mongoose.connection.useDb('Pre_Assessment').model('Word', wordSchema);
