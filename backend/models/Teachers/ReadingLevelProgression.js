const mongoose = require('mongoose');
const { Schema } = mongoose;

const levelHistorySchema = new Schema({
  readingLevel: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date
}, { _id: false });

const advancementRequirementsSchema = new Schema({
  currentLevel: {
    type: String,
    required: true
  },
  nextLevel: String,
  requiredCategories: [Number],
  completedCategories: [Number],
  remainingCategories: [Number]
}, { _id: false });

const readingLevelProgressionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  currentReadingLevel: {
    type: String,
    required: true
  },
  initialReadingLevel: {
    type: String,
    required: true
  },
  levelHistory: [levelHistorySchema],
  advancementRequirements: advancementRequirementsSchema,
  overallProgress: {
    type: Number,
    default: 0
  }
}, {
  collection: 'reading_level_progression',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.connection.useDb('test').model('ReadingLevelProgression', readingLevelProgressionSchema);
