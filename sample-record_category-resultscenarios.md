// ============================================================================
// SCENARIO 1: HIGH EMERGING LEVEL - INCOMPLETE (Only finished Alphabet Knowledge)
// ============================================================================

// CATEGORY_RESULTS Collection - Scenario 1
{
  "_id": {"$oid": "67000001a1b2c3d4e5f60001"},
  "studentId": 202533333,
  "assessmentDate": {"$date": "2025-09-10T08:30:00.000Z"},
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
      "totalQuestions": 15,
      "correctAnswers": 7,
      "score": 47,
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
  "createdAt": {"$date": "2025-09-10T08:30:00.000Z"},
  "updatedAt": {"$date": "2025-09-10T09:15:00.000Z"}
}

// STUDENT_RESPONSES Collection - Scenario 1 (Alphabet Knowledge - PASSED)

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

// STUDENT_RESPONSES Collection - Scenario 1 (Phonological Awareness - FAILED, based on actual main_assessment.json)

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

// ============================================================================
// SCENARIO 2: HIGH EMERGING LEVEL - COMPLETED (Ready to advance to Developing)
// ============================================================================

// CATEGORY_RESULTS Collection - Scenario 2
{
  "_id": {"$oid": "67000003a1b2c3d4e5f60001"},
  "studentId": 202533333,
  "assessmentDate": {"$date": "2025-09-08T10:00:00.000Z"},
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 13,
      "score": 87,
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
      "totalQuestions": 15,
      "correctAnswers": 12,
      "score": 80,
      "isPassed": true,
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
  "overallScore": 83,
  "completedCategories": 2,
  "totalCategories": 2,
  "allCategoriesPassed": true,
  "readingLevel": "High Emerging",
  "readingLevelUpdated": true,
  "createdAt": {"$date": "2025-09-08T10:00:00.000Z"},
  "updatedAt": {"$date": "2025-09-08T11:30:00.000Z"}
}

// STUDENT_RESPONSES Collection - Scenario 2 (Alphabet Knowledge - PASSED)
[
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60001"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_001",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.8,
    "answeredAt": {"$date": "2025-09-08T10:05:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:05:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60002"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_002",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.1,
    "answeredAt": {"$date": "2025-09-08T10:05:15.000Z"},
    "createdAt": {"$date": "2025-09-08T10:05:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60003"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_003",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.5,
    "answeredAt": {"$date": "2025-09-08T10:05:30.000Z"},
    "createdAt": {"$date": "2025-09-08T10:05:30.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60004"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_004",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 4.2,
    "answeredAt": {"$date": "2025-09-08T10:05:45.000Z"},
    "createdAt": {"$date": "2025-09-08T10:05:45.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60005"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_005",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.9,
    "answeredAt": {"$date": "2025-09-08T10:06:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:06:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60006"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_006",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.6,
    "answeredAt": {"$date": "2025-09-08T10:06:15.000Z"},
    "createdAt": {"$date": "2025-09-08T10:06:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60007"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_007",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.4,
    "answeredAt": {"$date": "2025-09-08T10:06:30.000Z"},
    "createdAt": {"$date": "2025-09-08T10:06:30.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60008"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_008",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.7,
    "answeredAt": {"$date": "2025-09-08T10:06:45.000Z"},
    "createdAt": {"$date": "2025-09-08T10:06:45.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60009"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_009",
    "category": "Alphabet Knowledge",
    "response": ["3"],
    "isCorrect": false,
    "responseTime": 6.1,
    "answeredAt": {"$date": "2025-09-08T10:07:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:07:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60010"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_010",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.4,
    "answeredAt": {"$date": "2025-09-08T10:07:15.000Z"},
    "createdAt": {"$date": "2025-09-08T10:07:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60011"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_011",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.0,
    "answeredAt": {"$date": "2025-09-08T10:07:30.000Z"},
    "createdAt": {"$date": "2025-09-08T10:07:30.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60012"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_012",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.3,
    "answeredAt": {"$date": "2025-09-08T10:07:45.000Z"},
    "createdAt": {"$date": "2025-09-08T10:07:45.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60013"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_013",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.8,
    "answeredAt": {"$date": "2025-09-08T10:08:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:08:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60014"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_014",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.5,
    "answeredAt": {"$date": "2025-09-08T10:08:15.000Z"},
    "createdAt": {"$date": "2025-09-08T10:08:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60015"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_015",
    "category": "Alphabet Knowledge",
    "response": ["3"],
    "isCorrect": false,
    "responseTime": 5.8,
    "answeredAt": {"$date": "2025-09-08T10:08:30.000Z"},
    "createdAt": {"$date": "2025-09-08T10:08:30.000Z"},
    "readingLevel": "High Emerging"
  }
]

// STUDENT_RESPONSES Collection - Scenario 2 (Phonological Awareness - PASSED)
[
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60016"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "PA_001",
    "category": "Phonological Awareness",
    "response": [
      {"H": "Hh"},
      {"T": "Tt"},
      {"N": "Nn"},
      {"L": "Ll"},
      {"P": "Pp"}
    ],
    "correctMatches": 5,
    "totalMatches": 5,
    "isCorrect": true,
    "responseTime": 32.4,
    "answeredAt": {"$date": "2025-09-08T10:15:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:15:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60017"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "PA_002",
    "category": "Phonological Awareness",
    "response": [
      {"L": "Ll"},
      {"P": "Pp"},
      {"B": "Bb"}
    ],
    "correctMatches": 3,
    "totalMatches": 3,
    "isCorrect": true,
    "responseTime": 26.8,
    "answeredAt": {"$date": "2025-09-08T10:16:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:16:00.000Z"},
    "readingLevel": "High Emerging"
  }
]

// ============================================================================
// SCENARIO 3: DEVELOPING LEVEL - WITH INTERVENTION (Failed Decoding, needs intervention)
// ============================================================================

// CATEGORY_RESULTS Collection - Scenario 3
{
  "_id": {"$oid": "67000005a1b2c3d4e5f60001"},
  "studentId": 202533333,
  "assessmentDate": {"$date": "2025-09-05T14:00:00.000Z"},
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 14,
      "score": 93,
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
      "totalQuestions": 15,
      "correctAnswers": 13,
      "score": 87,
      "isPassed": true,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "PA_015",
      "interventionRequired": false,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": []
    },
    {
      "categoryName": "Decoding",
      "totalQuestions": 15,
      "correctAnswers": 9,
      "score": 60,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "DC_015",
      "interventionRequired": true,
      "interventionAttempts": 2,
      "interventionCompleted": false,
      "currentInterventionId": {"$oid": "67000006a1b2c3d4e5f60001"},
      "interventionHistory": [
        {
          "attemptNumber": 1,
          "interventionId": {"$oid": "67000006a1b2c3d4e5f60001"},
          "interventionResultId": {"$oid": "67000007a1b2c3d4e5f60001"},
          "score": 65,
          "isPassed": false,
          "attemptedAt": {"$date": "2025-09-06T10:00:00.000Z"},
          "completedAt": {"$date": "2025-09-06T10:30:00.000Z"}
        },
        {
          "attemptNumber": 2,
          "interventionId": {"$oid": "67000006a1b2c3d4e5f60002"},
          "interventionResultId": {"$oid": "67000007a1b2c3d4e5f60002"},
          "score": 70,
          "isPassed": false,
          "attemptedAt": {"$date": "2025-09-07T11:00:00.000Z"},
          "completedAt": {"$date": "2025-09-07T11:25:00.000Z"}
        }
      ]
    }
  ],
  "overallScore": 80,
  "completedCategories": 2,
  "totalCategories": 3,
  "allCategoriesPassed": false,
  "readingLevel": "Developing",
  "readingLevelUpdated": false,
  "createdAt": {"$date": "2025-09-05T14:00:00.000Z"},
  "updatedAt": {"$date": "2025-09-07T11:25:00.000Z"}
}

// STUDENT_RESPONSES Collection - Scenario 3 (Alphabet Knowledge - PASSED)
[
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60001"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_001",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.2,
    "answeredAt": {"$date": "2025-09-05T14:05:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:05:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60002"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_002",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.8,
    "answeredAt": {"$date": "2025-09-05T14:05:15.000Z"},
    "createdAt": {"$date": "2025-09-05T14:05:15.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60003"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_003",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.4,
    "answeredAt": {"$date": "2025-09-05T14:05:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:05:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60004"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_004",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.7,
    "answeredAt": {"$date": "2025-09-05T14:05:45.000Z"},
    "createdAt": {"$date": "2025-09-05T14:05:45.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60005"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_005",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.5,
    "answeredAt": {"$date": "2025-09-05T14:06:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:06:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60006"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_006",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.3,
    "answeredAt": {"$date": "2025-09-05T14:06:15.000Z"},
    "createdAt": {"$date": "2025-09-05T14:06:15.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60007"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_007",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.1,
    "answeredAt": {"$date": "2025-09-05T14:06:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:06:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60008"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_008",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.6,
    "answeredAt": {"$date": "2025-09-05T14:06:45.000Z"},
    "createdAt": {"$date": "2025-09-05T14:06:45.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60009"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_009",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.2,
    "answeredAt": {"$date": "2025-09-05T14:07:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:07:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60010"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_010",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.4,
    "answeredAt": {"$date": "2025-09-05T14:07:15.000Z"},
    "createdAt": {"$date": "2025-09-05T14:07:15.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60011"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_011",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 3.9,
    "answeredAt": {"$date": "2025-09-05T14:07:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:07:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60012"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_012",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.0,
    "answeredAt": {"$date": "2025-09-05T14:07:45.000Z"},
    "createdAt": {"$date": "2025-09-05T14:07:45.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60013"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_013",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.7,
    "answeredAt": {"$date": "2025-09-05T14:08:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:08:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60014"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_014",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.5,
    "answeredAt": {"$date": "2025-09-05T14:08:15.000Z"},
    "createdAt": {"$date": "2025-09-05T14:08:15.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60015"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "AK_015",
    "category": "Alphabet Knowledge",
    "response": ["3"],
    "isCorrect": false,
    "responseTime": 5.8,
    "answeredAt": {"$date": "2025-09-05T14:08:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:08:30.000Z"},
    "readingLevel": "Developing"
  }
]

// STUDENT_RESPONSES Collection - Scenario 3 (Phonological Awareness - PASSED)
[
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60016"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "PA_001",
    "category": "Phonological Awareness",
    "response": [
      {"H": "Hh"},
      {"T": "Tt"},
      {"N": "Nn"},
      {"L": "Ll"},
      {"P": "Pp"}
    ],
    "correctMatches": 5,
    "totalMatches": 5,
    "isCorrect": true,
    "responseTime": 29.8,
    "answeredAt": {"$date": "2025-09-05T14:15:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:15:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60017"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "PA_002",
    "category": "Phonological Awareness",
    "response": [
      {"L": "Ll"},
      {"P": "Pp"},
      {"B": "Bb"}
    ],
    "correctMatches": 3,
    "totalMatches": 3,
    "isCorrect": true,
    "responseTime": 24.2,
    "answeredAt": {"$date": "2025-09-05T14:16:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:16:00.000Z"},
    "readingLevel": "Developing"
  }
]

// STUDENT_RESPONSES Collection - Scenario 3 (Decoding - FAILED, needs intervention)
[
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60018"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_001",
    "category": "Decoding",
    "response": ["Y", "E", "L", "O"],
    "isCorrect": true,
    "responseTime": 18.3,
    "answeredAt": {"$date": "2025-09-05T14:25:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:25:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60019"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_002",
    "category": "Decoding",
    "response": ["A"],
    "isCorrect": false,
    "responseTime": 22.1,
    "answeredAt": {"$date": "2025-09-05T14:25:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:25:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60020"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_003",
    "category": "Decoding",
    "response": ["M", "E", "S", "A"],
    "isCorrect": true,
    "responseTime": 25.7,
    "answeredAt": {"$date": "2025-09-05T14:26:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:26:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60021"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_004",
    "category": "Decoding",
    "response": ["L", "I", "B", "R", "A"],
    "isCorrect": false,
    "responseTime": 28.4,
    "answeredAt": {"$date": "2025-09-05T14:26:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:26:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60022"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_005",
    "category": "Decoding",
    "response": ["B", "A", "S", "O"],
    "isCorrect": true,
    "responseTime": 19.6,
    "answeredAt": {"$date": "2025-09-05T14:27:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:27:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60023"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_006",
    "category": "Decoding",
    "response": ["U", "S", "A"],
    "isCorrect": false,
    "responseTime": 24.8,
    "answeredAt": {"$date": "2025-09-05T14:27:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:27:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60024"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_007",
    "category": "Decoding",
    "response": ["B", "O", "L", "A"],
    "isCorrect": true,
    "responseTime": 17.2,
    "answeredAt": {"$date": "2025-09-05T14:28:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:28:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60025"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_008",
    "category": "Decoding",
    "response": ["I", "N", "A"],
    "isCorrect": false,
    "responseTime": 21.5,
    "answeredAt": {"$date": "2025-09-05T14:28:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:28:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60026"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_009",
    "category": "Decoding",
    "response": ["A", "S", "O"],
    "isCorrect": true,
    "responseTime": 16.8,
    "answeredAt": {"$date": "2025-09-05T14:29:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:29:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60027"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_010",
    "category": "Decoding",
    "response": ["P", "U", "S", "A"],
    "isCorrect": true,
    "responseTime": 20.1,
    "answeredAt": {"$date": "2025-09-05T14:29:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:29:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60028"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_011",
    "category": "Decoding",
    "response": ["T", "A", "O"],
    "isCorrect": false,
    "responseTime": 26.3,
    "answeredAt": {"$date": "2025-09-05T14:30:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:30:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60029"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_012",
    "category": "Decoding",
    "response": ["I", "B", "O"],
    "isCorrect": false,
    "responseTime": 23.7,
    "answeredAt": {"$date": "2025-09-05T14:30:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:30:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60030"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_013",
    "category": "Decoding",
    "response": ["B", "A", "T", "A"],
    "isCorrect": true,
    "responseTime": 18.9,
    "answeredAt": {"$date": "2025-09-05T14:31:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:31:00.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60031"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_014",
    "category": "Decoding",
    "response": ["M", "A", "N", "O"],
    "isCorrect": true,
    "responseTime": 22.4,
    "answeredAt": {"$date": "2025-09-05T14:31:30.000Z"},
    "createdAt": {"$date": "2025-09-05T14:31:30.000Z"},
    "readingLevel": "Developing"
  },
  {
    "_id": {"$oid": "67000008a1b2c3d4e5f60032"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000005a1b2c3d4e5f60001"},
    "questionId": "DC_015",
    "category": "Decoding",
    "response": ["T", "U", "B", "I"],
    "isCorrect": false,
    "responseTime": 27.8,
    "answeredAt": {"$date": "2025-09-05T14:32:00.000Z"},
    "createdAt": {"$date": "2025-09-05T14:32:00.000Z"},
    "readingLevel": "Developing"
  }
]

// ============================================================================
// USERS Collection Record for Philip Casingal Pangilinan
// ============================================================================

{
  "_id": {"$oid": "67000009a1b2c3d4e5f60001"},
  "idNumber": 202533333,
  "firstName": "Philip",
  "middleName": "Casingal",
  "lastName": "Pangilinan",
  "age": 8,
  "gender": "Male",
  "gradeLevel": "Grade 2",
  "section": "Mabait",
  "address": "123 Sampaguita Street, Marikina City",
  "email": "philip.pangilinan@school.edu.ph",
  "profileImageUrl": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/profiles/philip-pangilinan-profile.jpg",
  "readingLevel": "High Emerging",
  "readingPercentage": "75",
  "preAssessmentCompleted": "Yes",
  "createdAt": {"$date": "2025-09-01T08:00:00.000Z"},
  "updatedAt": {"$date": "2025-09-10T09:15:00.000Z"},
  "lastAssessmentDate": {"$date": "2025-09-10T08:30:00.000Z"}
}

// ============================================================================
// INSERTION INSTRUCTIONS FOR MONGODB COMPASS
// ============================================================================

/*
TO INSERT THESE RECORDS:

1. Copy each collection's records separately
2. In MongoDB Compass:
   - Select the appropriate collection (category_results, student_responses, or users)
   - Click "INSERT DOCUMENT"
   - Switch to JSON view
   - Paste the record(s)
   - Click "INSERT"

3. Insert in this order:
   - First: users collection record
   - Second: category_results records (one at a time for each scenario)
   - Third: student_responses records (in batches per scenario)

SCENARIOS SUMMARY:
- Scenario 1: High Emerging, incomplete (failed Phonological Awareness, no intervention yet)
- Scenario 2: High Emerging, completed (ready to advance to Developing level)
- Scenario 3: Developing level, failed Decoding with 2 intervention attempts

Each scenario provides comprehensive test data for different student progress states.
*/