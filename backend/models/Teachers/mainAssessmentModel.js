const mongoose = require('mongoose');

// Define Choice Option Schema
const choiceOptionSchema = new mongoose.Schema({
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
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

// Define Question Schema
const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['patinig', 'katinig', 'malapantig', 'word', 'sentence'],
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionImage: {
    type: String,
    default: null
  },
  questionValue: {
    type: String,
    required: true
  },
  choiceOptions: {
    type: [choiceOptionSchema],
    required: true,
    validate: {
      validator: function(options) {
        // At least one option must be correct
        return options.some(option => option.isCorrect === true);
      },
      message: 'At least one option must be marked as correct'
    }
  },
  order: {
    type: Number,
    required: true
  }
});

// Define Main Assessment Schema
const mainAssessmentSchema = new mongoose.Schema({
  readingLevel: {
    type: String,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'],
    required: true
  },
  category: {
    type: String,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'],
    required: true
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(questions) {
        // Must have at least one question
        return questions.length > 0;
      },
      message: 'Assessment must have at least one question'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'inactive'],
    default: 'draft'
  },
  rejectionReason: {
    type: String,
    default: null
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
  collection: 'main_assessment'
});

// Add index for efficient querying
mainAssessmentSchema.index({ readingLevel: 1, category: 1 });

// Middleware to update the updatedAt field on document update
mainAssessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to validate questionIds are unique within a category
mainAssessmentSchema.pre('save', function(next) {
  const questionIds = this.questions.map(q => q.questionId);
  const uniqueQuestionIds = [...new Set(questionIds)];
  
  if (questionIds.length !== uniqueQuestionIds.length) {
    return next(new Error('Question IDs must be unique within a category'));
  }
  
  // Validate questionId follows the required format (e.g., "AK_001")
  const categoryPrefix = getCategoryPrefix(this.category);
  const validFormat = this.questions.every(q => {
    const regex = new RegExp(`^${categoryPrefix}_\\d{3}$`);
    return regex.test(q.questionId);
  });
  
  if (!validFormat) {
    return next(new Error(`Question IDs must follow the format ${categoryPrefix}_XXX where XXX is a 3-digit number`));
  }
  
  next();
});

// Helper function to get category prefix
function getCategoryPrefix(category) {
  const prefixMap = {
    'Alphabet Knowledge': 'AK',
    'Phonological Awareness': 'PA',
    'Decoding': 'DC',
    'Word Recognition': 'WR',
    'Reading Comprehension': 'RC'
  };
  
  return prefixMap[category];
}

// Create and export the model
const MainAssessment = mongoose.model('MainAssessment', mainAssessmentSchema);

module.exports = MainAssessment; 