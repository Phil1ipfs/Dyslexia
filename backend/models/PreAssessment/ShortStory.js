// models/PreAssessment/ShortStory.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  questionID: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  }
}, { _id: false });

const shortStorySchema = new Schema({
  storyID: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: String,
  questions: [questionSchema],
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
  collection: 'shortstory_collection'
});

// Use a different connection for Pre_Assessment database
module.exports = mongoose.connection.useDb('Pre_Assessment').model('ShortStory', shortStorySchema);
