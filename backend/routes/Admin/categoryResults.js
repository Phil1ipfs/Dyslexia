const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/admin/category-results
router.get('/category-results', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('test');
    const results = await db.collection('category_results').find({}).toArray();
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/student-responses/:studentId/:category
router.get('/student-responses/:studentId/:category', async (req, res) => {
  try {
    const { studentId, category } = req.params;
    const db = mongoose.connection.useDb('test');
    
    console.log(`Fetching student responses for studentId: ${studentId}, category: ${category}`);
    
    // Fetch student responses from student_responses collection
    const responses = await db.collection('student_responses').find({
      studentId: parseInt(studentId),
      category: category
    }).sort({ answeredAt: 1 }).toArray();
    
    console.log(`Found ${responses.length} responses`);
    
    // Fetch the main assessment questions to get question details
    const mainAssessmentQuestions = await db.collection('main_assessment').find({
      category: category,
      status: 'active'
    }).toArray();
    
    console.log(`Found ${mainAssessmentQuestions.length} main assessment documents for category: ${category}`);
    
    // Combine responses with question details
    let responsesWithQuestions = [];
    
    for (const response of responses) {
      let questionDetails = null;
      let documentQuestionType = null;

      // Create a sanitized shallow copy without helper counters
      const { correctMatches, totalMatches, matches, ...baseResponse } = response;

      // Search through all main assessment documents and their questions arrays
      for (const mainDoc of mainAssessmentQuestions) {
        if (mainDoc.questions && Array.isArray(mainDoc.questions)) {
          questionDetails = mainDoc.questions.find(q => q.questionId === response.questionId);
          if (questionDetails) {
            documentQuestionType = mainDoc.questionType; // Get the document's question type
            break; // Found the question, stop searching
          }
        }
      }
      
      if (questionDetails && documentQuestionType === 'text_input' && questionDetails.sentenceQuestions && questionDetails.sentenceQuestions.length > 0) {
        // For Reading Comprehension, create separate responses for each sub-question
        questionDetails.sentenceQuestions.forEach((subQuestion, index) => {
          responsesWithQuestions.push({
            ...baseResponse,
            questionId: `${response.questionId}_${index + 1}`, // Make unique ID
            questionDetails: {
              question: subQuestion.questionText || 'Question text not available',
              correctAnswer: subQuestion.correctAnswer || 'Correct answer not available',
              options: questionDetails.choiceOptions || [],
              dragElements: questionDetails.dragElements || [],
              questionType: documentQuestionType || 'unknown',
              image: questionDetails.questionImage || null,
              questionId: `${response.questionId}_${index + 1}`,
              subQuestionIndex: index + 1
            }
          });
        });
      } else {
        // For other question types, use the original logic
        responsesWithQuestions.push({
          ...baseResponse,
          questionDetails: questionDetails ? {
            question: (() => {
              // Handle different question types for question text
              if (documentQuestionType === 'fill_blank' && questionDetails.displayWord) {
                return questionDetails.displayWord;
              }
              return questionDetails.questionText || 'Question text not available';
            })(),
            correctAnswer: (() => {
              // Handle different question types for correct answer
              // PRIORITY: If correctPairs exist on the question, format them (works even if type metadata is missing)
              const anyPairs = questionDetails.correctPairs || questionDetails.matchCorrectPairs || questionDetails.matchingCorrectPairs;
              if (Array.isArray(anyPairs) && anyPairs.length > 0) {
                try {
                  const formatted = anyPairs
                    .map(p => {
                      if (Array.isArray(p) && p.length >= 2) return `${String(p[0])} -> ${String(p[1])}`;
                      if (p && typeof p === 'object') {
                        const left = p.left ?? p.l ?? p.L ?? Object.keys(p)[0];
                        const right = p.right ?? p.r ?? p.R ?? (left !== undefined ? p[left] : undefined);
                        if (left !== undefined || right !== undefined) return `${left ?? ''} -> ${right ?? ''}`;
                      }
                      return null;
                    })
                    .filter(Boolean)
                    .join(', ');
                  if (formatted && formatted.trim()) return formatted;
                } catch (_) {}
              }

              if (documentQuestionType === 'drag_drop' && questionDetails.correctSequence) {
                return Array.isArray(questionDetails.correctSequence) 
                  ? questionDetails.correctSequence.join(', ')
                  : questionDetails.correctSequence;
              } else if (documentQuestionType === 'fill_blank' && questionDetails.correctAnswer) {
                return Array.isArray(questionDetails.correctAnswer) 
                  ? questionDetails.correctAnswer.join(', ')
                  : questionDetails.correctAnswer;
              } else if (documentQuestionType === 'decode' && questionDetails.correctSequence) {
                return Array.isArray(questionDetails.correctSequence) 
                  ? questionDetails.correctSequence.join(', ')
                  : questionDetails.correctSequence;
              } else if (documentQuestionType === 'word' && questionDetails.correctAnswer) {
                return Array.isArray(questionDetails.correctAnswer) 
                  ? questionDetails.correctAnswer.join(', ')
                  : questionDetails.correctAnswer;
              } else if (documentQuestionType === 'matching') {
                // Fallback matching branch (if reached without anyPairs above)
                const pairs = questionDetails.correctPairs || questionDetails.matchingCorrectPairs || [];
                if (Array.isArray(pairs) && pairs.length > 0) {
                  try {
                    const formatted = pairs
                      .map(p => {
                        if (Array.isArray(p) && p.length >= 2) return `${String(p[0])} -> ${String(p[1])}`;
                        if (p && typeof p === 'object') {
                          const keys = Object.keys(p);
                          if (keys.length > 0) {
                            const k = keys[0];
                            const v = p[k];
                            return `${k} -> ${v}`;
                          }
                        }
                        return null;
                      })
                      .filter(Boolean)
                      .join(', ');
                    return formatted && formatted.trim().length > 0 ? formatted : 'Correct answer not available';
                  } catch (e) {
                    return 'Correct answer not available';
                  }
                }
                return 'Correct answer not available';
              } else if (questionDetails.questionValue) {
                return questionDetails.questionValue;
              } else {
                return 'Correct answer not available';
              }
            })(),
            options: questionDetails.choiceOptions || questionDetails.matchOptions || questionDetails.matchingOptions || [],
            dragElements: questionDetails.dragElements || [],
            questionType: documentQuestionType || 'unknown',
            image: questionDetails.questionImage || null,
            questionId: questionDetails.questionId
          } : null
        });
      }
    }
    
    res.json({ 
      success: true, 
      data: responsesWithQuestions,
      totalResponses: responsesWithQuestions.length
    });
  } catch (err) {
    console.error('Error fetching student responses:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 