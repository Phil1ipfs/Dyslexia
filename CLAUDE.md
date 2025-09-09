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

---

## ASSESSMENT SYSTEM - STUDENT PROGRESS

### Assessment Overview

The LITEREXIA platform implements a comprehensive dyslexia assessment system with two main types:

1. **Pre-Assessment (CRLA)** - Initial screening assessment to determine reading level
2. **Main Assessment** - Detailed skills assessment with category-based scoring and interventions

### Data Models and Relationships

#### 1. Users Table (`test.users`)

**Key Assessment-Related Attributes:**
- `readingLevel`: String - Student's current reading level ("Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level")
- `readingPercentage`: Number - Percentage from pre-assessment (e.g., 60 for 60%)
- `preAssessmentCompleted`: Boolean - Whether student completed pre-assessment
- `lastAssessmentDate`: ISODate - Date of last assessment taken

**Reading Level Categories and Available Assessments:**
- **Low Emerging**: Only Alphabet Knowledge category
- **High Emerging**: Alphabet Knowledge + Phonological Awareness
- **Developing**: Alphabet Knowledge + Phonological Awareness + Decoding  
- **Transitioning**: Alphabet Knowledge + Phonological Awareness + Decoding + Word Recognition
- **At Grade Level**: All 5 categories (Alphabet Knowledge + Phonological Awareness + Decoding + Word Recognition + Reading Comprehension)

#### 2. Pre-Assessment System

**Pre-Assessment User Responses (`Pre_Assessment.user_responses.json`):**
```json
{
  "studentId": 2025121,
  "assessmentId": "1",
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": ["1"],
  "isCorrect": true,
  "responseTime": 15.3,
  "answeredAt": "2025-08-19T12:43:45.200Z",
  "createdAt": "2025-08-19T12:43:45.200Z"
}
```

**CRITICAL**: Pre-assessment user responses are **READ-ONLY** for web interface - used for viewing and analysis only.

#### 3. Main Assessment System

**Category Results (`test.category_results`):**
```json
{
  "_id": "ObjectId",
  "studentId": 202522233,
  "assessmentDate": "2025-08-20T05:13:00.100Z",
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 15,
      "score": 100,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "AK_015",
      "interventionRequired": false,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": []
    }
  ],
  "overallScore": 97,
  "completedCategories": 5,
  "totalCategories": 5,
  "allCategoriesPassed": true,
  "readingLevel": "At Grade Level",
  "readingLevelUpdated": true,
  "createdAt": "2025-08-20T05:13:00.100Z",
  "updatedAt": "2025-08-20T05:13:00.100Z"
}
```

**Main Assessment Student Responses (`test.student_responses.json`):**
```json
{
  "studentId": 202533333,
  "categoryId": "ObjectId",
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "response": ["2"],
  "isCorrect": true,
  "responseTime": 7.4,
  "answeredAt": "2025-08-18T12:15:25.500Z",
  "createdAt": "2025-08-18T12:15:25.500Z",
  "readingLevel": "High Emerging"
}
```

**CRITICAL**: Main assessment student responses are **READ-ONLY** for web interface - used for viewing and analysis only.

### Assessment Categories

#### 1. Alphabet Knowledge
- **Question Types**: `patinig` (vowels), `katinig` (consonants), `malaking` (uppercase), `tunog` (sounds)
- **Format**: Multiple choice with 2-3 options
- **Available for**: All reading levels

#### 2. Phonological Awareness  
- **Question Types**: `malapantig` (syllable matching)
- **Format**: Audio-to-text matching, drag and drop
- **Response Format**: Array of objects with audio-match pairs
- **Example**: `[{"H": "Hh"}, {"T": "Tt"}]`
- **Available for**: High Emerging and above

#### 3. Decoding
- **Question Types**: `decode` (letter/sound decoding)
- **Format**: Fill in blanks, sequence building
- **Response Format**: Array of letters/characters
- **Example**: `["Y", "E", "L", "O"]`
- **Available for**: Developing and above

#### 4. Word Recognition
- **Question Types**: `word` (word completion/identification)
- **Format**: Word building, multiple choice
- **Response Format**: Array of word parts or complete words
- **Example**: `["LIB", "RO"]` or `["BOLA"]`
- **Available for**: Transitioning and above

#### 5. Reading Comprehension
- **Question Types**: `sentence` (text comprehension)
- **Format**: Story-based questions with text input
- **Response Format**: Array with single text answer
- **Example**: `["Juan"]`
- **Available for**: At Grade Level only

### Web Interface Implementation Rules

#### Student Progress Viewing (READ-ONLY):

1. **Pre-Assessment Results Display:**
   - Compare student responses with correct answers from `Pre_Assessment.pre-assessment.json`
   - Show question text, student response, correct answer, and correctness status
   - Calculate reading percentage and display level determination based on scoring rules
   - Display Part 1 score and reading comprehension performance
   - **DO NOT** allow editing or updating of pre-assessment data

2. **Main Assessment Results Display:**
   - Show category-wise performance from `category_results`
   - Display individual question responses from `test.student_responses`
   - Compare student responses with main assessment question structures
   - Show intervention history and attempts if applicable
   - Display overall progress and reading level progression
   - **DO NOT** allow editing or updating of student responses

3. **Data Comparison Logic:**
   - **Pre-Assessment**: Match `questionId` between user responses and question bank to show correct answers
   - **Main Assessment**: Match `questionId` between student responses and assessment questions
   - Handle different response formats per question type (arrays, objects, strings)

### Assessment Response Format Examples

#### Pre-Assessment Response Types:
- **Multiple Choice**: `["1"]` or `["2"]` (option IDs)
- **Audio Matching**: `[{"audio": "H", "match": "Hh"}]` with `correctMatches` and `totalMatches`
- **Text Input**: `["Nag-aaral"]` for reading comprehension

#### Main Assessment Response Types:
- **Alphabet Knowledge**: `["2"]` (option selection)
- **Phonological Awareness**: `[{"H": "Hh"}, {"T": "Tt"}]` (audio-text pairs)
- **Decoding**: `["Y", "E", "L", "O"]` (letter sequence)
- **Word Recognition**: `["LIB", "RO"]` or `["BOLA"]` (word parts or complete words)
- **Reading Comprehension**: `["Juan"]` (text answer)

### Key Business Rules

1. **Reading Level Progression:**
   - When student passes all categories at current level, `readingLevelUpdated` becomes true
   - System creates new `category_results` record for next reading level
   - Update user's `readingLevel` in users table

2. **Intervention System:**
   - Students scoring below 75% in any category require intervention
   - Failed categories set `interventionRequired: true`
   - Teachers create interventions, students complete on mobile
   - Intervention attempts tracked in `interventionHistory`
   - Must score 75%+ to pass intervention

3. **Category Availability by Reading Level:**
   - **Low Emerging**: Only Alphabet Knowledge (1 category)
   - **High Emerging**: Alphabet Knowledge + Phonological Awareness (2 categories)
   - **Developing**: Previous + Decoding (3 categories)
   - **Transitioning**: Previous + Word Recognition (4 categories)
   - **At Grade Level**: All 5 categories

### Data File References

**Key Files for Student Progress Web Interface:**
1. `Pre_Assessment.pre-assessment.json` - Pre-assessment questions and correct answers
2. `Pre_Assessment.user_responses.json` - Student pre-assessment responses (READ-ONLY)
3. `test.category_results.json` - Main assessment category performance
4. `test.student_responses.json` - Student main assessment responses (READ-ONLY)
5. `test.users.json` - Student profile with reading level and pre-assessment status

### Critical Implementation Notes

1. **View-Only Nature**: The web interface is strictly for viewing assessment results and progress, NOT for taking assessments or editing responses

2. **Data Synchronization**: 
   - Mobile app creates assessment data
   - Web interface displays synced data
   - No data modification allowed on web

3. **Response Matching**: Must handle various response formats when comparing student answers with correct answers

4. **Reading Level Logic**: Display appropriate categories based on student's current reading level

5. **Intervention Tracking**: Show intervention requirements, attempts, and success/failure status


pre-assessment table 

[{
  "_id": {
    "$oid": "68ba1c34f05e9ffe3e15c5bd"
  },
  "title": "Filipino Reading Comprehension Pre Assessment",
  "description": "Assessment Based on CRLA DEPED Memorandum",
  "instructions": "Student should be able to finish this level",
  "totalQuestions": 45,
  "categoryCounts": {
    "alphabet_knowledge": 10,
    "phonological_awareness": 6,
    "decoding": 10,
    "word_recognition": 10,
    "reading_comprehension": 9
  },
  "language": "FL",
  "questions": [
    {
      "questionId": "AK_001",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Anong ang katumbas na maliit na letra?",
      "questionValue": "E",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026946462-ux19b3b5qth.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "a",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "e",
          "isCorrect": true
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
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026961201-l8mzg7m0f4.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "o",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "u",
          "isCorrect": false
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
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026868015-luedcqnf75a.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "d",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "i",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "b",
          "isCorrect": true
        }
      ]
    },
    {
      "questionId": "AK_004",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Anong ang katumbas na malaking na letra?",
      "questionValue": "u",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026934967-invu7gnr6bp.png",
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
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027023463-xnmaziiecf.png",
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
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027068340-mumkmlhynp.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "F",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "U",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "K",
          "isCorrect": true
        }
      ]
    },
    {
      "questionId": "AK_007",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Anong tunog ng letra?",
      "questionValue": "A",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027113796-rilnwh43xmp.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "/geh/ ",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "/ey/ ",
          "isCorrect": true
        },
        {
          "optionId": "3",
          "optionText": "/ee/ ",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "AK_008",
      "category": "Alphabet Knowledge",
      "questionType": "katinig",
      "questionText": "Anong tunog ng letra? ",
      "questionValue": "R",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027156158-6qa209rpjyx.png",
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
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027203742-5y69maht04p.png",
      "difficultyLevel": "low_emerging",
      "options": [
        {
          "optionId": "1",
          "optionText": "/ar/",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "/the/",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "/es/",
          "isCorrect": true
        }
      ]
    },
    {
      "questionId": "AK_010",
      "category": "Alphabet Knowledge",
      "questionType": "patinig",
      "questionText": "Tukuyin ang letra kung Patinig, Katinig o Malapantig",
      "questionValue": "I",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027279488-v9ijrp0t7r.png",
      "difficultyLevel": "low_emerging",
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
        },
        {
          "optionId": "3",
          "optionText": "Malapantig",
          "isCorrect": false
        }
      ]
    },
    {
      "questionId": "PA_001",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra sa kabilang hanay",
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
        ]
      }
    },
    {
      "questionId": "PA_002",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang salita sa audio. Itugma ito sa katumbas na salita sa kabilang hanay.",
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
            "audio": "DAGA",
            "match": "Daga"
          },
          {
            "audio": "ILAW",
            "match": "Ilaw"
          },
          {
            "audio": "MATA",
            "match": "Mata"
          },
          {
            "audio": "PUNO",
            "match": "Puno"
          },
          {
            "audio": "RELO",
            "match": "Relo"
          }
        ]
      },
      "questionValue": null
    },
    {
      "questionId": "PA_003",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
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
            "audio": "GA",
            "match": "GA"
          },
          {
            "audio": "LO",
            "match": "LO"
          },
          {
            "audio": "PI",
            "match": "PI"
          },
          {
            "audio": "NGA",
            "match": "NGA"
          },
          {
            "audio": "WU",
            "match": "WU"
          }
        ]
      },
      "questionValue": null
    },
    {
      "questionId": "PA_004",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
      "questionImage": null,
      "difficultyLevel": "high_emerging",
      "questionSet": {
        "audioTexts": [
          "PUNO",
          "RELO"
        ],
        "matchingOptions": [
          "PUNO",
          "RELO"
        ],
        "correctPairs": [
          {
            "audio": "PUNO",
            "match": "PUNO"
          },
          {
            "audio": "RELO",
            "match": "RELO"
          }
        ]
      },
      "questionValue": null
    },
    {
      "questionId": "PA_005",
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
          "PI"
        ],
        "matchingOptions": [
          "GA",
          "LO",
          "PI"
        ],
        "correctPairs": [
          {
            "audio": "GA",
            "match": "GA"
          },
          {
            "audio": "LO",
            "match": "LO"
          },
          {
            "audio": "PI",
            "match": "PI"
          }
        ]
      }
    },
    {
      "questionId": "PA_006",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang pantig sa audio. Itugma ito sa katumbas na pantig sa kabilang hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "high_emerging",
      "questionSet": {
        "audioTexts": [
          "NGA",
          "WU"
        ],
        "matchingOptions": [
          "NGA",
          "WU"
        ],
        "correctPairs": [
          {
            "audio": "NGA",
            "match": "NGA"
          },
          {
            "audio": "WU",
            "match": "WU"
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
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029227985-d5xxu50j1y.png",
      "difficultyLevel": "developing",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "Y",
        "e",
        "l",
        "o",
        "A",
        "I"
      ],
      "correctSequence": [
        "Y",
        "e",
        "l",
        "o"
      ]
    },
    {
      "questionId": "DC_002",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029273136-nqrf90xxoh.png",
      "difficultyLevel": "developing",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "A",
        "r",
        "a",
        "w",
        "R",
        "W"
      ],
      "correctSequence": [
        "A",
        "r",
        "a",
        "w"
      ]
    },
    {
      "questionId": "DC_003",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029657613-k0q2ed3nzu.png",
      "difficultyLevel": "developing",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "N",
        "g",
        "i",
        "p",
        "i",
        "n",
        "A",
        "U"
      ],
      "correctSequence": [
        "N",
        "g",
        "i",
        "p",
        "i",
        "n"
      ]
    },
    {
      "questionId": "DC_004",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029687663-6kovs8zne2d.png",
      "difficultyLevel": "developing",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "E",
        "r",
        "o",
        "p",
        "l",
        "a",
        "n",
        "o",
        "E",
        "U"
      ],
      "correctSequence": [
        "E",
        "r",
        "o",
        "p",
        "l",
        "a",
        "n",
        "o"
      ]
    },
    {
      "questionId": "DC_005",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029713845-kilagifx557.png",
      "difficultyLevel": "developing",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "B",
        "a",
        "h",
        "a",
        "y",
        "E",
        "I"
      ],
      "correctSequence": [
        "B",
        "a",
        "h",
        "a",
        "y"
      ]
    },
    {
      "questionId": "DC_006",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757382362894-9iz7doh1crl.png",
      "difficultyLevel": "developing",
      "displaySequence": [],
      "blankPosition": null,
      "dragElements": [
        "K",
        "a",
        "m",
        "a",
        "y",
        "E",
        "O"
      ],
      "correctSequence": [
        "K",
        "a",
        "m",
        "a",
        "y"
      ]
    },
    {
      "questionId": "DC_007",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029777889-825j13vbgeq.png",
      "difficultyLevel": "developing",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "R",
        "o",
        "s",
        "a",
        "s",
        "S",
        "H"
      ],
      "correctSequence": [
        "R",
        "o",
        "s",
        "a",
        "s"
      ]
    },
    {
      "questionId": "DC_008",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Tukuyin ang nasa larawan?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029827506-866iq6svjhe.png",
      "difficultyLevel": "developing",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "P",
        "a",
        "l",
        "a",
        "k",
        "a",
        "e",
        "I"
      ],
      "correctSequence": [
        "P",
        "a",
        "l",
        "a",
        "k",
        "a"
      ]
    },
    {
      "questionId": "DC_009",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Buoin ang salita",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029864142-hbk05ve4l3a.png",
      "difficultyLevel": "developing",
      "displaySequence": [
        "",
        "I",
        "N",
        "A",
        "P",
        "A",
        "Y"
      ],
      "blankPosition": 0,
      "dragElements": [
        "T",
        "S",
        "E",
        "I"
      ],
      "correctSequence": [
        "T"
      ]
    },
    {
      "questionId": "DC_010",
      "category": "Decoding",
      "questionType": "decode",
      "questionText": "Buoin ang salita",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029905272-5d3ojki7ma9.png",
      "difficultyLevel": "developing",
      "displaySequence": [
        "",
        "S",
        "O"
      ],
      "blankPosition": 0,
      "dragElements": [
        "O",
        "P",
        "E",
        "I"
      ],
      "correctSequence": [
        "O"
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
      "displayWord": "Naglalaro siya ng ___ sa parke",
      "blankOptions": [
        "BOLA",
        "KUTSARA",
        "PAPEL",
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
      "displayWord": "Malaki ang ___ sa zoo",
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
      "displayWord": "Mahilig magluto ang ___ ko",
      "blankOptions": [
        "NANAY",
        "MANOK",
        "BOLA",
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
      "displayWord": "Nasa ___ ang mga libro",
      "blankOptions": [
        "LAMESA",
        "PAPEL",
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
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Kumakain ng mais ang ___",
      "blankOptions": [
        "MANOK",
        "NANAY",
        "ELEPANTE",
        "KUTSARA"
      ],
      "correctAnswer": [
        "MANOK"
      ]
    },
    {
      "questionId": "WR_006",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Ginagamit niya ang ___ sa pagkain",
      "blankOptions": [
        "KUTSARA",
        "LAMESA",
        "ELEPANTE",
        "DAMIT"
      ],
      "correctAnswer": [
        "KUTSARA"
      ]
    },
    {
      "questionId": "WR_007",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Malinis ang ___ ni Ana",
      "blankOptions": [
        "DAMIT",
        "BOLA",
        "PAPEL",
        "KUTSARA"
      ],
      "correctAnswer": [
        "DAMIT"
      ]
    },
    {
      "questionId": "WR_008",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
      "displayWord": "Gumuguhit ako sa ___",
      "blankOptions": [
        "PAPEL",
        "ELEPANTE",
        "MANOK",
        "LAMESA"
      ],
      "correctAnswer": [
        "PAPEL"
      ]
    },
    {
      "questionId": "WR_009",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionValue": null,
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757030517902-0eh214z662zr.png",
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
      "questionId": "WR_010",
      "category": "Word Recognition",
      "questionType": "word",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "transitioning",
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
      "questionId": "RC_001",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Tuwing umaga, si Juan at ang kaniyang aso na si Max ay naglalaro sa Parke",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031431002-pd431brj7oo.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Paboritong habulin ni Max ang bola na inihahagis ni Juan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031432394-slk98m6h5b.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Silang dalawa ay masayang uuwi ng tahanan",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031433286-zvtteh7c5h.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang may aso? ",
          "correctAnswer": "Juan",
          "acceptableAnswers": [
            "Si juan",
            "juan",
            "si juan"
          ]
        },
        {
          "questionText": "Saan naglaro si Juan at Max? ",
          "correctAnswer": "Parke",
          "incorrectAnswer": "",
          "correctAnswerChoice": "1",
          "acceptableAnswers": [
            "Sa parke",
            "sa parke"
          ]
        },
        {
          "questionText": "Ano ang ginagawa ni Juan at Max? ",
          "correctAnswer": "Naglalaro",
          "acceptableAnswers": [
            "naglalaro",
            "naglaro",
            "naglaro"
          ]
        }
      ]
    },
    {
      "questionId": "RC_002",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Maria ay may puno ng mangga sa kanilang bakuran",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031779544-g731d7bqoyt.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Tuwing tag-init, nangunguha siya ng mangga. Ang mga mangga ay matamis at kulay dilaw. ",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031781082-n52iycewcz.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Si Maria ay umaakyat sa puno upang kunin ang mangga",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031781948-798hmttxt09.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang nangunguha ng mangga? ",
          "correctAnswer": "Maria",
          "acceptableAnswers": [
            "si Maria",
            "ma-ria",
            "maria"
          ]
        },
        {
          "questionText": "Saan matatagpuan ang puno ng mangga? ",
          "correctAnswer": "Bakuran",
          "acceptableAnswers": [
            "bakuran",
            "sa bakuran",
            "ba-kuran"
          ]
        },
        {
          "questionText": "Ano ang ginagawa ni Maria? ",
          "correctAnswer": "Nangunguha",
          "acceptableAnswers": [
            "sa nangunguha",
            "nangunguha"
          ]
        }
      ]
    },
    {
      "questionId": "RC_003",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Juan ay tumulong kay Tatay magbuhat ng kahon",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031992761-o8g0bn8299.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Si Tatay ay nagdadala ng mga gamit sa garahe. Matagal nang hindi nagagamit ang mga kahon na iyon",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031994108-ii2hu1mxnfi.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Inutusan ni Tatay si Juan na ilagay ang mga kahon sa isang tabi.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031994994-r7hxjojmm1g.png"
        },
        {
          "pageNumber": 4,
          "pageText": "Habang binubuhat nila ang mga kahon, napansin ni Juan ang mga lumang laruan. Inisip ni Juan na magtulungan silang ayusin ang garahe",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031995685-lpyszq1z14.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang tumulong kay Tatay? ",
          "correctAnswer": "Juan",
          "acceptableAnswers": [
            "juan",
            "si juan",
            "ju-an"
          ]
        },
        {
          "questionText": "Saan naganap ang pagtulong? ",
          "correctAnswer": "Garahe",
          "acceptableAnswers": [
            "garahe",
            "gaarahe",
            "sa garahe"
          ]
        },
        {
          "questionText": "Ano ang ginawa ni Juan? ",
          "correctAnswer": "Nagbuhat",
          "acceptableAnswers": [
            "nagbuhat",
            "nag-buhat",
            "buhatt"
          ]
        }
      ]
    },
    {
      "questionId": "RC_004",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Liza at si Marco ay magkaibigan",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032149430-65bqlu9v7yq.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Tuwing hapon, naglalaro sila ng habulan sa bakuran.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032151678-tvhi5c2ffwj.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Madalas silang maghabulan mula sa paligid ng bakuran hangang hangang gumabi o umulan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032152990-x1wxqyaxjjd.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang naglalaro ng habulan? ",
          "correctAnswer": "Liza at Marco",
          "acceptableAnswers": [
            "liza marco",
            "si liza at marco",
            "liza marco"
          ]
        },
        {
          "questionText": "Saan sila naglalaro? ",
          "correctAnswer": "Bakuran",
          "acceptableAnswers": [
            "bakuran",
            "babakuran",
            "binakuran"
          ]
        },
        {
          "questionText": "Ano ang laro nila? ",
          "correctAnswer": "Habulan",
          "acceptableAnswers": [
            "habulan",
            "habbulan",
            "hahabulin"
          ]
        }
      ]
    },
    {
      "questionId": "RC_005",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Maria ay kumain ng mansanas.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032323481-g4tr9ru3vze.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang kinain ni Maria?",
          "correctAnswer": "Mansanas",
          "acceptableAnswers": [
            "mansanass",
            "mansaanas"
          ]
        }
      ]
    },
    {
      "questionId": "RC_006",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si Juan ay naglalaro ng bola sa parke.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032375027-iv7p1trs1f.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang nilalaro ni Juan?",
          "correctAnswer": "Bola",
          "acceptableAnswers": [
            "booola",
            "bolaa"
          ]
        }
      ]
    },
    {
      "questionId": "RC_007",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Ang aso ay tumakbo sa hardin.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032469179-d962tot7cj.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Saan tumakbo ang aso?",
          "correctAnswer": "Hardin",
          "acceptableAnswers": [
            "hardin",
            "sa hardin"
          ]
        }
      ]
    },
    {
      "questionId": "RC_008",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Si nanay ay nagluto ng adobo.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032523091-cbg03vv30kq.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang niluto ni nanay?",
          "correctAnswer": "Adobo",
          "acceptableAnswers": [
            "adobo",
            "inadobo",
            "aadobo"
          ]
        }
      ]
    },
    {
      "questionId": "RC_009",
      "category": "Reading Comprehension",
      "questionType": "sentence",
      "questionValue": null,
      "questionImage": null,
      "difficultyLevel": "at_grade_level",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Ang bata ay nag-aaral ng aralin",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032587663-547gwak4d93.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Ano ang ginagawa ng bata?",
          "correctAnswer": "Nagaaral",
          "acceptableAnswers": [
            "nag aaral",
            "nagaaral",
            "Nag aaral"
          ]
        }
      ]
    }
  ],
  "type": "pre_assessment",
  "status": "active",
  "isActive": true,
  "updatedAt": "2025-09-09T02:00:51.605Z",
  "assessmentId": "1",
  "scoringRules": {
    "Low Emerging": {
      "part1ScoreRange": [
        0,
        19
      ],
      "readingPercentageRange": null,
      "comprehensionCorrectRange": null,
      "description": "Learner with scores 0 to 19 upon administration of Part 1 (36 questions)"
    },
    "High Emerging": {
      "part1ScoreRange": [
        20,
        36
      ],
      "readingPercentageRange": [
        0,
        25
      ],
      "comprehensionCorrectRange": [
        0,
        0
      ],
      "description": "Learner with scores 20 to 36 upon administration of Part 1 and reads less than 25% and cannot answer any of the questions"
    },
    "Developing": {
      "part1ScoreRange": [
        20,
        36
      ],
      "readingPercentageRange": [
        26,
        50
      ],
      "comprehensionCorrectRange": [
        2,
        9
      ],
      "description": "Learner with scores 20 to 36 upon administration of Part 1 and reads between 26-50% and answers atleast 2 questions correctly"
    },
    "Transitioning": {
      "part1ScoreRange": [
        20,
        36
      ],
      "readingPercentageRange": [
        51,
        75
      ],
      "comprehensionCorrectRange": [
        4,
        6
      ],
      "description": "Learner with scores 20 to 36 upon administration of Part 1 and reads between 51-75% and answers atleast 4-6 questions correctly"
    },
    "At Grade Level": {
      "part1ScoreRange": [
        20,
        36
      ],
      "readingPercentageRange": [
        76,
        100
      ],
      "comprehensionCorrectRange": [
        8,
        9
      ],
      "description": "Learner with scores 20 to 36 upon administration of Part 1 and reads between 76-100% and answers atleast 8 to 9 questions correctly"
    }
  },
  "lastUpdated": "2025-09-09T01:54:39.705Z"
}]



