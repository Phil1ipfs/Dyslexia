const mongoose = require('mongoose');

/**
 * Model for the test.student_responses collection  
 * Records student responses to main assessment questions (READ-ONLY for web interface)
 * Based on actual data structure from database
 */
const studentResponseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.Mixed, // Can be integer or string
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  response: {
    type: mongoose.Schema.Types.Mixed, // Array with different formats per question type
    required: true
  },
  // For Phonological Awareness questions only
  correctMatches: {
    type: Number
  },
  totalMatches: {
    type: Number  
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number
  },
  answeredAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level']
  }
}, {
  collection: 'student_responses'
});

module.exports = mongoose.models.StudentResponse || mongoose.model('StudentResponse', studentResponseSchema);