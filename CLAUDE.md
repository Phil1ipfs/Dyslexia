# Main Assessment System

## Overview

The main assessment system is used after students complete the pre-assessment to provide targeted practice questions based on their reading level. Unlike the pre-assessment which uses consistent multiple choice formats, the main assessment employs different interaction types for each category to better match educational approaches.

## Database Structure

### Main Assessment Collection (`main_assessment`)

#### Core Attributes
- `_id`: ObjectId - Unique identifier for the assessment document
- `readingLevel`: String - Target reading level ("Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level")
- `category`: String - Assessment category ("Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension")
- `questionType`: String - Interaction method (varies by category)
- `questions`: Array - Questions specific to the category and reading level
- `status`: String - Assessment status ("active", "draft", "inactive")
- `isActive`: Boolean - Whether this assessment set is currently active
- `createdAt`: ISODate - Creation timestamp
- `updatedAt`: ISODate - Last modification timestamp

## Category-Specific Implementations

### 1. Alphabet Knowledge
**Question Type**: `"multiple_choice"`
**Approach**: 3-option multiple choice questions

#### Question Structure
```javascript
{
  questionId: String,           // Unique identifier (e.g., "AK_001")
  questionText: String,         // Question prompt in Filipino
  questionImage: String,        // S3 bucket URL for image (can be null)
  questionValue: String|null,   // Letter being tested (can be null)
  choiceOptions: [
    {
      optionId: String,         // Choice identifier ("1", "2", "3")
      optionText: String,       // Display text for option
      isCorrect: Boolean,       // Whether this is the correct answer
      description: String       // Explanation for correctness (optional)
    }
  ]
}
```

#### Question Types in Alphabet Knowledge
- **Letter Case Matching**: "Anong katumbas na maliit/malaking letra?"
- **Letter Sound Recognition**: "Anong tunog ng letra?"
- **Letter Classification**: "Tukuyin ang letra kung Patinig o Katinig"
- **Initial Letter Identification**: "Tukuyin ang unang letra na nasa larawan?"

### 2. Phonological Awareness
**Question Type**: `"matching"`
**Approach**: Audio-to-text matching with multiple pairs

#### Question Structure
```javascript
{
  questionId: String,           // Unique identifier (e.g., "PA_001")
  questionText: String,         // Instructions for matching task
  questionSet: [
    {
      audioTexts: [String],     // Audio elements (converted to TTS)
      matchingOptions: [String], // Visual options for matching
      correctPairs: [
        { "audioItem": "matchingItem" }  // Correct audio-visual pairs
      ]
    }
  ]
}
```

#### Phonological Awareness Types
- **Letter Matching**: Individual letters to letter pairs (H → Hh)
- **Word Matching**: Complete words (DAGA → DAGA)
- **Syllable Matching**: Syllable components (GA → GA)

**Important Notes**:
- Audio elements use text-to-speech conversion
- Options should be shuffled for each student
- Students drag/connect audio to visual elements

### 3. Decoding
**Question Type**: `"drag_drop"`
**Approach**: Letter arrangement and word completion

#### Question Structure
```javascript
{
  questionId: String,           // Unique identifier (e.g., "DC_001")
  questionText: String,         // Task instructions
  questionImage: String,        // S3 image URL (can be null)
  displaySequence: [String]|null, // Word pattern with blanks (null for identification)
  blankPosition: Number|null,   // Position of blank (0-indexed, null if no blanks)
  dragElements: [String],       // Available letters to drag
  correctSequence: [String]     // Correct letter sequence/answer
}
```

#### Decoding Question Types
1. **Word Identification**: "Tukuyin ang nasa larawan"
   - `displaySequence`: null
   - `blankPosition`: null
   - Students arrange all letters to form the word

2. **Word Completion**: "Buoin ang salita"
   - `displaySequence`: ["_", "S", "O"] (example)
   - `blankPosition`: 0 (position of missing letter)
   - Students fill in the missing letter(s)

### 4. Word Recognition
**Question Type**: `"fill_blank"`
**Approach**: Sentence completion and rhyming word identification

#### Question Structure
```javascript
{
  questionId: String,           // Unique identifier (e.g., "WR_001")
  questionText: String,         // Task instructions
  questionImage: String|null,   // S3 image URL (optional)
  displayWord: String,          // Sentence with blank or target word
  blankOptions: [String],       // Multiple choice options
  correctAnswer: [String]       // Correct answer(s) - array for multiple answers
}
```

#### Word Recognition Types
1. **Sentence Completion**: "Basahin ang pangungusap. Piliin ang tamang salita"
   - `displayWord`: "Naglalaro siya ng ___ sa parke"
   - Single correct answer selection

2. **Rhyming/Sound Recognition**: "Anong kasing tunog ng salitang nakikita?"
   - `displayWord`: Target word (e.g., "SUMBRERO")
   - Multiple syllables may be correct (e.g., ["LIB", "RO"])

### 5. Reading Comprehension
**Question Type**: `"text_input"`
**Approach**: Story reading with typed responses

#### Question Structure
```javascript
{
  questionId: String,           // Unique identifier (e.g., "RC_001")
  storyTitle: String,           // Story title for grouping
  passages: [
    {
      pageNumber: Number,       // Page sequence number
      pageText: String,         // Story text for this page
      pageImage: String|null    // S3 image URL (optional)
    }
  ] | null,                    // null for subsequent questions of same story
  questionText: String,         // Comprehension question
  correctAnswer: String,        // Primary correct answer
  acceptableAnswers: [String]   // Alternative acceptable answers
}
```

#### Reading Comprehension Features
- **Multi-page Stories**: Stories can span multiple pages/screens
- **Story Grouping**: Questions reference the same story using `storyTitle`
- **Flexible Answers**: Accept multiple valid response formats
- **No Passage Repetition**: Subsequent questions for same story have `passages: null`

## Student Response Collection (`main_assessment_responses`)

### Universal Response Attributes
- `_id`: ObjectId - Unique response identifier
- `studentId`: Number - Student ID number (NOT string)
- `categoryId`: ObjectId - Reference to category results
- `questionId`: String - Reference to main assessment question
- `category`: String - Assessment category name
- `readingLevel`: String - Student's reading level (from user profile)
- `responseTime`: Number - Time taken in seconds
- `answeredAt`: ISODate - Response timestamp
- `createdAt`: ISODate - Record creation timestamp
- `isCorrect`: Boolean - Whether response was correct

### Category-Specific Response Formats

#### Alphabet Knowledge Responses
```javascript
{
  response: [String],           // Selected optionId (e.g., ["2"])
  // ... universal attributes
}
```

#### Phonological Awareness Responses
```javascript
{
  response: [
    { audio: String, match: String }  // Audio-visual pairs
  ],
  correctMatches: Number,       // Number of correct pairs
  totalMatches: Number,         // Total pairs attempted
  // ... universal attributes
}
```

#### Decoding Responses
```javascript
{
  response: [String],           // Letter sequence (e.g., ["Y", "E", "L", "O"])
  // ... universal attributes
}
```

#### Word Recognition Responses
```javascript
{
  response: [String],           // Selected answer(s) (e.g., ["BOLA"])
  // ... universal attributes
}
```

#### Reading Comprehension Responses
```javascript
{
  response: [String],           // Typed answer (e.g., ["Juan"])
  // ... universal attributes
}
```

## Implementation Guidelines

### Question Distribution by Reading Level
- **Low Emerging**: Alphabet Knowledge focus
- **High Emerging**: Alphabet Knowledge + Phonological Awareness
- **Developing**: Decoding emphasis
- **Transitioning**: Word Recognition focus
- **At Grade Level**: Reading Comprehension priority

### Response Validation
1. **Alphabet Knowledge**: Exact optionId match
2. **Phonological Awareness**: All pairs must be correct for `isCorrect: true`
3. **Decoding**: Exact sequence match with `correctSequence`
4. **Word Recognition**: Match against `correctAnswer` array
5. **Reading Comprehension**: Check against `correctAnswer` or `acceptableAnswers`

### Audio Implementation Notes
- Phonological Awareness uses text-to-speech for `audioTexts`
- Audio elements should be clearly distinguishable
- Implement audio replay functionality
- Consider speech rate appropriate for target age group

### Image Requirements
- All images stored in S3 bucket
- Consistent sizing and quality
- Alt text for accessibility
- Fallback handling for missing images

### Randomization
- Shuffle `matchingOptions` in Phonological Awareness
- Randomize `blankOptions` order in Word Recognition
- Vary `dragElements` position in Decoding
- Maintain consistent `correctSequence` reference