user_responses (pre-assessment)
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

student_responses for the post assessment

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


category_results table


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


users table in the test collection 

[{
  "_id": {
    "$oid": "683e948a9b13d43b098eb6e3"
  },
  "idNumber": 202533333,
  "firstName": "Philip",
  "middleName": "Casingal",
  "lastName": "Pangilinan",
  "age": "6",
  "gender": "Male",
  "gradeLevel": "Grade 1",
  "section": "Patience",
  "address": "Mandaluyong",
  "email": null,
  "profileImageUrl": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/student-profiles/1748931720760_rfdryb.png",
  "completedLessons": [],
  "readingLevel": "High Emerging",
  "readingPercentage": 40,
  "preAssessmentCompleted": true,
  "createdAt": {
    "$date": "2025-06-03T06:22:02.826Z"
  },
  "updatedAt": "2025-08-18T12:03:31.912721",
  "parentId": {
    "$oid": "683e7186a1338769a9095a7a"
  },
  "lastAssessmentDate": "2025-08-18T12:03:31.912503",
  "lastLogin": {
    "$date": "2025-09-05T15:49:06.017Z"
  }
},
{
  "_id": {
    "$oid": "68484489bc8ea7a4e8583489"
  },
  "idNumber": 202511111,
  "firstName": "Cherish",
  "middleName": "Mae",
  "lastName": "Sarmiento",
  "age": "6",
  "gender": "Female",
  "gradeLevel": "Grade 1",
  "section": "Patience",
  "address": "555 MF Jhocson Street, Barangay 408, Sampaloc, Manila",
  "email": null,
  "profileImageUrl": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/student-profiles/1749566599635_2hpcuc.png",
  "completedLessons": [],
  "readingLevel": "High Emerging",
  "readingPercentage": 33.33333333333333,
  "preAssessmentCompleted": true,
  "createdAt": {
    "$date": "2025-06-10T14:43:21.193Z"
  },
  "updatedAt": "2025-06-11T13:21:10.209837",
  "lastAssessmentDate": "2025-06-11T13:21:10.209763"
},
{
  "_id": {
    "$oid": "68491110988139e71b308b55"
  },
  "idNumber": 202522233,
  "firstName": "Ali",
  "middleName": "Kat",
  "lastName": "Alejaga",
  "age": "7",
  "gender": "Female",
  "gradeLevel": "Grade 1",
  "section": "Integrity",
  "address": "123 Maharlika Street Los Baños Laguna",
  "email": null,
  "profileImageUrl": "",
  "completedLessons": [],
  "readingLevel": "At Grade Level",
  "readingPercentage": 80,
  "preAssessmentCompleted": true,
  "createdAt": {
    "$date": "2025-06-11T05:16:00.131Z"
  },
  "updatedAt": "2025-08-20T04:47:39.678396",
  "lastAssessmentDate": "2025-08-20T04:47:39.677994"
},
{
  "_id": {
    "$oid": "68491428988139e71b308cca"
  },
  "idNumber": 2025121,
  "firstName": "efgwf",
  "middleName": "ewfe",
  "lastName": "ewfw",
  "age": "5",
  "gender": "Male",
  "gradeLevel": "Grade 1",
  "section": "Honesty",
  "address": "123 Maharlika Street Los Baños Laguna",
  "email": null,
  "profileImageUrl": "",
  "completedLessons": [],
  "readingLevel": "Developing",
  "readingPercentage": 60,
  "preAssessmentCompleted": true,
  "createdAt": {
    "$date": "2025-06-11T05:29:12.903Z"
  },
  "updatedAt": "2025-08-19T12:44:14.785224",
  "lastAssessmentDate": "2025-08-19T12:44:14.785010"
},
{
  "_id": {
    "$oid": "68b9beaf24ba05af669d7dc0"
  },
  "idNumber": 20251056,
  "firstName": "Philip",
  "middleName": "C.",
  "lastName": "Casingal",
  "age": "19",
  "gender": "Male",
  "gradeLevel": "Grade 1",
  "section": "Honesty",
  "address": "123 Mabini Street, Quezon City, Metro Manila",
  "email": null,
  "profileImageUrl": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/student-profiles/1757003438859_wdjads.jpg",
  "completedLessons": [],
  "readingLevel": null,
  "readingPercentage": null,
  "preAssessmentCompleted": false,
  "createdAt": {
    "$date": "2025-09-04T16:30:39.575Z"
  },
  "updatedAt": {
    "$date": "2025-09-04T16:30:39.575Z"
  },
  "lastLogin": {
    "$date": "2025-09-06T15:31:47.714Z"
  }
}]


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
}


