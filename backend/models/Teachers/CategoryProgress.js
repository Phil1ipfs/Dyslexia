const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const catSchema = new Schema({
  categoryId: Number,
  categoryName: String,
  preAssessmentCompleted: Boolean,
  preAssessmentScore: Number,
  preAssessmentDate: Date,
  mainAssessmentCompleted: Boolean,
  mainAssessmentId: String,
  mainAssessmentScore: Number,
  passed: Boolean,
  passingThreshold: Number,
  attemptCount: Number,
  lastAttemptDate: Date,
  completionDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'locked'],
    default: 'pending'
  }
}, { _id: false });

const categoryProgressSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    required: true
  },
  studentName: String,
  readingLevel: String,
  categories: [catSchema],
  completedCategories: {
    type: Number,
    default: 0
  },
  totalCategories: {
    type: Number,
    default: 0
  },
  overallProgress: {
    type: Number,
    default: 0
  },
  nextCategory: {
    categoryId: Number,
    categoryName: String,
    assessmentId: String
  }
}, {
  collection: 'category_progress',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.connection.useDb('test').model('CategoryProgress', categoryProgressSchema);
