import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faEdit, 
  faSpinner, 
  faVolumeUp,
  faImage,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faLayerGroup,
  faChevronRight,
  faChevronLeft,
  faFont,
  faMicrophone,
  faBookOpen,
  faList,
  faListAlt,
  faQuestionCircle,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import '../../../css/Teachers/PreviewActivity.css';

const PreviewActivity = () => {
  // Navigation and route parameters
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('student');
  const [activeLevel, setActiveLevel] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Get template type from URL
  const getTemplateTypeFromPath = () => {
    const path = window.location.pathname;
    if (path.includes('preview-assessment')) return 'template';
    if (path.includes('preview-question')) return 'question';
    if (path.includes('preview-choice')) return 'choice';
    if (path.includes('preview-passage')) return 'sentence';
    return 'template'; // Default
  };
  
  // Fetch activity data when component mounts
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        console.log("Fetching activity with ID:", id);
        console.log("Template type from path:", getTemplateTypeFromPath());
        
        // First, check localStorage for newly added templates
        const newlyAddedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
        console.log("Found activities in localStorage:", newlyAddedActivities.length);
        
        // Try to find by exact ID match first
        let activity = newlyAddedActivities.find(a => a.id.toString() === id.toString());
        
        // If not found, check if it's maybe in the MongoDB sample data
        // In a real implementation, this would be a database query
        if (!activity) {
          console.log("Activity not found in localStorage, checking mock data");
          
          // This is a placeholder for where you would do the MongoDB query
          // For now, we'll just set a not found error
          throw new Error('Activity not found');
        }
        
        console.log("Found activity:", activity);
        
        // Set template type if not already set
        if (!activity.templateType) {
          activity.templateType = getTemplateTypeFromPath();
        }
        
        setActivity(activity);
        setActiveLevel(0);
        
        if (activity.levels && activity.levels.length > 0) {
          setCurrentQuestion(0);
          setCurrentPage(0);
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
    setCurrentPage(0);
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

  // Navigate between passage pages
  const nextPage = () => {
    if (!activity?.levels || !activity.levels[activeLevel]?.passage) return;
    
    // Check if passage has pages array or treat the whole passage as one page
    const pages = activity.levels[activeLevel].passage.pages || [activity.levels[activeLevel].passage];
    
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      // If at last page, move to questions
      setCurrentQuestion(0);
      setCurrentPage(-1); // Special value to indicate we're viewing questions
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (currentPage === -1) {
      // If in questions view, go back to last page of passage
      const pages = activity.levels[activeLevel].passage.pages || [activity.levels[activeLevel].passage];
      setCurrentPage(pages.length - 1);
    }
  };

  // Get content type icon
  const getContentTypeIcon = (contentType) => {
    if (!contentType) return faFont;
    
    switch(contentType.toLowerCase()) {
      case 'text': return faFont;
      case 'image': return faImage;
      case 'audio': 
      case 'voice': return faVolumeUp;
      default: return faFont;
    }
  };

  // Get template type icon
  const getTemplateTypeIcon = () => {
    if (!activity) return faListAlt;
    
    switch(activity.templateType) {
      case 'template': return faListAlt;
      case 'question': return faQuestionCircle;
      case 'choice': return faList;
      case 'sentence': return faBookOpen;
      default: return faLayerGroup;
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

  // Get current question (only if in question view mode)
  const question = currentLevel?.questions && currentLevel.questions.length > currentQuestion && currentPage === -1
    ? currentLevel.questions[currentQuestion]
    : null;

  // Get current passage page (only if in passage view mode)
  const passagePage = currentLevel?.passage && currentPage >= 0
    ? currentLevel.passage.pages ? currentLevel.passage.pages[currentPage] : currentLevel.passage
    : null;

  return (
    <div className="preview-activity-container">
      <div className="preview-header">
        <div className="preview-title-area">
          <h1 className="preview-title">{activity.title}</h1>
          <p className="preview-subtitle">
            {activity.level} | {activity.category} | 
            {activity.templateType === 'template' && ' Assessment Template'}
            {activity.templateType === 'question' && ' Question Template'}
            {activity.templateType === 'choice' && ' Choice Template'}
            {activity.templateType === 'sentence' && ' Reading Passage'}
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
          {activity.status !== 'pending' && (
            <button 
              className="btn-edit"
              onClick={() => {
                // Determine the correct edit route based on template type
                let editPath = '/teacher/edit-activity';
                
                if (activity.templateType === 'template') editPath = '/teacher/edit-assessment';
                if (activity.templateType === 'question') editPath = '/teacher/edit-question';
                if (activity.templateType === 'choice') editPath = '/teacher/edit-choice';
                if (activity.templateType === 'sentence') editPath = '/teacher/edit-passage';
                
                navigate(`${editPath}/${activity.id}`);
              }}
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
          <p>This template is currently pending admin approval and cannot be edited until approved.</p>
        </div>
      )}

      <div className="preview-description">
        <h2>
          <FontAwesomeIcon icon={getTemplateTypeIcon()} className="template-icon" /> 
          Template Description
        </h2>
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
            {/* TEMPLATE TYPE: ASSESSMENT OR SENTENCE - Reading Passage View */}
            {(['template', 'sentence'].includes(activity.templateType) && 
              currentLevel?.passage && currentPage >= 0) && (
              <div className="passage-section">
                <h2>
                  <FontAwesomeIcon icon={faBookOpen} /> Reading Passage
                  {currentLevel.passage.pages && 
                   <span className="page-counter">Page {currentPage + 1} of {
                     Array.isArray(currentLevel.passage.pages) 
                     ? currentLevel.passage.pages.length 
                     : 1}</span>}
                </h2>
                
                <div className="reading-passage">
                  <div className="passage-content">
                    <p className="passage-text">
                      {passagePage?.text || currentLevel.passage.text || 'No passage text available.'}
                    </p>
                    
                    {(passagePage?.syllables || currentLevel.passage.syllables) && (
                      <div className="passage-syllables">
                        <h4>Syllable Breakdown:</h4>
                        <p>{passagePage?.syllables || currentLevel.passage.syllables}</p>
                      </div>
                    )}
                    
                    {(passagePage?.translation || currentLevel.passage.translation) && (
                      <div className="passage-translation">
                        <h4>Translation/Notes:</h4>
                        <p>{passagePage?.translation || currentLevel.passage.translation}</p>
                      </div>
                    )}
                    
                    {/* Audio button */}
                    {(passagePage?.audioFile || currentLevel.passage.audioFile) && (
                      <button className="audio-button">
                        <FontAwesomeIcon icon={faVolumeUp} /> Listen
                      </button>
                    )}
                  </div>
                  
                  {/* Passage image */}
                  {(passagePage?.imagePreview || currentLevel.passage.imagePreview) && (
                    <div className="passage-media">
                      <img 
                        src={passagePage?.imagePreview || currentLevel.passage.imagePreview} 
                        alt="Supporting visual" 
                        className="passage-image"
                      />
                    </div>
                  )}
                </div>

                {/* Passage navigation buttons */}
                <div className="passage-navigation">
                  <button
                    className="passage-nav-button"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} /> Previous Page
                  </button>

                  <button
                    className="passage-nav-button"
                    onClick={nextPage}
                  >
                    {currentPage < ((currentLevel.passage.pages?.length || 1) - 1)
                      ? <>Next Page <FontAwesomeIcon icon={faChevronRight} /></>
                      : <>Go to Questions <FontAwesomeIcon icon={faChevronRight} /></>
                    }
                  </button>
                </div>
              </div>
            )}
            
            {/* TEMPLATE TYPE: CHOICE */}
            {activity.templateType === 'choice' && (
              <div className="choice-preview">
                <h2>
                  <FontAwesomeIcon icon={faList} /> Choice Preview
                </h2>
                
                <div className="choice-card">
                  <div className="choice-details">
                    <div className="choice-item">
                      <span className="choice-label">Type:</span>
                      <span className="choice-value">{activity.choiceType}</span>
                    </div>
                    
                    <div className="choice-item">
                      <span className="choice-label">Value:</span>
                      <span className="choice-value">{activity.choiceValue}</span>
                    </div>
                    
                    {activity.soundText && (
                      <div className="choice-item">
                        <span className="choice-label">Sound:</span>
                        <span className="choice-value">{activity.soundText}</span>
                        {activity.hasAudio && (
                          <button className="audio-button small">
                            <FontAwesomeIcon icon={faVolumeUp} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Choice image */}
                  {activity.hasImage && activity.imagePreview && (
                    <div className="choice-media">
                      <img 
                        src={activity.imagePreview} 
                        alt={`Visual for ${activity.choiceValue}`} 
                        className="choice-image"
                      />
                    </div>
                  )}
                </div>
                
                {/* Example usage based on choice type */}
                <div className="choice-usage-example">
                  <h3>Example Usage in Question</h3>
                  <div className="usage-example">
                    {/* Different examples based on choice type */}
                    {activity.choiceType?.includes('BigLetter') && (
                      <>
                        <p className="example-question">Anong katumbas na maliit na letra?</p>
                        <div className="example-choice">{activity.choiceValue}</div>
                      </>
                    )}
                    
                    {activity.choiceType?.includes('SmallLetter') && (
                      <>
                        <p className="example-question">Anong katumbas na malaking letra?</p>
                        <div className="example-choice">{activity.choiceValue}</div>
                      </>
                    )}
                    
                    {activity.choiceType?.includes('Sound') && (
                      <>
                        <p className="example-question">Anong tunog ng letra?</p>
                        <div className="example-choice">
                          {activity.soundText}
                          <FontAwesomeIcon icon={faVolumeUp} className="sound-icon" />
                        </div>
                      </>
                    )}
                    
                    {activity.choiceType?.includes('Text') && !activity.choiceType?.includes('Sound') && (
                      <>
                        <p className="example-question">
                          {activity.choiceType === 'wordText' 
                            ? 'Piliin ang tamang larawan para sa salitang:' 
                            : 'Kapag pinagsama ang mga pantig, ano ang mabubuo?'}
                        </p>
                        <div className="example-choice">{activity.choiceValue}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* TEMPLATE TYPE: QUESTION */}
            {activity.templateType === 'question' && (
              <div className="question-template-preview">
                <h2>
                  <FontAwesomeIcon icon={faQuestionCircle} /> Question Template Preview
                </h2>
                
                <div className="question-template-card">
                  <div className="question-template-details">
                    <div className="question-template-item">
                      <span className="question-template-label">Question Text:</span>
                      <span className="question-template-value">{activity.title}</span>
                    </div>
                    
                    <div className="question-template-item">
                      <span className="question-template-label">Question Type:</span>
                      <span className="question-template-value">{activity.questionType}</span>
                    </div>
                    
                    <div className="question-template-item">
                      <span className="question-template-label">Applicable Choice Types:</span>
                      <div className="choice-types-list">
                        {activity.applicableChoiceTypes?.map((type, index) => (
                          <span key={index} className="choice-type-tag">{type}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="question-template-item">
                      <span className="question-template-label">Correct Choice Type:</span>
                      <span className="question-template-value highlight">{activity.correctChoiceType}</span>
                    </div>
                  </div>
                </div>
                
                {/* Show an example of how this question would look */}
                <div className="question-example">
                  <h3>Example Implementation</h3>
                  <div className="example-question-card">
                    <p className="example-question-text">{activity.title}</p>
                    
                    {/* Different examples based on question type */}
                    {activity.questionType === 'patinig' && renderPatinigExample(activity)}
                    {activity.questionType === 'katinig' && renderKatinigExample(activity)}
                    {activity.questionType === 'malapantig' && renderMalapantigExample(activity)}
                    {activity.questionType === 'word' && renderWordExample(activity)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Questions section for template and sentence types */}
            {(['template', 'sentence'].includes(activity.templateType) && 
              currentPage === -1 && question) && (
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
                  
                  {/* Media based on question content type */}
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
                  
                  {/* Answer options section */}
                  <div className="options-container">
                    {/* For templates with regular multiple-choice options */}
                    {activity.templateType === 'template' && question.options && 
                      question.options.map((option, idx) => (
                        <div 
                          key={idx} 
                          className={`option-item ${idx === question.correctAnswer ? 'correct' : ''}`}
                        >
                          <input 
                            type="radio" 
                            id={`opt${idx}`} 
                            name="question-option" 
                            defaultChecked={idx === question.correctAnswer && activeTab === 'teacher'}
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
                      ))
                    }
                    
                    {/* For sentence templates */}
                    {activity.templateType === 'sentence' && (
                      <>
                        <div className="option-item correct">
                          <input 
                            type="radio" 
                            id="correctAnswer" 
                            name="question-option" 
                            defaultChecked={activeTab === 'teacher'}
                          />
                          <label htmlFor="correctAnswer">
                            {question.correctAnswer || 'Correct answer'}
                            {activeTab === 'teacher' && (
                              <span className="correct-answer-indicator">
                                <FontAwesomeIcon icon={faCheckCircle} />
                              </span>
                            )}
                          </label>
                        </div>
                        
                        {question.options && question.options.map((option, idx) => (
                          <div key={idx} className="option-item">
                            <input 
                              type="radio" 
                              id={`opt${idx}`} 
                              name="question-option" 
                            />
                            <label htmlFor={`opt${idx}`}>{option}</label>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  
                  {/* Hint section (only shown in teacher view) */}
                  {activeTab === 'teacher' && question.hint && (
                    <div className="question-hint">
                      <h4>Hint/Explanation:</h4>
                      <p>{question.hint}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // TEACHER VIEW
          <div className="teacher-view">
            <div className="teacher-details">
              <h2>Teacher Information</h2>
              
              {/* Metadata section */}
              <div className="detail-section">
                <h3>Template Metadata</h3>
                <div className="detail-grid">
                  {/* Basic metadata for all template types */}
                  <div className="detail-item">
                    <span className="detail-label">Template Type:</span>
                    <span className="detail-value">
                      {activity.templateType === 'template' && 'Assessment Template'}
                      {activity.templateType === 'question' && 'Question Template'}
                      {activity.templateType === 'choice' && 'Choice Template'}
                      {activity.templateType === 'sentence' && 'Reading Passage'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{activity.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reading Level:</span>
                    <span className="detail-value">{activity.level}</span>
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
                      {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1) || 'Draft'}
                    </span>
                  </div>
                  
                  {/* Template-type specific metadata */}
                  {activity.templateType === 'template' && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Structure:</span>
                        <span className="detail-value">
                          {activity.hasReadingPassage 
                            ? 'Reading Passage with Questions'
                            : 'Questions Only'}
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
                          {activity.questionCount || 
                           activity.levels?.reduce((sum, level) => sum + (level.questions?.length || 0), 0) || 0}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {activity.templateType === 'question' && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Question Type:</span>
                        <span className="detail-value">{activity.questionType}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Applicable Choice Types:</span>
                        <div className="value-tags">
                          {activity.applicableChoiceTypes?.map((type, index) => (
                            <span key={index} className="value-tag">{type}</span>
                          ))}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Correct Choice Type:</span>
                        <span className="detail-value highlight">{activity.correctChoiceType}</span>
                      </div>
                    </>
                  )}
                  
                  {activity.templateType === 'choice' && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Choice Type:</span>
                        <span className="detail-value">{activity.choiceType}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Choice Value:</span>
                        <span className="detail-value">{activity.choiceValue}</span>
                      </div>
                      {activity.soundText && (
                        <div className="detail-item">
                          <span className="detail-label">Sound Text:</span>
                          <span className="detail-value">{activity.soundText}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">Has Image:</span>
                        <span className="detail-value">{activity.hasImage ? 'Yes' : 'No'}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Has Audio:</span>
                        <span className="detail-value">{activity.hasAudio ? 'Yes' : 'No'}</span>
                      </div>
                    </>
                  )}
                  
                  {activity.templateType === 'sentence' && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Passage Pages:</span>
                        <span className="detail-value">
                          {activity.pages || 
                           currentLevel?.passage?.pages?.length || 1}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Questions:</span>
                        <span className="detail-value">
                          {activity.questions || 
                           currentLevel?.questions?.length || 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Usage Guidelines section */}
              <div className="detail-section">
                <h3>Usage Guidelines</h3>
                <div className="guidelines">
                  {activity.templateType === 'template' && (
                    <>
                      <p>This assessment template is designed for students at {activity.level} reading level in the {activity.category} category. Use it to evaluate student skills in this area.</p>
                      
                      <p>When assigning this template to students:</p>
                      <ul>
                        <li>Ensure students understand the instructions before starting</li>
                        <li>Allow sufficient time for completion (approximately 15-20 minutes)</li>
                        {activity.hasReadingPassage && (
                          <li>Provide a quiet environment for reading comprehension</li>
                        )}
                        <li>Review student answers to identify areas for intervention</li>
                      </ul>
                    </>
                  )}
                  
                  {activity.templateType === 'question' && (
                    <>
                      <p>This question template can be used when creating assessments or activities for the {activity.category} category at {activity.level} reading level.</p>
                      
                      <p>To use this template effectively:</p>
                      <ul>
                        <li>Select appropriate choices of type "{activity.correctChoiceType}" for correct answers</li>
                        <li>Select appropriate distractors from other applicable choice types</li>
                        <li>Ensure all choices are clear and appropriate for the reading level</li>
                        <li>Include visual or audio support when needed for dyslexic students</li>
                      </ul>
                    </>
                  )}
                  
                  {activity.templateType === 'choice' && (
                    <>
                      <p>This choice template represents a "{activity.choiceType}" choice with value "{activity.choiceValue}". It can be used in questions for the {activity.category} category.</p>
                      
                      <p>Appropriate uses for this choice:</p>
                      <ul>
                        <li>As a correct answer or distractor in {activity.category} questions</li>
                        <li>In activities for {activity.level} reading level</li>
                        {activity.hasImage && <li>With visual support for better recognition</li>}
                        {activity.hasAudio && <li>With audio support for pronunciation practice</li>}
                      </ul>
                    </>
                  )}
                  
                  {activity.templateType === 'sentence' && (
                    <>
                      <p>This reading passage is designed for students at {activity.level} reading level. It contains {activity.pages || currentLevel?.passage?.pages?.length || 1} page(s) with supporting images and {activity.questions || currentLevel?.questions?.length || 0} comprehension questions.</p>
                      
                      <p>When using this passage:</p>
                      <ul>
                        <li>Present one page at a time to avoid overwhelming dyslexic students</li>
                        <li>Allow students to hear the audio recording if needed</li>
                        <li>Review syllable breakdowns to support reading</li>
                        <li>Ask comprehension questions only after complete reading</li>
                        <li>Use the images to reinforce understanding</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
              
              {/* Content Overview (for assessment and sentence templates) */}
              {(activity.templateType === 'template' || activity.templateType === 'sentence') && (
                <div className="detail-section">
                  <h3>Levels and Questions Overview</h3>
                  {activity.levels?.map((level, levelIndex) => (
                    <div key={levelIndex} className="level-overview">
                      <h4>{level.levelName || `Level ${levelIndex + 1}`}</h4>
                      
                      {/* Passage overview */}
                      {(activity.hasReadingPassage || activity.templateType === 'sentence') && level.passage && (
                        <div className="passage-overview">
                          <h5>Reading Passage</h5>
                          <p className="passage-preview">
                            {level.passage.text && (level.passage.text.length > 100 
                              ? level.passage.text.substring(0, 100) + '...' 
                              : level.passage.text)}
                          </p>
                          {level.passage.imagePreview && (
                            <div className="image-indicator">
                              <FontAwesomeIcon icon={faImage} /> Has supporting image
                            </div>
                          )}
                          {level.passage.audioFile && (
                            <div className="audio-indicator">
                              <FontAwesomeIcon icon={faVolumeUp} /> Has audio recording
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Questions overview */}
                      <h5>Questions ({level.questions?.length || 0})</h5>
                      <div className="questions-overview">
                        {level.questions?.map((q, qIndex) => (
                          <div key={qIndex} className="question-overview-item">
                            <div className="question-header">
                              <span className="question-number">Q{qIndex + 1}:</span>
                              <div className="question-content-type">
                                <FontAwesomeIcon icon={getContentTypeIcon(q.contentType)} />
                                <span>{q.contentType?.charAt(0).toUpperCase() + q.contentType?.slice(1) || 'Text'}</span>
                              </div>
                            </div>
                            <p className="question-text-preview">
                              {q.questionText?.length > 80 
                                ? q.questionText.substring(0, 80) + '...' 
                                : q.questionText}
                            </p>
                            <div className="correct-answer">
                              <span className="answer-label">Correct Answer:</span>
                              <span className="answer-value">
                                {activity.templateType === 'template' 
                                  ? (q.options?.[q.correctAnswer] || 'Not specified')
                                  : (q.correctAnswer || 'Not specified')}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {(!level.questions || level.questions.length === 0) && (
                          <p className="no-questions">No questions defined for this level.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for rendering question examples based on type
const renderPatinigExample = (activity) => {
  if (activity.correctChoiceType === 'patinigSmallLetter') {
    return (
      <>
        <div className="example-question-image">A</div>
        <div className="example-options">
          <div className="example-option correct">a</div>
          <div className="example-option">e</div>
        </div>
      </>
    );
  } else if (activity.correctChoiceType === 'patinigBigLetter') {
    return (
      <>
        <div className="example-question-image">a</div>
        <div className="example-options">
          <div className="example-option correct">A</div>
          <div className="example-option">E</div>
        </div>
      </>
    );
  } else if (activity.correctChoiceType === 'patinigSound') {
    return (
      <>
        <div className="example-question-image">A</div>
        <div className="example-options">
          <div className="example-option correct">/ah/</div>
          <div className="example-option">/eh/</div>
        </div>
      </>
    );
  }
  return null;
};

const renderKatinigExample = (activity) => {
  if (activity.correctChoiceType === 'katinigSmallLetter') {
    return (
      <>
        <div className="example-question-image">B</div>
        <div className="example-options">
          <div className="example-option correct">b</div>
          <div className="example-option">d</div>
        </div>
      </>
    );
  } else if (activity.correctChoiceType === 'katinigBigLetter') {
    return (
      <>
        <div className="example-question-image">b</div>
        <div className="example-options">
          <div className="example-option correct">B</div>
          <div className="example-option">D</div>
        </div>
      </>
    );
  } else if (activity.correctChoiceType === 'katinigSound') {
    return (
      <>
        <div className="example-question-image">B</div>
        <div className="example-options">
          <div className="example-option correct">/buh/</div>
          <div className="example-option">/duh/</div>
        </div>
      </>
    );
  }
  return null;
};

const renderMalapantigExample = (activity) => {
  if (activity.title.includes('pinagsama')) {
    return (
      <>
        <div className="example-question-value">BO + LA</div>
        <div className="example-options">
          <div className="example-option correct">BOLA</div>
          <div className="example-option">LABO</div>
        </div>
      </>
    );
  } else if (activity.title.includes('unang pantig')) {
    return (
      <>
        <div className="example-question-value">BOLA</div>
        <div className="example-options">
          <div className="example-option correct">BO</div>
          <div className="example-option">LA</div>
        </div>
      </>
    );
  }
  return null;
};

const renderWordExample = (activity) => {
  if (activity.title.includes('larawan')) {
    return (
      <>
        <div className="example-question-value">BOLA</div>
        <div className="example-options with-images">
          <div className="example-option correct">
            <div className="option-image-placeholder">
              <FontAwesomeIcon icon={faImage} />
            </div>
            <span>Ball image</span>
          </div>
          <div className="example-option">
            <div className="option-image-placeholder">
              <FontAwesomeIcon icon={faImage} />
            </div>
            <span>Book image</span>
          </div>
        </div>
      </>
    );
  } else if (activity.title.includes('babaybayin')) {
    return (
      <>
        <div className="example-question-image-large">
          <div className="option-image-placeholder large">
            <FontAwesomeIcon icon={faImage} />
          </div>
          <span>Ball image</span>
        </div>
        <div className="example-options">
          <div className="example-option correct">B-O-L-A</div>
          <div className="example-option">B-A-L-O</div>
        </div>
      </>
    );
  }
  return null;
};

export default PreviewActivity;
                     