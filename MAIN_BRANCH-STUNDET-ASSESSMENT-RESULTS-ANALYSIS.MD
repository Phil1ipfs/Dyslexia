# Main Branch - Student Assessment Results System Analysis

**Branch**: `main`
**Analysis Date**: January 2025
**Component**: StudentAssessmentResults.jsx (Admin Post-Assessment Results View)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Component Architecture](#frontend-component-architecture)
3. [Backend API Architecture](#backend-api-architecture)
4. [Database Collections](#database-collections)
5. [Data Flow Sequence](#data-flow-sequence)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Critical Issues & Configuration](#critical-issues--configuration)

---

## System Overview

### Purpose
The StudentAssessmentResults component is the **Admin Post-Assessment Results Detail View** that displays:
- **Student Profile Information** (ID, name, grade, section, teacher)
- **Post-Assessment Category Scores** (5 reading categories)
- **Main Assessment Question Responses** (BEFORE intervention)
- **Intervention Question Responses** (AFTER intervention - if applicable)
- **Intervention History Tracking** (multiple attempts, revision numbers)
- **Reading Level Progression Status**

### Key Features
1. **Sequential Category Display** - Categories shown in prerequisite order
2. **Intervention Status Tracking** - Shows if student passed through intervention
3. **Question-Level Response Details** - Detailed view of each question's response
4. **Multi-Attempt Intervention Support** - Tracks revision numbers and attempts
5. **Reading Comprehension Special Handling** - Groups sentence questions appropriately

---

## Frontend Component Architecture

### File Location
```
frontend/src/pages/Admin/StudentAssessmentResults.jsx
```

### Component Structure

#### State Management
```javascript
const [student, setStudent] = useState(null);                    // Student + assessment data
const [loading, setLoading] = useState(true);                    // Loading state
const [questionResponses, setQuestionResponses] = useState({});  // Question responses by category
const [loadingResponses, setLoadingResponses] = useState({});    // Loading per category
const [modalOpen, setModalOpen] = useState(false);               // Modal visibility
const [selectedCategory, setSelectedCategory] = useState(null);  // Currently viewed category
```

#### Key Functions

**1. fetchStudentData() - Lines 22-79**
```javascript
// Fetches student info + assessment results on component mount
useEffect(() => {
  const fetchStudentData = async () => {
    // Step 1: Get student info by idNumber
    const studentResponse = await axios.get(
      `http://localhost:5001/api/admin/manage/students/idNumber/${id}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    // Step 2: Get assessment results by idNumber
    const assessmentResponse = await axios.get(
      `http://localhost:5001/api/admin/assessment-results/${id}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    // Step 3: Combine data
    const combinedData = {
      ...studentData,
      ...assessmentData,
      categoryScores: mainAssessmentCategories,
      readingLevel: assessmentData.readingLevel || 'Not Assessed',
      readingPercentage: assessmentData.overallScore || 0,
      // ... other fields
    };

    setStudent(combinedData);
  };
}, [id]);
```

**2. fetchQuestionResponses() - Lines 611-930**
```javascript
// Fetches main assessment + intervention responses for a category
const fetchQuestionResponses = async (studentId, category) => {
  // STEP 1: Fetch main assessment responses (BEFORE INTERVENTION)
  const mainResponse = await axios.get(
    `http://localhost:5001/api/admin/student-responses/${studentId}/${category}`,
    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
  );

  // STEP 2: Filter to most recent assessment session
  // Groups by date, gets latest complete session with unique questions

  // STEP 3: Fetch main assessment questions for details
  const mainAssessmentDetailsResponse = await axios.get(
    `http://localhost:5001/api/main-assessment`,
    {
      params: { category, readingLevel: student?.readingLevel || 'High Emerging' },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );

  // STEP 4: Enhance responses with question details
  // Matches responses to questions, adds question text, correct answers, options

  // STEP 5: Fetch intervention responses (AFTER INTERVENTION - if applicable)
  const categoryData = student?.categoryScores?.find(cat => cat.categoryName === category);
  const finalResult = getFinalCategoryResult(categoryData);

  if (finalResult.hasIntervention) {
    const targetAttempt = categoryData.interventionHistory?.find(attempt => attempt.isPassed)
                          || bestAttempt;

    const interventionResponse = await axios.get(
      `http://localhost:5001/api/intervention-responses`,
      {
        params: {
          studentId,
          interventionAssessmentId,
          category,
          revisionNumber: targetRevisionNumber
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );

    // Enhance intervention responses with question details from intervention_assessment
  }

  // STEP 6: Combine both response types
  setQuestionResponses(prev => ({
    ...prev,
    [category]: {
      mainAssessment: mainAssessmentResponses,
      intervention: interventionResponses,
      hasIntervention: finalResult.hasIntervention,
      passedAttemptNumber: finalResult.passedAttemptNumber,
      bestInterventionAttempt: finalResult.bestInterventionAttempt
    }
  }));
};
```

**3. getFinalCategoryResult() - Lines 515-592**
```javascript
// Determines final category status considering intervention history
const getFinalCategoryResult = (categoryData) => {
  const initialScore = categoryData.score || 0;
  const initialPassed = initialScore >= 75;

  // Check intervention history
  const hasIntervention = categoryData.interventionHistory?.length > 0;

  if (!hasIntervention) {
    return {
      finalScore: initialScore,
      isPassed: initialPassed,
      hasIntervention: false,
      // ... other fields
    };
  }

  // Find best intervention score and passed attempt
  let bestInterventionScore = 0;
  let passedThroughIntervention = false;

  categoryData.interventionHistory.forEach(intervention => {
    if (intervention.score > bestInterventionScore) {
      bestInterventionScore = intervention.score;
      bestInterventionAttempt = intervention.attemptNumber;
    }
    if (intervention.isPassed && !passedThroughIntervention) {
      passedThroughIntervention = true;
      passedAttemptNumber = intervention.attemptNumber;
    }
  });

  // Return best result (initial or intervention)
  const finalScore = Math.max(initialScore, bestInterventionScore);
  const isPassed = initialPassed || passedThroughIntervention;

  return {
    finalScore,
    isPassed,
    hasIntervention: true,
    passedThroughIntervention,
    passedAttemptNumber,
    initialScore,
    bestInterventionScore,
    bestInterventionAttempt,
    interventionHistory,
    totalInterventionAttempts: interventionHistory.length
  };
};
```

**4. Helper Functions for Response Formatting**

```javascript
// getCorrectAnswerFromQuestion() - Lines 83-153
// Extracts correct answer based on category type

// getOptionsFromQuestion() - Lines 156-215
// Extracts answer options based on category type

// formatMainAssessmentResponse() - Lines 441-512
// Formats student response for display based on category type

// formatInterventionResponse() - Lines 218-282
// Formats intervention response for display based on category type

// groupReadingComprehensionQuestions() - Lines 408-438
// Groups RC sentence questions by base questionId
```

### UI Rendering Structure

**Profile Card** (Lines 993-1047)
- Student avatar/initials
- Name, ID, grade, section, teacher
- Assessment date
- Reading level badge
- Overall score badge

**Summary Section** (Lines 1050-1091)
- Reading level card
- Categories passed count (X/5)

**Category Performance Grid** (Lines 1094-1178)
- Category cards with:
  - Category name
  - Final score (with intervention indicator if applicable)
  - Before/After intervention details
  - Passed/Failed status badge
  - Progress bar

**Category Details Modal** (Lines 1181-1651)
- **Main Assessment Section** (Lines 1202-1384)
  - Question responses BEFORE intervention
  - Question details, correct answers, student answers
  - Response time, answered date

- **Intervention Section** (Lines 1387-1601)
  - Question responses AFTER intervention
  - Revision number indicator
  - Intervention score and pass status
  - Enhanced question details from intervention_assessment

- **Intervention History** (Lines 1615-1647)
  - All intervention attempts
  - Scores, dates, pass/fail status

---

## Backend API Architecture

### Route Mounting (server.js)

```javascript
// Admin management routes
app.use('/api/admin/manage', teacherRoutes);
// → Mounts /api/admin/manage/students/idNumber/:idNumber

// Admin profile/dashboard routes
app.use('/api/admin', adminProfileRoutes);
app.use('/api/admin', adminDashboardRoutes);
// → Mounts /api/admin/assessment-results/:idNumber
// → Mounts /api/admin/student-responses/:studentId/:category

// Main assessment routes
app.use('/api/main-assessment', mainAssessmentRoutes);
// → Mounts /api/main-assessment with query params

// Intervention responses routes
app.use('/api/intervention-responses', interventionResponses);
// → Mounts /api/intervention-responses with query params
```

### Backend File Structure

```
backend/
├── routes/
│   ├── Admin/
│   │   ├── teacherRoutes.js              # Student management endpoints
│   │   ├── assessmentResults.js          # Assessment results endpoint
│   │   └── categoryResults.js            # Student responses endpoint
│   └── Teachers/
│       ├── mainAssessmentRoutes.js       # Main assessment questions
│       ├── interventionResponses.js      # Intervention responses
│       └── progressRoutes.js             # Progress-related endpoints
├── controllers/
│   └── Teachers/
│       └── mainAssessmentController.js   # Main assessment logic
├── models/
│   └── Teachers/
│       └── ManageProgress/
│           └── studentResponseModel.js   # Response model
└── services/
    └── Teachers/
        └── CategoryResultsService.js    # Category processing
```

---

## Database Collections

### 1. **users** (test database)
**Purpose**: Student profile information
```javascript
{
  "_id": ObjectId("..."),
  "idNumber": 202533333,              // Student ID (used in URLs)
  "firstName": "Philip",
  "middleName": "Ong",
  "lastName": "Pangilinan",
  "age": 8,
  "gradeLevel": "Grade 2",
  "section": "Rose",
  "teacherName": "Mrs. Santos",
  "readingLevel": "High Emerging",    // Current reading level
  "readingPercentage": 72,            // Overall reading score
  "preAssessmentCompleted": true,
  "profileImageUrl": "https://...",
  "createdAt": Date,
  "updatedAt": Date
}
```

### 2. **category_results** (test database)
**Purpose**: Post-assessment category scores and intervention history
```javascript
{
  "_id": ObjectId("..."),
  "studentId": 202533333,
  "assessmentDate": "2025-01-15T10:30:00Z",
  "readingLevel": "High Emerging",
  "overallScore": 74,
  "totalQuestions": 41,
  "correctAnswers": 30,
  "allCategoriesPassed": false,
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 14,
      "score": 93,
      "isPassed": true,
      "isCompleted": true,
      "passingThreshold": 75,
      "interventionRequired": false,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "interventionHistory": []
    },
    {
      "categoryName": "Phonological Awareness",
      "totalQuestions": 6,
      "totalPossibleMatches": 18,
      "correctMatches": 8,
      "score": 44,
      "isPassed": false,
      "isCompleted": true,
      "interventionRequired": true,
      "interventionAttempts": 2,
      "interventionCompleted": true,
      "interventionHistory": [
        {
          "attemptNumber": 1,
          "interventionId": ObjectId("..."),
          "interventionResultId": ObjectId("..."),
          "revisionNumber": 1,
          "score": 73,
          "isPassed": false,
          "attemptedAt": "2025-01-16T09:00:00Z",
          "completedAt": "2025-01-16T09:20:00Z",
          "attemptReason": "initial_attempt"
        },
        {
          "attemptNumber": 2,
          "interventionId": ObjectId("..."),
          "interventionResultId": ObjectId("..."),
          "revisionNumber": 2,
          "score": 81,
          "isPassed": true,
          "attemptedAt": "2025-01-17T10:00:00Z",
          "completedAt": "2025-01-17T10:25:00Z",
          "attemptReason": "teacher_revision"
        }
      ]
    }
  ],
  "createdAt": Date,
  "updatedAt": Date
}
```

### 3. **student_responses** (test database)
**Purpose**: Main assessment question responses (BEFORE intervention)
```javascript
// Standard Response (Alphabet Knowledge, Phonological Awareness, etc.)
{
  "_id": ObjectId("..."),
  "studentId": 202533333,
  "categoryId": ObjectId("..."),       // Links to main_assessment
  "questionId": "AK_001",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "response": "e",                     // Student's answer
  "isCorrect": true,
  "responseTime": 8200,                // Milliseconds
  "answeredAt": "2025-01-15T10:32:15Z",
  "readingLevel": "High Emerging",
  "createdAt": Date
}

// Reading Comprehension Response (All-or-Nothing)
{
  "_id": ObjectId("..."),
  "studentId": 202533333,
  "questionId": "RC_001",              // Base question ID
  "category": "Reading Comprehension",
  "response": ["Juan", "Parke", "Bola"], // Array of sentence answers
  "isCorrect": true,                   // ALL sentence questions must be correct
  "responseTime": 35600,
  "answeredAt": "2025-01-15T10:45:30Z",
  "createdAt": Date
}
```

### 4. **main_assessment** (test database)
**Purpose**: Main assessment question bank
```javascript
{
  "_id": ObjectId("..."),
  "readingLevel": "High Emerging",
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "status": "active",
  "questions": [
    {
      "questionId": "AK_001",
      "questionText": "Anong katumbas ng maliit na letra?",
      "questionImage": "https://literexia-bucket.../big-E.png",
      "questionValue": "E",
      "choiceOptions": [
        { "optionId": "1", "optionText": "e", "isCorrect": true },
        { "optionId": "2", "optionText": "a", "isCorrect": false },
        { "optionId": "3", "optionText": "c", "isCorrect": false }
      ]
    }
  ],
  "totalQuestions": 15,
  "isActive": true,
  "createdAt": Date,
  "updatedAt": Date
}
```

### 5. **intervention_responses** (test database)
**Purpose**: Intervention question responses (AFTER intervention)
```javascript
{
  "_id": ObjectId("..."),
  "studentId": 202533333,
  "interventionAssessmentId": ObjectId("..."),
  "questionId": "int_pa_001",
  "category": "Phonological Awareness",
  "revisionNumber": 2,                 // Which version student took
  "response": [
    {"audio": "B", "match": "Bb"},
    {"audio": "P", "match": "Pp"},
    {"audio": "M", "match": "Mm"}
  ],
  "isCorrect": true,
  "responseTime": 8700,
  "answeredAt": "2025-01-17T10:15:30Z",
  "createdAt": Date
}
```

### 6. **intervention_assessment** (test database)
**Purpose**: Teacher-created intervention questions
```javascript
{
  "_id": ObjectId("..."),
  "studentId": 202533333,
  "prescriptiveAnalysisId": ObjectId("..."),
  "category": "Phonological Awareness",
  "readingLevel": "High Emerging",
  "passThreshold": 75,
  "totalQuestions": 12,
  "questions": [
    {
      "questionId": "int_pa_001",
      "source": "template_question",
      "questionType": "malapantig",
      "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra.",
      "questionSet": {
        "audioTexts": ["B", "P", "M"],
        "matchingOptions": ["Bb", "Pp", "Mm", "Nn"],
        "correctPairs": [
          {"audio": "B", "match": "Bb"},
          {"audio": "P", "match": "Pp"},
          {"audio": "M", "match": "Mm"}
        ]
      }
    }
  ],
  "revisionNumber": 2,                 // Version 2 (teacher edited)
  "revisionHistory": [
    {
      "version": 1,
      "editedBy": ObjectId("teacher_id"),
      "editedAt": "2025-01-16T08:00:00Z",
      "changes": "Initial implementation"
    },
    {
      "version": 2,
      "editedBy": ObjectId("teacher_id"),
      "editedAt": "2025-01-17T09:00:00Z",
      "changes": "Reduced cognitive load per near-miss guidance"
    }
  ],
  "lastEditedBy": ObjectId("teacher_id"),
  "lastEditedAt": "2025-01-17T09:00:00Z",
  "status": "active",
  "createdAt": Date,
  "updatedAt": Date
}
```

### 7. **intervention_results** (test database)
**Purpose**: Intervention assessment results and analytics
```javascript
{
  "_id": ObjectId("..."),
  "studentId": 202533333,
  "interventionAssessmentId": ObjectId("..."),
  "prescriptiveAnalysisId": ObjectId("..."),
  "category": "Phonological Awareness",
  "assessmentDate": "2025-01-17T10:00:00Z",
  "revisionNumber": 2,                 // Which version was taken
  "totalQuestions": 12,
  "correctAnswers": 10,
  "score": 83,
  "isPassed": true,                    // Passed intervention!
  "passThreshold": 75,
  "previousScore": 44,                 // Original main assessment score
  "improvement": 39,                   // Score improvement
  "improvementPercentage": 88.6,
  "skillMastery": { /* BKT analysis */ },
  "abilityEstimates": { /* IRT analysis */ },
  "errorPatterns": { /* Error analysis */ },
  "interventionEffectiveness": "HIGHLY_EFFECTIVE",
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## Data Flow Sequence

### Initial Page Load

```
1. User navigates to /admin/student-assessment-results/:id
   └─> StudentAssessmentResults component mounts

2. useEffect triggers fetchStudentData()
   ├─> GET /api/admin/manage/students/idNumber/202533333
   │   └─> backend/routes/Admin/teacherRoutes.js:169
   │       └─> Returns student profile from users collection
   │
   └─> GET /api/admin/assessment-results/202533333
       └─> backend/routes/Admin/assessmentResults.js:12
           └─> Returns category_results with categories array

3. Component combines student + assessment data
   └─> Displays profile card, summary, category grid
```

### Category Modal Open (View Details)

```
1. User clicks category card (e.g., "Phonological Awareness")
   └─> openCategoryModal(category) called
   └─> setSelectedCategory(category)
   └─> setModalOpen(true)
   └─> fetchQuestionResponses(studentId, categoryName)

2. fetchQuestionResponses() executes:

   STEP A: Fetch Main Assessment Responses
   ├─> GET /api/admin/student-responses/202533333/Phonological%20Awareness
   │   └─> backend/routes/Admin/categoryResults.js:17
   │       ├─> Queries student_responses collection
   │       ├─> Filters by studentId + category
   │       ├─> Sorts by answeredAt
   │       └─> Returns array of responses
   │
   ├─> Filter to most recent assessment session
   │   ├─> Group responses by date
   │   ├─> Find date with complete set of unique questionIds
   │   └─> Get latest response for each questionId
   │
   └─> GET /api/main-assessment?category=Phonological%20Awareness&readingLevel=High%20Emerging
       └─> backend/routes/Teachers/mainAssessmentRoutes.js:109
           └─> backend/controllers/Teachers/mainAssessmentController.js
               ├─> Queries main_assessment collection
               ├─> Filters by category + readingLevel + status: "active"
               └─> Returns assessment document with questions array

   STEP B: Enhance Main Responses with Question Details
   ├─> For each response, find matching question from main_assessment
   ├─> Extract question text, correct answer, options
   ├─> Special handling for Reading Comprehension grouping
   └─> Build enhanced mainAssessmentResponses array

   STEP C: Fetch Intervention Responses (if applicable)
   ├─> Check if category has intervention history
   ├─> Find passed attempt OR best attempt
   │   └─> const targetAttempt = passedAttempt || bestAttempt
   │
   ├─> GET /api/intervention-responses?studentId=202533333&interventionAssessmentId=...&category=Phonological%20Awareness&revisionNumber=2
   │   └─> backend/routes/Teachers/interventionResponses.js:6
   │       ├─> Queries intervention_responses collection
   │       ├─> Filters by studentId + interventionAssessmentId + revisionNumber
   │       ├─> Also fetches intervention_assessment for question details
   │       ├─> Also fetches intervention_results for score/pass status
   │       └─> Returns {
   │           data: [intervention responses],
   │           interventionAssessment: { questions: [...] },
   │           interventionResult: { score, isPassed }
   │         }
   │
   └─> Enhance intervention responses with question details
       ├─> Match response.questionId to interventionAssessment.questions
       ├─> Extract question text, correct answer, options
       └─> Build enhanced interventionResponses array

   STEP D: Combine and Store
   └─> setQuestionResponses({
       [category]: {
         mainAssessment: enhancedMainResponses,
         intervention: enhancedInterventionResponses,
         hasIntervention: true/false,
         passedAttemptNumber: X,
         bestInterventionAttempt: Y
       }
     })

3. Modal displays:
   ├─> Main Assessment Section (BEFORE INTERVENTION)
   │   └─> Shows each question with student's answer
   │
   ├─> Intervention Section (AFTER INTERVENTION)
   │   ├─> Shows "Revision X" indicator
   │   ├─> Shows intervention score and pass status
   │   └─> Shows each intervention question with student's answer
   │
   └─> Intervention History (if multiple attempts)
       └─> Lists all attempts with scores, dates, pass/fail
```

---

## API Endpoints Reference

### 1. GET `/api/admin/manage/students/idNumber/:idNumber`

**File**: `backend/routes/Admin/teacherRoutes.js:169`

**Purpose**: Fetch student profile information by student ID number

**Request**:
```http
GET /api/admin/manage/students/idNumber/202533333
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "idNumber": 202533333,
    "firstName": "Philip",
    "middleName": "Ong",
    "lastName": "Pangilinan",
    "age": 8,
    "gradeLevel": "Grade 2",
    "section": "Rose",
    "teacherName": "Mrs. Santos",
    "readingLevel": "High Emerging",
    "readingPercentage": 72,
    "profileImageUrl": "https://..."
  }
}
```

**Implementation**:
```javascript
router.get('/students/idNumber/:idNumber', async (req, res) => {
  const db = mongoose.connection.useDb('test');
  const student = await db.collection('users').findOne({
    $or: [
      { idNumber: req.params.idNumber },
      { idNumber: Number(req.params.idNumber) }
    ]
  });
  res.json({ success: true, data: student });
});
```

---

### 2. GET `/api/admin/assessment-results/:idNumber`

**File**: `backend/routes/Admin/assessmentResults.js:12`

**Purpose**: Fetch post-assessment category results for student

**Request**:
```http
GET /api/admin/assessment-results/202533333
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "studentId": 202533333,
    "assessmentDate": "2025-01-15T10:30:00Z",
    "readingLevel": "High Emerging",
    "overallScore": 74,
    "totalQuestions": 41,
    "correctAnswers": 30,
    "allCategoriesPassed": false,
    "assessmentType": "main-assessment",
    "isPreAssessment": false,
    "categories": [
      {
        "categoryName": "Alphabet Knowledge",
        "totalQuestions": 15,
        "correctAnswers": 14,
        "score": 93,
        "isPassed": true,
        "interventionHistory": []
      },
      {
        "categoryName": "Phonological Awareness",
        "score": 44,
        "isPassed": false,
        "interventionHistory": [
          {
            "attemptNumber": 1,
            "interventionId": "...",
            "revisionNumber": 1,
            "score": 73,
            "isPassed": false
          },
          {
            "attemptNumber": 2,
            "interventionId": "...",
            "revisionNumber": 2,
            "score": 81,
            "isPassed": true
          }
        ]
      }
    ]
  }
}
```

**Implementation**:
```javascript
router.get('/assessment-results/:idNumber', async (req, res) => {
  const db = mongoose.connection.useDb('test');
  const result = await db.collection('category_results').findOne({
    $or: [
      { studentId: req.params.idNumber },
      { studentId: Number(req.params.idNumber) }
    ]
  });

  const responseData = {
    ...result,
    assessmentType: 'main-assessment',
    isPreAssessment: false
  };

  res.json({ success: true, data: responseData });
});
```

---

### 3. GET `/api/admin/student-responses/:studentId/:category`

**File**: `backend/routes/Admin/categoryResults.js:17`

**Purpose**: Fetch main assessment question responses for a specific category

**Request**:
```http
GET /api/admin/student-responses/202533333/Phonological%20Awareness
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "totalResponses": 6,
  "data": [
    {
      "_id": "...",
      "studentId": 202533333,
      "questionId": "PA_001",
      "category": "Phonological Awareness",
      "response": [
        {"audio": "H", "match": "Tt"},
        {"audio": "T", "match": "Hh"},
        {"audio": "N", "match": "Nn"}
      ],
      "isCorrect": false,
      "responseTime": 12500,
      "answeredAt": "2025-01-15T10:35:30Z",
      "questionDetails": {
        "question": "Pakinggan ang audio. Itugma ito sa katumbas na letra.",
        "correctAnswer": "H → Hh, T → Tt, N → Nn",
        "options": ["Hh", "Tt", "Nn", "Ll"],
        "questionType": "matching",
        "image": null,
        "questionId": "PA_001"
      }
    }
  ]
}
```

**Implementation**:
```javascript
router.get('/student-responses/:studentId/:category', async (req, res) => {
  const { studentId, category } = req.params;
  const db = mongoose.connection.useDb('test');

  // Fetch student responses
  const responses = await db.collection('student_responses').find({
    studentId: parseInt(studentId),
    category: category
  }).sort({ answeredAt: 1 }).toArray();

  // Fetch main assessment questions for details
  const mainAssessmentQuestions = await db.collection('main_assessment').find({
    category: category,
    status: 'active'
  }).toArray();

  // Combine responses with question details
  let responsesWithQuestions = [];
  for (const response of responses) {
    let questionDetails = null;

    // Search through all main assessment documents
    for (const mainDoc of mainAssessmentQuestions) {
      if (mainDoc.questions && Array.isArray(mainDoc.questions)) {
        questionDetails = mainDoc.questions.find(q => q.questionId === response.questionId);
        if (questionDetails) break;
      }
    }

    responsesWithQuestions.push({
      ...response,
      questionDetails: questionDetails ? {
        question: questionDetails.questionText,
        correctAnswer: extractCorrectAnswer(questionDetails),
        options: extractOptions(questionDetails),
        questionType: mainDoc.questionType,
        questionId: questionDetails.questionId
      } : null
    });
  }

  res.json({
    success: true,
    data: responsesWithQuestions,
    totalResponses: responsesWithQuestions.length
  });
});
```

---

### 4. GET `/api/intervention-responses`

**File**: `backend/routes/Teachers/interventionResponses.js:6`

**Purpose**: Fetch intervention question responses with assessment details

**Request**:
```http
GET /api/intervention-responses?studentId=202533333&interventionAssessmentId=65f8a1234567890123456789&category=Phonological%20Awareness&revisionNumber=2
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "totalResponses": 12,
  "revisionNumber": 2,
  "data": [
    {
      "_id": "...",
      "studentId": 202533333,
      "interventionAssessmentId": "65f8a1234567890123456789",
      "questionId": "int_pa_001",
      "category": "Phonological Awareness",
      "revisionNumber": 2,
      "response": [
        {"audio": "B", "match": "Bb"},
        {"audio": "P", "match": "Pp"},
        {"audio": "M", "match": "Mm"}
      ],
      "isCorrect": true,
      "responseTime": 8700,
      "answeredAt": "2025-01-17T10:15:30Z"
    }
  ],
  "interventionAssessment": {
    "_id": "65f8a1234567890123456789",
    "studentId": 202533333,
    "category": "Phonological Awareness",
    "revisionNumber": 2,
    "totalQuestions": 12,
    "questions": [
      {
        "questionId": "int_pa_001",
        "questionType": "malapantig",
        "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra.",
        "questionSet": {
          "audioTexts": ["B", "P", "M"],
          "matchingOptions": ["Bb", "Pp", "Mm", "Nn"],
          "correctPairs": [
            {"audio": "B", "match": "Bb"},
            {"audio": "P", "match": "Pp"},
            {"audio": "M", "match": "Mm"}
          ]
        }
      }
    ]
  },
  "interventionResult": {
    "_id": "...",
    "studentId": 202533333,
    "interventionAssessmentId": "65f8a1234567890123456789",
    "revisionNumber": 2,
    "score": 83,
    "isPassed": true
  }
}
```

**Implementation**:
```javascript
router.get('/', async (req, res) => {
  const { studentId, interventionAssessmentId, revisionNumber, category } = req.query;

  if (!studentId || !interventionAssessmentId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID and Intervention Assessment ID are required'
    });
  }

  const db = mongoose.connection.useDb('test');

  // Build query
  const query = {
    studentId: parseInt(studentId),
    interventionAssessmentId: new mongoose.Types.ObjectId(interventionAssessmentId)
  };

  if (revisionNumber) query.revisionNumber = parseInt(revisionNumber);
  if (category) query.category = category;

  // Fetch responses
  const responses = await db.collection('intervention_responses').find(query).toArray();

  // Fetch intervention assessment details
  const interventionAssessment = await db.collection('intervention_assessment').findOne({
    _id: new mongoose.Types.ObjectId(interventionAssessmentId)
  });

  // Fetch intervention results
  const interventionResult = await db.collection('intervention_results').findOne({
    studentId: parseInt(studentId),
    interventionAssessmentId: new mongoose.Types.ObjectId(interventionAssessmentId),
    revisionNumber: parseInt(revisionNumber) || 1
  });

  res.json({
    success: true,
    data: responses,
    interventionAssessment: interventionAssessment,
    interventionResult: interventionResult,
    totalResponses: responses.length,
    revisionNumber: revisionNumber || 1
  });
});
```

---

### 5. GET `/api/main-assessment`

**File**: `backend/routes/Teachers/mainAssessmentRoutes.js:109`

**Purpose**: Fetch main assessment questions by category and reading level

**Request**:
```http
GET /api/main-assessment?category=Phonological%20Awareness&readingLevel=High%20Emerging
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "readingLevel": "High Emerging",
      "category": "Phonological Awareness",
      "questionType": "malapantig",
      "status": "active",
      "totalQuestions": 6,
      "questions": [
        {
          "questionId": "PA_001",
          "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra.",
          "questionSet": [
            {
              "audioTexts": ["H", "T", "N"],
              "matchingOptions": ["Hh", "Tt", "Nn", "Ll"],
              "correctPairs": [
                {"audio": "H", "match": "Hh"},
                {"audio": "T", "match": "Tt"},
                {"audio": "N", "match": "Nn"}
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Implementation**:
```javascript
router.get('/', authenticateToken, authorize('teacher', 'guro', 'admin'),
  mainAssessmentController.getAllAssessments
);

// In mainAssessmentController.js
async getAllAssessments(req, res) {
  const { category, readingLevel } = req.query;
  const db = mongoose.connection.useDb('test');

  const filter = { status: 'active' };
  if (category) filter.category = category;
  if (readingLevel) filter.readingLevel = readingLevel;

  const assessments = await db.collection('main_assessment').find(filter).toArray();

  res.json({ success: true, data: assessments });
}
```

---

## Critical Issues & Configuration

### ⚠️ CRITICAL: Hardcoded Localhost URLs in Main Branch

**Problem**: The main branch StudentAssessmentResults.jsx has **hardcoded `http://localhost:5001` URLs** which **WILL NOT WORK** in production.

**Affected Lines in StudentAssessmentResults.jsx**:
```javascript
Line 27:  `http://localhost:5001/api/admin/manage/students/idNumber/${id}`
Line 40:  `http://localhost:5001/api/admin/assessment-results/${id}`
Line 616: `http://localhost:5001/api/admin/student-responses/${studentId}/${category}`
Line 691: `http://localhost:5001/api/main-assessment`
Line 810: `http://localhost:5001/api/intervention-responses`
```

**Why This Breaks Production**:
1. Production frontend runs on `https://literexia.com`
2. Production backend runs on `https://api.literexia.com`
3. Hardcoded `localhost:5001` tries to connect to user's local machine → **404 errors**

**Correct Implementation (from rain branch)**:
```javascript
// Import API_BASE_URL from config
import { API_BASE_URL } from '../../config/apiConfig';

// Use in requests
const studentResponse = await axios.get(`${API_BASE_URL}/admin/manage/students/idNumber/${id}`);
const assessmentResponse = await axios.get(`${API_BASE_URL}/admin/assessment-results/${id}`);
const mainResponse = await axios.get(`${API_BASE_URL}/admin/student-responses/${studentId}/${category}`);
const interventionResponse = await axios.get(`${API_BASE_URL}/intervention-responses`);
```

**apiConfig.js** (Correct Configuration):
```javascript
// API configuration for the application
const isProd = import.meta.env?.PROD || false;
const API_BASE = import.meta.env?.VITE_API_URL || 'https://api.literexia.com/';
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.literexia.com/api';
const API_URL = `${API_BASE}/api`;

export default API_URL;
```

**Environment Variables Needed** (AWS Amplify):
```bash
VITE_API_URL=https://api.literexia.com
VITE_API_BASE_URL=https://api.literexia.com/api
```

---

### Component Dependencies

**Required Libraries**:
```javascript
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, BarChart2, Book, Award, Layers,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Edit, X
} from 'lucide-react';
import axios from 'axios';
```

**CSS**:
```javascript
import '../../css/Admin/AssessmentResults/StudentAssessmentResults.css';
```

---

### Backend Dependencies

**Required npm packages**:
```javascript
express
mongoose
multer
@aws-sdk/client-s3
```

**Environment Variables** (backend .env):
```bash
MONGODB_URI=mongodb+srv://...
AWS_S3_BUCKET=literexia-bucket
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
NODE_ENV=production
```

---

### Authentication Flow

**Token Storage**:
```javascript
localStorage.getItem('token')
```

**Headers**:
```javascript
headers: {
  Authorization: `Bearer ${localStorage.getItem('token')}`
}
```

**Middleware** (backend):
```javascript
const { authenticateToken, authorize } = require('../../middleware/auth');

router.get('/', authenticateToken, authorize('teacher', 'guro', 'admin'), controller.method);
```

---

## Summary

### Main Branch Status
- ✅ **Fully Functional** on localhost
- ❌ **BROKEN** in production due to hardcoded URLs
- ✅ **Complete Feature Set**: Main assessment + intervention tracking
- ✅ **Comprehensive Data Display**: All question responses visible
- ✅ **Intervention History**: Multiple attempts tracked with revision numbers

### Key Differences from Rain Branch
| Aspect | Main Branch | Rain Branch |
|--------|-------------|-------------|
| **API URLs** | Hardcoded `localhost:5001` | Environment-based `${API_BASE_URL}` |
| **Production** | ❌ Broken (404 errors) | ✅ Working |
| **Configuration** | Static | Dynamic (Vite env vars) |
| **Deployment** | ❌ Not production-ready | ✅ Production-ready |

### Migration Requirements
To fix production issues, the main branch needs:
1. Replace all hardcoded URLs with `${API_BASE_URL}`
2. Import `API_BASE_URL` from `apiConfig.js`
3. Ensure AWS Amplify has `VITE_API_BASE_URL` environment variable set
4. Test on production to verify API connectivity

---

## Conclusion

The main branch StudentAssessmentResults system is **architecturally sound** with comprehensive features for displaying student assessment data, question responses, and intervention tracking. However, it has **critical production deployment issues** due to hardcoded localhost URLs.

The rain branch contains the **correct implementation** with environment-based API configuration that works in both development and production environments.

**Next Steps**:
1. Review this analysis
2. Switch to rain branch for production-ready code
3. Compare configurations between branches
4. Deploy rain branch to production

---

**Analysis Complete** ✅
**Generated**: January 2025
**Branch Analyzed**: main
**Total Files Analyzed**: 10 backend files + 1 frontend component
