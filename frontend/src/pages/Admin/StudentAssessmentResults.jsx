// src/pages/Admin/StudentAssessmentResults.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, BarChart2, 
  Book, Award, Layers, CheckCircle, XCircle, AlertTriangle, 
  ChevronDown, ChevronUp, Download, Printer, Share2, Edit, X
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

  // Fetch question responses for a specific category
  const fetchQuestionResponses = async (studentId, category) => {
    try {
      setLoadingResponses(prev => ({ ...prev, [category]: true }));
      
      const response = await axios.get(`${API_BASE_URL}/admin/student-responses/${studentId}/${category}`);
      
      if (response.data.success) {
        const sanitized = (response.data.data || []).map(item => {
          const { correctMatches, totalMatches, matches, ...rest } = item || {};
          return rest;
        });
        setQuestionResponses(prev => ({
          ...prev,
          [category]: sanitized
        }));
      }
    } catch (error) {
      console.error(`Error fetching responses for ${category}:`, error);
      setQuestionResponses(prev => ({
        ...prev,
        [category]: []
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
        
        <div className="student-assessment__actions">
          <button className="student-assessment__action-btn">
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button className="student-assessment__action-btn">
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button className="student-assessment__action-btn">
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
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
                {Object.values(student.categoryScores).filter(category => category.score >= 75).length} / 5
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
            ? student.categoryScores.map((cat, idx) => (
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
                    <div className={`student-assessment__score-circle student-assessment__score--${cat.score >= 75 ? 'passed' : cat.score >= 50 ? 'partial' : 'failed'}`}>
                      {cat.score}%
                    </div>
                    <div className="student-assessment__score-details">
                      <p className="student-assessment__correct-count">
                        {cat.correctAnswers} out of {cat.totalQuestions} correct
                      </p>
                      <span className={`student-assessment__status-badge ${cat.score >= 75 ? 'passed' : 'failed'}`}>
                        {cat.score >= 75 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {cat.score >= 75 ? 'Passed' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  <div className="student-assessment__progress-bar">
                    <div 
                      className="student-assessment__progress-fill" 
                      style={{ width: `${cat.score}%` }}
                    ></div>
                  </div>
                </div>
              ))
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
                  <div className="student-assessment__questions-list">
                    {questionResponses[selectedCategory.categoryName] && questionResponses[selectedCategory.categoryName].length > 0 ? (
                      questionResponses[selectedCategory.categoryName].map((response, index) => (
                        <div 
                          key={response._id || index} 
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
                                    {response.questionDetails.options.map((option, index) => {
                                      const optionText = typeof option === 'object' && option.optionText ? option.optionText : String(option);
                                      return (
                                        <span key={index} className="student-assessment__blank-option">
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