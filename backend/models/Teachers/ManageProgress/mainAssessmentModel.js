const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    _id:          { type: mongoose.Schema.Types.ObjectId, auto: true },
    order:        Number,                      // 1-based
    questionType: String,
    questionText: String,
    questionImage: String,
    questionValue: String,
    choiceOptions: [
      {
        optionText: String,
        isCorrect:  Boolean
      }
    ]
  },
  { _id: false }         // we assign _id manually above
);

const MainAssessmentSchema = new mongoose.Schema({
  category:     { type: String, required: true },
  readingLevel: { type: String, required: true },
  questions:    [QuestionSchema],
  isActive:     { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now }
});

// one active doc per (category, readingLevel)
MainAssessmentSchema.index(
  { category: 1, readingLevel: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model('MainAssessment', MainAssessmentSchema); 