## Frontend Integration Points

### Question Rendering
- **Multiple Choice**: Standard radio button interface
- **Matching**: Drag-and-drop or click-to-connect interface
- **Drag Drop**: Letter tile arrangement interface
- **Fill Blank**: Dropdown or button selection
- **Text Input**: Text field with validation

### Progress Tracking
- Track completion per reading level
- Monitor response times for difficulty assessment
- Store partial progress for session resumption
- Generate performance analytics per category

### Accessibility Features
- High contrast mode support
- Text-to-speech for all text content
- Keyboard navigation support
- Scalable UI elements
- Dyslexia-friendly fonts (Atkinson Hyperlegible)

## API Endpoints Structure

### Main Assessment Endpoints (Web Backend for Teachers/Admins)
- `GET /api/main-assessment/:readingLevel/:category` - Get questions for level/category (for viewing/editing)
- `GET /api/main-assessment/responses/:studentId` - Get student responses for analysis
- `GET /api/main-assessment/progress/:studentId` - Get completion status
- `GET /api/main-assessment/results/:studentId/:category` - Get category results with answer analysis
- `GET /api/main-assessment/analytics/:readingLevel/:category` - Get aggregated performance data

### Response Data Flow Architecture
**Mobile App (Student Assessment):**
1. Mobile app requests questions from backend
2. Student completes assessment on mobile device
3. Mobile app submits responses directly to `main_assessment_responses` collection
4. Mobile app handles all response validation and scoring

**Web Backend (Teacher/Admin Dashboard):**
1. Web backend **reads** responses from `main_assessment_responses` collection
2. Compares student responses against correct answers from question data
3. Generates performance analytics and reports
4. Provides viewing interface for teachers to analyze student performance
5. No creation or modification of student responses - **read-only for analysis**

## Data Validation Rules

### Required Fields by Category
- **All Categories**: questionId, category, readingLevel
- **Alphabet Knowledge**: choiceOptions with exactly 3 options
- **Phonological Awareness**: questionSet with audioTexts and matchingOptions
- **Decoding**: dragElements and correctSequence
- **Word Recognition**: displayWord, blankOptions, correctAnswer
- **Reading Comprehension**: questionText, correctAnswer, acceptableAnswers

### Business Logic Constraints
- Questions must belong to valid reading levels
- Response times must be positive numbers
- Student IDs must exist in users collection
- Category and reading level must match available assessments
- Image URLs must be valid S3 paths

## Performance Considerations

### Database Indexing
- Index on `readingLevel` and `category` for question queries
- Index on `studentId` and `questionId` for response queries
- Compound index on `readingLevel + category + isActive`

### Caching Strategy
- Cache frequently accessed question sets
- Store reading level mappings in memory
- Implement CDN for image assets
- Cache student progress data

### Scalability Notes
- Separate collections per reading level if data grows large
- Implement question versioning for content updates
- Consider read replicas for high-traffic periods
- Monitor response time analytics for performance optimization




[{
  "_id": {
    "$oid": "683cb98951eaae9b315b8c31"
  },
  "readingLevel": "High Emerging",
  "category": "Phonological Awareness",
  "questionType": "matching",
  "questions": [
    {
      "questionId": "PA_001",
      "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
      "questionSet": [
        {
          "audioTexts": [
            "H",
            "T",
            "N",
            "L",
            "P"
          ],
          "matchingOptions": [
            "Hh",
            "Tt",
            "Nn",
            "Ll",
            "Pp"
          ],
          "correctPairs": [
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
          ]
        }
      ]
    },
    {
      "questionId": "PA_002",
      "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
      "questionSet": [
        {
          "audioTexts": [
            "Daga",
            "Ilaw",
            "Mata",
            "Puno"
          ],
          "matchingOptions": [
            "Mata",
            "Puno",
            "Daga",
            "Ilaw"
          ],
          "correctPairs": [
            {
              "Daga": "Daga"
            },
            {
              "Ilaw": "Ilaw"
            },
            {
              "Mata": "Mata"
            },
            {
              "Puno": "Puno"
            }
          ]
        }
      ]
    },
    {
      "questionId": "PA_003",
      "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
      "questionSet": [
        {
          "audioTexts": [
            "L",
            "P",
            "B"
          ],
          "matchingOptions": [
            "Ll",
            "Pp",
            "Bb"
          ],
          "correctPairs": [
            {
              "L": "Ll"
            },
            {
              "P": "Pp"
            },
            {
              "B": "Bb"
            }
          ]
        }
      ]
    }
  ],
  "status": "active",
  "isActive": true,
  "createdAt": {
    "$date": "2025-06-01T19:23:35.208Z"
  },
  "updatedAt": {
    "$date": "2025-06-02T20:14:49.561Z"
  }
},
{
  "_id": {
    "$oid": "683cbaa951eaae9b315b8c42"
  },
  "readingLevel": "Developing",
  "category": "Decoding",
  "questionType": "drag_drop",
  "questions": [
    {
      "questionId": "DC_001",
      "questionText": "Tukuyin ang nasa larawan..",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1748895526838-YELO.png",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "Y",
        "E",
        "L",
        "O",
        "A",
        "U"
      ],
      "correctSequence": [
        "Y",
        "E",
        "L",
        "O"
      ]
    },
    {
      "questionId": "DC_002",
      "questionText": "Buoin ang salita…",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1748895783318-OSO.png",
      "displaySequence": [
        "_",
        "S",
        "O"
      ],
      "blankPosition": 0,
      "dragElements": [
        "O",
        "A",
        "E",
        "S"
      ],
      "correctSequence": [
        "O"
      ]
    }
  ],
  "status": "active",
  "isActive": true,
  "createdAt": {
    "$date": "2025-06-01T20:10:37.081Z"
  },
  "updatedAt": {
    "$date": "2025-06-10T20:21:28.810Z"
  }
},
{
  "_id": {
    "$oid": "683cbb7451eaae9b315b8c4a"
  },
  "readingLevel": "Transitioning",
  "category": "Word Recognition",
  "questionType": "fill_blank",
  "questions": [
    {
      "questionId": "WR_001",
      "questionText": "Basahin ang pangungusap",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1748897392625-SUMBRERO.png",
      "displayWord": "Naglalaro siya ng __ sa parke",
      "blankOptions": [
        "Kutsara",
        "Papel",
        "Bola",
        "Damit"
      ],
      "correctAnswer": [
        "Bola"
      ]
    },
    {
      "questionId": "WR_002",
      "questionText": "Anong kasing tunog ng",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1748897392625-SUMBRERO.png",
      "displayWord": "Sumbrero",
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
    }
  ],
  "status": "active",
  "isActive": true,
  "createdAt": {
    "$date": "2025-06-01T20:13:31.554Z"
  },
  "updatedAt": {
    "$date": "2025-06-02T20:50:17.268Z"
  }
},
{
  "_id": {
    "$oid": "683e0fc10a6d5b9eb216970c"
  },
  "readingLevel": "At Grade Level",
  "category": "Reading Comprehension",
  "questionType": "text_input",
  "questions": [
    {
      "questionId": "RC_001",
      "storyTitle": "Si Juan at ang Aso",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Tuwing umaga, si Juan at ang kaniyang aso na si Max ay naglalaro sa Parke",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1748897996981-page_1_1748897996667.jpg"
        },
        {
          "pageNumber": 2,
          "pageText": "Tuwing gabi, si Max at ang kaniyang pusa na si Max ay naglalaro sa Dagat",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1748897998186-page_2_1748897998178.jpg"
        },
        {
          "pageNumber": 3,
          "pageText": "Silang dalawa ay masayang uuwi ng tahanan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1748897998943-page_3_1748897998622.jpg"
        }
      ],
      "questionText": "Sino ang may aso?",
      "correctAnswer": "Juan",
      "acceptableAnswers": [
        "Juan",
        "juan",
        "Si Juan",
        "si juan"
      ]
    },
    {
      "questionId": "RC_002",
      "storyTitle": "Si Juan at ang Aso",
      "passages": null,
      "questionText": "Saan naglaro si Juan at Max?",
      "correctAnswer": "Parke",
      "acceptableAnswers": [
        "Parke",
        "parke",
        "sa parke",
        "Sa parke"
      ]
    }
  ],
  "status": "active",
  "isActive": true,
  "createdAt": {
    "$date": "2025-06-02T20:55:29.800Z"
  },
  "updatedAt": {
    "$date": "2025-06-02T21:12:09.760Z"
  }
},

