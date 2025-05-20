import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faEdit, 
  faSpinner, 
  faVolumeUp,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faLayerGroup,
  faChevronRight,
  faChevronLeft,
  faFont,
  faImage,
  faMicrophone,
  faBookOpen
} from '@fortawesome/free-solid-svg-icons';
import '../../../css/Teachers/PreviewActivity.css';

const PreviewActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('student');
  const [activeLevel, setActiveLevel] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // Fetch activity data when component mounts
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        // First, check if we have any newly added activities in localStorage
        const newlyAddedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
        const newActivity = newlyAddedActivities.find(a => a.id === parseInt(id));
        
        if (newActivity) {
          setActivity(newActivity);
          setActiveLevel(0);
          if (newActivity.levels && newActivity.levels.length > 0) {
            setCurrentQuestion(0);
          }
        } else {
          // If not found in localStorage, check the mock data import
          // const mockResponse = await import('../../../data/Teachers/activitiesMockData.js');
          const activities = mockResponse.default;
          const foundActivity = activities.find(a => a.id === parseInt(id));
          
          if (!foundActivity) {
            throw new Error('Activity not found');
          }
          
          setActivity(foundActivity);
          setActiveLevel(0);
          if (foundActivity.levels && foundActivity.levels.length > 0) {
            setCurrentQuestion(0);
          }
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle level change
  const handleLevelChange = (levelIndex) => {
    setActiveLevel(levelIndex);
    setCurrentQuestion(0);
  };

  // Navigate between questions
  const nextQuestion = () => {
    if (!activity?.levels || !activity.levels[activeLevel]?.questions) return;
    
    const questions = activity.levels[activeLevel].questions;
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Get content type icon
  const getContentTypeIcon = (contentType) => {
    switch(contentType?.toLowerCase()) {
      case 'text': return faFont;
      case 'image': return faImage;
      case 'audio': 
      case 'voice': return faMicrophone;
      default: return faFont;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="preview-activity-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Loading activity preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="preview-activity-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Error Loading Activity</h2>
          <p>{error}</p>
          <button 
            className="btn-back" 
            onClick={() => navigate('/teacher/manage-activities')}
          >
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  if (!activity) return null;

  // Get current level based on active level index
  const currentLevel = activity.levels && activity.levels.length > activeLevel 
    ? activity.levels[activeLevel] 
    : null;

  // Get current question
  const question = currentLevel?.questions && currentLevel.questions.length > currentQuestion
    ? currentLevel.questions[currentQuestion]
    : null;

  return (
    <div className="preview-activity-container">
      <div className="preview-header">
        <div className="preview-title-area">
          <h1 className="preview-title">{activity.title}</h1>
          <p className="preview-subtitle">
            {activity.level} | {activity.categories?.join(', ') || 'No category'} | 
            {activity.type === 'template' && ' Activity Template'}
            {activity.type === 'assessment' && ' Pre-Assessment'}
            {activity.type === 'practice' && ' Practice Module'}
            {activity.status === 'pending' && ' (Pending Approval)'}
          </p>
        </div>
        <div className="preview-actions">
          <button 
            className="btn-back"
            onClick={() => navigate('/teacher/manage-activities')}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          {activity.status !== 'pending' && activity.status !== 'locked' && (
            <button 
              className="btn-edit"
              onClick={() => navigate(`/teacher/edit-activity/${activity.id}`)}
            >
              <FontAwesomeIcon icon={faEdit} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Status indicator for pending activities */}
      {activity.status === 'pending' && (
        <div className="pending-notice">
          <FontAwesomeIcon icon={faInfoCircle} className="notice-icon" />
          <p>This activity is currently pending admin approval and cannot be edited until approved.</p>
        </div>
      )}

      <div className="preview-description">
        <h2>Activity Description</h2>
        <p>{activity.description || 'No description provided.'}</p>
      </div>

      {/* Tabs for Student/Teacher views */}
      <div className="preview-tabs">
        <button 
          className={`tab-button ${activeTab === 'student' ? 'active' : ''}`}
          onClick={() => setActiveTab('student')}
        >
          Student View
        </button>
        <button 
          className={`tab-button ${activeTab === 'teacher' ? 'active' : ''}`}
          onClick={() => setActiveTab('teacher')}
        >
          Teacher Details
        </button>
      </div>

      {/* Level navigation if multiple levels exist */}
      {activity.levels && activity.levels.length > 1 && (
        <div className="level-navigation">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faLayerGroup} /> Levels
          </h3>
          <div className="level-tabs">
            {activity.levels.map((level, index) => (
              <button
                key={index}
                className={`level-tab ${index === activeLevel ? 'active' : ''}`}
                onClick={() => handleLevelChange(index)}
              >
                {level.levelName || `Level ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="preview-content">
        {activeTab === 'student' ? (
          <div className="student-view">
            {/* Reading passage section */}
            {activity.hasReadingPassage !== false && currentLevel?.passage?.text && (
              <div className="passage-section">
                <h2>
                  <FontAwesomeIcon icon={faBookOpen} /> Reading Passage
                </h2>
                
                <div className="reading-passage">
                  <div className="passage-content">
                    <p className="passage-text">{currentLevel.passage.text}</p>
                    
                    {currentLevel.passage.syllables && (
                      <div className="passage-syllables">
                        <h4>Syllable Breakdown:</h4>
                        <p>{currentLevel.passage.syllables}</p>
                      </div>
                    )}
                    
                    {currentLevel.passage.translation && (
                      <div className="passage-translation">
                        <h4>Translation/Notes:</h4>
                        <p>{currentLevel.passage.translation}</p>
                      </div>
                    )}
                    
                    <button className="audio-button">
                      <FontAwesomeIcon icon={faVolumeUp} /> Listen
                    </button>
                  </div>
                  
                  {currentLevel.passage.imagePreview && (
                    <div className="passage-media">
                      <img 
                        src={currentLevel.passage.imagePreview} 
                        alt="Supporting visual" 
                        className="passage-image"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Questions section */}
            {currentLevel?.questions && currentLevel.questions.length > 0 && (
              <div className="questions-section">
                <h2>Questions</h2>
                
                <div className="question-navigation">
                  <span className="question-counter">
                    Question {currentQuestion + 1} of {currentLevel.questions.length}
                  </span>
                  <div className="question-nav-buttons">
                    <button 
                      className="nav-button"
                      onClick={prevQuestion}
                      disabled={currentQuestion === 0}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button 
                      className="nav-button"
                      onClick={nextQuestion}
                      disabled={currentQuestion === currentLevel.questions.length - 1}
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                </div>
                
                {question && (
                  <div className="question-card">
                    <div className="question-type-indicator">
                      <FontAwesomeIcon icon={getContentTypeIcon(question.contentType)} />
                      <span>
                        {question.contentType === 'text' && 'Text Question'}
                        {question.contentType === 'image' && 'Image Question'}
                        {(question.contentType === 'audio' || question.contentType === 'voice') && 'Audio Question'}
                      </span>
                    </div>
                    
                    <h3 className="question-text">{question.questionText}</h3>
                    
                    {/* Content based on question type */}
                    {question.contentType === 'image' && question.imagePreview && (
                      <div className="question-media">
                        <img 
                          src={question.imagePreview} 
                          alt="Question visual"
                          className="question-image" 
                        />
                      </div>
                    )}
                    
                    {(question.contentType === 'audio' || question.contentType === 'voice') && (
                      <div className="question-media">
                        <button className="audio-button large">
                          <FontAwesomeIcon icon={faVolumeUp} /> Play Audio
                        </button>
                      </div>
                    )}
                    
                    <div className="options-container">
                      {question.options.map((option, idx) => (
                        <div 
                          key={idx} 
                          className={`option-item ${idx === question.correctAnswer ? 'correct' : ''}`}
                        >
                          <input 
                            type="radio" 
                            id={`opt${idx}`} 
                            name="question-option" 
                            defaultChecked={idx === question.correctAnswer}
                          />
                          <label htmlFor={`opt${idx}`}>
                            {option}
                            {idx === question.correctAnswer && activeTab === 'teacher' && (
                              <span className="correct-answer-indicator">
                                <FontAwesomeIcon icon={faCheckCircle} />
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {activeTab === 'teacher' && question.hint && (
                      <div className="question-hint">
                        <h4>Hint/Explanation:</h4>
                        <p>{question.hint}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="teacher-view">
            <div className="teacher-details">
              <h2>Teacher Information</h2>
              
              <div className="detail-section">
                <h3>Activity Metadata</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Created By:</span>
                    <span className="detail-value">{activity.creator || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Creation Date:</span>
                    <span className="detail-value">{formatDate(activity.createdAt)}</span>
                  </div>
                  {activity.lastModified && (
                    <div className="detail-item">
                      <span className="detail-label">Last Modified:</span>
                      <span className="detail-value">{formatDate(activity.lastModified)}</span>
                    </div>
                  )}
                  {activity.submittedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Submitted for Approval:</span>
                      <span className="detail-value">{formatDate(activity.submittedAt)}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-${activity.status}`}>
                      {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Structure:</span>
                    <span className="detail-value">
                      {activity.hasReadingPassage === false 
                        ? 'Questions Only'
                        : 'Reading Passage with Questions'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Levels:</span>
                    <span className="detail-value">
                      {activity.levels?.length || 1} level(s)
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Questions:</span>
                    <span className="detail-value">
                      {activity.levels?.reduce((sum, level) => sum + (level.questions?.length || 0), 0) || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Usage Guidelines</h3>
                <div className="guidelines">
                  <p>This activity is designed for students at {activity.level} reading level. 
                  It focuses on {activity.categories?.join(', ') || 'various'} skills and should be 
                  administered in a quiet environment without distractions.</p>
                  
                  <p>For best results, ensure students understand the instructions thoroughly before 
                  beginning. Allow approximately 15-20 minutes for completion.</p>
                  
                  {activity.hasReadingPassage !== false && (
                    <p>Since this activity includes a reading passage, make sure to give students adequate 
                    time to read and comprehend the text before answering the questions.</p>
                  )}
                  
                  {activity.levels?.some(level => 
                    level.questions?.some(q => 
                      q.contentType === 'audio' || q.contentType === 'voice'
                    )
                  ) && (
                    <p>This activity includes audio components. Ensure students have access to 
                    headphones or speakers and a quiet environment for the listening tasks.</p>
                  )}
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Correct Answers</h3>
                {currentLevel?.questions && (
                  <div className="answers-list">
                    {currentLevel.questions.map((q, idx) => (
                      <div key={idx} className="answer-item">
                        <div className="question">
                          <span className="question-number">Q{idx + 1}:</span> {q.questionText}
                          <span className="question-type">
                            <FontAwesomeIcon icon={getContentTypeIcon(q.contentType)} />
                            {q.contentType === 'text' && 'Text'}
                            {q.contentType === 'image' && 'Image'}
                            {(q.contentType === 'audio' || q.contentType === 'voice') && 'Audio'}
                          </span>
                        </div>
                        <div className="answer">
                          <span className="answer-label">Answer:</span>
                          <span className="answer-value">
                            {q.options && q.options[q.correctAnswer] 
                              ? q.options[q.correctAnswer] 
                              : 'No answer specified'}
                          </span>
                        </div>
                        {q.hint && (
                          <div className="hint">
                            <span className="hint-label">Hint:</span>
                            <span className="hint-value">{q.hint}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewActivity;