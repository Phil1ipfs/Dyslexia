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
        const studentResponse = await axios.get(`http://localhost:5001/api/admin/manage/students/idNumber/${id}`);
        
        if (!studentResponse.data.success) {
          throw new Error('Failed to fetch student data');
        }

        const studentData = studentResponse.data.data;

        // Fetch assessment results for the student
        const assessmentResponse = await axios.get(`http://localhost:5001/api/admin/assessment-results/${id}`);
        
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

      // Fetch main assessment responses (BEFORE INTERVENTION)
      const mainResponse = await axios.get(`http://localhost:5001/api/admin/student-responses/${studentId}/${category}`);

      let mainAssessmentResponses = [];
      if (mainResponse.data.success) {
        const allResponses = (mainResponse.data.data || []).map(item => {
          const { correctMatches, totalMatches, matches, ...rest } = item || {};
          return { ...rest, responseType: 'main_assessment' };
        });

        // Filter to get only the most recent assessment session
        // Group responses by date and get the most recent complete session
        if (allResponses.length > 0) {
          const responsesByDate = {};

          allResponses.forEach(response => {
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
            const uniqueQuestionIds = [...new Set(allResponses.map(r => r.questionId))];
            mainAssessmentResponses = uniqueQuestionIds.map(questionId => {
              const responsesForQuestion = allResponses
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
          // Determine target revision number
          let targetRevisionNumber = null;
          if (finalResult.passedAttemptNumber) {
            targetRevisionNumber = finalResult.passedAttemptNumber;
          } else if (finalResult.bestInterventionAttempt) {
            targetRevisionNumber = finalResult.bestInterventionAttempt;
          }

          if (targetRevisionNumber) {
            // Get intervention responses using the correct API endpoint with query parameters
            const interventionResponse = await axios.get(
              `http://localhost:5001/api/intervention-responses`, {
                params: {
                  studentId: studentId,
                  category: category,
                  revisionNumber: targetRevisionNumber
                }
              }
            );

            if (interventionResponse.data.success) {
              const allInterventionResponses = (interventionResponse.data.data || []).map(item => {
                const { correctMatches, totalMatches, matches, ...rest } = item || {};
                return { ...rest, responseType: 'intervention' };
              });

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

                // Convert to array and sort by question ID
                interventionResponses = Object.values(responsesByQuestion).sort((a, b) => {
                  // Handle different question ID formats
                  const aMatch = a.questionId.match(/(\d+)$/);
                  const bMatch = b.questionId.match(/(\d+)$/);
                  const aNum = aMatch ? parseInt(aMatch[1]) : 0;
                  const bNum = bMatch ? parseInt(bMatch[1]) : 0;
                  return aNum - bNum;
                });

                console.log(`[DEBUG] Found ${interventionResponses.length} intervention responses for ${category} revision ${targetRevisionNumber}`);
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
                        📝 Main Assessment Results (BEFORE INTERVENTION)
                      </h5>
                      <div className="student-assessment__questions-list">
                        {questionResponses[selectedCategory.categoryName]?.mainAssessment &&
                         questionResponses[selectedCategory.categoryName].mainAssessment.length > 0 ? (
                          questionResponses[selectedCategory.categoryName].mainAssessment.map((response, index) => (
                            <div
                              key={`main_${response._id || index}`}
                              className={`student-assessment__question-item ${response.isCorrect ? 'correct' : 'incorrect'}`}
                            >
                              <div className="student-assessment__question-header">
                                <span className="student-assessment__question-number">Q{index + 1}</span>
                                <span className="student-assessment__question-id">{response.questionId}</span>
                                <div className={`student-assessment__question-status ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                                  {response.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                  {response.isCorrect ? 'Correct' : 'Incorrect'}
                                </div>
                              </div>

                              {response.questionDetails && (
                                <div className="student-assessment__question-content">
                                  <div className="student-assessment__question-text">
                                    <strong>Question:</strong> {response.questionDetails.question || 'Question text not available'}
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
                                  {selectedCategory?.categoryName !== 'Phonological Awareness' && (
                                    <div className="student-assessment__correct-answer">
                                      <strong>Correct Answer:</strong> {response.questionDetails.correctAnswer || 'Correct answer not available'}
                                    </div>
                                  )}
                                  {response.questionDetails.questionType === 'fill_blank' && response.questionDetails.options && response.questionDetails.options.length > 0 && (
                                    <div className="student-assessment__blank-options">
                                      <strong>Blank Options:</strong>
                                      <div className="student-assessment__blank-options-list">
                                        {response.questionDetails.options.map((option, optionIndex) => {
                                          const optionText = typeof option === 'object' && option.optionText ? option.optionText : String(option);
                                          return (
                                            <span key={optionIndex} className="student-assessment__blank-option">
                                              {optionText}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="student-assessment__response-details">
                                <div className="student-assessment__student-answer">
                                  <strong>Student's Answer:</strong>
                                  {(() => {
                                    const value = response.response;
                                    const toDisplay = () => {
                                      if (Array.isArray(value)) {
                                        const joined = value
                                          .map((item) => {
                                            if (typeof item === 'object' && item !== null) {
                                              return JSON.stringify(item);
                                            }
                                            if (item === 0 || (typeof item === 'string' && item.trim() === '0')) return '';
                                            return String(item);
                                          })
                                          .filter(part => part && part.trim() !== '')
                                          .join(', ');
                                        return joined;
                                      } else if (typeof value === 'object' && value !== null) {
                                        return JSON.stringify(value);
                                      } else {
                                        if (value === 0 || (typeof value === 'string' && value.trim() === '0')) return '';
                                        return value ?? '';
                                      }
                                    };
                                    const text = toDisplay();
                                    return text && text.trim() !== '' ? text : null;
                                  })()}
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
                          🎯 Intervention Results (AFTER INTERVENTION)
                          {questionResponses[selectedCategory.categoryName]?.passedAttemptNumber && (
                            <span className="student-assessment__revision-info">
                              - Revision {questionResponses[selectedCategory.categoryName].passedAttemptNumber} (Passed)
                            </span>
                          )}
                          {!questionResponses[selectedCategory.categoryName]?.passedAttemptNumber &&
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
                                key={`intervention_${response._id || index}`}
                                className={`student-assessment__question-item ${response.isCorrect ? 'correct' : 'incorrect'} intervention-response`}
                              >
                                <div className="student-assessment__question-header">
                                  <span className="student-assessment__question-number">Q{index + 1}</span>
                                  <span className="student-assessment__question-id">{response.questionId}</span>
                                  <div className={`student-assessment__question-status ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                                    {response.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    {response.isCorrect ? 'Correct' : 'Incorrect'}
                                  </div>
                                  <span className="student-assessment__revision-badge">
                                    Rev. {response.revisionNumber}
                                  </span>
                                </div>

                                {response.questionDetails && (
                                  <div className="student-assessment__question-content">
                                    <div className="student-assessment__question-text">
                                      <strong>Question:</strong> {response.questionDetails.question || 'Question text not available'}
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
                                    {selectedCategory?.categoryName !== 'Phonological Awareness' && (
                                      <div className="student-assessment__correct-answer">
                                        <strong>Correct Answer:</strong> {response.questionDetails.correctAnswer || 'Correct answer not available'}
                                      </div>
                                    )}
                                    {response.questionDetails.questionType === 'fill_blank' && response.questionDetails.options && response.questionDetails.options.length > 0 && (
                                      <div className="student-assessment__blank-options">
                                        <strong>Blank Options:</strong>
                                        <div className="student-assessment__blank-options-list">
                                          {response.questionDetails.options.map((option, optionIndex) => {
                                            const optionText = typeof option === 'object' && option.optionText ? option.optionText : String(option);
                                            return (
                                              <span key={optionIndex} className="student-assessment__blank-option">
                                                {optionText}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="student-assessment__response-details">
                                  <div className="student-assessment__student-answer">
                                    <strong>Student's Answer:</strong>
                                    {(() => {
                                      const value = response.response;
                                      const toDisplay = () => {
                                        if (Array.isArray(value)) {
                                          const joined = value
                                            .map((item) => {
                                              if (typeof item === 'object' && item !== null) {
                                                return JSON.stringify(item);
                                              }
                                              if (item === 0 || (typeof item === 'string' && item.trim() === '0')) return '';
                                              return String(item);
                                            })
                                            .filter(part => part && part.trim() !== '')
                                            .join(', ');
                                          return joined;
                                        } else if (typeof value === 'object' && value !== null) {
                                          return JSON.stringify(value);
                                        } else {
                                          if (value === 0 || (typeof value === 'string' && value.trim() === '0')) return '';
                                          return value ?? '';
                                        }
                                      };
                                      const text = toDisplay();
                                      return text && text.trim() !== '' ? text : null;
                                    })()}
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