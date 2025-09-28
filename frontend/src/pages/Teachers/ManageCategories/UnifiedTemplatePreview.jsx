import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faEdit,
  faEye,
  faBook,
  faQuestionCircle,
  faChevronLeft,
  faChevronRight,
  faExpand,
  faCompress
} from '@fortawesome/free-solid-svg-icons';
import './UnifiedTemplatePreview.css';

/**
 * UnifiedTemplatePreview - Modal component for previewing multiple templates/assessments
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Array} props.templates - Array of templates to preview
 * @param {string} props.templateType - Type of templates being previewed
 * @param {Function} props.onEditTemplate - Function to edit a specific template
 */
const UnifiedTemplatePreview = ({ 
  isOpen, 
  onClose, 
  templates = [], 
  templateType = 'assessment',
  onEditTemplate 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const currentTemplate = templates[currentIndex];

  // Handle modal background click to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : templates.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < templates.length - 1 ? prev + 1 : 0));
  };

  // Handle edit template
  const handleEdit = () => {
    if (currentTemplate && onEditTemplate) {
      onEditTemplate(currentTemplate);
    }
  };

  // Render question content based on type
  const renderQuestionContent = (question) => {
    if (!question) return null;

    return (
      <div className="utp-question-content">
        {question.questionImage && (
          <div className="utp-question-image">
            <img 
              src={question.questionImage} 
              alt="Question visual" 
              className="utp-image"
            />
          </div>
        )}
        
        <div className="utp-question-text">
          <p>{question.questionText || question.prompt || 'No question text available'}</p>
        </div>

        {question.questionValue && (
          <div className="utp-question-value">
            <strong>Target Value:</strong> {question.questionValue}
          </div>
        )}

        {question.choiceOptions && question.choiceOptions.length > 0 && (
          <div className="utp-answer-choices">
            <h5>Answer Choices:</h5>
            <div className="utp-choices-grid">
              {question.choiceOptions.map((choice, index) => (
                <div 
                  key={index} 
                  className={`utp-choice ${choice.isCorrect ? 'correct' : ''}`}
                >
                  <span className="utp-choice-letter">{choice.optionId || String.fromCharCode(65 + index)}</span>
                  <span className="utp-choice-text">{choice.text || choice.content}</span>
                  {choice.isCorrect && <span className="utp-correct-indicator">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render template preview
  const renderTemplatePreview = () => {
    if (!currentTemplate) {
      return (
        <div className="utp-no-content">
          <FontAwesomeIcon icon={faQuestionCircle} size="3x" />
          <p>No templates available to preview</p>
        </div>
      );
    }

    return (
      <div className="utp-template-content">
        <div className="utp-template-header">
          <div className="utp-template-info">
            <h3 className="utp-template-title">
              {currentTemplate.title || currentTemplate.name || `${templateType} ${currentIndex + 1}`}
            </h3>
            <div className="utp-template-meta">
              <span className="utp-category">
                <FontAwesomeIcon icon={faBook} />
                {currentTemplate.category || 'General'}
              </span>
              {currentTemplate.difficulty && (
                <span className="utp-difficulty">
                  Level: {currentTemplate.difficulty}
                </span>
              )}
            </div>
          </div>
          
          <div className="utp-template-actions">
            <button 
              className="utp-btn utp-btn-edit"
              onClick={handleEdit}
              title="Edit Template"
            >
              <FontAwesomeIcon icon={faEdit} />
              Edit
            </button>
          </div>
        </div>

        <div className="utp-template-body">
          {currentTemplate.description && (
            <div className="utp-description">
              <p>{currentTemplate.description}</p>
            </div>
          )}

          {currentTemplate.questions && currentTemplate.questions.length > 0 ? (
            <div className="utp-questions-section">
              <h4>Questions ({currentTemplate.questions.length})</h4>
              <div className="utp-questions-list">
                {currentTemplate.questions.map((question, index) => (
                  <div key={index} className="utp-question-item">
                    <div className="utp-question-header">
                      <span className="utp-question-number">Q{index + 1}</span>
                      <span className="utp-question-type">
                        {question.questionType || 'Standard'}
                      </span>
                    </div>
                    {renderQuestionContent(question)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="utp-no-questions">
              <FontAwesomeIcon icon={faQuestionCircle} />
              <p>No questions available in this template</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`utp-modal-overlay ${isExpanded ? 'expanded' : ''}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="utp-modal">
        <div className="utp-modal-header">
          <div className="utp-header-left">
            <h2>
              <FontAwesomeIcon icon={faEye} />
              Preview {templateType.charAt(0).toUpperCase() + templateType.slice(1)}s
            </h2>
            <span className="utp-template-counter">
              {currentIndex + 1} of {templates.length}
            </span>
          </div>
          
          <div className="utp-header-right">
            <button
              className="utp-btn utp-btn-expand"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Compact View" : "Expanded View"}
            >
              <FontAwesomeIcon icon={isExpanded ? faCompress : faExpand} />
            </button>
            <button
              className="utp-btn utp-btn-close"
              onClick={onClose}
              title="Close Preview"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        <div className="utp-modal-body">
          {templates.length > 1 && (
            <div className="utp-navigation">
              <button
                className="utp-nav-btn utp-nav-prev"
                onClick={goToPrevious}
                disabled={templates.length <= 1}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                Previous
              </button>
              
              <div className="utp-navigation-dots">
                {templates.map((_, index) => (
                  <button
                    key={index}
                    className={`utp-nav-dot ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(index)}
                    title={`Go to template ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                className="utp-nav-btn utp-nav-next"
                onClick={goToNext}
                disabled={templates.length <= 1}
              >
                Next
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}

          <div className="utp-preview-content">
            {renderTemplatePreview()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTemplatePreview;