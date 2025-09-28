# test.users 

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
  "lastAssessmentDate": "2025-08-20T04:47:39.677994",
  "lastLogin": {
    "$date": "2025-09-16T05:05:20.363Z"
  }
}



category_results 

{
  "_id": {
    "$oid": "68c9fc6fd26632a89f218ede"
  },
  "studentId": 202522233,
  "assessmentDate": {
    "$date": "2025-09-17T00:10:23.583Z"
  },
  "categories": [
    {
      "categoryName": "Alphabet Knowledge",
      "totalQuestions": 15,
      "correctAnswers": 5,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 33,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": true,
      "lastQuestionAnswered": "",
      "interventionRequired": true,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": [],
      "_id": {
        "$oid": "68c9fc6fd26632a89f218edf"
      }
    },
    {
      "categoryName": "Phonological Awareness",
      "totalQuestions": 6,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": false,
      "lastQuestionAnswered": "",
      "interventionRequired": true,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": [],
      "_id": {
        "$oid": "68c9fc6fd26632a89f218ee0"
      }
    },
    {
      "categoryName": "Decoding",
      "totalQuestions": 15,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": false,
      "lastQuestionAnswered": "",
      "interventionRequired": true,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": [],
      "_id": {
        "$oid": "68c9fc6fd26632a89f218ee1"
      }
    },
    {
      "categoryName": "Word Recognition",
      "totalQuestions": 15,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": false,
      "lastQuestionAnswered": "",
      "interventionRequired": true,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": [],
      "_id": {
        "$oid": "68c9fc6fd26632a89f218ee2"
      }
    },
    {
      "categoryName": "Reading Comprehension",
      "totalQuestions": 10,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "passingThreshold": 75,
      "isCompleted": false,
      "lastQuestionAnswered": "",
      "interventionRequired": true,
      "interventionAttempts": 0,
      "interventionCompleted": false,
      "currentInterventionId": null,
      "interventionHistory": [],
      "_id": {
        "$oid": "68c9fc6fd26632a89f218ee3"
      }
    }
  ],
  "overallScore": 7,
  "completedCategories": 5,
  "totalCategories": 5,
  "allCategoriesPassed": false,
  "readingLevel": "At Grade Level",
  "readingLevelUpdated": false,
  "createdAt": {
    "$date": "2025-09-17T00:10:23.643Z"
  },
  "updatedAt": {
    "$date": "2025-09-18T01:47:11.219Z"
  },
  "__v": 0
}

prescriptive_analysis 

