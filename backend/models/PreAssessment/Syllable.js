
// models/PreAssessment/Syllable.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const syllableSchema = new Schema({
  syllableID: {
    type: String,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  imageUrl: String,
  component_letters: {
    type: [String],
    required: true
  },
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
  collection: 'syllables_collection'
});

// Use a different connection for Pre_Assessment database
module.exports = mongoose.connection.useDb('Pre_Assessment').model('Syllable', syllableSchema);
