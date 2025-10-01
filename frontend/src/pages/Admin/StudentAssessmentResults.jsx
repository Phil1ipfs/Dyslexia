// src/pages/Admin/StudentAssessmentResults.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, BarChart2, 
  Book, Award, Layers, CheckCircle, XCircle, AlertTriangle, 
  ChevronDown, ChevronUp, Edit, X
} from 'lucide-react';
import '../../css/Admin/AssessmentResults/StudentAssessmentResults.css';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const StudentAssessmentResults = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionResponses, setQuestionResponses] = useState({});
  const [loadingResponses, setLoadingResponses] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch student data by idNumber
        const studentResponse = await axios.get(`${API_BASE_URL}/admin/manage/students/idNumber/${id}`);
        
        if (!studentResponse.data.success) {
          throw new Error('Failed to fetch student data');
        }

        const studentData = studentResponse.data.data;

        // Fetch assessment results for the student
        const assessmentResponse = await axios.get(`${API_BASE_URL}/admin/assessment-results/${id}`);
        
        if (!assessmentResponse.data.success) {
          throw new Error('Failed to fetch assessment results');
        }

        const assessmentData = assessmentResponse.data.data;

        // Use categories from assessment data
        let mainAssessmentCategories = assessmentData.categories || [];

        // Combine student and assessment data
        const combinedData = {
          ...studentData,
          ...assessmentData,
          categoryScores: mainAssessmentCategories,
          readingLevel: assessmentData.readingLevel || 'Not Assessed',
          readingPercentage: assessmentData.overallScore || 0,
          totalQuestions: assessmentData.totalQuestions || 0,
          correctAnswers: assessmentData.correctAnswers || 0,
          difficulties: assessmentData.difficulties || [],
          strengths: assessmentData.strengths || [],
          recommendations: assessmentData.recommendations || [],
          allCategoriesPassed: assessmentData.allCategoriesPassed || false,
          completedAt: assessmentData.updatedAt || null
        };
        
        setStudent(combinedData);
      } catch (error) {
        console.error("Error fetching student assessment results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  // Helper function to extract correct answer from question details
  const getCorrectAnswerFromQuestion = (questionDetails, category) => {
    if (!questionDetails) return 'Not available';

    try {
      switch (category) {
        case 'Alphabet Knowledge':
          // For Alphabet Knowledge, find the correct option text
          if (questionDetails.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            const correctOption = questionDetails.choiceOptions.find(option => option.isCorrect);
            return correctOption ? correctOption.optionText : 'Not found';
          }
          return 'Not found';

        case 'Phonological Awareness':
          // For Phonological Awareness, use correctPairs
          if (questionDetails.questionSet?.correctPairs && Array.isArray(questionDetails.questionSet.correctPairs)) {
            return questionDetails.questionSet.correctPairs.map(pair => {
              if (typeof pair === 'object') {
                return Object.entries(pair).map(([audio, match]) => `${audio} → ${match}`).join(', ');
              }
              return pair;
            }).join(', ');
          }
          return 'Not found';

        case 'Decoding':
          // For Decoding, use displaySequence and correctSequence
          if (questionDetails.displaySequence && Array.isArray(questionDetails.displaySequence) &&
              questionDetails.correctSequence && Array.isArray(questionDetails.correctSequence)) {
            return `Display: ${questionDetails.displaySequence.join('')}, Correct: ${questionDetails.correctSequence.join('')}`;
          } else if (questionDetails.correctSequence && Array.isArray(questionDetails.correctSequence)) {
            return questionDetails.correctSequence.join('');
          }
          return 'Not found';

        case 'Word Recognition':
          // For Word Recognition, use displayWord and correctAnswer
          if (questionDetails.displayWord && questionDetails.correctAnswer) {
            const correctAnswerText = Array.isArray(questionDetails.correctAnswer) ?
              questionDetails.correctAnswer.join(', ') : questionDetails.correctAnswer;
            return `"${questionDetails.displayWord}" → ${correctAnswerText}`;
          } else if (questionDetails.correctAnswer) {
            return Array.isArray(questionDetails.correctAnswer) ?
              questionDetails.correctAnswer.join(', ') : questionDetails.correctAnswer;
          }
          return 'Not found';

        case 'Reading Comprehension':
          // For Reading Comprehension, don't show correct answer since it's in sentence questions
          return null; // Will not display "Correct Answer" section

        default:
          // Fallback for other categories
          if (questionDetails.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            const correctOption = questionDetails.choiceOptions.find(option => option.isCorrect);
            return correctOption ? correctOption.optionText : 'Not found';
          }
          if (questionDetails.correctSequence && Array.isArray(questionDetails.correctSequence)) {
            return questionDetails.correctSequence.join(', ');
          }
          if (questionDetails.correctAnswer) {
            return Array.isArray(questionDetails.correctAnswer) ?
              questionDetails.correctAnswer.join(', ') : questionDetails.correctAnswer;
          }
          return 'Not found';
      }
    } catch (error) {
      console.error('Error extracting correct answer:', error);
      return 'Error extracting answer';
    }
  };

  // Helper function to extract options from question details
  const getOptionsFromQuestion = (questionDetails, category) => {
    if (!questionDetails) return [];

    try {
      switch (category) {
        case 'Alphabet Knowledge':
          // For Alphabet Knowledge, use choiceOptions
          if (questionDetails.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            return questionDetails.choiceOptions.map(option => option.optionText);
          }
          break;

        case 'Phonological Awareness':
          // For Phonological Awareness, use matchingOptions from questionSet
          if (questionDetails.questionSet?.matchingOptions && Array.isArray(questionDetails.questionSet.matchingOptions)) {
            return questionDetails.questionSet.matchingOptions;
          }
          break;

        case 'Decoding':
          // For Decoding, use dragElements
          if (questionDetails.dragElements && Array.isArray(questionDetails.dragElements)) {
            return questionDetails.dragElements;
          }
          break;

        case 'Word Recognition':
          // For Word Recognition, use blankOptions
          if (questionDetails.blankOptions && Array.isArray(questionDetails.blankOptions)) {
            return questionDetails.blankOptions;
          }
          break;

        case 'Reading Comprehension':
          // For Reading Comprehension, use sentence question options
          if (questionDetails.sentenceQuestions && Array.isArray(questionDetails.sentenceQuestions)) {
            return questionDetails.sentenceQuestions.map(sq => sq.sentenceOptionAnswers || []).flat();
          }
          break;

        default:
          // Fallback to original logic
          if (questionDetails.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            return questionDetails.choiceOptions.map(option => option.optionText);
          }
          if (questionDetails.dragElements && Array.isArray(questionDetails.dragElements)) {
            return questionDetails.dragElements;
          }
          if (questionDetails.blankOptions && Array.isArray(questionDetails.blankOptions)) {
            return questionDetails.blankOptions;
          }
          break;
      }

      return [];
    } catch (error) {
      console.error('Error extracting options:', error);
      return [];
    }
  };

  // Helper function to format intervention student responses
  const formatInterventionResponse = (response, questionDetails, category) => {
    if (!response) return '';

    try {
      switch (category) {
        case 'Alphabet Knowledge':
          // For Alphabet Knowledge, convert option numbers to option text
          if (questionDetails?.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            if (Array.isArray(response)) {
              return response.map(optionId => {
                const option = questionDetails.choiceOptions.find(opt => opt.optionId === String(optionId));
                return option ? option.optionText : optionId;
              }).join(', ');
            } else {
              const option = questionDetails.choiceOptions.find(opt => opt.optionId === String(response));
              return option ? option.optionText : response;
            }
          }
          return Array.isArray(response) ? response.join(', ') : response;

        case 'Phonological Awareness':
          // For Phonological Awareness, format matching pairs
          if (Array.isArray(response)) {
            return response.map(item => {
              if (typeof item === 'object' && item !== null) {
                return Object.entries(item).map(([audio, match]) => `${audio} → ${match}`).join(', ');
              }
              return String(item);
            }).join(', ');
          }
          return String(response);

        case 'Decoding':
          // For Decoding, join sequence elements
          if (Array.isArray(response)) {
            return response.filter(item => item && item.trim() !== '').join('');
          }
          return String(response);

        case 'Word Recognition':
          // For Word Recognition, format array responses
          if (Array.isArray(response)) {
            return response.filter(item => item && item.trim() !== '').join(', ');
          }
          return String(response);

        case 'Reading Comprehension':
          // For Reading Comprehension, format sentence answers
          if (Array.isArray(response)) {
            return response.map((answer, index) => `Q${index + 1}: ${answer}`).join('\n');
          }
          return String(response);

        default:
          // Default formatting
          if (Array.isArray(response)) {
            return response.filter(item => item && String(item).trim() !== '').join(', ');
          }
          return String(response);
      }
    } catch (error) {
      console.error('Error formatting intervention response:', error);
      return Array.isArray(response) ? response.join(', ') : String(response);
    }
  };

  // Helper function to extract correct answer from main assessment question details
  const getCorrectAnswerFromMainQuestion = (questionDetails, category) => {
    if (!questionDetails) return 'Not available';

    try {
      switch (category) {
        case 'Alphabet Knowledge':
          // For Alphabet Knowledge, find the correct option text
          if (questionDetails.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            const correctOption = questionDetails.choiceOptions.find(option => option.isCorrect);
            return correctOption ? correctOption.optionText : 'Not found';
          }
          return 'Not found';

        case 'Phonological Awareness':
          // For Phonological Awareness, use correctPairs from questionSet
          if (questionDetails.questionSet && Array.isArray(questionDetails.questionSet) && questionDetails.questionSet[0]?.correctPairs) {
            return questionDetails.questionSet[0].correctPairs.map(pair => {
              if (typeof pair === 'object') {
                return Object.entries(pair).map(([audio, match]) => `${audio} → ${match}`).join(', ');
              }
              return pair;
            }).join(', ');
          }
          return 'Not found';

        case 'Decoding':
          // For Decoding, use displaySequence and correctSequence
          if (questionDetails.displaySequence && Array.isArray(questionDetails.displaySequence) &&
              questionDetails.correctSequence && Array.isArray(questionDetails.correctSequence)) {
            return `Display: ${questionDetails.displaySequence.join('')}, Correct: ${questionDetails.correctSequence.join('')}`;
          } else if (questionDetails.correctSequence && Array.isArray(questionDetails.correctSequence)) {
            return questionDetails.correctSequence.join('');
          }
          return 'Not found';

        case 'Word Recognition':
          // For Word Recognition, use displayWord and correctAnswer
          if (questionDetails.displayWord && questionDetails.correctAnswer) {
            const correctAnswerText = Array.isArray(questionDetails.correctAnswer) ?
              questionDetails.correctAnswer.join(', ') : questionDetails.correctAnswer;
            return `"${questionDetails.displayWord}" → ${correctAnswerText}`;
          } else if (questionDetails.correctAnswer) {
            return Array.isArray(questionDetails.correctAnswer) ?
              questionDetails.correctAnswer.join(', ') : questionDetails.correctAnswer;
          }
          return 'Not found';

        case 'Reading Comprehension':
          // For Reading Comprehension, don't show correct answer since it's in sentence questions
          return null; // Will not display "Correct Answer" section

        default:
          return 'Not found';
      }
    } catch (error) {
      console.error('Error extracting correct answer from main question:', error);
      return 'Error extracting answer';
    }
  };

  // Helper function to extract options from main assessment question details
  const getOptionsFromMainQuestion = (questionDetails, category) => {
    if (!questionDetails) return [];

    try {
      switch (category) {
        case 'Alphabet Knowledge':
          // For Alphabet Knowledge, use choiceOptions
          if (questionDetails.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            return questionDetails.choiceOptions.map(option => option.optionText);
          }
          break;

        case 'Phonological Awareness':
          // For Phonological Awareness, use matchingOptions from questionSet
          if (questionDetails.questionSet && Array.isArray(questionDetails.questionSet) && questionDetails.questionSet[0]?.matchingOptions) {
            return questionDetails.questionSet[0].matchingOptions;
          }
          break;

        case 'Decoding':
          // For Decoding, use dragElements
          if (questionDetails.dragElements && Array.isArray(questionDetails.dragElements)) {
            return questionDetails.dragElements;
          }
          break;

        case 'Word Recognition':
          // For Word Recognition, use blankOptions
          if (questionDetails.blankOptions && Array.isArray(questionDetails.blankOptions)) {
            return questionDetails.blankOptions;
          }
          break;

        case 'Reading Comprehension':
          // For Reading Comprehension, use sentence question options
          if (questionDetails.sentenceQuestions && Array.isArray(questionDetails.sentenceQuestions)) {
            return questionDetails.sentenceQuestions.map(sq => sq.sentenceOptionAnswers || []).flat();
          }
          break;

        default:
          // Fallback logic
          if (questionDetails.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            return questionDetails.choiceOptions.map(option => option.optionText);
          }
          if (questionDetails.dragElements && Array.isArray(questionDetails.dragElements)) {
            return questionDetails.dragElements;
          }
          if (questionDetails.blankOptions && Array.isArray(questionDetails.blankOptions)) {
            return questionDetails.blankOptions;
          }
          break;
      }

      return [];
    } catch (error) {
      console.error('Error extracting options from main question:', error);
      return [];
    }
  };

  // Helper function to group Reading Comprehension questions
  const groupReadingComprehensionQuestions = (responses) => {
    if (!responses || responses.length === 0) return [];
    
    const grouped = {};
    
    responses.forEach(response => {
      // Extract base question ID (e.g., RC_001 from RC_001_1, RC_001_2, RC_001_3)
      const baseQuestionId = response.questionId.replace(/_\d+$/, '');
      
      if (!grouped[baseQuestionId]) {
        grouped[baseQuestionId] = {
          baseQuestionId: baseQuestionId,
          responses: [],
          questionDetails: null
        };
      }
      
      grouped[baseQuestionId].responses.push(response);
    });
    
    // Sort responses within each group by question number
    Object.keys(grouped).forEach(baseId => {
      grouped[baseId].responses.sort((a, b) => {
        const aNum = parseInt(a.questionId.split('_').pop());
        const bNum = parseInt(b.questionId.split('_').pop());
        return aNum - bNum;
      });
    });
    
    return Object.values(grouped);
  };

  // Helper function to format main assessment student responses
  const formatMainAssessmentResponse = (response, questionDetails, category) => {
    if (!response) return '';

    try {
      switch (category) {
        case 'Alphabet Knowledge':
          // For Alphabet Knowledge, convert option numbers to option text
          if (questionDetails?.choiceOptions && Array.isArray(questionDetails.choiceOptions)) {
            if (Array.isArray(response)) {
              return response.map(optionId => {
                const option = questionDetails.choiceOptions.find(opt => opt.optionId === String(optionId));
                return option ? option.optionText : optionId;
              }).join(', ');
            } else {
              const option = questionDetails.choiceOptions.find(opt => opt.optionId === String(response));
              return option ? option.optionText : response;
            }
          }
          // If no choiceOptions, return raw response
          return Array.isArray(response) ? response.join(', ') : response;

        case 'Phonological Awareness':
          // For Phonological Awareness, format matching pairs
          if (Array.isArray(response)) {
            return response.map(item => {
              if (typeof item === 'object' && item !== null) {
                return Object.entries(item).map(([audio, match]) => `${audio} → ${match}`).join(', ');
              }
              return String(item);
            }).join(', ');
          }
          return String(response);

        case 'Decoding':
          // For Decoding, join sequence elements
          if (Array.isArray(response)) {
            return response.filter(item => item && item.trim() !== '').join('');
          }
          return String(response);

        case 'Word Recognition':
          // For Word Recognition, format array responses
          if (Array.isArray(response)) {
            return response.filter(item => item && item.trim() !== '').join(', ');
          }
          return String(response);

        case 'Reading Comprehension':
          // For Reading Comprehension, format sentence answers with question context
          if (Array.isArray(response) && questionDetails?.sentenceQuestions) {
            return response.map((answer, index) => {
              const question = questionDetails.sentenceQuestions[index];
              const questionText = question ? question.questionText : `Question ${index + 1}`;
              return `Q${index + 1}: ${answer}`;
            }).join('\n');
          } else if (Array.isArray(response)) {
            return response.map((answer, index) => `Q${index + 1}: ${answer}`).join('\n');
          }
          return String(response);

        default:
          // Default formatting
          if (Array.isArray(response)) {
            return response.filter(item => item && String(item).trim() !== '').join(', ');
          }
          return String(response);
      }
    } catch (error) {
      console.error('Error formatting main assessment response:', error);
      return Array.isArray(response) ? response.join(', ') : String(response);
    }
  };

  // Get final category result considering intervention history
  const getFinalCategoryResult = (categoryData) => {
    if (!categoryData) return { 
      finalScore: 0, 
      isPassed: false, 
      hasIntervention: false, 
      passedThroughIntervention: false,
      passedAttemptNumber: null,
      initialScore: 0,
      initialCorrectAnswers: 0,
      initialTotalQuestions: 0,
      bestInterventionScore: 0,
      bestInterventionAttempt: null,
      interventionHistory: [],
      totalInterventionAttempts: 0
    };
    
    const initialScore = categoryData.score || 0;
    const initialCorrectAnswers = categoryData.correctAnswers || 0;
    const initialTotalQuestions = categoryData.totalQuestions || 0;
    const initialPassed = initialScore >= 75;
    
    // Check if there are intervention attempts
    const hasIntervention = categoryData.interventionHistory && categoryData.interventionHistory.length > 0;
    
    if (!hasIntervention) {
      return { 
        finalScore: initialScore, 
        isPassed: initialPassed, 
        hasIntervention: false,
        passedThroughIntervention: false,
        passedAttemptNumber: null,
        initialScore: initialScore,
        initialCorrectAnswers: initialCorrectAnswers,
        initialTotalQuestions: initialTotalQuestions,
        bestInterventionScore: 0,
        bestInterventionAttempt: null,
        interventionHistory: [],
        totalInterventionAttempts: 0
      };
    }
    
    // Find the best intervention result and collect all attempts
    let bestInterventionScore = 0;
    let bestInterventionAttempt = null;
    let passedThroughIntervention = false;
    let passedAttemptNumber = null;
    const interventionHistory = categoryData.interventionHistory || [];
    
    interventionHistory.forEach(intervention => {
      if (intervention.score > bestInterventionScore) {
        bestInterventionScore = intervention.score;
        bestInterventionAttempt = intervention.attemptNumber;
      }
      if (intervention.isPassed && !passedThroughIntervention) {
        passedThroughIntervention = true;
        passedAttemptNumber = intervention.attemptNumber;
      }
    });
    
    // Return the best result (initial or intervention)
    const finalScore = Math.max(initialScore, bestInterventionScore);
    const isPassed = initialPassed || passedThroughIntervention;
    
    return { 
      finalScore, 
      isPassed, 
      hasIntervention: true,
      passedThroughIntervention: passedThroughIntervention,
      passedAttemptNumber: passedAttemptNumber,
      initialScore: initialScore,
      initialCorrectAnswers: initialCorrectAnswers,
      initialTotalQuestions: initialTotalQuestions,
      bestInterventionScore: bestInterventionScore,
      bestInterventionAttempt: bestInterventionAttempt,
      interventionHistory: interventionHistory,
      totalInterventionAttempts: interventionHistory.length
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Fetch question responses for a specific category (both main assessment and intervention)
  const fetchQuestionResponses = async (studentId, category) => {
    try {
      setLoadingResponses(prev => ({ ...prev, [category]: true }));
      
      const response = await axios.get(`${API_BASE_URL}/admin/student-responses/${studentId}/${category}`);

      if (response.data.success) {
        const sanitized = (response.data.data || []).map(item => {
          const { correctMatches, totalMatches, matches, ...rest } = item || {};
          return { ...rest, responseType: 'main_assessment' };
        });

        let mainAssessmentResponses = [];

        // Filter to get only the most recent assessment session
        // Group responses by date and get the most recent complete session
        if (sanitized.length > 0) {
          const responsesByDate = {};

          sanitized.forEach(response => {
            const dateKey = new Date(response.answeredAt).toDateString();
            if (!responsesByDate[dateKey]) {
              responsesByDate[dateKey] = [];
            }
            responsesByDate[dateKey].push(response);
          });

          // Get the most recent date with complete assessment
          const sortedDates = Object.keys(responsesByDate).sort((a, b) => new Date(b) - new Date(a));

          // Look for the most recent session with unique question IDs (complete assessment)
          for (const dateKey of sortedDates) {
            const dateResponses = responsesByDate[dateKey];
            const uniqueQuestionIds = [...new Set(dateResponses.map(r => r.questionId))];

            // If this date has a reasonable number of unique questions (likely a complete assessment)
            if (uniqueQuestionIds.length >= 10) { // Assuming at least 10 questions for a valid assessment
              // Get the latest responses for each unique question ID from this date
              const latestResponsesFromDate = uniqueQuestionIds.map(questionId => {
                const responsesForQuestion = dateResponses
                  .filter(r => r.questionId === questionId)
                  .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
                return responsesForQuestion[0]; // Get the most recent response for this question
              });

              // Sort by question ID for proper display order
              mainAssessmentResponses = latestResponsesFromDate.sort((a, b) => {
                const aNum = parseInt(a.questionId.split('_')[1]);
                const bNum = parseInt(b.questionId.split('_')[1]);
                return aNum - bNum;
              });
              break;
            }
          }

          // Fallback: if no complete session found, get most recent unique responses
          if (mainAssessmentResponses.length === 0) {
            const uniqueQuestionIds = [...new Set(sanitized.map(r => r.questionId))];
            mainAssessmentResponses = uniqueQuestionIds.map(questionId => {
              const responsesForQuestion = sanitized
                .filter(r => r.questionId === questionId)
                .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
              return responsesForQuestion[0];
            }).sort((a, b) => {
              const aNum = parseInt(a.questionId.split('_')[1]);
              const bNum = parseInt(b.questionId.split('_')[1]);
              return aNum - bNum;
            });
          }
        }
      }

      // Fetch main assessment questions for the category to enhance responses with question details
      let mainAssessment = null;
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        const mainAssessmentDetailsResponse = await axios.get(
          `${API_BASE_URL}/main-assessment`,
          {
            params: {
              category: category,
              readingLevel: student?.readingLevel || 'High Emerging'
            },
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 10000
          }
        );

        mainAssessment = mainAssessmentDetailsResponse.data?.data?.[0];
      } catch (error) {
        console.error(`[DEBUG] Error fetching main assessment for ${category}:`, error);
      }

      // Enhance main assessment responses with question details
      if (mainAssessment && mainAssessmentResponses.length > 0) {
        if (category === 'Reading Comprehension') {
          // Group Reading Comprehension questions
          const groupedQuestions = groupReadingComprehensionQuestions(mainAssessmentResponses);
          
          mainAssessmentResponses = groupedQuestions.map(group => {
            const questionDetails = mainAssessment?.questions?.find(q => q.questionId === group.baseQuestionId);
            
            return {
              questionId: group.baseQuestionId,
              category: category,
              isCorrect: group.responses.every(r => r.isCorrect),
              responseTime: group.responses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / group.responses.length,
              answeredAt: group.responses[0]?.answeredAt, // Use first response date
              response: group.responses.map(r => r.response).flat(), // Combine all responses
              questionDetails: questionDetails ? {
                question: questionDetails.questionText,
                questionType: questionDetails.questionType,
                questionImage: questionDetails.questionImage,
                questionValue: questionDetails.questionValue,
                correctAnswer: getCorrectAnswerFromMainQuestion(questionDetails, category),
                options: getOptionsFromMainQuestion(questionDetails, category),
                // Special handling for different question types
                questionSet: questionDetails.questionSet,
                choiceOptions: questionDetails.choiceOptions,
                dragElements: questionDetails.dragElements,
                correctSequence: questionDetails.correctSequence,
                displaySequence: questionDetails.displaySequence,
                blankOptions: questionDetails.blankOptions,
                displayWord: questionDetails.displayWord,
                // Reading Comprehension special handling
                storyTitle: questionDetails.storyTitle,
                passages: questionDetails.passages || [],
                sentenceQuestions: questionDetails.sentenceQuestions || []
              } : null,
              groupedResponses: group.responses // Keep individual responses for detailed display
            };
          });
        } else {
          // Handle other categories normally
          mainAssessmentResponses = mainAssessmentResponses.map(response => {
            const questionDetails = mainAssessment?.questions?.find(q => q.questionId === response.questionId);

            return {
              ...response,
              questionDetails: questionDetails ? {
                question: questionDetails.questionText,
                questionType: questionDetails.questionType,
                questionImage: questionDetails.questionImage,
                questionValue: questionDetails.questionValue,
                correctAnswer: getCorrectAnswerFromMainQuestion(questionDetails, category),
                options: getOptionsFromMainQuestion(questionDetails, category),
                // Special handling for different question types
                questionSet: questionDetails.questionSet,
                choiceOptions: questionDetails.choiceOptions,
                dragElements: questionDetails.dragElements,
                correctSequence: questionDetails.correctSequence,
                displaySequence: questionDetails.displaySequence,
                blankOptions: questionDetails.blankOptions,
                displayWord: questionDetails.displayWord,
                // Reading Comprehension special handling
                storyTitle: questionDetails.storyTitle,
                passages: questionDetails.passages || [],
                sentenceQuestions: questionDetails.sentenceQuestions || []
              } : null
            };
          });
        }
      }

      // Fetch intervention responses (AFTER INTERVENTION)
      let interventionResponses = [];

      // Find the category data to get intervention history
      const categoryData = student?.categoryScores?.find(cat => cat.categoryName === category);
      const finalResult = getFinalCategoryResult(categoryData);

      // Debug logging
      console.log(`[DEBUG] Category: ${category}`);
      console.log(`[DEBUG] Category data:`, categoryData);
      console.log(`[DEBUG] Final result:`, finalResult);

      if (finalResult.hasIntervention) {
        try {
          // Find the passed attempt or best attempt from interventionHistory
          const passedAttempt = categoryData.interventionHistory?.find(attempt => attempt.isPassed);
          const bestAttempt = categoryData.interventionHistory?.reduce((best, current) =>
            !best || current.score > best.score ? current : best, null);

          const targetAttempt = passedAttempt || bestAttempt;

          if (targetAttempt) {
            const targetRevisionNumber = targetAttempt.attemptNumber;
            const interventionAssessmentId = targetAttempt.interventionId.$oid || targetAttempt.interventionId;

            console.log(`Target revision number for ${category}: ${targetRevisionNumber}`);
            console.log(`Intervention Assessment ID: ${interventionAssessmentId}`);

            // Get intervention responses using the correct API endpoint with all required parameters
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user?.token;
            const interventionResponse = await axios.get(
              `${API_BASE_URL}/intervention-responses`, {
                params: {
                  studentId: studentId,
                  interventionAssessmentId: interventionAssessmentId,
                  category: category,
                  revisionNumber: targetRevisionNumber
                },
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (interventionResponse.data.success) {
              const allInterventionResponses = (interventionResponse.data.data || []).map(item => {
                const { correctMatches, totalMatches, matches, ...rest } = item || {};
                return { ...rest, responseType: 'intervention' };
              });

              // Get intervention assessment data with question details
              const interventionAssessment = interventionResponse.data.interventionAssessment;
              const interventionResult = interventionResponse.data.interventionResult;

              console.log(`[DEBUG] Intervention Assessment for ${category}:`, interventionAssessment);
              console.log(`[DEBUG] Intervention Result for ${category}:`, interventionResult);
              console.log(`[DEBUG] Intervention Assessment Questions:`, interventionAssessment?.questions);

              if (allInterventionResponses.length > 0) {
                // Group by questionId and get the most recent response for each question
                const responsesByQuestion = {};
                allInterventionResponses.forEach(response => {
                  const questionId = response.questionId;
                  if (!responsesByQuestion[questionId] ||
                      new Date(response.answeredAt) > new Date(responsesByQuestion[questionId].answeredAt)) {
                    responsesByQuestion[questionId] = {
                      ...response,
                      revisionNumber: targetRevisionNumber,
                      attemptNumber: targetRevisionNumber
                    };
                  }
                });

                // Convert to array and enhance with question details from intervention assessment
                interventionResponses = Object.values(responsesByQuestion).map(response => {
                  // Find matching question from intervention assessment
                  const questionDetails = interventionAssessment?.questions?.find(q => q.questionId === response.questionId);

                  console.log(`[DEBUG] Matching question for ${response.questionId}:`, questionDetails);
                  console.log(`[DEBUG] Available question IDs in intervention:`, interventionAssessment?.questions?.map(q => q.questionId));

                  let enhancedResponse = {
                    ...response,
                    questionDetails: questionDetails ? {
                      question: questionDetails.questionText,
                      questionType: questionDetails.questionType,
                      image: questionDetails.questionImage,
                      questionValue: questionDetails.questionValue,
                      // Handle different question types
                      correctAnswer: getCorrectAnswerFromQuestion(questionDetails, category),
                      options: getOptionsFromQuestion(questionDetails, category),
                      // Include choiceOptions for formatting responses
                      choiceOptions: questionDetails.choiceOptions,
                      // Reading Comprehension special handling
                      passages: questionDetails.passages || [],
                      sentenceQuestions: questionDetails.sentenceQuestions || []
                    } : null,
                    // Include intervention assessment metadata
                    interventionRevision: interventionAssessment?.revisionNumber || targetRevisionNumber,
                    interventionLastEdited: interventionAssessment?.lastEditedAt,
                    interventionScore: interventionResult?.score,
                    interventionPassed: interventionResult?.isPassed
                  };

                  console.log(`[DEBUG] Enhanced response:`, enhancedResponse);
                  return enhancedResponse;
                }).sort((a, b) => {
                  // Handle different question ID formats
                  const aMatch = a.questionId.match(/(\d+)$/);
                  const bMatch = b.questionId.match(/(\d+)$/);
                  const aNum = aMatch ? parseInt(aMatch[1]) : 0;
                  const bNum = bMatch ? parseInt(bMatch[1]) : 0;
                  return aNum - bNum;
                });

                console.log(`[DEBUG] Found ${interventionResponses.length} enhanced intervention responses for ${category} revision ${targetRevisionNumber}`);
              }
            }
          }
        } catch (interventionError) {
          console.error(`Error fetching intervention responses for ${category}:`, interventionError);
        }
      }

      // Combine both response types
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

    } catch (error) {
      console.error(`Error fetching responses for ${category}:`, error);
      setQuestionResponses(prev => ({
        ...prev,
        [category]: {
          mainAssessment: [],
          intervention: [],
          hasIntervention: false,
          passedAttemptNumber: null,
          bestInterventionAttempt: null
        }
      }));
    } finally {
      setLoadingResponses(prev => ({ ...prev, [category]: false }));
    }
  };

  // Open category modal
  const openCategoryModal = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
    fetchQuestionResponses(student?.idNumber, category.categoryName);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="student-assessment__container">
        <div className="student-assessment__loading">
          <div className="student-assessment__loading-spinner"></div>
          <p>Loading student assessment results...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-assessment__container">
        <div className="student-assessment__error">
          <AlertTriangle size={48} />
          <h3>Student Not Found</h3>
          <p>The student assessment results could not be found.</p>
          <Link to="/admin/assessment-results-overview" className="student-assessment__back-btn">
            <ArrowLeft size={18} />
            Back to Assessment Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="student-assessment__container">
      {/* Header */}
      <div className="student-assessment__header">
        <Link to="/admin/assessment-results-overview" className="student-assessment__back-btn">
          <ArrowLeft size={18} />
          Back to Post Assessment Results
        </Link>
        
      </div>

      {/* Profile Card */}
      <div className="student-assessment__profile-card">
        <div className="student-assessment__profile-header">
          <div className="student-assessment__profile-avatar">
            {student.profileImageUrl ? (
              <img 
                src={student.profileImageUrl} 
                alt={`${student.firstName} ${student.lastName}`} 
                className="student-assessment__avatar-img"
              />
            ) : (
              <div className="student-assessment__avatar-placeholder">
                {student.firstName.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="student-assessment__profile-info">
            <h1>{student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}</h1>
            
            <div className="student-assessment__profile-details">
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">ID Number</span>
                <span className="student-assessment__detail-value">{student.idNumber}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Grade</span>
                <span className="student-assessment__detail-value">{student.gradeLevel}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Section</span>
                <span className="student-assessment__detail-value">{student.section}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Teacher</span>
                <span className="student-assessment__detail-value">{student.teacherName}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Assessment Date</span>
                <span className="student-assessment__detail-value">{formatDate(student.completedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="student-assessment__level-badge-container">
            <div className={`student-assessment__level-badge student-assessment__level--${student.readingLevel.toLowerCase().replace(' ', '-')}`}>
              {student.readingLevel}
            </div>
            <span className="student-assessment__score-badge">Overall Score: {student.readingPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="student-assessment__summary-section">
        <h2 className="student-assessment__section-title">
          <BarChart2 size={20} />
          Post Assessment Summary
        </h2>
        
        <div className="student-assessment__summary-grid">
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Award size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Reading Level</h3>
              <p className="student-assessment__summary-value">{student.readingLevel}</p>
              <p className="student-assessment__summary-detail">
                Based on DepEd CRLA post-assessment standards
              </p>
            </div>
          </div>
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Layers size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Categories Passed</h3>
              <p className="student-assessment__summary-value">
                {Array.isArray(student.categoryScores) 
                  ? student.categoryScores.filter(category => {
                      const finalResult = getFinalCategoryResult(category);
                      return finalResult.isPassed;
                    }).length 
                  : 0} / {Array.isArray(student.categoryScores) ? student.categoryScores.length : 0}
              </p>
              <p className="student-assessment__summary-detail">
                Some categories need improvement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="student-assessment__categories-section">
        <h2 className="student-assessment__section-title">
          <Layers size={20} />
          Category Performance
        </h2>
        
        <div className="student-assessment__categories-grid">
          {Array.isArray(student.categoryScores)
            ? student.categoryScores.map((cat, idx) => {
                const finalResult = getFinalCategoryResult(cat);
                return (
                <div key={cat.categoryName || idx} className="student-assessment__category-card" onClick={() => openCategoryModal(cat)}>
                  <div className="student-assessment__category-header">
                    <h3>{cat.categoryName || `Category ${idx + 1}`}</h3>
                    <button 
                      className="student-assessment__toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCategoryModal(cat);
                      }}
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <div className="student-assessment__category-score">
                      <div className={`student-assessment__score-circle student-assessment__score--${finalResult.isPassed ? 'passed' : finalResult.finalScore >= 50 ? 'partial' : 'failed'}`}>
                        {finalResult.finalScore}%
                        {finalResult.hasIntervention && (
                          <span 
                            className="student-assessment__intervention-indicator"
                            title={finalResult.isPassed ? "Passed through intervention" : "Intervention attempted"}
                          >
                            {finalResult.isPassed ? "✓" : "⏳"}
                          </span>
                        )}
                    </div>
                    <div className="student-assessment__score-details">
                        {finalResult.hasIntervention ? (
                          <>
                      <p className="student-assessment__correct-count">
                              <strong>Before Intervention:</strong> {finalResult.initialCorrectAnswers} out of {finalResult.initialTotalQuestions} correct ({finalResult.initialScore}%)
                            </p>
                            <p className="student-assessment__correct-count">
                              <strong>After Intervention:</strong> {finalResult.bestInterventionScore}% (Attempt {finalResult.bestInterventionAttempt})
                            </p>
                          </>
                        ) : (
                          <p className="student-assessment__correct-count">
                            {finalResult.initialCorrectAnswers} out of {finalResult.initialTotalQuestions} correct
                          </p>
                        )}
                        
                        {finalResult.hasIntervention && finalResult.passedThroughIntervention && (
                          <p className="student-assessment__intervention-info">
                            ✓ Passed through intervention (Attempt {finalResult.passedAttemptNumber})
                          </p>
                        )}
                        {finalResult.hasIntervention && !finalResult.passedThroughIntervention && (
                          <p className="student-assessment__intervention-info">
                            ⏳ Intervention attempted (Not passed)
                          </p>
                        )}
                        {finalResult.isPassed && !finalResult.passedThroughIntervention && (
                          <p className="student-assessment__intervention-info">
                            ✓ Passed initially
                          </p>
                        )}
                        <span className={`student-assessment__status-badge ${finalResult.isPassed ? 'passed' : 'failed'}`}>
                          {finalResult.isPassed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {finalResult.isPassed ? 'Passed' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  <div className="student-assessment__progress-bar">
                    <div 
                      className="student-assessment__progress-fill" 
                        style={{ width: `${finalResult.finalScore}%` }}
                    ></div>
                  </div>
                </div>
                );
              })
            : null}
        </div>
      </div>

      {/* Category Details Modal */}
      {modalOpen && selectedCategory && (
        <div className="student-assessment__modal-overlay" onClick={closeModal}>
          <div className="student-assessment__modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="student-assessment__modal-header">
              <h2>{selectedCategory.categoryName}</h2>
              <button className="student-assessment__modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="student-assessment__modal-body">
              {/* Question Results Section */}
              <div className="student-assessment__questions-overview">
                <h4>Question Results</h4>
                {loadingResponses[selectedCategory.categoryName] ? (
                  <div className="student-assessment__loading">
                    <p>Loading question responses...</p>
                  </div>
                ) : (
                  <div className="student-assessment__questions-sections">
                    {/* Main Assessment Results (BEFORE INTERVENTION) */}
                    <div className="student-assessment__main-assessment-section">
                        <h5 className="student-assessment__response-section-title">
                          Main Assessment Results (BEFORE INTERVENTION)
                        </h5>
                  <div className="student-assessment__questions-list">
                        {questionResponses[selectedCategory.categoryName]?.mainAssessment &&
                         questionResponses[selectedCategory.categoryName].mainAssessment.length > 0 ? (
                          questionResponses[selectedCategory.categoryName].mainAssessment.map((response, index) => (
                        <div 
                              key={`main_${selectedCategory.categoryName}_${response.questionId}_${index}`}
                          className={`student-assessment__question-item ${response.isCorrect ? 'correct' : 'incorrect'}`}
                        >
                          <div className="student-assessment__question-header">
                            <div className="student-assessment__question-header-left">
                            <span className="student-assessment__question-number">Q{index + 1}</span>
                            <span className="student-assessment__question-id">{response.questionId}</span>
                            </div>
                            <div className="student-assessment__question-header-right">
                              <div className={`student-assessment__intervention-status-badge ${response.isCorrect ? 'passed' : 'failed'}`}>
                              {response.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              {response.isCorrect ? 'Correct' : 'Incorrect'}
                              </div>
                            </div>
                          </div>
                          
                          {response.questionDetails && selectedCategory?.categoryName !== 'Reading Comprehension' && (
                            <div className="student-assessment__question-content">
                              <div className="student-assessment__question-text">
                                    <strong>Main Assessment Question:</strong> {response.questionDetails.question || 'Question text not available'}
                              </div>



                                  {response.questionDetails.questionImage && (
                                    <div className="student-assessment__question-image">
                                      <img
                                        src={response.questionDetails.questionImage}
                                        alt="Question illustration"
                                        style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem' }}
                                      />
                                    </div>
                                  )}

                                  {response.questionDetails.questionValue && (
                                    <div className="student-assessment__question-value">
                                      <strong>Question Value:</strong> {response.questionDetails.questionValue}
                                    </div>
                                  )}

                                  {/* Show correct answer for non-Phonological Awareness and non-Reading Comprehension */}
                                  {selectedCategory?.categoryName !== 'Phonological Awareness' && response.questionDetails.correctAnswer !== null && (
                                    <div className="student-assessment__correct-answer">
                                      <strong>Correct Answer:</strong> {response.questionDetails.correctAnswer || 'Correct answer not available'}
                                    </div>
                                  )}

                                  {/* Special handling for Phonological Awareness correct pairs */}
                                  {selectedCategory?.categoryName === 'Phonological Awareness' && response.questionDetails.correctAnswer && (
                                    <div className="student-assessment__pa-correct-pairs">
                                      <strong>Correct Audio-Letter Pairs:</strong>
                                      <div className="student-assessment__correct-pairs-list">
                                        {response.questionDetails.correctAnswer}
                                      </div>
                                    </div>
                                  )}

                                  {/* Show options/choices */}
                                  {response.questionDetails.options && response.questionDetails.options.length > 0 && (
                                    <div className="student-assessment__intervention-options">
                                      <strong>Answer Options:</strong>
                                      <div className="student-assessment__options-list">
                                        {response.questionDetails.options.map((option, optionIndex) => {
                                          const optionText = typeof option === 'object' && option.optionText ? option.optionText : String(option);
                                          return (
                                            <span key={optionIndex} className="student-assessment__option">
                                              {optionText}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Special handling for Reading Comprehension */}
                                  {selectedCategory?.categoryName === 'Reading Comprehension' && response.questionDetails && (
                                    <>
                                      {/* Story Title */}
                                      {response.questionDetails.storyTitle && (
                                        <div className="student-assessment__story-title">
                                          <strong>Story:</strong> {response.questionDetails.storyTitle}
                                        </div>
                                      )}

                                      {/* Reading Passages */}
                                      {response.questionDetails.passages && response.questionDetails.passages.length > 0 && (
                                        <div className="student-assessment__rc-passages">
                                          <strong>Reading Passage:</strong>
                                          {response.questionDetails.passages.map((passage, passageIndex) => {
                                            const passageText = passage.pageText || passage.text || passage;
                                            const cleanText = typeof passageText === 'string' ? passageText.trim() : '';
                                            
                                            return (
                                              <div key={passageIndex} className="student-assessment__passage">
                                                {cleanText && (
                                                  <p className="student-assessment__passage-text">{cleanText}</p>
                                                )}
                                                {passage.pageImage && (
                                                  <img
                                                    src={passage.pageImage}
                                                    alt="Passage illustration"
                                                    style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem' }}
                                                  />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Sentence Questions */}
                                      {response.questionDetails.sentenceQuestions && response.questionDetails.sentenceQuestions.length > 0 && (
                                        <div className="student-assessment__rc-sentence-questions">
                                          <strong>Questions ({response.questionDetails.sentenceQuestions.length} questions):</strong>
                                          {response.questionDetails.sentenceQuestions.map((sq, sqIndex) => {
                                            const questionText = typeof sq.questionText === 'string' ? sq.questionText.trim() : '';
                                            const correctAnswer = typeof sq.correctAnswer === 'string' ? sq.correctAnswer.trim() : '';
                                            
                                            return (
                                              <div key={sqIndex} className="student-assessment__sentence-question">
                                                <div className="student-assessment__sq-number">Q{sqIndex + 1}:</div>
                                                {questionText && (
                                                  <div className="student-assessment__sq-text">{questionText}</div>
                                                )}
                                                {correctAnswer && (
                                                  <div className="student-assessment__sq-correct">Correct Answer: {correctAnswer}</div>
                                                )}
                                                {sq.acceptableAnswers && sq.acceptableAnswers.length > 0 && (
                                                  <div className="student-assessment__sq-options">
                                                    Acceptable Answers: {sq.acceptableAnswers.join(', ')}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Question metadata */}
                                  <div className="student-assessment__question-metadata">
                                    {/* Question type removed for all categories */}
                                  </div>
                                </div>
                              )}

                              <div className="student-assessment__response-details">
                                <div className="student-assessment__student-answer">
                                  <strong>Student's Answer:</strong>
                                  <span className="student-assessment__formatted-response">
                                    {formatMainAssessmentResponse(response.response, response.questionDetails, selectedCategory?.categoryName)}
                                  </span>
                                </div>
                                {response.responseTime && (
                                  <div className="student-assessment__response-time">
                                    <strong>Response Time:</strong> {response.responseTime}ms
                                  </div>
                                )}
                                {(response.answeredAt) && (
                                  <div className="student-assessment__response-date">
                                    <strong>Answered:</strong> {formatDate(response.answeredAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="student-assessment__no-responses">
                            <p>No main assessment responses found for this category.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Intervention Results (AFTER INTERVENTION) */}
                    {questionResponses[selectedCategory.categoryName]?.hasIntervention && (
                      <div className="student-assessment__intervention-section">
                          <h5 className="student-assessment__response-section-title">
                            Intervention Results (AFTER INTERVENTION)
                          {questionResponses[selectedCategory.categoryName]?.intervention?.[0]?.interventionRevision && (
                            <span className="student-assessment__revision-info">
                              - Revision {questionResponses[selectedCategory.categoryName].intervention[0].interventionRevision}
                              {questionResponses[selectedCategory.categoryName].intervention[0].interventionPassed ? " (Passed)" : " (Failed)"}
                              {questionResponses[selectedCategory.categoryName].intervention[0].interventionScore &&
                                ` - Score: ${questionResponses[selectedCategory.categoryName].intervention[0].interventionScore}%`}
                            </span>
                          )}
                          {!questionResponses[selectedCategory.categoryName]?.intervention?.[0]?.interventionRevision &&
                           questionResponses[selectedCategory.categoryName]?.passedAttemptNumber && (
                            <span className="student-assessment__revision-info">
                              - Revision {questionResponses[selectedCategory.categoryName].passedAttemptNumber} (Passed)
                            </span>
                          )}
                          {!questionResponses[selectedCategory.categoryName]?.intervention?.[0]?.interventionRevision &&
                           !questionResponses[selectedCategory.categoryName]?.passedAttemptNumber &&
                           questionResponses[selectedCategory.categoryName]?.bestInterventionAttempt && (
                            <span className="student-assessment__revision-info">
                              - Revision {questionResponses[selectedCategory.categoryName].bestInterventionAttempt} (Best Attempt)
                            </span>
                          )}
                        </h5>
                        <div className="student-assessment__questions-list">
                          {questionResponses[selectedCategory.categoryName]?.intervention &&
                           questionResponses[selectedCategory.categoryName].intervention.length > 0 ? (
                            questionResponses[selectedCategory.categoryName].intervention.map((response, index) => (
                              <div
                                key={`intervention_${selectedCategory.categoryName}_${response.questionId}_${index}`}
                                className={`student-assessment__question-item ${response.isCorrect ? 'correct' : 'incorrect'} intervention-response`}
                              >
                                <div className="student-assessment__question-header">
                                  <div className="student-assessment__question-header-left">
                                    <span className="student-assessment__question-number">Q{index + 1}</span>
                                    <span className="student-assessment__question-id">{response.questionId}</span>
                                  </div>
                                  <div className="student-assessment__question-header-right">
                                    <div className={`student-assessment__intervention-status-badge ${response.isCorrect ? 'passed' : 'failed'}`}>
                                      {response.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                      {response.isCorrect ? 'Correct' : 'Incorrect'}
                                    </div>
                                    <span className="student-assessment__intervention-revision-badge">
                                      Rev. {response.revisionNumber}
                                    </span>
                                  </div>
                                </div>

                                {response.questionDetails && selectedCategory?.categoryName !== 'Reading Comprehension' && (
                                  <div className="student-assessment__question-content">
                                    <div className="student-assessment__question-text">
                                      <strong>Intervention Question:</strong> {response.questionDetails.question || 'Question text not available'}
                                    </div>

                              {response.questionDetails.image && (
                                <div className="student-assessment__question-image">
                                  <img 
                                    src={response.questionDetails.image} 
                                    alt="Question illustration"
                                    style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem' }}
                                  />
                                </div>
                              )}

                                    {response.questionDetails.questionValue && (
                                      <div className="student-assessment__question-value">
                                        <strong>Question Value:</strong> {response.questionDetails.questionValue}
                                      </div>
                                    )}

                                    {/* Show correct answer for non-Phonological Awareness and non-Reading Comprehension */}
                                    {selectedCategory?.categoryName !== 'Phonological Awareness' && response.questionDetails.correctAnswer !== null && (
                                <div className="student-assessment__correct-answer">
                                  <strong>Correct Answer:</strong> {response.questionDetails.correctAnswer || 'Correct answer not available'}
                                </div>
                              )}

                                    {/* Special handling for Phonological Awareness correct pairs */}
                                    {selectedCategory?.categoryName === 'Phonological Awareness' && response.questionDetails.correctAnswer && (
                                      <div className="student-assessment__pa-correct-pairs">
                                        <strong>Correct Audio-Letter Pairs:</strong>
                                        <div className="student-assessment__correct-pairs-list">
                                          {response.questionDetails.correctAnswer}
                                        </div>
                                      </div>
                                    )}

                                    {/* Show options/choices */}
                                    {response.questionDetails.options && response.questionDetails.options.length > 0 && (
                                      <div className="student-assessment__intervention-options">
                                        <strong>Answer Options:</strong>
                                        <div className="student-assessment__options-list">
                                          {response.questionDetails.options.map((option, optionIndex) => {
                                      const optionText = typeof option === 'object' && option.optionText ? option.optionText : String(option);
                                      return (
                                              <span key={optionIndex} className="student-assessment__option">
                                          {optionText}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Special handling for Reading Comprehension in intervention results */}
                              {selectedCategory?.categoryName === 'Reading Comprehension' && response.questionDetails && (
                                <>
                                  {/* Story Title */}
                                  {response.questionDetails.storyTitle && (
                                    <div className="student-assessment__story-title">
                                      <strong>Story:</strong> {response.questionDetails.storyTitle}
                                    </div>
                                  )}

                                  {/* Reading Passages */}
                                  {response.questionDetails.passages && response.questionDetails.passages.length > 0 && (
                                    <div className="student-assessment__rc-passages">
                                      <strong>Reading Passage:</strong>
                                      {response.questionDetails.passages.map((passage, passageIndex) => {
                                        const passageText = passage.pageText || passage.text || passage;
                                        const cleanText = typeof passageText === 'string' ? passageText.trim() : '';
                                        
                                        return (
                                          <div key={passageIndex} className="student-assessment__passage">
                                            {cleanText && (
                                              <p className="student-assessment__passage-text">{cleanText}</p>
                                            )}
                                            {passage.pageImage && (
                                              <img
                                                src={passage.pageImage}
                                                alt="Passage illustration"
                                                style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem' }}
                                              />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Sentence Questions */}
                                  {response.questionDetails.sentenceQuestions && response.questionDetails.sentenceQuestions.length > 0 && (
                                    <div className="student-assessment__rc-sentence-questions">
                                      <strong>Questions ({response.questionDetails.sentenceQuestions.length} questions):</strong>
                                      {response.questionDetails.sentenceQuestions.map((sq, sqIndex) => {
                                        const questionText = typeof sq.questionText === 'string' ? sq.questionText.trim() : '';
                                        const correctAnswer = typeof sq.correctAnswer === 'string' ? sq.correctAnswer.trim() : '';
                                        
                                        return (
                                          <div key={sqIndex} className="student-assessment__sentence-question">
                                            <div className="student-assessment__sq-number">Q{sqIndex + 1}:</div>
                                            {questionText && (
                                              <div className="student-assessment__sq-text">{questionText}</div>
                                            )}
                                            {correctAnswer && (
                                              <div className="student-assessment__sq-correct">Correct Answer: {correctAnswer}</div>
                                            )}
                                            {sq.acceptableAnswers && sq.acceptableAnswers.length > 0 && (
                                              <div className="student-assessment__sq-options">
                                                Acceptable Answers: {sq.acceptableAnswers.join(', ')}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}

                                    {/* Question metadata */}
                                    <div className="student-assessment__question-metadata">
                                      {/* Question type removed for all categories */}
                                      {response.interventionRevision && (
                                        <div className="student-assessment__intervention-revision">
                                          <strong>Intervention Revision:</strong> {response.interventionRevision}
                                        </div>
                                      )}
                                      {response.interventionLastEdited && (
                                        <div className="student-assessment__intervention-edited">
                                          <strong>Last Edited:</strong> {formatDate(response.interventionLastEdited)}
                                        </div>
                                      )}
                                    </div>
                            </div>
                          )}
                          
                          <div className="student-assessment__response-details">
                            <div className="student-assessment__student-answer">
                              <strong>Student's Answer:</strong>
                                    {formatInterventionResponse(response.response, response.questionDetails, selectedCategory?.categoryName) || 'No response recorded'}
                            </div>
                            {response.responseTime && (
                              <div className="student-assessment__response-time">
                                <strong>Response Time:</strong> {response.responseTime}ms
                              </div>
                            )}
                            {(response.answeredAt) && (
                              <div className="student-assessment__response-date">
                                <strong>Answered:</strong> {formatDate(response.answeredAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                            <div className="student-assessment__no-responses">
                              <p>No intervention responses found for this revision.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* No Data Message */}
                    {!questionResponses[selectedCategory.categoryName]?.mainAssessment?.length &&
                     !questionResponses[selectedCategory.categoryName]?.intervention?.length && (
                      <div className="student-assessment__no-responses">
                        <p>No question responses found for this category.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Intervention History Section */}
              {selectedCategory.interventionAttempts > 0 && (
                <div className="student-assessment__intervention-history">
                  <h4>Intervention History</h4>
                  <div className="student-assessment__intervention-summary">
                    <p><strong>Total Attempts:</strong> {selectedCategory.interventionAttempts}</p>
                    <p><strong>Status:</strong> {selectedCategory.interventionCompleted ? 'Completed' : 'In Progress'}</p>
                  </div>
                  
                  {selectedCategory.interventionHistory && selectedCategory.interventionHistory.length > 0 && (
                    <div className="student-assessment__intervention-attempts">
                      {selectedCategory.interventionHistory.map((attempt, index) => (
                        <div key={attempt._id || index} className={`student-assessment__intervention-attempt ${attempt.isPassed ? 'passed' : 'failed'}`}>
                          <div className="student-assessment__attempt-header">
                            <span className="student-assessment__attempt-number">Attempt {attempt.attemptNumber}</span>
                            <div className={`student-assessment__attempt-status ${attempt.isPassed ? 'passed' : 'failed'}`}>
                              {attempt.isPassed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              {attempt.isPassed ? 'Passed' : 'Failed'}
                            </div>
                          </div>
                          <div className="student-assessment__attempt-details">
                            <div className="student-assessment__attempt-score">
                              <strong>Score:</strong> {attempt.score}%
                            </div>
                            <div className="student-assessment__attempt-dates">
                              <div><strong>Started:</strong> {formatDate(attempt.attemptedAt)}</div>
                              <div><strong>Completed:</strong> {formatDate(attempt.completedAt)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssessmentResults;