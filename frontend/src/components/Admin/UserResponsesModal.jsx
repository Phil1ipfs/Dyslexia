import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, Book, Award, Layers, Eye, EyeOff } from 'lucide-react';
import PreAssessmentService from '../../services/Teachers/PreAssessmentService';
import './UserResponsesModal.css';

const UserResponsesModal = ({ isOpen, onClose, student }) => {
  const [userResponses, setUserResponses] = useState([]);
  const [preAssessmentData, setPreAssessmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (isOpen && student) {
      fetchUserResponses();
    }
  }, [isOpen, student]);

  const fetchUserResponses = async () => {
    if (!student) return;
    
    setLoading(true);
    setError(null);
    
    console.log('🔍 UserResponsesModal: Fetching responses for student:', student);
    console.log('🔍 UserResponsesModal: Student ID:', student._id);
    
    try {
      // Fetch both user responses and pre-assessment data in parallel
      const [responsesResponse, assessmentResponse] = await Promise.all([
        PreAssessmentService.getPreAssessmentUserResponses(student._id),
        PreAssessmentService.getPreAssessmentById('1') // Get the main pre-assessment
      ]);
      
      console.log('🔍 UserResponsesModal: Service responses:', { responsesResponse, assessmentResponse });
      
      if (responsesResponse.success) {
        console.log('🔍 UserResponsesModal: Setting user responses:', responsesResponse.data?.length || 0, 'responses');
        setUserResponses(responsesResponse.data || []);
      } else {
        console.error('🔍 UserResponsesModal: Service returned error:', responsesResponse.message);
        setError(responsesResponse.message || 'Failed to fetch user responses');
      }
      
      if (assessmentResponse.success) {
        console.log('🔍 UserResponsesModal: Setting pre-assessment data');
        setPreAssessmentData(assessmentResponse.data);
      } else {
        console.warn('🔍 UserResponsesModal: Failed to fetch pre-assessment data:', assessmentResponse.message);
      }
    } catch (err) {
      console.error('🔍 UserResponsesModal: Exception caught:', err);
      setError('Failed to fetch user responses');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const formatResponseTime = (time) => {
    if (!time) return 'N/A';
    return `${time.toFixed(1)}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Alphabet Knowledge':
        return <Book size={16} />;
      case 'Phonological Awareness':
        return <Award size={16} />;
      case 'Decoding':
        return <Layers size={16} />;
      case 'Word Recognition':
        return <Book size={16} />;
      case 'Reading Comprehension':
        return <Award size={16} />;
      default:
        return <Book size={16} />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Alphabet Knowledge':
        return '#3B82F6';
      case 'Phonological Awareness':
        return '#8B5CF6';
      case 'Decoding':
        return '#10B981';
      case 'Word Recognition':
        return '#F59E0B';
      case 'Reading Comprehension':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Helper function to get question data from pre-assessment
  const getQuestionData = (questionId) => {
    if (!preAssessmentData?.questions) return null;
    return preAssessmentData.questions.find(q => q.questionId === questionId);
  };

  const renderResponseContent = (response) => {
    const { category, questionType, response: responseData } = response;

    switch (category) {
      case 'Alphabet Knowledge':
        return renderAlphabetKnowledgeResponse(response);
      case 'Phonological Awareness':
        return renderPhonologicalAwarenessResponse(response);
      case 'Decoding':
        return renderDecodingResponse(response);
      case 'Word Recognition':
        return renderWordRecognitionResponse(response);
      case 'Reading Comprehension':
        return renderReadingComprehensionResponse(response);
      default:
        return <div className="user-responses__response-content">
          <p><strong>Response:</strong> {JSON.stringify(responseData)}</p>
        </div>;
    }
  };

  const renderAlphabetKnowledgeResponse = (response) => {
    const { response: responseData, isCorrect, questionId } = response;
    const questionData = getQuestionData(questionId);
    const correctOption = questionData?.options?.find(opt => opt.isCorrect);
    
    return (
      <div className="user-responses__response-content">
        {questionData && (
          <div className="user-responses__question-context">
            <h4>Question:</h4>
            <p className="user-responses__question-text">{questionData.questionText}</p>
            {questionData.questionValue && (
              <div className="user-responses__question-value">
                <strong>Target:</strong> {questionData.questionValue}
              </div>
            )}
          </div>
        )}
        
        <div className="user-responses__response-comparison">
          <div className="user-responses__response-item">
            <span className="user-responses__response-label">Student's Answer:</span>
            <span className={`user-responses__response-value ${isCorrect ? 'correct' : 'incorrect'}`}>
              {Array.isArray(responseData) ? responseData[0] : responseData}
            </span>
          </div>
          
          {correctOption && (
            <div className="user-responses__response-item">
              <span className="user-responses__response-label">Correct Answer:</span>
              <span className="user-responses__response-value correct">
                {correctOption.optionText}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPhonologicalAwarenessResponse = (response) => {
    const { response: responseData, correctMatches, totalMatches, isCorrect, questionId } = response;
    const questionData = getQuestionData(questionId);
    const correctPairs = questionData?.questionSet?.correctPairs || [];
    
    return (
      <div className="user-responses__response-content">
        {questionData && (
          <div className="user-responses__question-context">
            <h4>Question:</h4>
            <p className="user-responses__question-text">{questionData.questionText}</p>
          </div>
        )}
        
        <div className="user-responses__response-item">
          <span className="user-responses__response-label">Matches:</span>
          <span className={`user-responses__response-value ${isCorrect ? 'correct' : 'incorrect'}`}>
            {correctMatches || 0}/{totalMatches || 0}
          </span>
        </div>
        
        {Array.isArray(responseData) && responseData.length > 0 && (
          <div className="user-responses__matching-pairs">
            <h4>Student's Matching Pairs:</h4>
            {responseData.map((pair, index) => {
              const isCorrectMatch = correctPairs.some(correctPair => 
                correctPair.audio === pair.audio && correctPair.match === pair.match
              );
              return (
                <div key={index} className={`user-responses__matching-pair ${isCorrectMatch ? 'correct' : 'incorrect'}`}>
                  <span className="user-responses__audio-text">{pair.audio}</span>
                  <span className="user-responses__arrow">→</span>
                  <span className="user-responses__match-text">{pair.match}</span>
                  {isCorrectMatch ? (
                    <CheckCircle size={16} className="user-responses__match-icon correct" />
                  ) : (
                    <XCircle size={16} className="user-responses__match-icon incorrect" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {correctPairs.length > 0 && (
          <div className="user-responses__correct-pairs">
            <h4>Correct Matching Pairs:</h4>
            {correctPairs.map((pair, index) => (
              <div key={index} className="user-responses__matching-pair correct">
                <span className="user-responses__audio-text">{pair.audio}</span>
                <span className="user-responses__arrow">→</span>
                <span className="user-responses__match-text">{pair.match}</span>
                <CheckCircle size={16} className="user-responses__match-icon correct" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDecodingResponse = (response) => {
    const { response: responseData, isCorrect, questionId } = response;
    const questionData = getQuestionData(questionId);
    const correctSequence = questionData?.correctSequence || [];
    
    return (
      <div className="user-responses__response-content">
        {questionData && (
          <div className="user-responses__question-context">
            <h4>Question:</h4>
            <p className="user-responses__question-text">{questionData.questionText}</p>
            {questionData.questionImage && (
              <div className="user-responses__question-image">
                <img src={questionData.questionImage} alt="Question" className="user-responses__image" />
              </div>
            )}
          </div>
        )}
        
        <div className="user-responses__response-comparison">
          <div className="user-responses__response-item">
            <span className="user-responses__response-label">Student's Answer:</span>
            <span className={`user-responses__response-value ${isCorrect ? 'correct' : 'incorrect'}`}>
              {Array.isArray(responseData) ? responseData.join('') : responseData}
            </span>
          </div>
          
          {correctSequence.length > 0 && (
            <div className="user-responses__response-item">
              <span className="user-responses__response-label">Correct Answer:</span>
              <span className="user-responses__response-value correct">
                {correctSequence.join('')}
              </span>
            </div>
          )}
        </div>
        
        {Array.isArray(responseData) && responseData.length > 0 && (
          <div className="user-responses__letter-sequence">
            <h4>Student's Letter Sequence:</h4>
            <div className="user-responses__letters">
              {responseData.map((letter, index) => (
                <span key={index} className="user-responses__letter">{letter}</span>
              ))}
            </div>
          </div>
        )}
        
        {correctSequence.length > 0 && (
          <div className="user-responses__correct-sequence">
            <h4>Correct Letter Sequence:</h4>
            <div className="user-responses__letters">
              {correctSequence.map((letter, index) => (
                <span key={index} className="user-responses__letter correct">{letter}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWordRecognitionResponse = (response) => {
    const { response: responseData, isCorrect, questionId } = response;
    const questionData = getQuestionData(questionId);
    const correctAnswer = questionData?.correctAnswer || [];
    
    return (
      <div className="user-responses__response-content">
        {questionData && (
          <div className="user-responses__question-context">
            <h4>Question:</h4>
            <p className="user-responses__question-text">{questionData.questionText}</p>
            {questionData.displayWord && (
              <div className="user-responses__display-word">
                <strong>Sentence:</strong> {questionData.displayWord}
              </div>
            )}
            {questionData.questionImage && (
              <div className="user-responses__question-image">
                <img src={questionData.questionImage} alt="Question" className="user-responses__image" />
              </div>
            )}
          </div>
        )}
        
        <div className="user-responses__response-comparison">
          <div className="user-responses__response-item">
            <span className="user-responses__response-label">Student's Answer:</span>
            <span className={`user-responses__response-value ${isCorrect ? 'correct' : 'incorrect'}`}>
              {Array.isArray(responseData) ? responseData.join(', ') : responseData}
            </span>
          </div>
          
          {correctAnswer.length > 0 && (
            <div className="user-responses__response-item">
              <span className="user-responses__response-label">Correct Answer:</span>
              <span className="user-responses__response-value correct">
                {correctAnswer.join(', ')}
              </span>
            </div>
          )}
        </div>
        
        {questionData?.blankOptions && (
          <div className="user-responses__options">
            <h4>Available Options:</h4>
            <div className="user-responses__options-grid">
              {questionData.blankOptions.map((option, index) => (
                <span 
                  key={index} 
                  className={`user-responses__option ${
                    correctAnswer.includes(option) ? 'correct' : ''
                  } ${
                    Array.isArray(responseData) && responseData.includes(option) ? 'selected' : ''
                  }`}
                >
                  {option}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReadingComprehensionResponse = (response) => {
    const { response: responseData, isCorrect, questionId } = response;
    const questionData = getQuestionData(questionId);
    const passages = questionData?.passages || [];
    const sentenceQuestions = questionData?.sentenceQuestions || [];
    
    return (
      <div className="user-responses__response-content">
        {questionData && (
          <div className="user-responses__question-context">
            <h4>Reading Passage:</h4>
            <div className="user-responses__passage">
              {passages.map((passage, index) => (
                <div key={index} className="user-responses__passage-page">
                  {passage.pageImage && (
                    <div className="user-responses__passage-image">
                      <img src={passage.pageImage} alt={`Page ${passage.pageNumber}`} className="user-responses__image" />
                    </div>
                  )}
                  <p className="user-responses__passage-text">{passage.pageText}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sentenceQuestions.length > 0 && (
          <div className="user-responses__comprehension-questions">
            <h4>Comprehension Questions:</h4>
            {sentenceQuestions.map((question, index) => (
              <div key={index} className="user-responses__comprehension-question">
                <div className="user-responses__question-text">
                  <strong>Q{index + 1}:</strong> {question.questionText}
                </div>
                <div className="user-responses__response-comparison">
                  <div className="user-responses__response-item">
                    <span className="user-responses__response-label">Student's Answer:</span>
                    <span className={`user-responses__response-value ${isCorrect ? 'correct' : 'incorrect'}`}>
                      {Array.isArray(responseData) ? responseData[index] || 'No answer' : responseData}
                    </span>
                  </div>
                  <div className="user-responses__response-item">
                    <span className="user-responses__response-label">Correct Answer:</span>
                    <span className="user-responses__response-value correct">
                      {question.correctAnswer}
                    </span>
                  </div>
                </div>
                {question.acceptableAnswers && question.acceptableAnswers.length > 0 && (
                  <div className="user-responses__acceptable-answers">
                    <span className="user-responses__response-label">Acceptable Answers:</span>
                    <div className="user-responses__acceptable-list">
                      {question.acceptableAnswers.map((answer, answerIndex) => (
                        <span key={answerIndex} className="user-responses__acceptable-answer">
                          {answer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const filteredResponses = selectedCategory === 'all' 
    ? userResponses 
    : userResponses.filter(response => response.category === selectedCategory);

  const categories = [...new Set(userResponses.map(response => response.category))];

  if (!isOpen) return null;

  return (
    <div className="user-responses__modal-overlay" onClick={onClose}>
      <div className="user-responses__modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-responses__modal-header">
          <div className="user-responses__modal-title">
            <h2>Pre Assessment Responses</h2>
            <p>{student?.firstName} {student?.lastName} (ID: {student?.idNumber})</p>
          </div>
          <button className="user-responses__close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="user-responses__modal-content">
          {loading ? (
            <div className="user-responses__loading">
              <div className="user-responses__loading-spinner"></div>
              <p>Loading user responses...</p>
            </div>
          ) : error ? (
            <div className="user-responses__error">
              <XCircle size={48} />
              <h3>Error Loading Responses</h3>
              <p>{error}</p>
              <button className="user-responses__retry-btn" onClick={fetchUserResponses}>
                Try Again
              </button>
            </div>
          ) : userResponses.length === 0 ? (
            <div className="user-responses__empty">
              <Book size={48} />
              <h3>No Responses Found</h3>
              <p>This student hasn't completed the pre-assessment yet.</p>
            </div>
          ) : (
            <>
              {/* Category Filter */}
              <div className="user-responses__filters">
                <select 
                  className="user-responses__category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="user-responses__response-count">
                  {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Responses List */}
              <div className="user-responses__list">
                {filteredResponses.map((response, index) => {
                  const isExpanded = expandedQuestions[response.questionId];
                  
                  return (
                    <div key={response._id || index} className="user-responses__response-card">
                      <div 
                        className="user-responses__response-header"
                        onClick={() => toggleQuestionExpansion(response.questionId)}
                      >
                        <div className="user-responses__response-info">
                          <div className="user-responses__category-badge" style={{ backgroundColor: getCategoryColor(response.category) }}>
                            {getCategoryIcon(response.category)}
                            <span>{response.category}</span>
                          </div>
                          <div className="user-responses__question-info">
                            <span className="user-responses__question-id">{response.questionId}</span>
                            <span className="user-responses__question-type">{response.questionType}</span>
                          </div>
                        </div>
                        
                        <div className="user-responses__response-meta">
                          <div className={`user-responses__correctness ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                            {response.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            <span>{response.isCorrect ? 'Correct' : 'Incorrect'}</span>
                          </div>
                          <div className="user-responses__time">
                            <Clock size={14} />
                            <span>{formatResponseTime(response.responseTime)}</span>
                          </div>
                          <div className="user-responses__expand-icon">
                            {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="user-responses__response-details">
                          <div className="user-responses__response-metadata">
                            <div className="user-responses__metadata-item">
                              <span className="user-responses__metadata-label">Answered At:</span>
                              <span className="user-responses__metadata-value">{formatDate(response.answeredAt)}</span>
                            </div>
                            <div className="user-responses__metadata-item">
                              <span className="user-responses__metadata-label">Response Time:</span>
                              <span className="user-responses__metadata-value">{formatResponseTime(response.responseTime)}</span>
                            </div>
                          </div>
                          
                          {renderResponseContent(response)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserResponsesModal;
