// models/QuestionType.js
const mongoose = require('mongoose');

const questionTypeSchema = new mongoose.Schema({
  typeId: String,
  typeName: String
}, { collection: 'question_types' });

module.exports = mongoose.model('QuestionType', questionTypeSchema, 'Pre_Assessment.question_types');