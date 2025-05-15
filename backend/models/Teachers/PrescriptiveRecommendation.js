// models/Teachers/PrescriptiveRecommendation.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
  activityType: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  content: Schema.Types.Mixed,
  completionCriteria: String
}, { _id: false });

const contentReferenceSchema = new Schema({
  collection: {
    type: String,
    required: true
  },
  contentIds: [String]
}, { _id: false });

const prescriptiveRecommendationSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    // This references a student in the test.users collection
    required: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'dismissed'],
    default: 'pending'
  },
  priorityLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  readingLevel: String,
  activities: [activitySchema],
  contentReferences: [contentReferenceSchema],
  isCustom: {
    type: Boolean,
    default: false
  },
  questionIds: [String],
  notes: String,
  generatedAt: {
    type: Date,
    default: Date.now
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
  }
}, {
  collection: 'prescriptive_recommendations'
});

// Use the test database connection
module.exports = mongoose.connection.useDb('test').model('PrescriptiveRecommendation', prescriptiveRecommendationSchema);