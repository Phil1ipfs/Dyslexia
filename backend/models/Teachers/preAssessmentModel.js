const mongoose = require('mongoose');

// Define the option schema for answer options
const optionSchema = new mongoose.Schema({
  optionId: { type: String, required: true },
  optionText: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

// Define the passage schema for reading comprehension
const passageSchema = new mongoose.Schema({
  pageNumber: { type: Number, required: true },
  pageText: { type: String, required: true },
  pageImage: { type: String },
  pageImageS3Path: { type: String }
}, { _id: false });

// Define the sentence question schema for reading comprehension
const sentenceQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionImage: { type: String },
  questionImageS3Path: { type: String },
  correctAnswer: { type: String, required: true },
  incorrectAnswer: { type: String, required: true },
  acceptableAnswers: [{ type: String }] // Alternative acceptable answers
}, { _id: false });

// Define the question set schema for phonological awareness
const questionSetSchema = new mongoose.Schema({
  audioTexts: [{ type: String }], // Letters/words to be read aloud via TTS
  matchingOptions: [{ type: String }], // Visual options to match against
  correctPairs: [{ 
    audio: { type: String, required: true },
    match: { type: String, required: true }
  }] // Correct audio-visual pairs
}, { _id: false });

// Define the question schema
const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionNumber: { type: Number, required: true },
  questionTypeId: { type: String, required: true }, // Category: alphabet_knowledge, phonological_awareness, etc.
  questionType: { type: String, required: true }, // Specific type: patinig, katinig, malapantig, decode, word, sentence
  questionText: { type: String, required: true },
  displayedText: { type: String },
  questionImage: { type: String },
  questionImageS3Path: { type: String },
  questionValue: { type: String },
  hasAudio: { type: Boolean, default: false },
  audioUrl: { type: String },
  audioS3Path: { type: String },
  difficultyLevel: { type: String, required: true },
  
  // For multiple choice questions (alphabet knowledge)
  options: [optionSchema],
  
  // For reading comprehension
  passages: [passageSchema],
  sentenceQuestions: [sentenceQuestionSchema],
  
  // For phonological awareness (malapantig questions)
  questionSet: questionSetSchema,
  
  // For decoding questions (decode type)
  displaySequence: [{ type: String }], // Letters shown in sequence (may have blanks)
  blankPosition: { type: Number }, // Position of blank (null if no blank)
  dragElements: [{ type: String }], // Available letters to drag
  correctSequence: [{ type: String }], // Correct letter sequence
  
  // For word recognition questions (word type)
  displayWord: { type: String }, // Sentence with blank or word to analyze
  blankOptions: [{ type: String }], // Options to fill blank or syllable choices
  correctAnswer: [{ type: String }], // Correct answer(s)
  
  order: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Define the difficulty level schema
const difficultyLevelSchema = new mongoose.Schema({
  description: { type: String, required: true },
  targetReadingLevel: { type: String, required: true },
  weight: { type: Number, required: true }
}, { _id: false });

// Define the scoring rule schema
const scoringRuleSchema = new mongoose.Schema({
  part1ScoreRange: [{ type: Number, required: true }], // [min, max] for first 4 categories
  readingPercentageRange: { type: [Number], default: null }, // [min, max] or null
  comprehensionCorrectRange: { type: [Number], default: null }, // [min, max] or null  
  description: { type: String, required: true }
}, { _id: false });

// Define the pre-assessment schema
const preAssessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: { type: String },
  totalQuestions: { type: Number, required: true },
  categoryCounts: {
    alphabet_knowledge: { type: Number, required: true },
    phonological_awareness: { type: Number, required: true },
    decoding: { type: Number, required: true },
    word_recognition: { type: Number, required: true },
    reading_comprehension: { type: Number, required: true }
  },
  continueButtonText: { type: String },
  language: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  questions: [questionSchema],
  difficultyLevels: {
    low_emerging: difficultyLevelSchema,
    high_emerging: difficultyLevelSchema,
    developing: difficultyLevelSchema,
    transitioning: difficultyLevelSchema,
    at_grade_level: difficultyLevelSchema
  },
  scoringRules: {
    "Low Emerging": scoringRuleSchema,
    "High Emerging": scoringRuleSchema,
    "Developing": scoringRuleSchema,
    "Transitioning": scoringRuleSchema,
    "At Grade Level": scoringRuleSchema
  }
}, { timestamps: true });

// Define the question type schema
const questionTypeSchema = new mongoose.Schema({
  typeId: { type: String, required: true, unique: true },
  typeName: { type: String, required: true },
  description: { type: String },
  difficultyWeights: {
    low_emerging: { type: Number, default: 0 },
    high_emerging: { type: Number, default: 0 },
    developing: { type: Number, default: 0 },
    transitioning: { type: Number, default: 0 },
    at_grade_level: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Create models using the Pre_Assessment database
const getPreAssessmentDb = () => {
  return mongoose.connection.useDb('Pre_Assessment');
};

// Export the models
const PreAssessment = () => getPreAssessmentDb().model('pre-assessment', preAssessmentSchema);
const QuestionType = () => getPreAssessmentDb().model('question_types', questionTypeSchema);

module.exports = {
  PreAssessment,
  QuestionType
}; 