{
  "_id": {
    "$oid": "68c9fc70d26632a89f218ef0"
  },
  "studentId": 202522233,
  "categoryResultId": {
    "$oid": "68c9fc6fd26632a89f218ede"
  },
  "assessmentDate": {
    "$date": "2025-09-17T00:10:23.583Z"
  },
  "assessmentType": "main",
  "readingLevel": "At Grade Level",
  "skillMastery": {
    "Alphabet Knowledge": {
      "masteryProbability": 0.371,
      "lastUpdated": {
        "$date": "2025-09-17T00:10:23.937Z"
      },
      "totalQuestions": 15,
      "correctAnswers": 5,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 33,
      "isPassed": false,
      "status": "ADEQUATE",
      "responseHistory": [
        {
          "questionId": "AK_001",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:00:00.000Z"
          },
          "masteryAfter": 0.213
        },
        {
          "questionId": "AK_002",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:00:30.000Z"
          },
          "masteryAfter": 0.133
        },
        {
          "questionId": "AK_003",
          "correct": true,
          "timestamp": {
            "$date": "2025-09-16T08:01:00.000Z"
          },
          "masteryAfter": 0.384
        },
        {
          "questionId": "AK_004",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:01:30.000Z"
          },
          "masteryAfter": 0.174
        },
        {
          "questionId": "AK_005",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:02:00.000Z"
          },
          "masteryAfter": 0.126
        },
        {
          "questionId": "AK_006",
          "correct": true,
          "timestamp": {
            "$date": "2025-09-16T08:02:30.000Z"
          },
          "masteryAfter": 0.372
        },
        {
          "questionId": "AK_007",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:03:00.000Z"
          },
          "masteryAfter": 0.17
        },
        {
          "questionId": "AK_008",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:03:30.000Z"
          },
          "masteryAfter": 0.126
        },
        {
          "questionId": "AK_009",
          "correct": true,
          "timestamp": {
            "$date": "2025-09-16T08:04:00.000Z"
          },
          "masteryAfter": 0.371
        },
        {
          "questionId": "AK_010",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:04:30.000Z"
          },
          "masteryAfter": 0.17
        },
        {
          "questionId": "AK_011",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:05:00.000Z"
          },
          "masteryAfter": 0.126
        },
        {
          "questionId": "AK_012",
          "correct": true,
          "timestamp": {
            "$date": "2025-09-16T08:05:30.000Z"
          },
          "masteryAfter": 0.371
        },
        {
          "questionId": "AK_013",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:06:00.000Z"
          },
          "masteryAfter": 0.17
        },
        {
          "questionId": "AK_014",
          "correct": false,
          "timestamp": {
            "$date": "2025-09-16T08:06:30.000Z"
          },
          "masteryAfter": 0.126
        },
        {
          "questionId": "AK_015",
          "correct": true,
          "timestamp": {
            "$date": "2025-09-16T08:07:00.000Z"
          },
          "masteryAfter": 0.371
        }
      ]
    },
    "Phonological Awareness": {
      "masteryProbability": 0.5,
      "lastUpdated": {
        "$date": "2025-09-17T00:10:23.937Z"
      },
      "totalQuestions": 0,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "status": "ADEQUATE",
      "responseHistory": []
    },
    "Decoding": {
      "masteryProbability": 0.5,
      "lastUpdated": {
        "$date": "2025-09-17T00:10:23.937Z"
      },
      "totalQuestions": 0,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "status": "ADEQUATE",
      "responseHistory": []
    },
    "Word Recognition": {
      "masteryProbability": 0.5,
      "lastUpdated": {
        "$date": "2025-09-17T00:10:23.937Z"
      },
      "totalQuestions": 0,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "status": "ADEQUATE",
      "responseHistory": []
    },
    "Reading Comprehension": {
      "masteryProbability": 0.5,
      "lastUpdated": {
        "$date": "2025-09-17T00:10:23.937Z"
      },
      "totalQuestions": 0,
      "correctAnswers": 0,
      "totalPossibleMatches": 0,
      "correctMatches": 0,
      "score": 0,
      "isPassed": false,
      "status": "ADEQUATE",
      "responseHistory": []
    }
  },
  "abilityEstimates": {
    "Alphabet Knowledge": -2,
    "Phonological Awareness": -2,
    "Decoding": -2,
    "Word Recognition": -2,
    "Reading Comprehension": -2
  },
  "errorPatterns": {
    "Alphabet Knowledge": {
      "detailedErrorAnalysis": [
        {
          "errorPattern": "Vowel recognition difficulty with E",
          "specificPairs": [],
          "interventionFocus": "Vowel discrimination training for E"
        },
        {
          "errorPattern": "Vowel recognition difficulty with O",
          "specificPairs": [],
          "interventionFocus": "Vowel discrimination training for O"
        },
        {
          "errorPattern": "Vowel recognition difficulty with u",
          "specificPairs": [],
          "interventionFocus": "Vowel discrimination training for u"
        },
        {
          "errorPattern": "Vowel recognition difficulty with A",
          "specificPairs": [],
          "interventionFocus": "Vowel discrimination training for A"
        },
        {
          "errorPattern": "Vowel recognition difficulty with I",
          "specificPairs": [],
          "interventionFocus": "Vowel discrimination training for I"
        },
        {
          "errorPattern": "Consonant recognition difficulty with d",
          "specificPairs": [],
          "interventionFocus": "Consonant-sound correspondence practice for d"
        },
        {
          "errorPattern": "Consonant recognition difficulty with R",
          "specificPairs": [],
          "interventionFocus": "Consonant-sound correspondence practice for R"
        },
        {
          "errorPattern": "Consonant recognition difficulty with Y",
          "specificPairs": [],
          "interventionFocus": "Consonant-sound correspondence practice for Y"
        },
        {
          "errorPattern": "Consonant recognition difficulty with G u l a y",
          "specificPairs": [],
          "interventionFocus": "Consonant-sound correspondence practice for G u l a y"
        },
        {
          "errorPattern": "Consonant recognition difficulty with w a l i s",
          "specificPairs": [],
          "interventionFocus": "Consonant-sound correspondence practice for w a l i s"
        }
      ],
      "patinig_errors": {
        "count": 5,
        "total": 5,
        "percentage": 100,
        "specific_letters": [
          "E",
          "O",
          "u",
          "A",
          "I"
        ],
        "error_type": "visual_confusion",
        "questionIds": [
          "AK_001",
          "AK_002",
          "AK_004",
          "AK_007",
          "AK_010"
        ],
        "researchClassification": "Multiple vowel confusion - potential visual processing difficulty",
        "interventionFocus": "Visual-auditory vowel discrimination with multisensory support"
      },
      "katinig_errors": {
        "count": 5,
        "total": 10,
        "percentage": 50,
        "specific_letters": [
          "d",
          "R",
          "Y",
          "G u l a y",
          "w a l i s"
        ],
        "error_type": "general_difficulty",
        "questionIds": [
          "AK_005",
          "AK_008",
          "AK_011",
          "AK_013",
          "AK_014"
        ],
        "researchClassification": "General consonant processing deficit",
        "interventionFocus": "Systematic consonant-sound correspondence building"
      }
    }
  },
  "interventionPlan": {
    "required": true,
    "priority": [
      "Alphabet Knowledge"
    ],
    "specificFocus": {
      "Alphabet Knowledge": {
        "focus": "Vowel recognition and sound-symbol correspondence",
        "targetSounds": [],
        "targetPatterns": [
          "Foundation alphabet knowledge skills"
        ],
        "recommendedActivities": [
          "Systematic, explicit instruction",
          "Immediate corrective feedback"
        ],
        "questionDistribution": {
          "total": 18
        }
      }
    }
  },
  "insights": {
    "strengths": [],
    "weaknesses": [
      "Alphabet Knowledge - 37%"
    ],
    "overallReadiness": "Intervention needed for Alphabet Knowledge. Teacher should create approximately 18 questions total, focusing on identified error patterns and target skills.",
    "recommendedAction": "immediate_intervention",
    "passedCategories": 0,
    "failedCategories": 1,
    "overallScore": 33
  },
  "researchBasedPrescriptions": {
    "Alphabet Knowledge": {
      "categoryStatus": "failed",
      "maintenanceRecommendations": {
        "implementationGuidance": {
          "monitoringIndicators": []
        },
        "activities": []
      },
      "accelerationRecommendations": {
        "bridgingActivities": [],
        "nextLevelSkills": [],
        "researchEvidence": []
      },
      "deficitAnalysis": {
        "specificDeficits": [
          {
            "deficit": "Vowel recognition and sound-symbol correspondence",
            "severity": "severe",
            "manifestation": "Score: 33% (below 75% threshold)",
            "errorRate": "67%",
            "researchEvidence": "Evidence-based deficit identification"
          }
        ],
        "rootCauseAnalysis": "Alphabet Knowledge: Vowel recognition weaknesses",
        "cognitiveFactors": [
          "workingMemory",
          "processingSpeed",
          "attention",
          "auditoryProcessing"
        ],
        "researchClassification": "Alphabet Knowledge learning difficulty",
        "linguisticFactors": []
      },
      "interventionPrescription": {
        "primaryApproach": "multisensory_structured",
        "specificTechniques": [
          {
            "technique": "Vowel recognition and sound-symbol correspondence",
            "description": "Targeted alphabet knowledge intervention",
            "duration": "6-8 weeks intensive intervention",
            "materials": "Teacher-created intervention questions from templates",
            "progressCriteria": "75% accuracy on intervention assessment",
            "researchBasis": "Systematic, explicit instruction principles"
          }
        ],
        "intensityLevel": "highly_intensive",
        "sessionStructure": {
          "optimalLength": "15-20 minutes",
          "sessionComponents": [
            "Systematic, explicit instruction",
            "Immediate corrective feedback"
          ],
          "breakPattern": "Short breaks every 10 minutes"
        },
        "materialRecommendations": [
          "Create 18 intervention questions using templates",
          "Focus on identified error patterns",
          "Use multisensory approach"
        ],
        "progressMonitoring": {
          "frequency": "Weekly",
          "keyIndicators": [
            "Accuracy improvement",
            "Error pattern reduction"
          ],
          "dataCollectionMethod": "Intervention assessment performance"
        }
      },
      "escalationProtocol": {
        "triggers": [
          {
            "trigger": "No improvement after 2 weeks",
            "approach": "Increase intervention intensity",
            "researchFoundation": "Response to Intervention (RTI) model",
            "specificTechniques": [
              {
                "technique": "Intensive one-on-one instruction",
                "purpose": "Address persistent learning difficulties",
                "implementation": "Daily 20-minute sessions",
                "materials": [
                  "Teacher-created materials",
                  "Multisensory aids"
                ],
                "progression": "Gradual skill building",
                "researchBasis": "Systematic synthetic phonics approach",
                "researchEvidence": "Evidence-based intervention research"
              }
            ],
            "intensityRecommendations": {
              "duration": "4-6 weeks intensive",
              "frequency": "Daily sessions",
              "totalIntervention": "20-30 hours",
              "researchSupport": "RTI framework guidelines"
            }
          }
        ]
      },
      "_id": {
        "$oid": "68c9fc70d26632a89f218ef1"
      }
    }
  },
  "analyticsMetrics": {
    "fatigueIndicators": {
      "performanceDecline": false,
      "responseTimeIncrease": false,
      "errorPatternShift": false
    },
    "confidenceMetrics": {
      "skillMasteryConfidence": 0,
      "interventionSuccessProbability": 0
    },
    "totalQuestions": 0,
    "totalCorrect": 0,
    "averageResponseTime": 0,
    "consistencyIndex": 0
  },
  "strengths": [],
  "weaknesses": [
    "Alphabet Knowledge: Fundamental skill gaps"
  ],
  "recommendations": [
    "Alphabet Knowledge: Create 18 intervention questions"
  ],
  "createdAt": {
    "$date": "2025-09-17T00:10:24.122Z"
  },
  "updatedAt": {
    "$date": "2025-09-17T00:10:24.135Z"
  },
  "interventionHistory": [],
  "__v": 0
}

templates_qeustions 
[{
  "_id": {
    "$oid": "68cba2fcf06ef8899a9bf738"
  },
  "category": "Alphabet Knowledge",
  "questionType": "katinig",
  "questionText": "Anong katumbas ng malaking letra?",
  "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/mobile/1758175841689_big_H.png",
  "questionValue": "H",
  "choiceOptions": [
    {
      "optionId": "1",
      "optionText": "a",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf739"
      }
    },
    {
      "optionId": "2",
      "optionText": "v",
      "isCorrect": true,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf73a"
      }
    },
    {
      "optionId": "3",
      "optionText": "c",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf73b"
      }
    }
  ],
  "matchCount": null,
  "displaySequence": [],
  "dragElements": [],
  "correctSequence": [],
  "blankPosition": null,
  "displayWord": null,
  "blankOptions": [],
  "correctAnswer": [],
  "targetSkills": [
    "general_practice"
  ],
  "difficultyLevel": "medium",
  "isActive": true,
  "createdBy": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "createdAt": {
    "$date": "2025-09-18T06:13:16.727Z"
  },
  "updatedAt": {
    "$date": "2025-09-18T06:13:16.729Z"
  },
  "__v": 0
},
{
  "_id": {
    "$oid": "68cba2fcf06ef8899a9bf73d"
  },
  "category": "Alphabet Knowledge",
  "questionType": "katinig",
  "questionText": "Anong katumbas ng malaking letra",
  "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/mobile/1758175875998_big_W.png",
  "questionValue": "S",
  "choiceOptions": [
    {
      "optionId": "1",
      "optionText": "s",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf73e"
      }
    },
    {
      "optionId": "2",
      "optionText": "v",
      "isCorrect": true,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf73f"
      }
    },
    {
      "optionId": "3",
      "optionText": "c",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf740"
      }
    }
  ],
  "matchCount": null,
  "displaySequence": [],
  "dragElements": [],
  "correctSequence": [],
  "blankPosition": null,
  "displayWord": null,
  "blankOptions": [],
  "correctAnswer": [],
  "targetSkills": [
    "general_practice"
  ],
  "difficultyLevel": "medium",
  "isActive": true,
  "createdBy": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "createdAt": {
    "$date": "2025-09-18T06:13:16.774Z"
  },
  "updatedAt": {
    "$date": "2025-09-18T06:13:16.775Z"
  },
  "__v": 0
},
{
  "_id": {
    "$oid": "68cba2fcf06ef8899a9bf742"
  },
  "category": "Alphabet Knowledge",
  "questionType": "katinig",
  "questionText": "Anong katumbas ng maliit na letra?",
  "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/mobile/1758175903691_big_K.png",
  "questionValue": "K",
  "choiceOptions": [
    {
      "optionId": "1",
      "optionText": "ka",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf743"
      }
    },
    {
      "optionId": "2",
      "optionText": "k",
      "isCorrect": true,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf744"
      }
    },
    {
      "optionId": "3",
      "optionText": "v",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf745"
      }
    }
  ],
  "matchCount": null,
  "displaySequence": [],
  "dragElements": [],
  "correctSequence": [],
  "blankPosition": null,
  "displayWord": null,
  "blankOptions": [],
  "correctAnswer": [],
  "targetSkills": [
    "general_practice"
  ],
  "difficultyLevel": "medium",
  "isActive": true,
  "createdBy": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "createdAt": {
    "$date": "2025-09-18T06:13:16.810Z"
  },
  "updatedAt": {
    "$date": "2025-09-18T06:13:16.811Z"
  },
  "__v": 0
},
{
  "_id": {
    "$oid": "68cba2fcf06ef8899a9bf747"
  },
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "questionText": "Anong katumbas ng maliit na letra?",
  "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/mobile/1758175934395_big_R.png",
  "questionValue": "R",
  "choiceOptions": [
    {
      "optionId": "1",
      "optionText": "s",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf748"
      }
    },
    {
      "optionId": "2",
      "optionText": "r",
      "isCorrect": true,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf749"
      }
    },
    {
      "optionId": "3",
      "optionText": "v",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf74a"
      }
    }
  ],
  "matchCount": null,
  "displaySequence": [],
  "dragElements": [],
  "correctSequence": [],
  "blankPosition": null,
  "displayWord": null,
  "blankOptions": [],
  "correctAnswer": [],
  "targetSkills": [
    "general_practice"
  ],
  "difficultyLevel": "medium",
  "isActive": true,
  "createdBy": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "createdAt": {
    "$date": "2025-09-18T06:13:16.846Z"
  },
  "updatedAt": {
    "$date": "2025-09-18T06:13:16.847Z"
  },
  "__v": 0
},
{
  "_id": {
    "$oid": "68cba2fcf06ef8899a9bf74c"
  },
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "questionText": "Anong katumbas ng maliit na letra",
  "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/mobile/1758175951494_small_m.png",
  "questionValue": "M",
  "choiceOptions": [
    {
      "optionId": "1",
      "optionText": "n",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf74d"
      }
    },
    {
      "optionId": "2",
      "optionText": "m",
      "isCorrect": true,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf74e"
      }
    },
    {
      "optionId": "3",
      "optionText": "v",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf74f"
      }
    }
  ],
  "matchCount": null,
  "displaySequence": [],
  "dragElements": [],
  "correctSequence": [],
  "blankPosition": null,
  "displayWord": null,
  "blankOptions": [],
  "correctAnswer": [],
  "targetSkills": [
    "general_practice"
  ],
  "difficultyLevel": "medium",
  "isActive": true,
  "createdBy": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "createdAt": {
    "$date": "2025-09-18T06:13:16.881Z"
  },
  "updatedAt": {
    "$date": "2025-09-18T06:13:16.882Z"
  },
  "__v": 0
},
{
  "_id": {
    "$oid": "68cba2fcf06ef8899a9bf751"
  },
  "category": "Alphabet Knowledge",
  "questionType": "patinig",
  "questionText": "Anong katumbas ng lamiit na letra",
  "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/mobile/1758175985446_small_b.png",
  "questionValue": "B",
  "choiceOptions": [
    {
      "optionId": "1",
      "optionText": "b",
      "isCorrect": true,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf752"
      }
    },
    {
      "optionId": "2",
      "optionText": "a",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf753"
      }
    },
    {
      "optionId": "3",
      "optionText": "c",
      "isCorrect": false,
      "_id": {
        "$oid": "68cba2fcf06ef8899a9bf754"
      }
    }
  ],
  "matchCount": null,
  "displaySequence": [],
  "dragElements": [],
  "correctSequence": [],
  "blankPosition": null,
  "displayWord": null,
  "blankOptions": [],
  "correctAnswer": [],
  "targetSkills": [
    "general_practice"
  ],
  "difficultyLevel": "medium",
  "isActive": true,
  "createdBy": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "createdAt": {
    "$date": "2025-09-18T06:13:16.915Z"
  },
  "updatedAt": {
    "$date": "2025-09-18T06:13:16.916Z"
  },
  "__v": 0
}]


teachers.profile 

{
  "_id": {
    "$oid": "6818bae0e9bed4ff08ab7e8c"
  },
  "userId": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "firstName": "Jan Mark",
  "lastName": "Caram",
  "position": "Grade 1 Teacher",
  "contact": "09155933015",
  "profileImageUrl": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/teacher-profiles/2025/08/1756411524213-4ce45f83-54b0-4b2a-a982-26121d9a4df5-rw-1920-6818bae0e9bed4ff08ab7e8c.png?t=1756411525849?t=1757905710621",
  "createdAt": "2025-05-05T02:02:23.476Z",
  "updatedAt": {
    "$date": "2025-09-18T03:21:31.449Z"
  },
  "address": "123 Maharlika Street Los Baños Laguna",
  "civilStatus": "Single",
  "dob": "2025-05-14",
  "emergencyContact": {
    "name": "Maricel Santos",
    "number": "09155933015"
  },
  "gender": "Female",
  "middleName": "T.",
  "email": "teacher@gmail.com"
}

users_web.users

{
  "_id": {
    "$oid": "6816482b816c9582b244bff7"
  },
  "email": "teacher@gmail.com",
  "roles": {
    "$oid": "681b690af9fd9071c6ac2f3a"
  },
  "passwordHash": "$2b$10$KF6R03btmYdBMD/gOgoZue6V7tp8V8yAcHJ8VOdxmPfllrX/SpEmu",
  "updatedAt": {
    "$date": "2025-05-27T16:59:14.891Z"
  },
  "failedLoginAttempts": 0,
  "lastFailedLogin": {
    "$date": "2025-05-16T14:37:05.222Z"
  },
  "lastSuccessfulLogin": {
    "$date": "2025-05-16T14:37:11.955Z"
  }
}