import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../../components/TeacherPage/PreAssessment/ActivityPreviewModal.css';

import {
  faTimes,
  faChevronLeft,
  faChevronRight,
  faCheck,
  faImage,
  faFileAlt,
  faHeadphones,
  faBook,
  faLayerGroup,
  faQuestion
} from '@fortawesome/free-solid-svg-icons';

const ActivityPreviewModal = ({ activity, onClose, onSelectQuestion, selectedQuestions, isQuestionSelected }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  
  // Get levels from activity
  const levels = activity.levels || [];
  
  // Handle navigation between levels
  const goToNextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(currentLevel + 1);
    }
  };
  
  const goToPrevLevel = () => {
    if (currentLevel > 0) {
      setCurrentLevel(currentLevel - 1);
    }
  };
  
  // Toggle question selection mode
  const toggleSelectionMode = () => {
    setShowQuestionSelection(!showQuestionSelection);
  };
  
  // Get current level
  const currentLevelData = levels[currentLevel] || { questions: [], passage: { text: '' } };
  
  return (
    <div className="pre-assess-modal-overlay" onClick={onClose}>
      <div className="pre-assess-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pre-assess-modal-header">
          <h2 className="pre-assess-modal-title">
            {activity.title} 
            {showQuestionSelection && " - Select Questions"}
          </h2>
          <button 
            className="pre-assess-modal-close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="pre-assess-activity-preview">
          {/* Level Navigation */}
          {levels.length > 1 && (
            <div className="pre-assess-level-navigation">
              <button
                className="pre-assess-level-nav-btn"
                onClick={goToPrevLevel}
                disabled={currentLevel === 0}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              <div className="pre-assess-level-indicator">
                <span className="pre-assess-level-label">{currentLevelData.levelName || `Level ${currentLevel + 1}`}</span>
                <span className="pre-assess-level-count">{currentLevel + 1} of {levels.length}</span>
              </div>
              
              <button
                className="pre-assess-level-nav-btn"
                onClick={goToNextLevel}
                disabled={currentLevel === levels.length - 1}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
          
          <div className="pre-assess-modal-body">
            {/* Reading Passage (if exists) */}
            {currentLevelData.passage && currentLevelData.passage.text && (
              <div className="pre-assess-passage-preview">
                <div className="pre-assess-passage-header">
                  <FontAwesomeIcon icon={faBook} />
                  <h3>Reading Passage</h3>
                </div>
                
                <div className="pre-assess-passage-content">
                  <p className="pre-assess-passage-text">{currentLevelData.passage.text}</p>
                  
                  {currentLevelData.passage.syllables && (
                    <div className="pre-assess-passage-syllables">
                      <h4>Syllables:</h4>
                      <p>{currentLevelData.passage.syllables}</p>
                    </div>
                  )}
                  
                  {currentLevelData.passage.translation && (
                    <div className="pre-assess-passage-translation">
                      <h4>Translation/Notes:</h4>
                      <p>{currentLevelData.passage.translation}</p>
                    </div>
                  )}
                </div>
                
                {currentLevelData.passage.imagePreview && (
                  <div className="pre-assess-passage-media">
                    <img 
                      src={currentLevelData.passage.imagePreview} 
                      alt="Passage illustration" 
                      className="pre-assess-passage-image"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Questions */}
            <div className="pre-assess-questions-preview">
              <div className="pre-assess-questions-header">
                <div className="pre-assess-questions-title">
                  <FontAwesomeIcon icon={faQuestion} />
                  <h3>Questions</h3>
                </div>
                <div className="pre-assess-questions-count">
                  {currentLevelData.questions?.length || 0} question(s)
                </div>
              </div>
              
              {(!currentLevelData.questions || currentLevelData.questions.length === 0) ? (
                <div className="pre-assess-no-content">
                  <p>No questions found for this level.</p>
                </div>
              ) : (
                <div className="pre-assess-questions-list-preview">
                  {currentLevelData.questions.map((question, index) => (
                    <div 
                      key={index} 
                      className={`pre-assess-question-item ${
                        showQuestionSelection ? 
                          isQuestionSelected(activity.id, currentLevelData.id, question.id) ? 
                            'pre-assess-question-selected' : '' 
                          : ''
                      }`}
                      onClick={() => {
                        if (showQuestionSelection) {
                          onSelectQuestion(activity.id, currentLevelData.id, question.id);
                        }
                      }}
                    >
                      <div className="pre-assess-question-item-header">
                        <div className="pre-assess-question-item-number">
                          Question {index + 1}
                        </div>
                        
                        <div className="pre-assess-question-type-indicator">
                          <FontAwesomeIcon icon={
                            question.contentType === 'text' ? faFileAlt :
                            question.contentType === 'image' ? faImage :
                            faHeadphones
                          } />
                          <span>{question.contentType}</span>
                        </div>
                        
                        {showQuestionSelection && (
                          <div className="pre-assess-selection-checkbox">
                            {isQuestionSelected(activity.id, currentLevelData.id, question.id) ? (
                              <div className="pre-assess-selected-mark">
                                <FontAwesomeIcon icon={faCheck} />
                              </div>
                            ) : (
                              <div className="pre-assess-unselected-mark"></div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="pre-assess-question-item-content">
                        <div className="pre-assess-question-item-text">
                          {question.questionText}
                        </div>
                        
                        {question.contentType === 'image' && question.imagePreview && (
                          <div className="pre-assess-question-item-media">
                            <img 
                              src={question.imagePreview} 
                              alt="Question visual" 
                              className="pre-assess-question-image"
                            />
                          </div>
                        )}
                        
                        <div className="pre-assess-answer-options">
                          <div className="pre-assess-options-title">Answer Options:</div>
                          <div className="pre-assess-options-grid">
                            {question.options.map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`pre-assess-option-item ${
                                  optIndex === question.correctAnswer ? 'pre-assess-option-correct' : ''
                                }`}
                              >
                                {optIndex === question.correctAnswer && (
                                  <FontAwesomeIcon icon={faCheck} className="pre-assess-option-check" />
                                )}
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="pre-assess-modal-footer">
          <button 
            className="pre-assess-btn-tertiary"
            onClick={onClose}
          >
            Close Preview
          </button>
          
          <button
            className={`pre-assess-btn-selection ${showQuestionSelection ? 'pre-assess-btn-active' : ''}`}
            onClick={toggleSelectionMode}
          >
            {showQuestionSelection ? 'Exit Selection Mode' : 'Select Questions from this Activity'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityPreviewModal;