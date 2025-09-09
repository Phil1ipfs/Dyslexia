# Reading Assessment System - Claude Code Documentation

## System Overview
This is a comprehensive reading assessment system based on DepEd standards that evaluates students across five reading categories: Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, and Reading Comprehension. The system supports progressive reading levels and includes intervention mechanisms for students who need additional support.

## Reading Levels & Category Progression

The system uses a progressive reading level structure where students advance through different levels, with each level having specific categories:

### 1. Low Emerging
- **Categories**: Alphabet Knowledge only (1 category)
- **Description**: Beginning learners who need foundational alphabet skills

### 2. High Emerging  
- **Categories**: Alphabet Knowledge + Phonological Awareness (2 categories)
- **Description**: Students progressing beyond basic letter recognition

### 3. Developing
- **Categories**: Alphabet Knowledge + Phonological Awareness + Decoding (3 categories)
- **Description**: Students developing decoding and phonics skills

### 4. Transitioning
- **Categories**: Alphabet Knowledge + Phonological Awareness + Decoding + Word Recognition (4 categories)
- **Description**: Students transitioning to word-level reading

### 5. At Grade Level
- **Categories**: All 5 categories (Alphabet Knowledge + Phonological Awareness + Decoding + Word Recognition + Reading Comprehension)
- **Description**: Students at expected grade level performance

## Core Collections & Schemas

### 1. MAIN_ASSESSMENT Collection

This collection contains all assessment questions organized by category and reading level. **Note: This data should be VIEW-ONLY in the web interface - no creation or editing allowed.**

