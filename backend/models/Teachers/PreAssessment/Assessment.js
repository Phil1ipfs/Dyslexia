// models/Assessment.js
const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  assessmentId: Number,
  title: String,
  description: String,
  totalQuestions: Number,
  continueButtonText: String,
  language: String,
  type: String,
  status: String,
  questions: [{
    questionId: String,
    questionText: String,
    typeId: String,
    options: [{
      optionId: String,
      optionText: String,
      isCorrect: Boolean
    }]
  }],
  scoringRules: Object
}, { collection: 'assessments' });

module.exports = mongoose.model('Assessment', assessmentSchema, 'Pre_Assessment.assessments');