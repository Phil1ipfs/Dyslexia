# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LITEREXIA is a dyslexia assessment and intervention platform built with React and Node.js/Express. The application serves teachers, parents, and administrators with tools for assessing, monitoring, and supporting students with dyslexia.

## Architecture

### Frontend (`/frontend`)
- **Framework**: React 19.1.0 with Vite build system
- **UI Libraries**: React Bootstrap, FontAwesome, Radix UI components
- **Routing**: React Router DOM 7.4.1
- **Charts**: Recharts for data visualization
- **State Management**: Context API (AuthContext, ChatbotContexts)
- **Key Features**: 
  - Teacher dashboard and assessment tools
  - Parent portal for child progress monitoring
  - Admin panel for system management
  - Responsive design with Bootstrap

### Backend (`/backend`)
- **Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 integration for images/documents
- **AI Integration**: OpenAI API for chatbot functionality
- **Email**: Nodemailer for notifications
- **Multi-database**: Uses separate MongoDB databases (test, teachers, parent, users_web)

### Database Structure
- `users_web` - User authentication and roles
- `teachers` - Teacher profiles and data
- `parent` - Parent profiles and data
- `test` - Student data and assessment results

## Pre-Assessment System

### Overview
The pre-assessment is a comprehensive Filipino reading assessment that evaluates students across 5 categories to determine their reading level according to DepEd standards.

### Database Collections

#### 1. Pre_Assessment Collection (pre-assessment table)
**Purpose**: Stores the master assessment questions and configuration

**Key Attributes**:
```javascript
{
  _id: ObjectId,                    // MongoDB ObjectId
  title: String,                    // "Filipino Reading Comprehension Assessment"
  description: String,              // "CRLA Standard Deped Curriculum"
  instructions: String,             // Instructions for students
  totalQuestions: Number,           // Total questions (65 total: 15+15+15+15+5)
  
  categoryCounts: {                 // Distribution of questions per category
    alphabet_knowledge: 15,
    phonological_awareness: 15,
    decoding: 15,
    word_recognition: 15,
    reading_comprehension: 5
  },
  
  language: String,                 // "FL" for Filipino
  questions: [Array],               // All assessment questions (see detailed structure below)
  scoringRules: Object,             // Reading level determination rules
  type: String,                     // "pre_assessment"
  status: String,                   // "active" or "inactive"
  isActive: Boolean,                // true/false
  assessmentId: String,             // Always "1"
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### 2. User_Responses Collection
**Purpose**: Stores individual student responses to assessment questions

**Key Attributes**:
```javascript
{
  _id: ObjectId,
  studentId: Number,                // From users.idNumber
  assessmentId: String,             // "1" (links to pre_assessment.assessmentId)
  questionId: String,               // Links to specific question (e.g., "AK_001")
  category: String,                 // Question category
  questionType: String,             // Specific question type within category
  response: [Array],                // Student's answer (format varies by question type)
  isCorrect: Boolean,               // Whether answer was correct
  responseTime: Number,             // Time taken in seconds
  answeredAt: ISODate,              // When question was answered
  createdAt: ISODate,
  
  // Additional fields for specific question types:
  correctMatches: Number,           // For phonological awareness only
  totalMatches: Number              // For phonological awareness only
}
```

#### 3. Test.Users Collection
**Purpose**: Student records that get updated after pre-assessment completion

**Key Attributes**:
```javascript
{
  _id: ObjectId,
  idNumber: Number,                 // Unique student identifier
  firstName: String,
  middleName: String,
  lastName: String,
  age: String,
  gender: String,                   // "Male" or "Female"
  gradeLevel: String,               // "Grade 1", "Grade 2", etc.
  section: String,                  // Class section name
  address: String,
  email: String,                    // Usually null for students
  profileImageUrl: String,          // S3 URL or empty string
  completedLessons: [Array],        // Array of completed lesson IDs
  
  // These fields are updated after pre-assessment:
  readingLevel: String,             // "Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"
  readingPercentage: Number,        // Calculated percentage score
  preAssessmentCompleted: Boolean,  // Set to true when assessment is done
  lastAssessmentDate: String,       // ISO date string of last assessment
  
  parentId: ObjectId,               // Link to parent record
  createdAt: ISODate,
  updatedAt: String                 // ISO date string
}
```

### Question Categories and Types

#### 1. Alphabet Knowledge (15 questions)
**Question Types**: 
- `patinig` (vowels) - Multiple choice with 3 options
- `katinig` (consonants) - Multiple choice with 3 options

**Question Structure**:
```javascript
{
  questionId: String,               // "AK_001", "AK_002", etc.
  category: "Alphabet Knowledge",
  questionType: String,             // "patinig" or "katinig"
  questionText: String,             // Question prompt in Filipino
  questionValue: String,            // The letter being tested
  questionImage: String,            // S3 URL or null
  options: [                        // Array of 3 options
    {
      optionId: String,             // "1", "2", "3"
      optionText: String,           // Option text
      isCorrect: Boolean            // Only one should be true
    }
  ]
}
```

**Response Format**:
```javascript
{
  response: ["2"],                  // Array with selected optionId
  isCorrect: true/false
}
```

#### 2. Phonological Awareness (15 questions)
**Question Types**: 
- `malapantig` - Audio-based matching exercises

**Question Structure**:
```javascript
{
  questionId: String,               // "PA_001", "PA_002", etc.
  category: "Phonological Awareness",
  questionType: "malapantig",
  questionText: String,             // Instructions for matching
  questionValue: null,              // Always null for this category
  questionImage: null,              // Always null for this category
  questionSet: {
    audioTexts: [Array],            // Letters/words to be read aloud via TTS
    matchingOptions: [Array],       // Visual options to match against
    correctPairs: [Array]           // Correct audio-visual pairs
  }
}
```

**Response Format**:
```javascript
{
  response: [
    { audio: "H", match: "Hh" },
    { audio: "T", match: "Tt" }
  ],
  correctMatches: Number,           // How many pairs were correct
  totalMatches: Number,             // Total pairs in the question
  isCorrect: Boolean                // True if all matches are correct
}
```

#### 3. Decoding (15 questions)
**Question Types**: 
- `decode` - Drag and drop letter arrangement

**Question Structure**:
```javascript
{
  questionId: String,               // "DC_001", "DC_002", etc.
  category: "Decoding",
  questionType: "decode",
  questionText: String,             // Question prompt
  questionValue: null,              // Always null for this category
  questionImage: String,            // S3 URL with image to decode
  displaySequence: [Array],         // Letters shown in sequence (may have blanks)
  blankPosition: Number,            // Position of blank (null if no blank)
  dragElements: [Array],            // Available letters to drag
  correctSequence: [Array]          // Correct letter sequence
}
```

**Response Format**:
```javascript
{
  response: ["Y", "E", "L", "O"],   // Array of dragged letters in order
  isCorrect: Boolean                // True if matches correctSequence
}
```

#### 4. Word Recognition (15 questions)
**Question Types**: 
- `word` - Fill in the blank or syllable matching

**Question Structure**:
```javascript
{
  questionId: String,               // "WR_001", "WR_002", etc.
  category: "Word Recognition",
  questionType: "word",
  questionText: String,             // Question prompt
  questionValue: String,            // Word being tested (or null)
  questionImage: String,            // S3 URL or null
  displayWord: String,              // Sentence with blank or word to analyze
  blankOptions: [Array],            // Options to fill blank or syllable choices
  correctAnswer: [Array]            // Correct answer(s)
}
```

**Response Format**:
```javascript
{
  response: ["BOLA"],               // Array with selected answer(s)
  isCorrect: Boolean
}
```

#### 5. Reading Comprehension (5 questions)
**Question Types**: 
- `sentence` - Short story comprehension with typed answers

**Question Structure**:
```javascript
{
  questionId: String,               // "RC_001", "RC_002", etc.
  category: "Reading Comprehension",
  questionType: "sentence",
  questionText: String,             // General instruction
  questionValue: null,              // Always null
  questionImage: null,              // Always null
  passages: [                       // Story content
    {
      pageNumber: Number,           // Page number
      pageText: String,             // Story text for this page
      pageImage: String             // S3 URL or null
    }
  ],
  sentenceQuestions: [              // Questions about the story
    {
      questionText: String,         // Specific question
      correctAnswer: String,        // Expected answer
      acceptableAnswers: [Array]    // Alternative acceptable answers
    }
  ]
}
```

**Response Format**:
```javascript
{
  response: ["Mansanas"],           // Array with typed answer
  isCorrect: Boolean                // True if matches correctAnswer or acceptableAnswers
}
```

### Scoring and Reading Level Determination

#### Scoring Rules
The system uses a complex scoring algorithm based on:
1. **Part 1 Score**: Total correct answers from first 4 categories (60 questions max)
2. **Reading Percentage**: Percentage of reading comprehension questions answered
3. **Comprehension Correct Range**: Number of reading comprehension questions correct

#### Reading Levels
```javascript
scoringRules: {
  "Low Emerging": {
    part1ScoreRange: [0, 16],
    readingPercentageRange: null,
    comprehensionCorrectRange: null,
    description: "Learner with scores 0 to 16 upon administration of Part 1"
  },
  "High Emerging": {
    part1ScoreRange: [17, 30],
    readingPercentageRange: [0, 25],
    comprehensionCorrectRange: [0, 0],
    description: "Scores 17-30 in Part 1, reads less than 25%, cannot answer any RC questions"
  },
  "Developing": {
    part1ScoreRange: [17, 30],
    readingPercentageRange: [26, 50],
    comprehensionCorrectRange: [1, 5],
    description: "Scores 17-30 in Part 1, reads 26-50%, answers at least 1 question correctly"
  },
  "Transitioning": {
    part1ScoreRange: [17, 30],
    readingPercentageRange: [51, 75],
    comprehensionCorrectRange: [2, 3],
    description: "Scores 17-30 in Part 1, reads 51-75%, answers 2-3 questions correctly"
  },
  "At Grade Level": {
    part1ScoreRange: [17, 30],
    readingPercentageRange: [76, 100],
    comprehensionCorrectRange: [4, 5],
    description: "Scores 17-30 in Part 1, reads 76-100%, answers 4-5 questions correctly"
  }
}
```

### Assessment Workflow

1. **Student starts assessment**: System retrieves questions from pre_assessment collection
2. **Question presentation**: Based on question type, appropriate UI is shown:
   - Alphabet Knowledge: Multiple choice with 3 options
   - Phonological Awareness: Audio playback with drag-and-drop matching
   - Decoding: Image with drag-and-drop letter arrangement
   - Word Recognition: Fill-in-the-blank or syllable selection
   - Reading Comprehension: Story display with text input for answers

3. **Response recording**: Each answer is saved to user_responses collection with:
   - Student ID and question ID linking
   - Response time tracking
   - Immediate correctness evaluation
   - Specific response format based on question type

4. **Score calculation**: After completion, system:
   - Calculates total correct answers per category
   - Determines Part 1 score (first 4 categories)
   - Calculates reading comprehension percentage
   - Applies scoring rules to determine reading level

5. **Student record update**: Updates test.users collection:
   - `readingLevel`: Determined from scoring rules
   - `readingPercentage`: Calculated percentage
   - `preAssessmentCompleted`: Set to `true`
   - `lastAssessmentDate`: Current timestamp
   - `updatedAt`: Current timestamp

### API Endpoints Structure
- `GET /api/pre-assessment` - Retrieve assessment questions
- `POST /api/pre-assessment/response` - Submit individual question response
- `POST /api/pre-assessment/complete` - Finalize assessment and update student record
- `GET /api/student/:id/assessment-results` - Retrieve student's assessment results

## Development Commands

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start           # Start production server
npm run init-iep    # Initialize IEP system
```

### Root Level
The root `package.json` contains minimal dependencies (axios, form-data, react-toastify) for shared utilities.

## Key Configuration

### Frontend (Vite)
- **Dev Server**: http://localhost:5173 (proxies /api to backend)
- **API Proxy**: All `/api` requests forwarded to http://localhost:5001
- **Build Output**: `dist/` directory
- **Assets**: Custom fonts (Atkinson Hyperlegible) for dyslexia accessibility

### Backend (Express)
- **Server Port**: 5001 (configurable via PORT env var)
- **CORS**: Configured for multiple frontend origins including localhost:5173
- **File Uploads**: 50MB limit for large file handling
- **Database**: MongoDB connection with timeout settings
- **S3 Integration**: AWS SDK v3 for file storage

## Environment Variables

### Required Backend Variables
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - S3 configuration
- `AWS_BUCKET_NAME` - S3 bucket name
- `FRONTEND_URL` - Frontend URL for CORS

## Key Directories

### Frontend Structure
- `src/components/` - Reusable UI components organized by domain (Admin, TeacherPage, ParentPage, Homepage)
- `src/pages/` - Page components for routing
- `src/services/` - API service layers for backend communication
- `src/contexts/` - React context providers
- `src/assets/` - Static assets including accessibility fonts

### Backend Structure
- `controllers/` - Route handlers organized by domain
- `models/` - Mongoose schema definitions
- `routes/` - Express route definitions
- `services/` - Business logic and external integrations
- `middleware/` - Express middlewares for auth, uploads
- `utils/` - Utility functions

## Testing

Currently no test framework is configured. The backend has a placeholder test script that exits with error.

## Special Features

### Accessibility
- Uses Atkinson Hyperlegible font specifically designed for dyslexia
- Responsive design considerations for various devices
- Audio-based questions with Text-to-Speech integration

### Multi-tenant Architecture
- Separate database collections for different user types
- Role-based access control with JWT

### File Management
- S3 integration with fallback to database storage
- Image proxy endpoint for secure S3 access
- Large file upload support (50MB limit)

### AI Integration
- OpenAI chatbot for teacher assistance
- Automated assessment analysis and recommendations

## Development Notes

- Frontend uses Vite for fast development and modern build process
- Backend implements comprehensive error handling and logging
- Database connections are established before route registration
- Multiple CORS origins supported for different development environments
- Extensive fallback data systems for development/demo purposes
- Assessment system uses real-time response tracking and immediate feedback
- All images are stored in S3 with CDN distribution for optimal performance



Sample Json File of the pre assessment 

[{
  "_id": {
    "$oid": "683c8b5bb3d25e77531903d6"
  },
  "title": "Filipino Reading Comprehension Assessment",
  "description": "CRLA Standard Deped Curriculum",
  "instructions": "Complete the pre assessment for student to assess reading level",
  "totalQuestions": 35,
  "categoryCounts": {
    "alphabet_knowledge": 15,
    "phonological_awareness": 15,
    "decoding": 15,
    "word_recognition": 15,
    "reading_comprehension": 5
  },
  "language": "FL",
  "questions": [
    {
      "questionId": "AK_001",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Anong ang katumbas na maliit na letra?",
      "questionValue": "E",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748891553508-o231plbj3e.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "e",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "a",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "c",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_002",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Anong ang katumbas na maliit na letra?",
      "questionValue": "O",
      "questionImage": null,
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "u",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "o",
          "isCorrect": true
        },
        {
          "optionId": "3",
          "optionText": "j",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_003",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Anong ang katumbas na maliit na letra?",
      "questionValue": "B",
      "questionImage": null,
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "b",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "i",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "d",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_004",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Anong ang katumbas na malaking letra?",
      "questionValue": "u",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748891612703-6zaxr91juo7.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "U",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "E",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "V",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_005",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Anong ang katumbas na malaking letra?",
      "questionValue": "d",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748891900805-jy66cw08we8.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "W",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "D",
          "isCorrect": true
        },
        {
          "optionId": "3",
          "optionText": "B",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_006",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Anong ang katumbas na malaking letra?",
      "questionValue": "k",
      "questionImage": null,
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "K",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "U",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "F",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_007",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Anong tunog ng letra?",
      "questionValue": "A",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748891924936-aner7cujhme.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "/geh/",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "/ey/",
          "isCorrect": true
        },
        {
          "optionId": "3",
          "optionText": "/ee/",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_008",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Anong tunog ng letra?",
      "questionValue": "R",
      "questionImage": null,
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "/ar/",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "/es/",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "/beh/",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_009",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Anong tunog ng letra?",
      "questionValue": "S",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748891952089-2f0m5w03m45.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "/ar/",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "/es/",
          "isCorrect": true
        },
        {
          "optionId": "3",
          "optionText": "/the/",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_010",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Tukuyin ang letra kung Patinig o Katinig",
      "questionValue": "I",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748892181633-nseun67drmr.png",
      "difficultyLevel": "high_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "Patinig",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "Katinig",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_011",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Tukuyin ang letra kung Patinig o Katinig",
      "questionValue": "Y",
      "questionImage": null,
      "difficultyLevel": "high_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "Katinig",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "Patinig",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_012",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Tukuyin ang letra kung Patinig o Katinig",
      "questionValue": "M",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748892205955-i7ui7c32pro.png",
      "difficultyLevel": "high_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "Patinig",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "Katinig",
          "isCorrect": true
        }
      ]
    },
    {
      "questionId": "AK_013",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Tukuyin ang unang letra na nasa larawan?",
      "questionValue": "gulay",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748892370350-k6fyokc9jos.png",
      "difficultyLevel": "high_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "G",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "u",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "l",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_014",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Tukuyin ang unang letra na nasa larawan?",
      "questionValue": "walis",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748892390177-97s3qqdxc6n.png",
      "difficultyLevel": "high_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "w",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "a",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "l",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_015",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Tukuyin ang unang letra na nasa larawan?",
      "questionValue": "Kalabaw",
      "questionImage": null,
      "difficultyLevel": "high_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "K",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "a",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "l",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "PA_001",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "high_emerging",
      "questionSet": {
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
    },
    {
      "questionId": "PA_002",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang salita sa audio. Itugma ito sa katumbas na salita sa kabilang hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "high_emerging",
      "questionSet": {
        "audioTexts": [
          "DAGA",
          "ILAW",
          "MATA",
          "PUNO",
          "RELO"
        ],
        "matchingOptions": [
          "Daga",
          "Ilaw",
          "Mata",
          "Puno",
          "Relo"
        ],
        "correctPairs": [
          {
            "DAGA": "DAGA"
          },
          {
            "ILAW": "ILAW"
          },
          {
            "MATA": "MATA"
          },
          {
            "PUNO": "PUNO"
          },
          {
            "RELO": "RELO"
          }
        ]
      }
    },
    {
      "questionId": "PA_003",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang pantig sa audio. Itugma ito sa katumbas na pantig sa kabilang hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "high_emerging",
      "questionSet": {
        "audioTexts": [
          "GA",
          "LO",
          "PI",
          "NGA",
          "WU"
        ],
        "matchingOptions": [
          "GA",
          "LO",
          "PI",
          "NGA",
          "WU"
        ],
        "correctPairs": [
          {
            "GA": "GA"
          },
          {
            "LO": "LO"
          },
          {
            "PI": "PI"
          },
          {
            "NGA": "NGA"
          },
          {
            "WU": "WU"
          }
        ]
      }
    },
    {
      "questionId": "DC_001",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "s3 bucket link",
      "difficultyLevel": "developing",
      "displaySequence": [
        "Y",
        "E",
        "L",
        "O"
      ],
      "blankPosition": null,
      "dragElements": [
        "Y",
        "A",
        "L",
        "E",
        "O"
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
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893185897-7yd0qu3sj3.png",
      "difficultyLevel": "developing",
      "displaySequence": [
        "A",
        "R",
        "A",
        "W"
      ],
      "blankPosition": null,
      "dragElements": [
        "A",
        "N",
        "R",
        "A",
        "P",
        "W"
      ],
      "correctSequence": [
        "A",
        "R",
        "A",
        "W"
      ]
    },
    {
      "questionId": "DC_003",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893244646-7yuayk0eu5c.png",
      "difficultyLevel": "developing",
      "displaySequence": [
        "N",
        "G",
        "I",
        "P",
        "I",
        "N"
      ],
      "blankPosition": null,
      "dragElements": [
        "N",
        "G",
        "I",
        "P",
        "I",
        "N"
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
      "questionId": "DC_004",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Buoin ang salita",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893244646-7yuayk0eu5c.png",
      "difficultyLevel": "developing",
      "displaySequence": [
        "",
        "i",
        "n",
        "a",
        "p",
        "a",
        "y"
      ],
      "blankPosition": 0,
      "dragElements": [
        "T",
        "y",
        "A",
        "E"
      ],
      "correctSequence": [
        "T"
      ]
    },
    {
      "questionId": "DC_005",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Buoin ang salita",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893244646-7yuayk0eu5c.png",
      "difficultyLevel": "developing",
      "displaySequence": [
        "",
        "s",
        "o"
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
    },
    {
      "questionId": "DC_006",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Buoin ang salita",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893244646-7yuayk0eu5c.png",
      "difficultyLevel": "developing",
      "displaySequence": [
        "",
        "p",
        "o"
      ],
      "blankPosition": 0,
      "dragElements": [
        "U",
        "O",
        "A",
        "E"
      ],
      "correctSequence": [
        "U"
      ]
    },
    {
      "questionId": "WR_001",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Naglalaro siya ng ___ sa parke.",
      "blankOptions": [
        "KUTSARA",
        "PAPEL",
        "BOLA",
        "DAMIT"
      ],
      "correctAnswer": [
        "BOLA"
      ]
    },
    {
      "questionId": "WR_002",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Malaki ang ___ sa zoo.",
      "blankOptions": [
        "ELEPANTE",
        "LAMESA",
        "NANAY",
        "MANOK"
      ],
      "correctAnswer": [
        "ELEPANTE"
      ]
    },
    {
      "questionId": "WR_003",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Mahilig magluto ang ___ ko.",
      "blankOptions": [
        "MANOK",
        "BOLA",
        "NANAY",
        "ELEPANTE"
      ],
      "correctAnswer": [
        "NANAY"
      ]
    },
    {
      "questionId": "WR_004",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Nasa ___ ang mga libro.",
      "blankOptions": [
        "PAPEL",
        "LAMESA",
        "MANOK",
        "BOLA"
      ],
      "correctAnswer": [
        "LAMESA"
      ]
    },
    {
      "questionId": "WR_005",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionValue": "SUMBRERO",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893507991-y80mnxe4oa.png",
      "difficultyLevel": "transitioning",
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
      "questionId": "RC_001",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionText": "Tukuyin ang angkop na sagot",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Maria ay kumain ng mansanas.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893727535-eb17jnoo94.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang kinain ni Maria?",
          "correctAnswer": "Mansanas",
          "acceptableAnswers": [
            "Si Mansanas",
            "ako si mansanas"
          ]
        }
      ]
    },
    {
      "questionId": "RC_002",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionText": "Tukuyin ang angkop na sagot",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Juan ay naglalaro ng bola sa parke.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893746148-srpxj0f44w.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang nilalaro ni Juan?",
          "correctAnswer": "Bola",
          "acceptableAnswers": [
            "Bola",
            "bola"
          ]
        }
      ]
    },
    {
      "questionId": "RC_003",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionText": "Tukuyin ang angkop na sagot",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Ang aso ay tumakbo sa hardin.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893767966-cadtn6hapn8.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Saan tumakbo ang aso?",
          "correctAnswer": "Hardin",
          "acceptableAnswers": [
            "Hardin",
            "hardin"
          ]
        }
      ]
    },
    {
      "questionId": "RC_004",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionText": "Tukuyin ang angkop na sagot",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si nanay ay nagluto ng adobo.",
          "pageImage": null
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang niluto ni nanay?",
          "correctAnswer": "Adobo",
          "acceptableAnswers": [
            "Adobo",
            "adobo"
          ]
        }
      ]
    },
    {
      "questionId": "RC_005",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionText": "Tukuyin ang angkop na sagot",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Ang bata ay nag-aaral ng aralin.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1748893830023-fcpgi0t4ef.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang ginagawa ng bata?",
          "correctAnswer": "Nag-aaral",
          "acceptableAnswers": [
            "Nag-aaral",
            "nag-aaral",
            "Nag aaral"
          ]
        }
      ]
    }
  ],
  "scoringRules": {
    "Low Emerging": {
      "part1ScoreRange": [
        0,
        16
      ],
      "description": "Learner with scores 0 to 16 upon administration of Part 1",
      "readingPercentageRange": null,
      "comprehensionCorrectRange": null
    },
    "High Emerging": {
      "part1ScoreRange": [
        17,
        30
      ],
      "readingPercentageRange": [
        0,
        25
      ],
      "comprehensionCorrectRange": [
        0,
        0
      ],
      "description": "Scores 17-30 in Part 1, reads less than 25%, cannot answer any Reading Comprehension questions"
    },
    "Developing": {
      "part1ScoreRange": [
        17,
        30
      ],
      "readingPercentageRange": [
        26,
        50
      ],
      "comprehensionCorrectRange": [
        1,
        5
      ],
      "description": "Scores 17-30 in Part 1, reads 26-50%, answers at least 1 question correctly"
    },
    "Transitioning": {
      "part1ScoreRange": [
        17,
        30
      ],
      "readingPercentageRange": [
        51,
        75
      ],
      "comprehensionCorrectRange": [
        2,
        3
      ],
      "description": "Scores 17-30 in Part 1, reads 51-75%, answers 2-3 questions correctly"
    },
    "At Grade Level": {
      "part1ScoreRange": [
        17,
        30
      ],
      "readingPercentageRange": [
        76,
        100
      ],
      "comprehensionCorrectRange": [
        4,
        5
      ],
      "description": "Scores 17-30 in Part 1, reads 76-100%, answers 4-5 questions correctly"
    }
  },
  "type": "pre_assessment",
  "status": "active",
  "isActive": true,
  "assessmentId": "1",
  "createdAt": {
    "$date": "2025-01-15T10:00:00.000Z"
  },
  "updatedAt": {
    "$date": "2025-01-15T10:00:00.000Z"
  }
}]



SAMPLE RECORD OF user_responses

[{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6f2"
  },
  "studentId": 202533333,
  "assessmentId": "1",
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 6.2,
  "answeredAt": {
    "$date": "2025-08-18T12:03:32.700Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:03:32.700Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6f3"
  },
  "studentId": 202533333,
  "assessmentId": "1",
  "questionId": "AK_003",
  "category": "Alphabet Knowledge",
  "questionType": "katinig",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 7.8,
  "answeredAt": {
    "$date": "2025-08-18T12:03:41.500Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:03:41.500Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6f4"
  },
  "studentId": 202533333,
  "assessmentId": "1",
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "questionType": "malapantig",
  "response": [
    {
      "audio": "H",
      "match": "Hh"
    },
    {
      "audio": "T",
      "match": "Tt"
    },
    {
      "audio": "N",
      "match": "Nn"
    },
    {
      "audio": "L",
      "match": "Ll"
    },
    {
      "audio": "P",
      "match": "Pp"
    }
  ],
  "correctMatches": 5,
  "totalMatches": 5,
  "isCorrect": true,
  "responseTime": 45.7,
  "answeredAt": {
    "$date": "2025-08-18T12:04:27.200Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:04:27.200Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6f5"
  },
  "studentId": 202533333,
  "assessmentId": "1",
  "questionId": "DC_001",
  "category": "Decoding",
  "questionType": "decode",
  "response": [
    "Y",
    "E",
    "L",
    "O"
  ],
  "isCorrect": true,
  "responseTime": 25.3,
  "answeredAt": {
    "$date": "2025-08-18T12:04:52.500Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:04:52.500Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6f6"
  },
  "studentId": 202533333,
  "assessmentId": "1",
  "questionId": "WR_001",
  "category": "Word Recognition",
  "questionType": "word",
  "response": [
    "BOLA"
  ],
  "isCorrect": true,
  "responseTime": 18.9,
  "answeredAt": {
    "$date": "2025-08-18T12:05:11.400Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:05:11.400Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6f7"
  },
  "studentId": 202533333,
  "assessmentId": "1",
  "questionId": "RC_001",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "Mansanas"
  ],
  "isCorrect": true,
  "responseTime": 35.6,
  "answeredAt": {
    "$date": "2025-08-18T12:05:47.000Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:05:47.000Z"
  }
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583501"
  },
  "studentId": 202511111,
  "assessmentId": "1",
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 12.3,
  "answeredAt": {
    "$date": "2025-06-11T13:20:45.500Z"
  },
  "createdAt": {
    "$date": "2025-06-11T13:20:45.500Z"
  }
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583502"
  },
  "studentId": 202511111,
  "assessmentId": "1",
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "3"
  ],
  "isCorrect": false,
  "responseTime": 9.8,
  "answeredAt": {
    "$date": "2025-06-11T13:20:55.300Z"
  },
  "createdAt": {
    "$date": "2025-06-11T13:20:55.300Z"
  }
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583503"
  },
  "studentId": 202511111,
  "assessmentId": "1",
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "questionType": "malapantig",
  "response": [
    {
      "audio": "H",
      "match": "Tt"
    },
    {
      "audio": "T",
      "match": "Hh"
    },
    {
      "audio": "N",
      "match": "Nn"
    },
    {
      "audio": "L",
      "match": "Ll"
    },
    {
      "audio": "P",
      "match": "Pp"
    }
  ],
  "correctMatches": 3,
  "totalMatches": 5,
  "isCorrect": false,
  "responseTime": 52.4,
  "answeredAt": {
    "$date": "2025-06-11T13:21:47.700Z"
  },
  "createdAt": {
    "$date": "2025-06-11T13:21:47.700Z"
  }
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583504"
  },
  "studentId": 202511111,
  "assessmentId": "1",
  "questionId": "DC_002",
  "category": "Decoding",
  "questionType": "decode",
  "response": [
    "A",
    "N",
    "A",
    "W"
  ],
  "isCorrect": false,
  "responseTime": 38.7,
  "answeredAt": {
    "$date": "2025-06-11T13:22:26.400Z"
  },
  "createdAt": {
    "$date": "2025-06-11T13:22:26.400Z"
  }
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583505"
  },
  "studentId": 202511111,
  "assessmentId": "1",
  "questionId": "WR_002",
  "category": "Word Recognition",
  "questionType": "word",
  "response": [
    "ELEPANTE"
  ],
  "isCorrect": true,
  "responseTime": 22.1,
  "answeredAt": {
    "$date": "2025-06-11T13:22:48.500Z"
  },
  "createdAt": {
    "$date": "2025-06-11T13:22:48.500Z"
  }
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583506"
  },
  "studentId": 202511111,
  "assessmentId": "1",
  "questionId": "RC_002",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "Bola"
  ],
  "isCorrect": true,
  "responseTime": 28.9,
  "answeredAt": {
    "$date": "2025-06-11T13:23:17.400Z"
  },
  "createdAt": {
    "$date": "2025-06-11T13:23:17.400Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c01"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 5.2,
  "answeredAt": {
    "$date": "2025-08-20T04:47:15.200Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:47:15.200Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c02"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "2"
  ],
  "isCorrect": true,
  "responseTime": 4.8,
  "answeredAt": {
    "$date": "2025-08-20T04:47:20.000Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:47:20.000Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c03"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "AK_003",
  "category": "Alphabet Knowledge",
  "questionType": "katinig",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 6.1,
  "answeredAt": {
    "$date": "2025-08-20T04:47:26.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:47:26.100Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c04"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "questionType": "malapantig",
  "response": [
    {
      "audio": "H",
      "match": "Hh"
    },
    {
      "audio": "T",
      "match": "Tt"
    },
    {
      "audio": "N",
      "match": "Nn"
    },
    {
      "audio": "L",
      "match": "Ll"
    },
    {
      "audio": "P",
      "match": "Pp"
    }
  ],
  "correctMatches": 5,
  "totalMatches": 5,
  "isCorrect": true,
  "responseTime": 32.6,
  "answeredAt": {
    "$date": "2025-08-20T04:47:58.700Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:47:58.700Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c05"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "PA_002",
  "category": "Phonological Awareness",
  "questionType": "malapantig",
  "response": [
    {
      "audio": "DAGA",
      "match": "ILAW"
    },
    {
      "audio": "ILAW",
      "match": "DAGA"
    },
    {
      "audio": "MATA",
      "match": "MATA"
    },
    {
      "audio": "PUNO",
      "match": "PUNO"
    },
    {
      "audio": "RELO",
      "match": "RELO"
    }
  ],
  "correctMatches": 3,
  "totalMatches": 5,
  "isCorrect": false,
  "responseTime": 41.3,
  "answeredAt": {
    "$date": "2025-08-20T04:48:40.000Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:48:40.000Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c06"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "DC_001",
  "category": "Decoding",
  "questionType": "decode",
  "response": [
    "Y",
    "E",
    "L",
    "O"
  ],
  "isCorrect": true,
  "responseTime": 18.4,
  "answeredAt": {
    "$date": "2025-08-20T04:48:58.400Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:48:58.400Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c07"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "DC_002",
  "category": "Decoding",
  "questionType": "decode",
  "response": [
    "A",
    "R",
    "A",
    "W"
  ],
  "isCorrect": true,
  "responseTime": 21.7,
  "answeredAt": {
    "$date": "2025-08-20T04:49:20.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:49:20.100Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c08"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "WR_001",
  "category": "Word Recognition",
  "questionType": "word",
  "response": [
    "BOLA"
  ],
  "isCorrect": true,
  "responseTime": 14.2,
  "answeredAt": {
    "$date": "2025-08-20T04:49:34.300Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:49:34.300Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c09"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "WR_002",
  "category": "Word Recognition",
  "questionType": "word",
  "response": [
    "ELEPANTE"
  ],
  "isCorrect": true,
  "responseTime": 16.8,
  "answeredAt": {
    "$date": "2025-08-20T04:49:51.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:49:51.100Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c10"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "RC_001",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "Mansanas"
  ],
  "isCorrect": true,
  "responseTime": 24.5,
  "answeredAt": {
    "$date": "2025-08-20T04:50:15.600Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:50:15.600Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c11"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "RC_002",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "Bola"
  ],
  "isCorrect": true,
  "responseTime": 19.3,
  "answeredAt": {
    "$date": "2025-08-20T04:50:34.900Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:50:34.900Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c12"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "RC_003",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "Hardin"
  ],
  "isCorrect": true,
  "responseTime": 22.7,
  "answeredAt": {
    "$date": "2025-08-20T04:50:57.600Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:50:57.600Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c13"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "RC_004",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "Adobo"
  ],
  "isCorrect": true,
  "responseTime": 18.9,
  "answeredAt": {
    "$date": "2025-08-20T04:51:16.500Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:51:16.500Z"
  }
},
{
  "_id": {
    "$oid": "68491110988139e71b308c14"
  },
  "studentId": 202522233,
  "assessmentId": "1",
  "questionId": "RC_005",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "Nag-aaral"
  ],
  "isCorrect": true,
  "responseTime": 26.4,
  "answeredAt": {
    "$date": "2025-08-20T04:51:42.900Z"
  },
  "createdAt": {
    "$date": "2025-08-20T04:51:42.900Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d01"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 15.3,
  "answeredAt": {
    "$date": "2025-08-19T12:43:45.200Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:43:45.200Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d02"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "AK_002",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "1"
  ],
  "isCorrect": false,
  "responseTime": 18.7,
  "answeredAt": {
    "$date": "2025-08-19T12:44:03.900Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:44:03.900Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d03"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "AK_003",
  "category": "Alphabet Knowledge",
  "questionType": "katinig",
  "response": [
    "2"
  ],
  "isCorrect": false,
  "responseTime": 22.1,
  "answeredAt": {
    "$date": "2025-08-19T12:44:26.000Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:44:26.000Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d04"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "PA_001",
  "category": "Phonological Awareness",
  "questionType": "malapantig",
  "response": [
    {
      "audio": "H",
      "match": "Hh"
    },
    {
      "audio": "T",
      "match": "Nn"
    },
    {
      "audio": "N",
      "match": "Tt"
    },
    {
      "audio": "L",
      "match": "Ll"
    },
    {
      "audio": "P",
      "match": "Pp"
    }
  ],
  "correctMatches": 3,
  "totalMatches": 5,
  "isCorrect": false,
  "responseTime": 68.4,
  "answeredAt": {
    "$date": "2025-08-19T12:45:34.400Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:45:34.400Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d05"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "DC_004",
  "category": "Decoding",
  "questionType": "decode",
  "response": [
    "T"
  ],
  "isCorrect": true,
  "responseTime": 42.6,
  "answeredAt": {
    "$date": "2025-08-19T12:46:17.000Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:46:17.000Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d06"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "DC_005",
  "category": "Decoding",
  "questionType": "decode",
  "response": [
    "A"
  ],
  "isCorrect": false,
  "responseTime": 35.8,
  "answeredAt": {
    "$date": "2025-08-19T12:46:52.800Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:46:52.800Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d07"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "WR_003",
  "category": "Word Recognition",
  "questionType": "word",
  "response": [
    "NANAY"
  ],
  "isCorrect": true,
  "responseTime": 28.3,
  "answeredAt": {
    "$date": "2025-08-19T12:47:21.100Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:47:21.100Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d08"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "WR_004",
  "category": "Word Recognition",
  "questionType": "word",
  "response": [
    "BOLA"
  ],
  "isCorrect": false,
  "responseTime": 31.7,
  "answeredAt": {
    "$date": "2025-08-19T12:47:52.800Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:47:52.800Z"
  }
},
{
  "_id": {
    "$oid": "68491428988139e71b308d09"
  },
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "RC_003",
  "category": "Reading Comprehension",
  "questionType": "sentence",
  "response": [
    "hardin"
  ],
  "isCorrect": true,
  "responseTime": 45.2,
  "answeredAt": {
    "$date": "2025-08-19T12:48:38.000Z"
  },
  "createdAt": {
    "$date": "2025-08-19T12:48:38.000Z"
  }
},
{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6f1"
  },
  "studentId": 202533333,
  "assessmentId": "1",
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 8.5,
  "answeredAt": {
    "$date": "2025-08-18T12:03:25.500Z"
  },
  "createdAt": {
    "$date": "2025-08-18T12:03:25.500Z"
  }
}]