#### Base Schema (Common to All Categories):
```javascript
{
  _id: ObjectId,
  readingLevel: String, // "Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"
  category: String, // "Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension"
  questionType: String, // Varies by category
  questions: [Array], // Category-specific structure
  status: String, // "active", "draft", "inactive"
  isActive: Boolean,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Category-Specific Schemas:

**ALPHABET KNOWLEDGE**
- questionType: "multiple_choice"
- Question Structure:
```javascript
questions: [{
  questionId: String, // "AK_001", "AK_002", etc.
  questionText: String, // "Anong katumbas na maliit na letra?"
  questionImage: String, // S3 bucket URL (can be null)
  questionValue: String, // "E", "O", etc.
  choiceOptions: [{
    optionId: String, // "1", "2", "3"
    optionText: String, // "e", "a", "c"
    isCorrect: Boolean,
    description: String // Optional explanation
  }]
}]
```

**PHONOLOGICAL AWARENESS**
- questionType: "matching"
- Question Structure:
```javascript
questions: [{
  questionId: String, // "PA_001", "PA_002", etc.
  questionText: String, // "Pakinggan ang audio. Itugma ito sa katumbas na letra"
  questionImage: String, // Usually null
  questionValue: String, // Usually null
  questionSet: [{
    audioTexts: [String], // ["H", "T", "N"] - for TTS generation
    matchingOptions: [String], // ["Hh", "Tt", "Nn"] - shuffled options
    correctPairs: [Object] // [{"H": "Hh"}, {"T": "Tt"}, {"N": "Nn"}]
  }]
}]
```

**DECODING**
- questionType: "drag_drop"
- Question Structure:
```javascript
questions: [{
  questionId: String, // "DC_001", "DC_002", etc.
  questionText: String, // "Tukuyin ang mga letra"
  questionImage: String, // S3 bucket URL (can be null)
  dragElements: [String], // ["Y", "E", "L", "O"] - draggable items
  correctSequence: [String], // ["Y", "E", "L", "O"] - correct order
  displaySequence: [String], // May have blanks "__" (can be null)
  blankPosition: Number // Position of blank if applicable
}]
```

**WORD RECOGNITION**
- questionType: "fill_blank"
- Question Structure:
```javascript
questions: [{
  questionId: String, // "WR_001", "WR_002", etc.
  questionText: String, // Instructions
  questionImage: String, // S3 bucket URL (can be null)
  displayWord: String, // "Sumbrero", "Libro"
  blankOptions: [String], // ["LIB", "RO", "ME", "SA"] - available choices
  correctAnswer: [String] // ["LIB", "RO"] - correct sequence
}]
```

**READING COMPREHENSION**
- questionType: "text_input"
- Question Structure:
```javascript
questions: [{
  questionId: String, // "RC_001", "RC_002", etc.
  storyTitle: String, // "Si Juan at ang Aso" (null for subsequent questions from same story)
  passages: [{ // null if referencing same story
    pageNumber: Number,
    pageText: String,
    pageImage: String // S3 bucket URL
  }],
  questionText: String, // "Sino ang may aso?"
  correctAnswer: String, // "Juan"
  acceptableAnswers: [String] // ["Juan", "juan", "Si Juan", "si juan"]
}]
```

### 2. STUDENT_RESPONSES Collection

This collection stores individual student responses to assessment questions. **Note: This data should be VIEW-ONLY in the web interface - no creation or editing allowed.**

#### Base Schema:
```javascript
{
  _id: ObjectId,
  studentId: Number, // INTEGER - consistent across all collections
  categoryId: ObjectId, // Reference to category_results
  questionId: String, // Reference to main_assessment question
  category: String, // "Alphabet Knowledge", "Phonological Awareness", etc.
  response: [Mixed], // Format varies by category
  isCorrect: Boolean,
  responseTime: Number, // Time in seconds
  answeredAt: ISODate,
  createdAt: ISODate,
  readingLevel: String // Student's reading level at time of response
}
```

#### Category-Specific Response Formats:

**ALPHABET KNOWLEDGE**
```javascript
response: ["2"] // Selected option ID
```

**PHONOLOGICAL AWARENESS**
```javascript
response: [
  {"H": "Hh"},
  {"T": "Tt"},
  {"N": "Nn"}
],
correctMatches: Number, // Number of correct pairs
totalMatches: Number // Total pairs attempted
```

**DECODING**
```javascript
response: ["Y", "E", "L", "O"] // Sequence of dragged elements
```

**WORD RECOGNITION**
```javascript
response: ["LIB", "RO"] // Selected fill-in options
```

**READING COMPREHENSION**
```javascript
response: ["Juan"] // Text input answer
```

### 3. CATEGORY_RESULTS Collection

This collection tracks student progress and results across categories. **Note: This data should be VIEW-ONLY in the web interface - no creation or editing allowed.**

#### Schema:
```javascript
{
  _id: ObjectId,
  studentId: Number, // INTEGER - consistent across collections
  assessmentDate: ISODate,
  categories: [{ // Array varies by reading level
    categoryName: String, // "Alphabet Knowledge", etc.
    totalQuestions: Number,
    correctAnswers: Number,
    score: Number, // Percentage score
    isPassed: Boolean, // True if score >= passingThreshold (75%)
    passingThreshold: Number, // Usually 75
    isCompleted: Boolean,
    lastQuestionAnswered: String, // For resuming assessments
    
    // Intervention fields (when isPassed = false)
    interventionRequired: Boolean,
    interventionAttempts: Number,
    interventionCompleted: Boolean,
    currentInterventionId: ObjectId, // Reference to intervention_assessment
    interventionHistory: [{
      attemptNumber: Number,
      interventionId: ObjectId,
      interventionResultId: ObjectId,
      score: Number,
      isPassed: Boolean,
      attemptedAt: ISODate,
      completedAt: ISODate
    }]
  }],
  overallScore: Number, // Computed across all categories
  completedCategories: Number,
  totalCategories: Number, // Varies by reading level (1-5)
  allCategoriesPassed: Boolean,
  readingLevel: String, // Current reading level
  readingLevelUpdated: Boolean, // Triggers new category_results record
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Reading Level Category Requirements:
- **Low Emerging**: 1 category (Alphabet Knowledge)
- **High Emerging**: 2 categories (Alphabet Knowledge + Phonological Awareness)
- **Developing**: 3 categories (+ Decoding)
- **Transitioning**: 4 categories (+ Word Recognition)
- **At Grade Level**: 5 categories (+ Reading Comprehension)

## Assessment Comparison & Analysis

### Comparing Student Responses to Correct Answers

When analyzing student performance, the system compares `student_responses` data with `main_assessment` questions:

1. **Question Matching**: Use `questionId` to match student response with assessment question
2. **Category Analysis**: Compare performance across categories within the student's reading level
3. **Answer Validation**: 
   - For multiple choice: Compare selected `optionId` with correct option
   - For matching: Compare response pairs with `correctPairs`
   - For drag_drop: Compare sequence with `correctSequence`
   - For fill_blank: Compare selections with `correctAnswer`
   - For text_input: Check against `correctAnswer` and `acceptableAnswers`

### Progress Tracking

The system tracks student progression through:
- **Category completion**: Individual category scores and pass/fail status
- **Overall performance**: Computed across all categories for the reading level
- **Reading level advancement**: When `allCategoriesPassed = true` and scores meet thresholds
- **Intervention tracking**: Detailed history of support interventions

## Data Access Rules

### Web Interface Restrictions:
- **STUDENT_RESPONSES**: VIEW ONLY - No create/edit operations
- **CATEGORY_RESULTS**: VIEW ONLY - No create/edit operations  
- **MAIN_ASSESSMENT**: Can be created/edited for content management

### Mobile Application:
- Creates and updates `student_responses` locally
- Updates `category_results` based on assessment completion
- Syncs with server when online

## Key Implementation Notes

1. **Data Consistency**: All `studentId` fields use INTEGER type consistently
2. **Reading Level Progression**: When `readingLevelUpdated = true`, create new `category_results` record with additional categories
3. **Intervention Logic**: When `isPassed = false`, set `interventionRequired = true` and track attempts
4. **Response Validation**: Each category has specific response format requirements
5. **Scoring**: Minimum 75% required to pass each category
6. **Category Dependencies**: Students must complete categories in order based on their reading level
7. **Reading Comprehension Structure**: Each story contains multiple sentence questions, with each generating separate response records
8. **Answer Matching**: Use flexible matching for Reading Comprehension with `acceptableAnswers` arrays

## Assessment Flow

1. Student takes assessment questions from `main_assessment`
2. Responses stored in `student_responses` with timing and correctness
3. Results aggregated in `category_results` with category-specific scores
4. System evaluates if student passes all required categories for their level
5. If passed, student advances to next reading level with additional categories
6. If failed, intervention system is triggered with detailed tracking

This system provides comprehensive tracking and assessment capabilities while maintaining data integrity and supporting progressive learning paths for students at different reading levels.

test.student_responses.json
[{
  "_id": {
    "$oid": "683e948a9b13d43b098eb701"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 7.4,
  "answeredAt": {
    "$date": "2025-08-18T12:15:25.500Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:15:25.500Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb702"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 6.8,
  "answeredAt": {
    "$date": "2025-08-18T12:15:32.300Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:15:32.300Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb703"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_003",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 8.1,
  "answeredAt": {
    "$date": "2025-08-18T12:15:40.400Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:15:40.400Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb704"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683cb98951eaae9b315b8c31"
  },
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "response": [
    {
      "H": "Hh"
    },
    {
      "T": "Tt"
    },
    {
      "N": "Nn"
    },
    {
      "L": "Ll"
    },
    {
      "P": "Pp"
    }
  ],
  "correctMatches": 5,
  "totalMatches": 5,
  "isCorrect": true,
  "responseTime": 42.6,
  "answeredAt": {
    "$date": "2025-08-18T12:16:23.000Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:16:23.000Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb705"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683cb98951eaae9b315b8c31"
  },
  "questionId": "PA_002",
  "category": "Phonological Awareness",
  "response": [
    {
      "L": "Ll"
    },
    {
      "P": "Bb"
    },
    {
      "B": "Pp"
    }
  ],
  "correctMatches": 1,
  "totalMatches": 3,
  "isCorrect": false,
  "responseTime": 38.9,
  "answeredAt": {
    "$date": "2025-08-18T12:17:01.900Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:17:01.900Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb706"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683cbaa951eaae9b315b8c42"
  },
  "questionId": "DC_001",
  "category": "Decoding",
  "response": [
    "Y",
    "E",
    "L",
    "O"
  ],
  "isCorrect": true,
  "responseTime": 28.5,
  "answeredAt": {
    "$date": "2025-08-18T12:17:30.400Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:17:30.400Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb707"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683cbaa951eaae9b315b8c42"
  },
  "questionId": "DC_002",
  "category": "Decoding",
  "response": [
    "O"
  ],
  "isCorrect": true,
  "responseTime": 22.3,
  "answeredAt": {
    "$date": "2025-08-18T12:17:52.700Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:17:52.700Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb708"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683cbb7451eaae9b315b8c4a"
  },
  "questionId": "WR_001",
  "category": "Word Recognition",
  "response": [
    "Bola"
  ],
  "isCorrect": true,
  "responseTime": 16.8,
  "answeredAt": {
    "$date": "2025-08-18T12:18:09.500Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:18:09.500Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb709"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683cbb7451eaae9b315b8c4a"
  },
  "questionId": "WR_002",
  "category": "Word Recognition",
  "response": [
    "LIB",
    "RO"
  ],
  "isCorrect": true,
  "responseTime": 31.2,
  "answeredAt": {
    "$date": "2025-08-18T12:18:40.700Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:18:40.700Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb710"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683e0fc10a6d5b9eb216970c"
  },
  "questionId": "RC_001",
  "category": "Reading Comprehension",
  "response": [
    "Juan"
  ],
  "isCorrect": true,
  "responseTime": 45.6,
  "answeredAt": {
    "$date": "2025-08-18T12:19:26.300Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:19:26.300Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb711"
  },
  "studentId": 202533333,
  "categoryId": {
    "$oid": "683e0fc10a6d5b9eb216970c"
  },
  "questionId": "RC_002",
  "category": "Reading Comprehension",
  "response": [
    "Parke"
  ],
  "isCorrect": true,
  "responseTime": 38.4,
  "answeredAt": {
    "$date": "2025-08-18T12:20:04.700Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:20:04.700Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583601"
  },
  "studentId": 202511111,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 12.8,
  "answeredAt": {
    "$date": "2025-06-11T14:30:15.200Z"
  },
  "createdAt": {
    "$date": "2025-06-11T14:30:15.200Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583602"
  },
  "studentId": 202511111,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": false,
  "responseTime": 15.3,
  "answeredAt": {
    "$date": "2025-06-11T14:30:30.500Z"
  },
  "createdAt": {
    "$date": "2025-06-11T14:30:30.500Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583603"
  },
  "studentId": 202511111,
  "categoryId": {
    "$oid": "683cb98951eaae9b315b8c31"
  },
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "response": [
    {
      "H": "Tt"
    },
    {
      "T": "Hh"
    },
    {
      "N": "Nn"
    },
    {
      "L": "Ll"
    },
    {
      "P": "Pp"
    }
  ],
  "correctMatches": 3,
  "totalMatches": 5,
  "isCorrect": false,
  "responseTime": 58.7,
  "answeredAt": {
    "$date": "2025-06-11T14:31:29.200Z"
  },
  "createdAt": {
    "$date": "2025-06-11T14:31:29.200Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583604"
  },
  "studentId": 202511111,
  "categoryId": {
    "$oid": "683cbaa951eaae9b315b8c42"
  },
  "questionId": "DC_001",
  "category": "Decoding",
  "response": [
    "Y",
    "A",
    "L",
    "O"
  ],
  "isCorrect": false,
  "responseTime": 41.2,
  "answeredAt": {
    "$date": "2025-06-11T14:32:10.400Z"
  },
  "createdAt": {
    "$date": "2025-06-11T14:32:10.400Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583605"
  },
  "studentId": 202511111,
  "categoryId": {
    "$oid": "683cbb7451eaae9b315b8c4a"
  },
  "questionId": "WR_001",
  "category": "Word Recognition",
  "response": [
    "Kutsara"
  ],
  "isCorrect": false,
  "responseTime": 26.9,
  "answeredAt": {
    "$date": "2025-06-11T14:32:37.300Z"
  },
  "createdAt": {
    "$date": "2025-06-11T14:32:37.300Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583606"
  },
  "studentId": 202511111,
  "categoryId": {
    "$oid": "683e0fc10a6d5b9eb216970c"
  },
  "questionId": "RC_001",
  "category": "Reading Comprehension",
  "response": [
    "juan"
  ],
  "isCorrect": true,
  "responseTime": 52.8,
  "answeredAt": {
    "$date": "2025-06-11T14:33:30.100Z"
  },
  "createdAt": {
    "$date": "2025-06-11T14:33:30.100Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d01"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 4.2,
  "answeredAt": {
    "$date": "2025-08-20T05:10:12.300Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:10:12.300Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d02"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 3.8,
  "answeredAt": {
    "$date": "2025-08-20T05:10:16.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:10:16.100Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d03"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_003",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 4.6,
  "answeredAt": {
    "$date": "2025-08-20T05:10:20.700Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:10:20.700Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d04"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683cb98951eaae9b315b8c31"
  },
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "response": [
    {
      "H": "Hh"
    },
    {
      "T": "Tt"
    },
    {
      "N": "Nn"
    },
    {
      "L": "Ll"
    },
    {
      "P": "Pp"
    }
  ],
  "correctMatches": 5,
  "totalMatches": 5,
  "isCorrect": true,
  "responseTime": 28.4,
  "answeredAt": {
    "$date": "2025-08-20T05:10:49.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:10:49.100Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d05"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683cb98951eaae9b315b8c31"
  },
  "questionId": "PA_002",
  "category": "Phonological Awareness",
  "response": [
    {
      "L": "Ll"
    },
    {
      "P": "Pp"
    },
    {
      "B": "Bb"
    }
  ],
  "correctMatches": 3,
  "totalMatches": 3,
  "isCorrect": true,
  "responseTime": 24.7,
  "answeredAt": {
    "$date": "2025-08-20T05:11:13.800Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:11:13.800Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d06"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683cbaa951eaae9b315b8c42"
  },
  "questionId": "DC_001",
  "category": "Decoding",
  "response": [
    "Y",
    "E",
    "L",
    "O"
  ],
  "isCorrect": true,
  "responseTime": 15.3,
  "answeredAt": {
    "$date": "2025-08-20T05:11:29.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:11:29.100Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d07"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683cbaa951eaae9b315b8c42"
  },
  "questionId": "DC_002",
  "category": "Decoding",
  "response": [
    "O"
  ],
  "isCorrect": true,
  "responseTime": 12.8,
  "answeredAt": {
    "$date": "2025-08-20T05:11:41.900Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:11:41.900Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d08"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683cbb7451eaae9b315b8c4a"
  },
  "questionId": "WR_001",
  "category": "Word Recognition",
  "response": [
    "Bola"
  ],
  "isCorrect": true,
  "responseTime": 11.2,
  "answeredAt": {
    "$date": "2025-08-20T05:11:53.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:11:53.100Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d09"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683cbb7451eaae9b315b8c4a"
  },
  "questionId": "WR_002",
  "category": "Word Recognition",
  "response": [
    "LIB",
    "RO"
  ],
  "isCorrect": true,
  "responseTime": 18.7,
  "answeredAt": {
    "$date": "2025-08-20T05:12:11.800Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:12:11.800Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d10"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683e0fc10a6d5b9eb216970c"
  },
  "questionId": "RC_001",
  "category": "Reading Comprehension",
  "response": [
    "Juan"
  ],
  "isCorrect": true,
  "responseTime": 22.5,
  "answeredAt": {
    "$date": "2025-08-20T05:12:34.300Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:12:34.300Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491110988139e71b308d11"
  },
  "studentId": 202522233,
  "categoryId": {
    "$oid": "683e0fc10a6d5b9eb216970c"
  },
  "questionId": "RC_002",
  "category": "Reading Comprehension",
  "response": [
    "Parke"
  ],
  "isCorrect": true,
  "responseTime": 19.8,
  "answeredAt": {
    "$date": "2025-08-20T05:12:54.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T05:12:54.100Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68491428988139e71b308e01"
  },
  "studentId": 2025121,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 18.3,
  "answeredAt": {
    "$date": "2025-08-19T13:20:22.400Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:20:22.400Z"
  },
  "readingLevel": "Developing"
},
{
  "_id": {
    "$oid": "68491428988139e71b308e02"
  },
  "studentId": 2025121,
  "categoryId": {
    "$oid": "683a51d3168ffbb611dab96a"
  },
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "response": [
    "2"
  ],
  "isCorrect": false,
  "responseTime": 22.7,
  "answeredAt": {
    "$date": "2025-08-19T13:20:45.100Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:20:45.100Z"
  },
  "readingLevel": "Developing"
},
{
  "_id": {
    "$oid": "68491428988139e71b308e03"
  },
  "studentId": 2025121,
  "categoryId": {
    "$oid": "683cb98951eaae9b315b8c31"
  },
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "response": [
    {
      "H": "Hh"
    },
    {
      "T": "Nn"
    },
    {
      "N": "Tt"
    },
    {
      "L": "Ll"
    },
    {
      "P": "Pp"
    }
  ],
  "correctMatches": 3,
  "totalMatches": 5,
  "isCorrect": false,
  "responseTime": 72.8,
  "answeredAt": {
    "$date": "2025-08-19T13:21:57.900Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:21:57.900Z"
  },
  "readingLevel": "Developing"
},
{
  "_id": {
    "$oid": "68491428988139e71b308e04"
  },
  "studentId": 2025121,
  "categoryId": {
    "$oid": "683cbaa951eaae9b315b8c42"
  },
  "questionId": "DC_002",
  "category": "Decoding",
  "response": [
    "A"
  ],
  "isCorrect": false,
  "responseTime": 48.6,
  "answeredAt": {
    "$date": "2025-08-19T13:22:46.500Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:22:46.500Z"
  },
  "readingLevel": "Developing"
},
{
  "_id": {
    "$oid": "68491428988139e71b308e05"
  },
  "studentId": 2025121,
  "categoryId": {
    "$oid": "683cbb7451eaae9b315b8c4a"
  },
  "questionId": "WR_001",
  "category": "Word Recognition",
  "response": [
    "Papel"
  ],
  "isCorrect": false,
  "responseTime": 35.4,
  "answeredAt": {
    "$date": "2025-08-19T13:23:21.900Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:23:21.900Z"
  },
  "readingLevel": "Developing"
},
{
  "_id": {
    "$oid": "68491428988139e71b308e06"
  },
  "studentId": 2025121,
  "categoryId": {
    "$oid": "683e0fc10a6d5b9eb216970c"
  },
  "questionId": "RC_001",
  "category": "Reading Comprehension",
  "response": [
    "si juan"
  ],
  "isCorrect": true,
  "responseTime": 58.7,
  "answeredAt": {
    "$date": "2025-08-19T13:24:20.600Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:24:20.600Z"
  },
  "readingLevel": "Developing"
}]

test.category_results.json 

[{
  "_id": {
    "$oid": "683e948a9b13d43b098eb800"
  },
  "studentId": 202533333,
  "assessmentDate": {
    "$date": "2025-08-18T12:20:30.500Z"
  },
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 12,
      "score": 80,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "AK_015"
    }
  ],
  "overallScore": 80,
  "completedCategories": 1,
  "totalCategories": 1,
  "allCategoriesPassed": true,
  "readingLevel": "Alphabet Knowledge",
  "readingLevelUpdated": true,
  "createdAt": {
    "$date": "2025-08-18T12:20:30.500Z"
  },
  "updatedAt": {
    "$date": "2025-08-18T12:20:30.500Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb801"
  },
  "studentId": 202511111,
  "assessmentDate": {
    "$date": "2025-06-11T14:35:15.200Z"
  },
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 10,
      "score": 67,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "AK_015",
      "interventionRequired": true,
      "interventionAttempts": 2,
      "interventionCompleted": true,
      "currentInterventionId": {
        "$oid": "683f948a9b13d43b098eb901"
      },
      "interventionHistory": [
        {
          "attemptNumber": 1,
          "interventionId": {
            "$oid": "683f948a9b13d43b098eb900"
          },
          "interventionResultId": {
            "$oid": "683f948a9b13d43b098eb901"
          },
          "score": 65,
          "isPassed": false,
          "attemptedAt": {
            "$date": "2025-06-11T15:20:10.300Z"
          },
          "completedAt": {
            "$date": "2025-06-11T15:35:22.100Z"
          }
        },
        {
          "attemptNumber": 2,
          "interventionId": {
            "$oid": "683f948a9b13d43b098eb901"
          },
          "interventionResultId": {
            "$oid": "683f948a9b13d43b098eb902"
          },
          "score": 78,
          "isPassed": true,
          "attemptedAt": {
            "$date": "2025-06-12T09:15:20.500Z"
          },
          "completedAt": {
            "$date": "2025-06-12T09:28:45.800Z"
          }
        }
      ]
    },
    {
      "categoryName": "Phonological Awareness",
      "totalQuestions": 3,
      "totalPossibleMatches": 13,
      "correctMatches": 8,
      "score": 62,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": false,
      "lastQuestionAnswered": "PA_010",
      "interventionRequired": true,
      "interventionAttempts": 1,
      "interventionCompleted": false,
      "currentInterventionId": {
        "$oid": "683f948a9b13d43b098eb910"
      },
      "interventionHistory": [
        {
          "attemptNumber": 1,
          "interventionId": {
            "$oid": "683f948a9b13d43b098eb910"
          },
          "interventionResultId": {
            "$oid": "683f948a9b13d43b098eb911"
          },
          "score": 69,
          "isPassed": false,
          "attemptedAt": {
            "$date": "2025-06-12T14:10:15.400Z"
          },
          "completedAt": {
            "$date": "2025-06-12T14:25:30.200Z"
          }
        }
      ]
    }
  ],
  "overallScore": 73,
  "completedCategories": 2,
  "totalCategories": 2,
  "allCategoriesPassed": false,
  "readingLevel": "High Emerging",
  "readingLevelUpdated": false,
  "createdAt": {
    "$date": "2025-06-11T14:35:15.200Z"
  },
  "updatedAt": {
    "$date": "2025-06-12T14:25:30.200Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb802"
  },
  "studentId": 202522233,
  "assessmentDate": {
    "$date": "2025-08-20T05:13:00.100Z"
  },
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 15,
      "score": 100,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "AK_015"
    },
    {
      "categoryName": "Phonological Awareness",
      "totalQuestions": 3,
      "totalPossibleMatches": 13,
      "correctMatches": 13,
      "score": 100,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "PA_003"
    },
    {
      "categoryName": "Decoding",
      "totalQuestions": 6,
      "correctAnswers": 5,
      "score": 83,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "DC_006"
    },
    {
      "categoryName": "Word Recognition",
      "totalQuestions": 5,
      "correctAnswers": 5,
      "score": 100,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "WR_005"
    },
    {
      "categoryName": "Reading Comprehension",
      "totalQuestions": 5,
      "correctAnswers": 5,
      "score": 100,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "RC_005"
    }
  ],
  "overallScore": 97,
  "completedCategories": 5,
  "totalCategories": 5,
  "allCategoriesPassed": true,
  "readingLevel": "At Grade Level",
  "readingLevelUpdated": true,
  "createdAt": {
    "$date": "2025-08-20T05:13:00.100Z"
  },
  "updatedAt": {
    "$date": "2025-08-20T05:13:00.100Z"
  }
}]