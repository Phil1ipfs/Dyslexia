import React, { useState, useEffect } from 'react';
import { 
  FaInfoCircle, FaChartBar, FaExpandArrowsAlt, FaCompressArrowsAlt,
  FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaCalendarAlt,
  FaClipboardList, FaQuestionCircle, FaLightbulb, FaFileAlt, FaImage,
  FaVolumeUp, FaBook, FaEye, FaExclamationCircle, FaDownload, FaSpinner
} from 'react-icons/fa';

import './css/PreAssessmentResults.css';
import ImagePreviewModal from './ImagePreviewModal';
import PreAssessmentDataProcessor from '../../../services/Teachers/PreAssessmentDataProcessor';
import PreAssessmentPDFService from '../../../services/Teachers/PreAssessmentPDFService';
// Helper function to render question comparison with correct answers
const renderQuestionComparison = (question, onImageClick) => {
  const getAnswerStatus = (question) => {
    if (!question.wasAnswered) return 'no-record';
    return question.isCorrect ? 'correct' : 'incorrect';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'correct':
        return (
          <span className="pre-assessment-results__status-badge pre-assessment-results__status-badge--correct">
            <FaCheckCircle /> Correct
          </span>
        );
      case 'incorrect':
        return (
          <span className="pre-assessment-results__status-badge pre-assessment-results__status-badge--incorrect">
            <FaTimesCircle /> Incorrect
          </span>
        );
      case 'no-record':
      default:
        return (
          <span className="pre-assessment-results__status-badge pre-assessment-results__status-badge--no-record">
            <FaExclamationCircle /> No Record
          </span>
        );
    }
  };

  const renderStudentAnswer = () => {
    if (!question.wasAnswered) return 'Not answered yet';
    
    const questionType = question.questionType;
    
    switch (questionType) {
      case 'patinig':
      case 'katinig':
      case 'malaking':
      case 'tunog':
        // Alphabet Knowledge - Multiple choice
        return question.studentAnswerText || `Option ${question.studentAnswer}`;
        
      case 'malapantig':
        // Phonological Awareness - Use formatted text with actual pairs
        return question.studentAnswerText || (
          question.correctMatches !== undefined && question.totalMatches !== undefined 
            ? `${question.correctMatches}/${question.totalMatches} correct matches`
            : 'Matching response'
        );
        
      case 'decode':
        // Decoding - Letter arrangement
        if (Array.isArray(question.studentResponse)) {
          return question.studentResponse.join('');
        }
        return question.studentAnswerText || 'Letter arrangement';
        
      case 'word':
        // Word Recognition
        if (Array.isArray(question.studentResponse)) {
          return question.studentResponse.join(', ');
        }
        return question.studentAnswerText || 'Word selection';
        
      case 'sentence':
        // Reading Comprehension - Text input
        if (Array.isArray(question.studentResponse)) {
          return question.studentResponse.join(', ');
        }
        return question.studentAnswerText || 'Text response';
        
      default:
        return question.studentAnswerText || 'Response recorded';
    }
  };

  const renderCorrectAnswer = () => {
    const questionType = question.questionType;
    
    switch (questionType) {
      case 'patinig':
      case 'katinig':
      case 'malaking':
      case 'tunog':
        // Find the correct option from the question's options
        if (question.options) {
          const correctOption = question.options.find(opt => opt.isCorrect);
          return correctOption ? correctOption.optionText : 'Correct option';
        }
        return question.correctAnswerText || 'See correct option';
        
      case 'malapantig':
        // Phonological Awareness - Use formatted text with actual pairs
        return question.correctAnswerText || (
          question.correctPairs 
            ? `${question.correctPairs.length} correct pairs expected`
            : 'All audio-text pairs matched correctly'
        );
        
      case 'decode':
        // Decoding - Show correct sequence
        if (question.correctSequence && Array.isArray(question.correctSequence)) {
          return question.correctSequence.join('');
        }
        return question.correctAnswerText || 'Correct letter arrangement';
        
      case 'word':
        // Word Recognition
        if (question.correctAnswer && Array.isArray(question.correctAnswer)) {
          return question.correctAnswer.join(', ');
        }
        return question.correctAnswerText || 'Correct word(s)';
        
      case 'sentence':
        // Reading Comprehension
        return question.correctAnswer || question.correctAnswerText || 'Expected text response';
        
      default:
        return question.correctAnswerText || 'Correct response';
    }
  };

  const answerStatus = getAnswerStatus(question);

  return (
    <div className="pre-assessment-results__question-comparison">
      <div className="pre-assessment-results__comparison-header">
        <div className="pre-assessment-results__question-id">ID: {question.questionId}</div>
        {getStatusBadge(answerStatus)}
      </div>

      <div className="pre-assessment-results__comparison-content">
        <div className="pre-assessment-results__comparison-row">
          <span className="pre-assessment-results__comparison-label">Student Answer:</span>
          <span className={`pre-assessment-results__comparison-value pre-assessment-results__comparison-value--${answerStatus}${question.questionType === 'malapantig' ? ' pre-assessment-results__comparison-value--phonological' : ''}`}>
            {renderStudentAnswer()}
          </span>
        </div>

        <div className="pre-assessment-results__comparison-row">
          <span className="pre-assessment-results__comparison-label">Correct Answer:</span>
          <span className={`pre-assessment-results__comparison-value pre-assessment-results__comparison-value--correct${question.questionType === 'malapantig' ? ' pre-assessment-results__comparison-value--phonological' : ''}`}>
            {renderCorrectAnswer()}
          </span>
        </div>


        <div className="pre-assessment-results__comparison-row">
          <span className="pre-assessment-results__comparison-label">Difficulty:</span>
          <span className="pre-assessment-results__comparison-value">
            {question.difficultyLevel?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
          </span>
        </div>
      </div>
    </div>
  );
};

const PreAssessmentResults = ({ assessmentData, userResponses, student }) => {
  const [expandedSkills, setExpandedSkills] = useState({});
  const [processedData, setProcessedData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    imageUrl: '',
    title: '',
    questionText: ''
  });

  // Process the assessment data when component mounts or data changes
  useEffect(() => {
    if (userResponses && Array.isArray(userResponses) && userResponses.length > 0) {
      console.log('Processing user responses:', userResponses);
      const processed = PreAssessmentDataProcessor.processStudentResponses(userResponses);
      console.log('Processed data:', processed);
      
      // Use actual student reading level if available, otherwise use calculated one
      if (student && student.readingLevel) {
        processed.readingLevel = student.readingLevel;
        console.log('Using student reading level from database:', student.readingLevel);
      }
      
      setProcessedData(processed);
    } else if (assessmentData && assessmentData.skillDetails) {
      // Fallback to existing assessment data format
      let processedAssessment = { ...assessmentData };
      if (student && student.readingLevel) {
        processedAssessment.readingLevel = student.readingLevel;
      }
      setProcessedData(processedAssessment);
    }
  }, [assessmentData, userResponses, student]);

  // Handle PDF generation
  const handleDownloadPDF = async () => {
    if (!processedData || !student) {
      alert('Unable to generate PDF. Student or assessment data is missing.');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      await PreAssessmentPDFService.generatePreAssessmentPDF(
        student, 
        processedData, 
        userResponses
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle image preview
  const handleImageClick = (imageUrl, title, questionText) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      title: title || 'Question Image',
      questionText: questionText || ''
    });
  };

  const handleCloseImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: '',
      title: '',
      questionText: ''
    });
  };

  // Use processed data if available, otherwise fall back to original assessmentData
  const dataToDisplay = processedData || assessmentData;

  if (!dataToDisplay) {
    return (
      <div className="pre-assessment-results__empty-state">
        <FaInfoCircle size={48} />
        <h3>No Pre-Assessment Data Available</h3>
        <p>This student has not completed the pre-assessment yet.</p>
      </div>
    );
  }

  if (!dataToDisplay.hasCompleted) {
    return (
      <div className="pre-assessment-results__empty-state">
        <FaInfoCircle size={48} />
        <h3>Pre-Assessment Not Completed</h3>
        <p>{dataToDisplay.message || 'This student has not completed the pre-assessment yet.'}</p>
      </div>
    );
  }

  // Check if skillDetails is missing
  if (!dataToDisplay.skillDetails || dataToDisplay.skillDetails.length === 0) {
    return (
      <div className="pre-assessment-results__empty-state">
        <FaInfoCircle size={48} />
        <h3>Incomplete Pre-Assessment Data</h3>
        <p>The pre-assessment data is missing skill details. Please contact support if this issue persists.</p>
      </div>
    );
  }

  const toggleSkillExpansion = (categoryKey) => {
    setExpandedSkills(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const getScoreColor = (score) => {
    // Use the same blue color for all scores
    return '#4a5494';
  };
  
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'reading-level-not-assessed';
    
    switch(level.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return 'reading-level-early';
      
      case 'developing':
      case 'emergent':
        return 'reading-level-developing';
      
      case 'transitioning':
      case 'at grade level':
      case 'fluent':
        return 'reading-level-fluent';
      
      case 'advanced':
        return 'reading-level-advanced';
      
      default:
        return 'reading-level-not-assessed';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0 || !Number.isFinite(seconds)) return 'Not recorded';
    const sanitizedSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(sanitizedSeconds / 60);
    const remainingSeconds = sanitizedSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getCategoryIcon = (category) => {
    // Icon mapping with uniform color
    const iconMap = {
      'alphabet_knowledge': <FaQuestionCircle />,
      'phonological_awareness': <FaVolumeUp />,
      'decoding': <FaBook />,
      'word_recognition': <FaClipboardList />,
      'reading_comprehension': <FaFileAlt />
    };
    
    // Return the icon with the uniform color style
    return (
      <span style={{ color: '#4a5494', fontSize: '1.25rem' }}>
        {iconMap[category] || <FaQuestionCircle />}
      </span>
    );
  };

  const getCategoryColorClass = (category) => {
    // Using the same class for all skill bars to maintain color consistency
    return 'skill-bar--blue';
  };

  return (
    <div className="pre-assessment-results">
      {/* Info Banner */}
      <div className="pre-assessment-results__info-banner">
        <FaInfoCircle className="pre-assessment-results__info-icon" />
        <div className="pre-assessment-results__info-content">
          <h3>Pre-Assessment Results (CRLA Standards)</h3>
          <p>
            This assessment evaluates <strong>Filipino reading skills</strong> based on DepEd's 
            Comprehensive Reading and Literacy Assessment (CRLA) standards. The results show 
            the student's performance across five key reading skill categories and determine 
            their current reading level.
          </p>
        </div>
      </div>

      {/* Overview Section */}
      <div className="pre-assessment-results__overview">
        <div className="pre-assessment-results__overview-header">
          <h3>
            <FaChartBar className="pre-assessment-results__overview-icon" />
            Assessment Overview
          </h3>
          <div className="pre-assessment-results__overview-actions">
            <button
              className="pre-assessment-results__download-btn"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || !dataToDisplay.hasCompleted}
              title="Download Pre-Assessment Report as PDF"
            >
              {isGeneratingPDF ? (
                <>
                  <FaSpinner className="pre-assessment-results__spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <FaDownload />
                  Download PDF Report
                </>
              )}
            </button>
            <div className={`pre-assessment-results__score-badge ${getReadingLevelClass(dataToDisplay.readingLevel)}`}>
              {dataToDisplay.readingLevel}
            </div>
          </div>
        </div>

        {/* Single row grid for overview items */}
        <div className="pre-assessment-results__overview-grid">
          <div className="pre-assessment-results__overview-item">
            <div className="pre-assessment-results__overview-item-icon">
              <FaChartBar />
            </div>
            <div className="pre-assessment-results__overview-item-content">
              <div className="pre-assessment-results__overview-item-label">Overall Score</div>
              <div className="pre-assessment-results__overview-item-value">
                {Math.max(0, dataToDisplay.correctAnswers || 0)}/45
              </div>
            </div>
          </div>

          <div className="pre-assessment-results__overview-item">
            <div className="pre-assessment-results__overview-item-icon">
              <FaCalendarAlt />
            </div>
            <div className="pre-assessment-results__overview-item-content">
              <div className="pre-assessment-results__overview-item-label">Completed On</div>
              <div className="pre-assessment-results__overview-item-value">
                {formatDate(dataToDisplay.completedAt)}
              </div>
            </div>
          </div>

          <div className="pre-assessment-results__overview-item">
            <div className="pre-assessment-results__overview-item-icon">
              <FaClock />
            </div>
            <div className="pre-assessment-results__overview-item-content">
              <div className="pre-assessment-results__overview-item-label">Time Taken</div>
              <div className="pre-assessment-results__overview-item-value">
                {formatTime(Math.max(0, dataToDisplay.totalResponseTime || 0))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Results Section */}
      <div className="pre-assessment-results__skills-section">
        <h3 className="pre-assessment-results__section-title">
          <FaChartBar className="pre-assessment-results__section-icon" />
          Reading Skills Performance
        </h3>

        <div className="pre-assessment-results__skill-list">
          {dataToDisplay.skillDetails && dataToDisplay.skillDetails.map((skill, index) => (
            <div key={skill.category} className="pre-assessment-results__skill-item">
              <div className="pre-assessment-results__skill-header">
                <div className="pre-assessment-results__skill-title">
                  <div className="pre-assessment-results__skill-name-container">
                    {getCategoryIcon(skill.category)}
                    <span className="pre-assessment-results__skill-name">{skill.categoryName}</span>
                  </div>
                  <span 
                    className="pre-assessment-results__skill-score"
                    style={{ color: getScoreColor(skill.score) }}
                  >
                    {skill.correct || 0}/{skill.totalQuestions || skill.total} correct ({skill.score}%)
                  </span>
                </div>
                <button
                  className="pre-assessment-results__expand-btn"
                  onClick={() => toggleSkillExpansion(skill.categoryName || skill.category)}
                  aria-label={expandedSkills[skill.categoryName || skill.category] ? 'Collapse' : 'Expand'}
                >
                  {expandedSkills[skill.categoryName || skill.category] ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
                </button>
              </div>

              <div className="pre-assessment-results__skill-bar-wrapper">
                <div 
                  className={`pre-assessment-results__skill-bar ${getCategoryColorClass(skill.category)}`}
                  style={{ 
                    width: `${Math.round((skill.correct / skill.total) * 100)}%`
                  }}
                />
              </div>

              {expandedSkills[skill.categoryName || skill.category] && (
                <div className="pre-assessment-results__skill-details">
                  <h4>
                    <FaClipboardList />
                    Question Details
                  </h4>
                  <div className="pre-assessment-results__questions-list">
                    {skill.questions && skill.questions.map((question, qIndex) => (
                      <div key={question.questionId} className="pre-assessment-results__question-item">
                        <div className="pre-assessment-results__question-header">
                          <div className="pre-assessment-results__question-number">
                            Question {qIndex + 1}
                          </div>
                          <div className="pre-assessment-results__question-type">
                            {question.questionType?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </div>

                        <div className="pre-assessment-results__question-content">
                          <div className="pre-assessment-results__question-text">
                            <strong>Question:</strong> {question.questionText}
                          </div>

                          {question.questionImage && (
                            <div className="pre-assessment-results__question-media">
                              <button
                                className="pre-assessment-results__image-preview-btn"
                                onClick={() => handleImageClick(
                                  question.questionImage,
                                  `Question ${qIndex + 1} Image`,
                                  question.questionText
                                )}
                                title="Click to view image"
                              >
                                <FaEye /> View Image
                              </button>
                            </div>
                          )}

                          {question.hasAudio && (
                            <div className="pre-assessment-results__question-media">
                              <FaVolumeUp /> Audio provided
                            </div>
                          )}

                          {question.displayedText && (
                            <div className="pre-assessment-results__displayed-text">
                              <strong>Displayed Text:</strong> {question.displayedText}
                            </div>
                          )}

                          {question.questionValue && (
                            <div className="pre-assessment-results__question-value">
                              <strong>Focus:</strong> {question.questionValue}
                            </div>
                          )}

                          {/* Special handling for reading comprehension */}
                          {/* Special handling for reading comprehension passages */}
                          {question.questionType === 'sentence' && question.passages && (
                            <div className="pre-assessment-results__reading-passages">
                              <div className="pre-assessment-results__passages-header">
                                <FaBook /> Reading Passage:
                              </div>
                              <div className="pre-assessment-results__passages-content">
                                {question.passages.map((page, pageIndex) => (
                                  <div key={pageIndex} className="pre-assessment-results__passage-page">
                                    {question.passages.length > 1 && (
                                      <div className="pre-assessment-results__page-number">
                                        Page {page.pageNumber}:
                                      </div>
                                    )}
                                    <p className="pre-assessment-results__passage-text">
                                      {page.pageText}
                                    </p>
                                    {page.pageImage && (
                                      <div className="pre-assessment-results__passage-image">
                                        <button
                                          className="pre-assessment-results__image-preview-btn"
                                          onClick={() => handleImageClick(
                                            page.pageImage,
                                            `Passage ${pageIndex + 1} Image`,
                                            page.pageText
                                          )}
                                          title="Click to view passage image"
                                        >
                                          <FaImage /> View Passage Image
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {question.sentenceQuestions && question.sentenceQuestions.length > 0 && (
                                <div className="pre-assessment-results__comprehension-questions">
                                  <div className="pre-assessment-results__comprehension-header">
                                    <FaQuestionCircle /> Comprehension Questions:
                                  </div>
                                  {question.sentenceQuestions.map((sentenceQ, sqIndex) => (
                                    <div key={sqIndex} className="pre-assessment-results__comprehension-question">
                                      <div className="pre-assessment-results__question-text">
                                        <strong>Q{sqIndex + 1}:</strong> {sentenceQ.questionText}
                                      </div>
                                      <div className="pre-assessment-results__expected-answer">
                                        <strong>Expected Answer:</strong> {sentenceQ.correctAnswer}
                                      </div>
                                      {sentenceQ.acceptableAnswers && sentenceQ.acceptableAnswers.length > 0 && (
                                        <div className="pre-assessment-results__acceptable-answers">
                                          <strong>Acceptable Variations:</strong> {sentenceQ.acceptableAnswers.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Answer comparison display */}
                          {renderQuestionComparison(question, handleImageClick)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion Section */}
      <div className="pre-assessment-results__conclusion">
        <h3 className="pre-assessment-results__conclusion-title">
          <FaFileAlt />
          Assessment Summary
        </h3>
        <p className="pre-assessment-results__conclusion-text">
          Based on the pre-assessment results, the student has been 
          placed at the <strong>{dataToDisplay.readingLevel}</strong> reading level. 
          {dataToDisplay.focusAreas && dataToDisplay.focusAreas.length > 0 && (
            <>
             
            </>
          )}
        </p>
        
        {dataToDisplay.overallScore >= 90 && (
          <div className="pre-assessment-results__focus-areas">
            <strong>Excellent Performance!</strong> The student demonstrates strong reading skills 
            across all assessed categories and is ready for grade-level instruction.
          </div>
        )}
      </div>

      {/* Process Note */}
      <div className="pre-assessment-results__process-note">
        <FaLightbulb className="pre-assessment-results__process-note-icon" />
        <div className="pre-assessment-results__process-note-text">
          <p>
            <strong>Next Steps:</strong> The student will now proceed to the post-assessment phase 
            to measure progress and determine if additional interventions are needed to support 
            their reading development journey.
          </p>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        onClose={handleCloseImagePreview}
        imageUrl={imagePreview.imageUrl}
        title={imagePreview.title}
        questionText={imagePreview.questionText}
      />
    </div>
  );
};

export default PreAssessmentResults;