import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faTimes, faSearch, faEdit, 
  faChevronLeft, faChevronRight, faFilter,
  faQuestion, faListAlt, faBook, faCheckCircle,
  faBan, faLayerGroup, faFileAlt, faVolumeUp,
  faImage, faParagraph, faClipboardList, faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import "../../../css/Teachers/ManageCategories/TemplateLibrary.css";
import "../../../css/Teachers/ManageCategories/TemplateModals.css";

const UnifiedTemplatePreview = ({ 
  isOpen, 
  onClose, 
  templates = [], 
  templateType = 'question',
  onEditTemplate
}) => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(1);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChoiceType, setFilterChoiceType] = useState('all');
  const [filterReadingLevel, setFilterReadingLevel] = useState('all');
  
  // Filtered templates
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  
  // Apply filters
  useEffect(() => {
    const filtered = templates.filter(template => {
      // Search term filter
      const searchMatch = 
        templateType === 'question' ? template.templateText?.toLowerCase().includes(searchTerm.toLowerCase()) :
        templateType === 'choice' ? (template.choiceValue || template.soundText || "").toLowerCase().includes(searchTerm.toLowerCase()) :
        template.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const categoryMatch = 
        filterCategory === "all" ? true :
        templateType === 'question' ? template.category === filterCategory :
        templateType === 'sentence' ? template.category === filterCategory :
        true; // Choice templates don't have categories
      
      // Reading level filter
      const readingLevelMatch =
        filterReadingLevel === "all" ? true :
        templateType === 'sentence' ? template.readingLevel === filterReadingLevel :
        true;
      
      // Choice type filter
      const choiceTypeMatch = 
        filterChoiceType === "all" ? true :
        templateType === 'choice' ? (
          filterChoiceType === "patinig" ? template.choiceType?.includes("patinig") :
          filterChoiceType === "katinig" ? template.choiceType?.includes("katinig") :
          filterChoiceType === "Letter" ? template.choiceType?.includes("Letter") :
          filterChoiceType === "Sound" ? template.choiceType?.includes("Sound") :
          filterChoiceType === "malapatinigText" ? template.choiceType === "malapatinigText" :
          filterChoiceType === "wordText" ? template.choiceType === "wordText" :
          true
        ) : true;
      
      // Status filter
      const statusMatch = 
        filterStatus === "all" ? true :
        filterStatus === "active" ? template.isActive :
        filterStatus === "inactive" ? !template.isActive : 
        true;
      
      return searchMatch && categoryMatch && statusMatch && choiceTypeMatch && readingLevelMatch;
    });
    
    setFilteredTemplates(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [templates, searchTerm, filterCategory, filterStatus, filterChoiceType, filterReadingLevel, templateType]);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTemplates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  
  // Get unique categories for the current template type
  const getCategories = () => {
    const categories = ["all"];
    if (templateType === 'question' || templateType === 'sentence') {
      templates.forEach(t => {
        if (t.category && !categories.includes(t.category)) {
          categories.push(t.category);
        }
      });
    }
    return categories;
  };
  
  // Get unique reading levels for sentence templates
  const getReadingLevels = () => {
    const levels = ["all"];
    if (templateType === 'sentence') {
      templates.forEach(t => {
        if (t.readingLevel && !levels.includes(t.readingLevel)) {
          levels.push(t.readingLevel);
        }
      });
    }
    return levels;
  };
  
  // Get unique choice types for choice templates
  const getChoiceTypes = () => {
    const types = ["all"];
    if (templateType === 'choice') {
      templates.forEach(t => {
        if (t.choiceType && !types.includes(t.choiceType)) {
          types.push(t.choiceType);
        }
      });
    }
    return types;
  };
  
  // Get template type icon
  const getTemplateTypeIcon = () => {
    switch(templateType) {
      case 'question':
        return faQuestion;
      case 'choice':
        return faListAlt;
      case 'sentence':
        return faBook;
      case 'assessment':
        return faClipboardList;
      case 'preassessment':
        return faClipboardCheck;
      default:
        return faQuestion;
    }
  };
  
  // Format template type for display
  const getTemplateTypeDisplay = () => {
    if (templateType === 'assessment') {
      return 'Assessment';
    }
    if (templateType === 'preassessment') {
      return 'Pre-Assessment';
    }
    return templateType.charAt(0).toUpperCase() + templateType.slice(1);
  };
  
  // Get question type display name
  const getQuestionTypeDisplay = (type) => {
    switch(type) {
      case 'multipleChoice':
        return 'Multiple Choice';
      case 'imageChoice':
        return 'Image Choice';
      case 'soundChoice': 
        return 'Sound Choice';
      case 'comprehension':
        return 'Comprehension';
      case 'sentence': 
        return 'Sentence';
      default:
        return type;
    }
  };
  
  // Sanitize image URL
  const sanitizeImageUrl = (url) => {
    if (!url) return '';
    
    // Check if the URL contains JavaScript code (a sign of corruption)
    if (url.includes('async () =>') || url.includes('function(') || url.includes('=>')) {
      // Extract the filename from the corrupted URL if possible
      const filenameMatch = url.match(/main-assessment\/[^/]*\/([^/]+)/);
      const filename = filenameMatch ? filenameMatch[1] : '';
      
      if (filename) {
        // Reconstruct a valid S3 URL with the extracted filename
        return `https://literexia-bucket.s3.amazonaws.com/main-assessment/sentences/${filename}`;
      } else {
        console.error('Could not parse corrupted image URL:', url);
        return '';
      }
    }
    
    return url;
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Render template content based on type
  const renderTemplateContent = (template) => {
    if (!template) return null;
    
    switch(templateType) {
      case 'question':
        return renderQuestionTemplate(template);
      case 'choice':
        return renderChoiceTemplate(template);
      case 'sentence':
        return renderSentenceTemplate(template);
      case 'assessment':
        return renderAssessmentTemplate(template);
      case 'preassessment':
        return renderPreAssessmentTemplate(template);
      default:
        return <div>Unknown template type</div>;
    }
  };
  
  // Render question template content
  const renderQuestionTemplate = (template) => {
    return (
      <>
        <div className="question-template-text">
          {template.templateText}
        </div>
        
        <div className="question-template-details">
          <div className="question-template-detail">
            <div className="question-template-detail-label">Category</div>
            <div className="question-template-detail-value">{template.category || 'N/A'}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Question Type</div>
            <div className="question-template-detail-value">{getQuestionTypeDisplay(template.questionType)}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Status</div>
            <div className="question-template-detail-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        
        {template.questionType === 'comprehension' && template.passage && (
          <div style={{ marginTop: '16px' }}>
            <div className="question-template-detail-label">
              <FontAwesomeIcon icon={faParagraph} style={{ marginRight: '8px' }} />
              Passage
            </div>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '14px',
              marginTop: '8px'
            }}>
              {template.passage}
            </div>
          </div>
        )}
        
        {template.questionType === 'comprehension' && template.comprehensionQuestions && template.comprehensionQuestions.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div className="question-template-detail-label">
              <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px' }} />
              Comprehension Questions
            </div>
            <div style={{ marginTop: '8px' }}>
              {template.comprehensionQuestions.map((question, index) => (
                <div key={index} style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <strong>Question {index + 1}:</strong> {question.questionText}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };
  
  // Render choice template content
  const renderChoiceTemplate = (template) => {
    return (
      <>
        <div className="question-template-text">
          {template.choiceValue || template.soundText || 'N/A'}
        </div>
        
        {(template.choiceImage || template.soundFile) && (
          <div style={{ margin: '16px 0' }}>
            {template.choiceImage ? (
              <div style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: '4px', 
                padding: '12px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <img 
                  src={sanitizeImageUrl(template.choiceImage)} 
                  alt="Choice" 
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </div>
            ) : (
              <div style={{ marginTop: '8px' }}>
                <audio controls style={{ width: '100%' }}>
                  <source src={template.soundFile} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}
        
        <div className="question-template-details">
          <div className="question-template-detail">
            <div className="question-template-detail-label">Choice Type</div>
            <div className="question-template-detail-value">{template.choiceType || 'N/A'}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Is Correct</div>
            <div className="question-template-detail-value">
              {template.isCorrect ? (
                <span style={{ color: '#40c057' }}>Yes</span>
              ) : 'No'}
            </div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Status</div>
            <div className="question-template-detail-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  // Render sentence template content
  const renderSentenceTemplate = (template) => {
    return (
      <>
        <div className="question-template-text">
          {template.title}
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '14px',
          margin: '16px 0'
        }}>
          {template.content}
        </div>
        
        {template.sentenceImage && (
          <div style={{ 
            margin: '16px 0',
            border: '1px solid #e9ecef', 
            borderRadius: '4px', 
            padding: '12px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <img 
              src={sanitizeImageUrl(template.sentenceImage)} 
              alt="Sentence" 
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          </div>
        )}
        
        <div className="question-template-details">
          <div className="question-template-detail">
            <div className="question-template-detail-label">Category</div>
            <div className="question-template-detail-value">{template.category || 'N/A'}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Reading Level</div>
            <div className="question-template-detail-value">{template.readingLevel || 'N/A'}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Status</div>
            <div className="question-template-detail-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        
        {template.sentenceQuestions && template.sentenceQuestions.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div className="question-template-detail-label">
              <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px' }} />
              Questions
            </div>
            <div style={{ marginTop: '8px' }}>
              {template.sentenceQuestions.map((question, index) => (
                <div key={index} style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <strong>Question {question.questionNumber || index + 1}:</strong> {question.questionText}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };
  
  // Render assessment template content
  const renderAssessmentTemplate = (template) => {
    return (
      <>
        <div className="question-template-text">
          Assessment Template - {template.readingLevel}
        </div>
        
        <div className="question-template-details">
          <div className="question-template-detail">
            <div className="question-template-detail-label">Reading Level</div>
            <div className="question-template-detail-value">{template.readingLevel}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Category</div>
            <div className="question-template-detail-value">{template.category}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Total Questions</div>
            <div className="question-template-detail-value">{template.questions ? template.questions.length : 0}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Status</div>
            <div className="question-template-detail-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        
        {template.questions && template.questions.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div className="question-template-detail-label">
              <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px' }} />
              Questions ({template.questions.length})
            </div>
            <div style={{ marginTop: '8px' }}>
              {template.questions.slice(0, 3).map((question, index) => (
                <div key={index} style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <strong>Question {index + 1}:</strong> {question.questionText}
                </div>
              ))}
              {template.questions.length > 3 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '8px', 
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  + {template.questions.length - 3} more questions
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };
  
  // Render pre-assessment template content
  const renderPreAssessmentTemplate = (template) => {
    return (
      <>
        <div className="question-template-text">
          Pre-Assessment Template
        </div>
        
        <div className="question-template-details">
          {template.targetLevel && (
            <div className="question-template-detail">
              <div className="question-template-detail-label">Target Level</div>
              <div className="question-template-detail-value">{template.targetLevel}</div>
            </div>
          )}
          <div className="question-template-detail">
            <div className="question-template-detail-label">Total Questions</div>
            <div className="question-template-detail-value">{template.questions ? template.questions.length : 0}</div>
          </div>
          <div className="question-template-detail">
            <div className="question-template-detail-label">Status</div>
            <div className="question-template-detail-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        
        {template.questions && template.questions.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div className="question-template-detail-label">
              <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px' }} />
              Questions ({template.questions.length})
            </div>
            <div style={{ marginTop: '8px' }}>
              {template.questions.slice(0, 3).map((question, index) => (
                <div key={index} style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <strong>Question {index + 1}:</strong> {question.questionText}
                </div>
              ))}
              {template.questions.length > 3 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '8px', 
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  + {template.questions.length - 3} more questions
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="template-modal-overlay">
      <div className="question-templates-modal">
        {/* Header */}
        <div className="question-templates-header">
          <h3>
            <FontAwesomeIcon icon={faEye} className="template-modal-icon" />
            {getTemplateTypeDisplay()} Templates
            {filteredTemplates.length > 0 && 
              <span style={{ marginLeft: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                ({currentPage} of {totalPages})
              </span>
            }
          </h3>
          <button 
            className="template-modal-close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Filter Bar */}
        <div className="question-templates-filters">
          <div className="question-templates-filter-label">
            <FontAwesomeIcon icon={faFilter} style={{ marginRight: '8px' }} />
            Status:
          </div>
          <select 
            className="question-templates-filter-select"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          {/* Category Filter - Available for question and sentence templates */}
          {(templateType === 'question' || templateType === 'sentence') && (
            <>
              <div className="question-templates-filter-label">Category:</div>
              <select 
                className="question-templates-filter-select"
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {getCategories().map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </>
          )}
          
          {/* Reading Level Filter - Available for sentence templates */}
          {templateType === 'sentence' && (
            <>
              <div className="question-templates-filter-label">Reading Level:</div>
              <select 
                className="question-templates-filter-select"
                value={filterReadingLevel} 
                onChange={(e) => setFilterReadingLevel(e.target.value)}
              >
                {getReadingLevels().map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level}
                  </option>
                ))}
              </select>
            </>
          )}
          
          {/* Choice Type Filter - Available for choice templates */}
          {templateType === 'choice' && (
            <>
              <div className="question-templates-filter-label">Choice Type:</div>
              <select 
                className="question-templates-filter-select"
                value={filterChoiceType} 
                onChange={(e) => setFilterChoiceType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="patinig">Patinig</option>
                <option value="katinig">Katinig</option>
                <option value="Letter">Letter</option>
                <option value="Sound">Sound</option>
                <option value="malapatinigText">Malapatinig</option>
                <option value="wordText">Word</option>
              </select>
            </>
          )}
          
          {/* Search */}
          <div className="question-templates-search">
            <input 
              type="text" 
              placeholder={`Search ${getTemplateTypeDisplay()} templates...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="question-templates-search-icon" />
          </div>
        </div>
        
        {/* Content */}
        <div className="question-templates-content">
          {filteredTemplates.length > 0 ? (
            <>
              {currentItems.map((template, index) => (
                <div key={index} className="question-template-item">
                  <div className="question-template-header">
                    <div className="question-template-title">
                      <FontAwesomeIcon icon={getTemplateTypeIcon()} className="question-template-icon" />
                      {templateType === 'question' ? 'Question Template' : 
                       templateType === 'choice' ? 'Choice Template' : 
                       templateType === 'sentence' ? 'Sentence Template' : 
                       templateType === 'assessment' ? 'Assessment Template' :
                       'Pre-Assessment Template'}
                    </div>
                    <button 
                      className="question-template-edit-btn"
                      onClick={() => onEditTemplate(template)}
                    >
                      <FontAwesomeIcon icon={faEdit} style={{ marginRight: '6px' }} />
                      Edit
                    </button>
                  </div>
                  <div className="question-template-body">
                    {renderTemplateContent(template)}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6c757d' }}>
              No templates found.
            </div>
          )}
        </div>
        
        {/* Pagination */}
        <div className="question-templates-pagination">
          <button 
            className="question-templates-pagination-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="question-templates-pagination-text">{currentPage} of {totalPages}</span>
          <button 
            className="question-templates-pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTemplatePreview;