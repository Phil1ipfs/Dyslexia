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

