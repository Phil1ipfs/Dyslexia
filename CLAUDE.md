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

[
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60001"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_001",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.2,
    "answeredAt": {"$date": "2025-09-10T08:32:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:32:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60002"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_002",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.8,
    "answeredAt": {"$date": "2025-09-10T08:32:15.000Z"},
    "createdAt": {"$date": "2025-09-10T08:32:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60003"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_003",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 5.1,
    "answeredAt": {"$date": "2025-09-10T08:32:30.000Z"},
    "createdAt": {"$date": "2025-09-10T08:32:30.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60004"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_004",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.5,
    "answeredAt": {"$date": "2025-09-10T08:32:45.000Z"},
    "createdAt": {"$date": "2025-09-10T08:32:45.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60005"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_005",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.7,
    "answeredAt": {"$date": "2025-09-10T08:33:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:33:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60006"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_006",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.2,
    "answeredAt": {"$date": "2025-09-10T08:33:15.000Z"},
    "createdAt": {"$date": "2025-09-10T08:33:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60007"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_007",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.9,
    "answeredAt": {"$date": "2025-09-10T08:33:30.000Z"},
    "createdAt": {"$date": "2025-09-10T08:33:30.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60008"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_008",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.8,
    "answeredAt": {"$date": "2025-09-10T08:33:45.000Z"},
    "createdAt": {"$date": "2025-09-10T08:33:45.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60009"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_009",
    "category": "Alphabet Knowledge",
    "response": ["3"],
    "isCorrect": false,
    "responseTime": 6.2,
    "answeredAt": {"$date": "2025-09-10T08:34:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:34:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60010"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_010",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.4,
    "answeredAt": {"$date": "2025-09-10T08:34:15.000Z"},
    "createdAt": {"$date": "2025-09-10T08:34:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60011"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_011",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.1,
    "answeredAt": {"$date": "2025-09-10T08:34:30.000Z"},
    "createdAt": {"$date": "2025-09-10T08:34:30.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60012"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_012",
    "category": "Alphabet Knowledge",
    "response": ["3"],
    "isCorrect": false,
    "responseTime": 5.8,
    "answeredAt": {"$date": "2025-09-10T08:34:45.000Z"},
    "createdAt": {"$date": "2025-09-10T08:34:45.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60013"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_013",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 4.3,
    "answeredAt": {"$date": "2025-09-10T08:35:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:35:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60014"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_014",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.7,
    "answeredAt": {"$date": "2025-09-10T08:35:15.000Z"},
    "createdAt": {"$date": "2025-09-10T08:35:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60015"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "AK_015",
    "category": "Alphabet Knowledge",
    "response": ["3"],
    "isCorrect": false,
    "responseTime": 6.1,
    "answeredAt": {"$date": "2025-09-10T08:35:30.000Z"},
    "createdAt": {"$date": "2025-09-10T08:35:30.000Z"},
    "readingLevel": "High Emerging"
  }
]

[
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60016"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "PA_001",
    "category": "Phonological Awareness",
    "response": [
      {"H": "Hh"},
      {"T": "Tt"},
      {"N": "Ll"}
    ],
    "correctMatches": 2,
    "totalMatches": 3,
    "isCorrect": false,
    "responseTime": 35.2,
    "answeredAt": {"$date": "2025-09-10T08:40:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:40:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60017"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "PA_002",
    "category": "Phonological Awareness",
    "response": [
      {"L": "Pp"},
      {"P": "Ll"}
    ],
    "correctMatches": 0,
    "totalMatches": 2,
    "isCorrect": false,
    "responseTime": 28.7,
    "answeredAt": {"$date": "2025-09-10T08:41:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:41:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60018"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "PA_003",
    "category": "Phonological Awareness",
    "response": [
      {"DAGA": "MATA"},
      {"ILAW": "DAGA"},
      {"MATA": "ILAW"}
    ],
    "correctMatches": 0,
    "totalMatches": 3,
    "isCorrect": false,
    "responseTime": 42.1,
    "answeredAt": {"$date": "2025-09-10T08:42:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:42:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60019"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "PA_004",
    "category": "Phonological Awareness",
    "response": [
      {"PUNO": "PUNO"},
      {"RELO": "RELO"}
    ],
    "correctMatches": 2,
    "totalMatches": 2,
    "isCorrect": true,
    "responseTime": 25.3,
    "answeredAt": {"$date": "2025-09-10T08:43:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:43:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60020"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "PA_005",
    "category": "Phonological Awareness",
    "response": [
      {"GA": "LO"},
      {"LO": "GA"},
      {"PI": "PI"}
    ],
    "correctMatches": 1,
    "totalMatches": 3,
    "isCorrect": false,
    "responseTime": 31.8,
    "answeredAt": {"$date": "2025-09-10T08:44:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:44:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000002a1b2c3d4e5f60021"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000001a1b2c3d4e5f60001"},
    "questionId": "PA_006",
    "category": "Phonological Awareness",
    "response": [
      {"NGA": "WU"},
      {"WU": "NGA"}
    ],
    "correctMatches": 0,
    "totalMatches": 2,
    "isCorrect": false,
    "responseTime": 29.4,
    "answeredAt": {"$date": "2025-09-10T08:45:00.000Z"},
    "createdAt": {"$date": "2025-09-10T08:45:00.000Z"},
    "readingLevel": "High Emerging"
  }
]


test.category_results.json 
{
  "_id": {
    "$oid": "67000001a1b2c3d4e5f60001"
  },
  "studentId": 202533333,
  "assessmentDate": {
    "$date": "2025-09-10T08:30:00.000Z"
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
      "lastQuestionAnswered": "AK_015",
      "interventionRequired": false,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": []
    },
    {
      "categoryName": "Phonological Awareness",
      "totalQuestions": 6,
      "totalPossibleMatches": 15,
      "correctMatches": 5,
      "score": 33,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "PA_015",
      "interventionRequired": false,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": []
    }
  ],
  "overallScore": 63,
  "completedCategories": 1,
  "totalCategories": 2,
  "allCategoriesPassed": false,
  "readingLevel": "High Emerging",
  "readingLevelUpdated": false,
  "createdAt": {
    "$date": "2025-09-10T08:30:00.000Z"
  },
  "updatedAt": {
    "$date": "2025-09-10T09:15:00.000Z"
  }
}


{
  "_id": {
    "$oid": "68bba9b3e4c854c11d63162f"
  },
  "readingLevel": "Transitioning",
  "category": "Word Recognition",
  "questionType": "fill_blank",
  "questions": [
    {
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_001",
      "displayWord": "Naglalaro siya ng _____ sa parke",
      "blankOptions": [
        "Papel",
        "Kutsara",
        "Bola",
        "Damit"
      ],
      "correctAnswer": [
        "bola"
      ]
    },
    {
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_002",
      "displayWord": "Malaki ang _____ sa zoo.",
      "blankOptions": [
        "Elepante",
        "Lamesa",
        "Nanay",
        "Manok"
      ],
      "correctAnswer": [
        "Elepante"
      ]
    },
    {
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_003",
      "displayWord": "Mahilig magluto ang ___ ko",
      "blankOptions": [
        "Manok",
        "Nanay",
        "Bola",
        "Elepante"
      ],
      "correctAnswer": [
        "Nanay"
      ]
    },
    {
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_004",
      "displayWord": "Nasa ___ ang mga libro",
      "blankOptions": [
        "Papel",
        "Lamesa",
        "Manok",
        "Bola"
      ],
      "correctAnswer": [
        "Lamesa"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_005",
      "displayWord": "Kumakain ng mais ang ___",
      "blankOptions": [
        "Nanay",
        "Elepante",
        "Kutsara",
        "Manok"
      ],
      "correctAnswer": [
        "Manok"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_006",
      "displayWord": "Ginagamit niya ang ___ sa pagkain",
      "blankOptions": [
        "Kutsara",
        "Lamesa",
        "Elepante",
        "Damit"
      ],
      "correctAnswer": [
        "Kutsara"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_007",
      "displayWord": "Malinis ang ___ ni Ana",
      "blankOptions": [
        "Bola",
        "Papel",
        "Damit",
        "Kutsara"
      ],
      "correctAnswer": [
        "Damit"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_008",
      "displayWord": "Gumuguhit ako sa ___",
      "blankOptions": [
        "Elepante",
        "Papel",
        "Manok",
        "Lamesa"
      ],
      "correctAnswer": [
        "Papel"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217628205-SUMBRERO.png",
      "questionValue": null,
      "questionId": "WR_009",
      "displayWord": "SUMBRERO",
      "blankOptions": [
        "LIB",
        "RO",
        "ME",
        "SA"
      ],
      "correctAnswer": [
        "LIB",
        "RO"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217665769-LOBO.png",
      "questionValue": null,
      "questionId": "WR_010",
      "displayWord": "LOBO",
      "blankOptions": [
        "ME",
        "SA",
        "TU",
        "BO"
      ],
      "correctAnswer": [
        "TU",
        "BO"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217712715-HALAMAN.png",
      "questionValue": null,
      "questionId": "WR_011",
      "displayWord": "HALAMAN",
      "blankOptions": [
        "KU",
        "LU",
        "NGAN",
        "ME"
      ],
      "correctAnswer": [
        "KU",
        "LU",
        "NGAN"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217748169-YAYA.png",
      "questionValue": null,
      "questionId": "WR_012",
      "displayWord": "YAYA",
      "blankOptions": [
        "TI",
        "YA",
        "U",
        "PO"
      ],
      "correctAnswer": [
        "TI",
        "YA"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217794275-TASA.png",
      "questionValue": null,
      "questionId": "WR_013",
      "displayWord": "TASA",
      "blankOptions": [
        "ME",
        "SA",
        "YA",
        "HA"
      ],
      "correctAnswer": [
        "ME",
        "SA"
      ]
    },
    {
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217891404-NGITI.png",
      "questionValue": null,
      "questionId": "WR_014",
      "displayWord": "NGITI",
      "blankOptions": [
        "SU",
        "SI",
        "RO",
        "SAS"
      ],
      "correctAnswer": [
        "SU",
        "SI"
      ]
    },
    {
      "questionType": "fill_blank",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217924027-ISLA.png",
      "questionValue": null,
      "questionId": "WR_015",
      "displayWord": "ISLA",
      "blankOptions": [
        "SIL",
        "YA",
        "ME",
        "NA"
      ],
      "correctAnswer": [
        "SIL",
        "YA"
      ]
    }
  ],
  "isActive": true,
  "status": "active",
  "createdAt": {
    "$date": "2025-09-06T03:25:39.189Z"
  },
  "updatedAt": {
    "$date": "2025-09-07T04:05:38.124Z"
  }
}


{
  "_id": {
    "$oid": "68bcf37ce32d5718169f6ea0"
  },
  "readingLevel": "Developing",
  "category": "Decoding",
  "questionType": "drag_drop",
  "questions": [
    {
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757213559198-YELO.png",
      "questionValue": null,
      "questionId": "DC_001",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "Y",
        "E",
        "L",
        "O",
        "A",
        "E"
      ],
      "correctSequence": [
        "Y",
        "E",
        "L",
        "O"
      ]
    },
    {
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757213920167-ARAW.png",
      "questionValue": null,
      "questionId": "DC_002",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "A",
        "R",
        "A",
        "W",
        "I",
        "E"
      ],
      "correctSequence": [
        "A",
        "R",
        "A",
        "W"
      ]
    },
    {
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757213994409-NGIPIN.png",
      "questionValue": null,
      "questionId": "DC_003",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "N",
        "G",
        "I",
        "P",
        "I",
        "N",
        "E",
        "O"
      ],
      "correctSequence": [
        "N",
        "G",
        "I",
        "P",
        "I",
        "N"
      ]
    },
    {
      "questionType": "drag_drop",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214009945-EROPLANO.png",
      "questionValue": null,
      "questionId": "DC_004",
      "displaySequence": null,
      "dragElements": [
        "E",
        "R",
        "O",
        "P",
        "L",
        "A",
        "N",
        "O",
        "T",
        "I"
      ],
      "correctSequence": [
        "E",
        "R",
        "O",
        "P",
        "L",
        "A",
        "N",
        "O"
      ],
      "blankPosition": null
    },
    {
      "questionType": "drag_drop",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214024461-BAHAY.png",
      "questionValue": null,
      "questionId": "DC_005",
      "displaySequence": null,
      "dragElements": [
        "B",
        "A",
        "H",
        "A",
        "Y",
        "I",
        "E"
      ],
      "correctSequence": [
        "B",
        "A",
        "H",
        "A",
        "Y"
      ],
      "blankPosition": null
    },
    {
      "questionType": "drag_drop",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214037777-KAMAY.png",
      "questionValue": null,
      "questionId": "DC_006",
      "displaySequence": null,
      "dragElements": [
        "K",
        "A",
        "M",
        "A",
        "Y",
        "T",
        "I"
      ],
      "correctSequence": [
        "K",
        "A",
        "M",
        "A",
        "Y"
      ],
      "blankPosition": null
    },
    {
      "questionType": "drag_drop",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214063651-ROSAS.png",
      "questionValue": null,
      "questionId": "DC_007",
      "displaySequence": null,
      "dragElements": [
        "R",
        "O",
        "S",
        "A",
        "S",
        "U",
        "H"
      ],
      "correctSequence": [
        "R",
        "O",
        "S",
        "A",
        "S"
      ],
      "blankPosition": null
    },
    {
      "questionType": "drag_drop",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214080616-PALAKA.png",
      "questionValue": null,
      "questionId": "DC_008",
      "displaySequence": null,
      "dragElements": [
        "P",
        "A",
        "L",
        "A",
        "K",
        "A",
        "U",
        "O"
      ],
      "correctSequence": [
        "P",
        "A",
        "L",
        "A",
        "K",
        "A"
      ],
      "blankPosition": null
    },
    {
      "questionType": "drag_drop",
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214590096-TINAPAY.png",
      "questionValue": null,
      "questionId": "DC_009",
      "displaySequence": [
        "_",
        "i",
        "n",
        "a",
        "p",
        "a",
        "y"
      ],
      "dragElements": [
        "T",
        "M",
        "K",
        "L"
      ],
      "correctSequence": [
        "T"
      ],
      "blankPosition": 0
    },
    {
      "questionType": "drag_drop",
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214614830-OSO.png",
      "questionValue": null,
      "questionId": "DC_010",
      "displaySequence": [
        "_",
        "s",
        "o"
      ],
      "dragElements": [
        "O",
        "U",
        "F",
        "V"
      ],
      "correctSequence": [
        "O"
      ],
      "blankPosition": 0
    },
    {
      "questionType": "drag_drop",
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214635178-UPO.png",
      "questionValue": null,
      "questionId": "DC_011",
      "displaySequence": [
        "_",
        "p",
        "o"
      ],
      "dragElements": [
        "U",
        "X",
        "O",
        "Z"
      ],
      "correctSequence": [
        "U"
      ],
      "blankPosition": 0
    },
    {
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214699143-DOKTOR.png",
      "questionValue": null,
      "questionId": "DC_012",
      "displaySequence": [
        "_",
        "o",
        "k",
        "t",
        "o",
        "r"
      ],
      "blankPosition": 0,
      "dragElements": [
        "D",
        "I",
        "E",
        "V"
      ],
      "correctSequence": [
        "D"
      ]
    },
    {
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214735077-HAGDAN.png",
      "questionValue": null,
      "questionId": "DC_013",
      "displaySequence": [
        "_",
        "a",
        "g",
        "d",
        "a",
        "n"
      ],
      "blankPosition": 0,
      "dragElements": [
        "H",
        "P",
        "X",
        "A"
      ],
      "correctSequence": [
        "H"
      ]
    },
    {
      "questionType": "drag_drop",
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214755519-SAGING.png",
      "questionValue": null,
      "questionId": "DC_014",
      "displaySequence": [
        "_",
        "a",
        "g",
        "i",
        "n",
        "g"
      ],
      "dragElements": [
        "S",
        "H",
        "G",
        "W"
      ],
      "correctSequence": [
        "S"
      ],
      "blankPosition": 0
    },
    {
      "questionType": "drag_drop",
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214775239-WATAWAT.png",
      "questionValue": null,
      "questionId": "DC_015",
      "displaySequence": [
        "_",
        "a",
        "t",
        "a",
        "w",
        "a",
        "t"
      ],
      "dragElements": [
        "W",
        "H",
        "A",
        "N"
      ],
      "correctSequence": [
        "W"
      ],
      "blankPosition": 0
    }
  ],
  "isActive": true,
  "status": "active",
  "createdAt": {
    "$date": "2025-09-07T02:52:44.956Z"
  },
  "updatedAt": {
    "$date": "2025-09-07T03:13:01.624Z"
  }
}

{
  "_id": {
    "$oid": "68be35c466224f27838e0a42"
  },
  "readingLevel": "At Grade Level",
  "category": "Reading Comprehension",
  "questionType": "text_input",
  "isActive": true,
  "status": "active",
  "questions": [
    {
      "questionId": "RC_001",
      "storyTitle": "Si Juan at ang Aso",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Tuwing umaga, si Juan at ang kaniyang aso na si Max ay naglalaro sa Parke.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757295881174-Si-Juan-at-ang-Aso.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Paboritong habulin ni Max ang bola na inihahagis ni Juan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757295883337-Si-Juan-at-ang-Aso.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Silang dalawa ay masayang uuwi ng tahanan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757295884374-Si-Juan-at-ang-Aso.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang may aso?",
          "correctAnswer": "Juan",
          "acceptableAnswers": [
            "juan",
            "si Juan",
            "Juan"
          ]
        },
        {
          "questionText": "Saan naglaro si Juan at Max?",
          "correctAnswer": "Parke",
          "acceptableAnswers": [
            "parke",
            "sa parke"
          ]
        },
        {
          "questionText": "Ano ang ginagawa ni Juan at Max?",
          "correctAnswer": "Naglalaro",
          "acceptableAnswers": [
            "naglalaro",
            "nag-lalaro"
          ]
        }
      ],
      "questionValue": null
    },
    {
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_002",
      "storyTitle": "Ang Puno ng Mangga",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Maria ay may puno ng mangga sa kanilang bakuran.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757297243943-Ang-Puno-ng-Mangga.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Tuwing tag-init, nangunguha siya ng mangga. ",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757297245168-Ang-Puno-ng-Mangga.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Ang mga mangga ay matamis at kulay dilaw. Si Maria ay umaakyat sa puno upang kunin ang mangga.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757297245676-Ang-Puno-ng-Mangga.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang nangunguha ng mangga?",
          "correctAnswer": "Maria",
          "acceptableAnswers": [
            "maria",
            "si maria",
            "Si maria"
          ]
        },
        {
          "questionText": "Saan matatagpuan ang puno ng mangga?",
          "correctAnswer": "Bakuran",
          "acceptableAnswers": [
            "bakuran",
            "ba-kuran"
          ]
        },
        {
          "questionText": "Ano ang ginagawa ni Maria?",
          "correctAnswer": "Nangunguha",
          "acceptableAnswers": [
            "nangunguha",
            "nang-unguha"
          ]
        }
      ]
    },
    {
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_003",
      "storyTitle": "Si Nanay at ang Pagluluto",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Tuwing Sabado, Inaabangan ko ang masarap na luto ni Nanay.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757297766560-Si-Nanay-at-ang-Pagluluto.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Paborito ng pamilya ang kaniyang malinamnam at maasim na Sinigang. ",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757297767734-Si-Nanay-at-ang-Pagluluto.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Masaya ang pamilya na magsalo sa tanghalian sa aming tahanan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757297768196-Si-Nanay-at-ang-Pagluluto.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang nagluto ng sinigang?",
          "correctAnswer": "Nanay",
          "acceptableAnswers": [
            "nanay",
            "na-nay"
          ]
        },
        {
          "questionText": "Ano ang niluto ni Nanay?",
          "correctAnswer": "Sinigang",
          "acceptableAnswers": [
            "sinigang",
            "sini-gang"
          ]
        },
        {
          "questionText": "Saan naganap ang masayang salo-salo sa tanghalian?",
          "correctAnswer": "Tahanan",
          "acceptableAnswers": [
            "tahanan",
            "aking tahanan"
          ]
        }
      ]
    },
    {
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_004",
      "storyTitle": "Ang Pagtulong ni Juan",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Juan ay tumulong kay Tatay magbuhat ng kahon. Si Tatay ay nagdadala ng mga gamit sa garahe. ",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298131398-Ang-Pagtulong-ni-Juan.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Inutusan ni Tatay si Juan na ilagay ang mga kahon sa isang tabi. ",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298132520-Ang-Pagtulong-ni-Juan.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Habang binubuhat nila ang mga kahon, napansin ni Juan ang mga lumang laruan. ",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298133046-Ang-Pagtulong-ni-Juan.png"
        },
        {
          "pageNumber": 4,
          "pageText": " Inisip ni Juan na magtulungan silang ayusin ang garahe.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298133407-Ang-Pagtulong-ni-Juan.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang tumulong kay Tatay?",
          "correctAnswer": "Juan",
          "acceptableAnswers": [
            "juan",
            "si juan"
          ]
        },
        {
          "questionText": "Saan naganap ang pagtulong?",
          "correctAnswer": "Garahe",
          "acceptableAnswers": [
            "garahe",
            "sa garahe"
          ]
        },
        {
          "questionText": "Ano ang ginawa ni Juan?",
          "correctAnswer": "Nagbuhat",
          "acceptableAnswers": [
            "nagbuhat",
            "buhat",
            "binuhat"
          ]
        }
      ]
    },
    {
      "questionType": "text_input",
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_005",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Liza at si Marco ay magkaibigan. Tuwing hapon, naglalaro sila ng habulan sa bakuran.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298235908-Ang-Paboriting-Laro.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Madalas silang maghabulan mula sa paligid ng bakuran hangang hangang gumabi o umulan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298237017-Ang-Paboriting-Laro.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang naglalaro ng habulan?",
          "correctAnswer": "Liza at Marco",
          "acceptableAnswers": [
            "si liza at marco",
            "liza marco"
          ]
        },
        {
          "questionText": "Saan sila naglalaro?",
          "correctAnswer": "Bakuran",
          "acceptableAnswers": [
            "Bakuran",
            "sa bakuran"
          ]
        },
        {
          "questionText": "Ano ang laro nila?",
          "correctAnswer": "Habulan",
          "acceptableAnswers": [
            "hinabulan",
            "habulin"
          ]
        }
      ],
      "storyTitle": "Ang Paboritong Laro"
    },
    {
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_006",
      "storyTitle": "Si Maria ay kumain ng mansanas.",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Maria ay kumain ng mansanas.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298607345-Maria.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang kinain ni Maria?",
          "correctAnswer": "Mansanas",
          "acceptableAnswers": [
            "mansanas",
            "man-sanas"
          ]
        }
      ]
    },
    {
      "questionType": "text_input",
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_007",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Juan ay naglalaro ng bola sa parke.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298655413-Juan.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang nilalaro ni Juan?",
          "correctAnswer": "Bola",
          "acceptableAnswers": [
            "bola",
            "binola",
            "bobola"
          ]
        }
      ],
      "storyTitle": "Juan at ang Bola"
    },
    {
      "questionType": "text_input",
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_008",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Ang aso ay tumakbo sa hardin.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298722732-Aso.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Saan tumakbo ang aso?",
          "correctAnswer": "Hardin",
          "acceptableAnswers": [
            "hardinn",
            "sa hardin"
          ]
        }
      ],
      "storyTitle": "Aso at Hardin"
    },
    {
      "questionType": "text_input",
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_009",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si nanay ay nagluto ng adobo.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757298824701-Nanay.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang niluto ni nanay?",
          "correctAnswer": "Adobo",
          "acceptableAnswers": [
            "inadobo",
            "aadobo"
          ]
        }
      ],
      "storyTitle": "Nanay at Adobo"
    },
    {
      "questionImage": null,
      "questionValue": null,
      "questionId": "RC_010",
      "storyTitle": "Bata Aralin Siya",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Ang bata ay nag-aaral ng aralin.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757299342378-Bata.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang ginagawa ng bata?",
          "correctAnswer": "Nag-aaral",
          "acceptableAnswers": [
            "nagaaral",
            "inaaral",
            "sa aralin"
          ]
        }
      ]
    }
  ],
  "createdAt": {
    "$date": "2025-09-08T01:47:48.827Z"
  },
  "updatedAt": {
    "$date": "2025-09-08T02:44:20.167Z"
  }
}