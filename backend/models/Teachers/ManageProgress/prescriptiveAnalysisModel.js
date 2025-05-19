const mongoose = require('mongoose');

/**
 * Model for the test.prescriptive_analysis collection
 * Stores detailed analysis of student performance with strengths, weaknesses, and recommendations
 */
const prescriptiveAnalysisSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: String,
    required: true
  },
  readingLevel: {
    type: String,
    required: true
  },
  strengths: [{
    type: String
  }],
  weaknesses: [{
    type: String
  }],
  recommendations: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  collection: 'prescriptive_analysis'
});

module.exports = mongoose.models.PrescriptiveAnalysis || mongoose.model('PrescriptiveAnalysis', prescriptiveAnalysisSchema);