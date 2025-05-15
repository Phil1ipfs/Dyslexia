// models/Teachers/CustomizedAssessment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contentReferenceSchema = new Schema({
  collection: {
    type: String,
    required: true,
    enum: ['letters_collection', 'syllables_collection', 'words_collection', 'sentences_collection', 'shortstory_collection']
  },
  contentId: {
    type: Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const customOptionSchema = new Schema({
  optionId: {
    type: String,
    required: true
  },
  optionText: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  explanation: String
}, { _id: false });

const customizedQuestionSchema = new Schema({
  questionId: {
    type: Schema.Types.Mixed,
    required: true
  },
  originalQuestionId: Schema.Types.Mixed,
  questionText: {
    type: String,
    required: true
  },
  typeId: {
    type: String,
    required: true
  },
  contentReference: contentReferenceSchema,
  originalContentReference: contentReferenceSchema,
  displayedText: String,
  hasImage: Boolean,
  imageUrl: String,
  imageAlt: String,
  hasAudio: Boolean,
  audioUrl: String,
  options: [customOptionSchema],
  pointValue: {
    type: Number,
    default: 1
  }
}, { _id: false });

const customizedAssessmentSchema = new Schema({
  originalAssessmentId: {
    type: String,
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  assessmentId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  categoryID: Number,
  categoryName: String,
  targetReadingLevel: String,
  questions: [customizedQuestionSchema],
  totalQuestions: {
    type: Number,
    default: function() {
      return this.questions.length;
    }
  },
  passingThreshold: {
    type: Number,
    default: 75
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
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
  collection: 'customized_assessments'
});

module.exports = mongoose.connection.useDb('test').model('CustomizedAssessment', customizedAssessmentSchema);