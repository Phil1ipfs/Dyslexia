const mongoose = require('mongoose');

// Schema for Alphabet Knowledge questions (multiple_choice)
const choiceOptionSchema = new mongoose.Schema({
  optionId: {
    type: String,
    required: true,
    enum: ['1', '2', '3']
  },
  optionText: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
}, { _id: false });

// Schema for Phonological Awareness questions (matching)
const questionSetSchema = new mongoose.Schema({
  audioTexts: {
    type: [String],
    required: true,
    validate: {
      validator: function(audioTexts) {
        return audioTexts && audioTexts.length > 0;
      },
      message: 'Audio texts array must have at least one element'
    }
  },
  matchingOptions: {
    type: [String],
    required: true,
    validate: {
      validator: function(options) {
        return options && options.length > 0;
      },
      message: 'Matching options array must have at least one element'
    }
  },
  correctPairs: {
    type: [mongoose.Schema.Types.Mixed],
    required: true,
    validate: {
      validator: function(pairs) {
        return pairs && pairs.length > 0;
      },
      message: 'Correct pairs array must have at least one pair'
    }
  }
}, { _id: false });

// Schema for Reading Comprehension sentence questions (similar to pre-assessment)
const sentenceQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  acceptableAnswers: {
    type: [String],
    default: []
  }
}, { _id: false });

// Schema for Reading Comprehension questions (text_input)
const passagePageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true,
    min: 1
  },
  pageText: {
    type: String,
    required: true
  },
  pageImage: {
    type: String,
    default: null
  }
}, { _id: false });

// Main question schema that supports all 5 question types
const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    validate: {
      validator: function(questionId) {
        // Validate format: AK_001, PA_002, DC_003, WR_004, RC_005
        const regex = /^(AK|PA|DC|WR|RC)_\d{3}$/;
        return regex.test(questionId);
      },
      message: 'Question ID must follow the format XX_000 where XX is category prefix'
    }
  },
  questionText: {
    type: String,
    required: function() {
      return this.parent?.().category !== 'Reading Comprehension';
    }
  },
  questionImage: {
    type: String,
    default: null
  },
  questionValue: {
    type: String,
    default: null
  },

  // For Alphabet Knowledge (multiple_choice)
  choiceOptions: {
    type: [choiceOptionSchema],
    required: function() {
      return this.parent?.().category === 'Alphabet Knowledge';
    },
    validate: {
      validator: function(options) {
        if (this.parent?.().category !== 'Alphabet Knowledge') return true;
        return options && options.length === 3 && options.some(opt => opt.isCorrect);
      },
      message: 'Alphabet Knowledge questions must have exactly 3 options with one correct'
    }
  },

  // For Phonological Awareness (matching)
  questionSet: {
    type: [questionSetSchema],
    required: function() {
      return this.parent?.().category === 'Phonological Awareness';
    }
  },

  // For Decoding (drag_drop)
  displaySequence: {
    type: [String],
    required: function() {
      return this.parent?.().category === 'Decoding';
    }
  },
  blankPosition: {
    type: Number,
    default: null
  },
  dragElements: {
    type: [String],
    required: function() {
      return this.parent?.().category === 'Decoding';
    }
  },
  correctSequence: {
    type: [String],
    required: function() {
      return this.parent?.().category === 'Decoding';
    }
  },

  // For Word Recognition (fill_blank)
  displayWord: {
    type: String,
    required: function() {
      return this.parent?.().category === 'Word Recognition';
    }
  },
  blankOptions: {
    type: [String],
    required: function() {
      return this.parent?.().category === 'Word Recognition';
    }
  },
  correctAnswer: {
    type: [String],
    required: function() {
      return this.parent?.().category === 'Word Recognition';
    }
  },

  // For Reading Comprehension (text_input)
  storyTitle: {
    type: String,
    required: function() {
      return this.parent?.().category === 'Reading Comprehension';
    }
  },
  passages: {
    type: [passagePageSchema],
    required: function() {
      return this.parent?.().category === 'Reading Comprehension';
    },
    validate: {
      validator: function(passages) {
        if (this.parent?.().category !== 'Reading Comprehension') return true;
        return passages === null || (passages && passages.length > 0);
      },
      message: 'Reading Comprehension questions must have passages array or null'
    }
  },
  sentenceQuestions: {
    type: [sentenceQuestionSchema],
    required: function() {
      return this.parent?.().category === 'Reading Comprehension';
    },
    validate: {
      validator: function(sentenceQuestions) {
        if (this.parent?.().category !== 'Reading Comprehension') return true;
        return sentenceQuestions && sentenceQuestions.length > 0;
      },
      message: 'Reading Comprehension questions must have at least one sentence question'
    }
  },
  acceptableAnswers: {
    type: [String],
    required: function() {
      return this.parent?.().category === 'Reading Comprehension';
    }
  }
}, { _id: false });

// Main Assessment Schema
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
  questionType: {
    type: String,
    required: true,
    validate: {
      validator: function(questionType) {
        const validTypes = {
          'Alphabet Knowledge': 'multiple_choice',
          'Phonological Awareness': 'matching',
          'Decoding': 'drag_drop',
          'Word Recognition': 'fill_blank',
          'Reading Comprehension': 'text_input'
        };
        return validTypes[this.category] === questionType;
      },
      message: 'Question type must match the category requirements'
    }
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(questions) {
        return questions && questions.length > 0;
      },
      message: 'Assessment must have at least one question'
    }
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'inactive'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Compound index for efficient querying
mainAssessmentSchema.index({ readingLevel: 1, category: 1, isActive: 1 });

// Middleware to update updatedAt on save
mainAssessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to validate questionIds are unique within an assessment
mainAssessmentSchema.pre('save', function(next) {
  const questionIds = this.questions.map(q => q.questionId);
  const uniqueQuestionIds = [...new Set(questionIds)];
  
  if (questionIds.length !== uniqueQuestionIds.length) {
    return next(new Error('Question IDs must be unique within an assessment'));
  }
  
  // Validate questionId follows the required format and matches category
  const categoryPrefix = getCategoryPrefix(this.category);
  const validFormat = this.questions.every(q => {
    const regex = new RegExp(`^${categoryPrefix}_\\d{3}$`);
    return regex.test(q.questionId);
  });
  
  if (!validFormat) {
    return next(new Error(`Question IDs must follow the format ${categoryPrefix}_XXX where XXX is a 3-digit number`));
  }
  
  // Questions no longer have individual category field - validation removed
  
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