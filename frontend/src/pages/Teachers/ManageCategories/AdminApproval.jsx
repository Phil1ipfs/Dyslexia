// src/pages/Teachers/ManageCategories/AdminApproval.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faTimes, 
  faEye, 
  faInfoCircle,
  faLanguage,
  faFont,
  faBook,
  faVolumeUp,
  faImage
} from '@fortawesome/free-solid-svg-icons';
import "../../../css/Teachers/ManageCategories/AdminApproval.css";

const AdminApproval = ({ templates, onApprove, onReject }) => {
  const [selectedTab, setSelectedTab] = useState('question');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Get pending templates
  const getPendingTemplates = () => {
    switch (selectedTab) {
      case 'question':
        return templates.questionTemplates.filter(t => !t.isApproved);
      case 'choice':
        return templates.choiceTemplates.filter(t => !t.isActive);
      case 'sentence':
        return templates.sentenceTemplates.filter(t => !t.isApproved);
      default:
        return [];
    }
  };
  
  // Filter templates by search term
  const filteredTemplates = getPendingTemplates().filter(template => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    if (selectedTab === 'question') {
      return (
        template.templateText.toLowerCase().includes(searchLower) ||
        template.category.toLowerCase().includes(searchLower) ||
        template.questionType.toLowerCase().includes(searchLower)
      );
    } else if (selectedTab === 'choice') {
      return (
        (template.choiceValue?.toLowerCase().includes(searchLower) || false) ||
        (template.soundText?.toLowerCase().includes(searchLower) || false) ||
        template.choiceType.toLowerCase().includes(searchLower)
      );
    } else if (selectedTab === 'sentence') {
      return (
        template.title.toLowerCase().includes(searchLower) ||
        template.readingLevel.toLowerCase().includes(searchLower) ||
        template.category.toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  });
  
  const handlePreview = (template) => {
    setCurrentTemplate(template);
    setIsPreviewModalOpen(true);
  };
  
  const handleApproveConfirm = (template) => {
    setCurrentTemplate(template);
    setIsApproveModalOpen(true);
  };
  
  const handleRejectConfirm = (template) => {
    setCurrentTemplate(template);
    setIsRejectModalOpen(true);
    setRejectReason('');
  };
  
  const handleApprove = () => {
    if (!currentTemplate) return;
    
    onApprove(selectedTab, currentTemplate._id);
    setIsApproveModalOpen(false);
    setCurrentTemplate(null);
  };
  
  const handleReject = () => {
    if (!currentTemplate || !rejectReason) return;
    
    onReject(selectedTab, currentTemplate._id, rejectReason);
    setIsRejectModalOpen(false);
    setCurrentTemplate(null);
    setRejectReason('');
  };
  
  // Helper function to get choice type display name
  const getChoiceTypeDisplayName = (type) => {
    const displayNames = {
      "patinigBigLetter": "Vowel (Uppercase)",
      "patinigSmallLetter": "Vowel (Lowercase)",
      "patinigSound": "Vowel Sound",
      "katinigBigLetter": "Consonant (Uppercase)",
      "katinigSmallLetter": "Consonant (Lowercase)",
      "katinigSound": "Consonant Sound",
      "malapatinigText": "Syllable Block",
      "wordText": "Word",
      "wordSound": "Word Sound"
    };
    return displayNames[type] || type;
  };
  
  // Helper to get appropriate icon for choice type
  const getChoiceTypeIcon = (type) => {
    if (type.includes('Sound')) {
      return faVolumeUp;
    } else if (type.includes('Letter')) {
      return faFont;
    } else if (type.includes('Text')) {
      return faLanguage;
    } else {
      return faFont;
    }
  };
  
  return (
    <div className="admin-approval-container">
      <div className="aa-header">
        <h2>Admin Approval</h2>
        <p>Review and approve teacher-created templates before they can be used in assessments.</p>
      </div>
      
      <div className="aa-tabs">
        <div 
          className={`aa-tab ${selectedTab === 'question' ? 'active' : ''}`}
          onClick={() => setSelectedTab('question')}
        >
          <FontAwesomeIcon icon={faLanguage} style={{ marginRight: '8px' }} />
          Question Templates 
          <span className="aa-badge">
            {templates.questionTemplates.filter(t => !t.isApproved).length}
          </span>
        </div>
        <div 
          className={`aa-tab ${selectedTab === 'choice' ? 'active' : ''}`}
          onClick={() => setSelectedTab('choice')}
        >
          <FontAwesomeIcon icon={faFont} style={{ marginRight: '8px' }} />
          Choice Templates 
          <span className="aa-badge">
            {templates.choiceTemplates.filter(t => !t.isActive).length}
          </span>
        </div>
        <div 
          className={`aa-tab ${selectedTab === 'sentence' ? 'active' : ''}`}
          onClick={() => setSelectedTab('sentence')}
        >
          <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px' }} />
          Sentence Templates 
          <span className="aa-badge">
            {templates.sentenceTemplates.filter(t => !t.isApproved).length}
          </span>
        </div>
      </div>
      
      <div className="aa-filters">
        <div className="aa-search">
          <input
            type="text"
            placeholder={`Search pending ${selectedTab} templates...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="aa-template-list">
        {filteredTemplates.length === 0 ? (
          <div className="aa-empty-section">
            <div className="aa-empty-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3>No pending approvals</h3>
            <p>There are no {selectedTab} templates waiting for your approval at this time.</p>
          </div>
        ) : (
          <div className="aa-table">
            <div className="aa-header-row">
              {selectedTab === 'question' && (
                <>
                  <div className="aa-header-cell">Question Text</div>
                  <div className="aa-header-cell">Category</div>
                  <div className="aa-header-cell">Question Type</div>
                  <div className="aa-header-cell">Created By</div>
                  <div className="aa-header-cell">Actions</div>
                </>
              )}
              
              {selectedTab === 'choice' && (
                <>
                  <div className="aa-header-cell">Value</div>
                  <div className="aa-header-cell">Type</div>
                  <div className="aa-header-cell">Asset</div>
                  <div className="aa-header-cell">Created By</div>
                  <div className="aa-header-cell">Actions</div>
                </>
              )}
              
              {selectedTab === 'sentence' && (
                <>
                  <div className="aa-header-cell">Title</div>
                  <div className="aa-header-cell">Reading Level</div>
                  <div className="aa-header-cell">Pages</div>
                  <div className="aa-header-cell">Created By</div>
                  <div className="aa-header-cell">Actions</div>
                </>
              )}
            </div>
            
            {filteredTemplates.map(template => (
              <div key={template._id} className="aa-row">
                {selectedTab === 'question' && (
                  <>
                    <div className="aa-cell">{template.templateText}</div>
                    <div className="aa-cell">{template.category}</div>
                    <div className="aa-cell">
                      {template.questionType === "patinig" ? "Vowel (Patinig)" : 
                       template.questionType === "katinig" ? "Consonant (Katinig)" :
                       template.questionType === "malapantig" ? "Syllable (Malapantig)" :
                       template.questionType === "word" ? "Word" :
                       template.questionType === "sentence" ? "Reading Passage" : 
                       template.questionType}
                    </div>
                    <div className="aa-cell">Teacher</div>
                    <div className="aa-cell aa-actions">
                      <button 
                        className="aa-preview-btn"
                        onClick={() => handlePreview(template)}
                        title="Preview"
                      >
                        <FontAwesomeIcon icon={faEye} /> Preview
                      </button>
                      <button 
                        className="aa-approve-btn"
                        onClick={() => handleApproveConfirm(template)}
                        title="Approve"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} /> Approve
                      </button>
                      <button 
                        className="aa-reject-btn"
                        onClick={() => handleRejectConfirm(template)}
                        title="Reject"
                      >
                        <FontAwesomeIcon icon={faTimes} /> Reject
                      </button>
                    </div>
                  </>
                )}
                
                {selectedTab === 'choice' && (
                  <>
                    <div className="aa-cell">
                      <FontAwesomeIcon 
                        icon={getChoiceTypeIcon(template.choiceType)} 
                        style={{ marginRight: '8px', color: '#4e5c93' }} 
                      />
                      {template.choiceValue || template.soundText || '(No Value)'}
                    </div>
                    <div className="aa-cell">{getChoiceTypeDisplayName(template.choiceType)}</div>
                    <div className="aa-cell">
                      {template.choiceImage ? (
                        <img 
                          src={template.choiceImage} 
                          alt={template.choiceValue || 'Choice'} 
                          className="aa-choice-image"
                        />
                      ) : template.soundText ? (
                        <span className="aa-sound-badge">
                          <FontAwesomeIcon icon={faVolumeUp} /> {template.soundText}
                        </span>
                      ) : (
                        <span className="aa-no-asset">None</span>
                      )}
                    </div>
                    <div className="aa-cell">Teacher</div>
                    <div className="aa-cell aa-actions">
                      <button 
                        className="aa-preview-btn"
                        onClick={() => handlePreview(template)}
                        title="Preview"
                      >
                        <FontAwesomeIcon icon={faEye} /> Preview
                      </button>
                      <button 
                        className="aa-approve-btn"
                        onClick={() => handleApproveConfirm(template)}
                        title="Approve"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} /> Approve
                      </button>
                      <button 
                        className="aa-reject-btn"
                        onClick={() => handleRejectConfirm(template)}
                        title="Reject"
                      >
                        <FontAwesomeIcon icon={faTimes} /> Reject
                      </button>
                    </div>
                  </>
                )}
                
                {selectedTab === 'sentence' && (
                  <>
                    <div className="aa-cell">
                      <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px', color: '#4e5c93' }} />
                      {template.title}
                    </div>
                    <div className="aa-cell">{template.readingLevel}</div>
                    <div className="aa-cell">{template.sentenceText?.length || 0} pages</div>
                    <div className="aa-cell">Teacher</div>
                    <div className="aa-cell aa-actions">
                      <button 
                        className="aa-preview-btn"
                        onClick={() => handlePreview(template)}
                        title="Preview"
                      >
                        <FontAwesomeIcon icon={faEye} /> Preview
                      </button>
                      <button 
                        className="aa-approve-btn"
                        onClick={() => handleApproveConfirm(template)}
                        title="Approve"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} /> Approve
                      </button>
                      <button 
                        className="aa-reject-btn"
                        onClick={() => handleRejectConfirm(template)}
                        title="Reject"
                      >
                        <FontAwesomeIcon icon={faTimes} /> Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Preview Modal */}
      {isPreviewModalOpen && currentTemplate && (
        <div className="aa-modal-overlay">
          <div className="aa-preview-modal">
            <div className="aa-modal-header">
              <h3>Template Preview</h3>
              <button 
                className="aa-modal-close"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="aa-modal-body">
              {selectedTab === 'question' && (
                <div className="aa-preview-card">
                  <h4 className="aa-preview-question">{currentTemplate.templateText}</h4>
                  
                  <div className="aa-preview-details">
                    <p><strong>Category:</strong> {currentTemplate.category}</p>
                    <p><strong>Question Type:</strong> {
                      currentTemplate.questionType === "patinig" ? "Vowel (Patinig)" : 
                      currentTemplate.questionType === "katinig" ? "Consonant (Katinig)" :
                      currentTemplate.questionType === "malapantig" ? "Syllable (Malapantig)" :
                      currentTemplate.questionType === "word" ? "Word" :
                      currentTemplate.questionType === "sentence" ? "Reading Passage" : 
                      currentTemplate.questionType
                    }</p>
                    <p><strong>Answer Options:</strong> {currentTemplate.applicableChoiceTypes.map(
                      type => getChoiceTypeDisplayName(type)
                    ).join(', ')}</p>
                    <p><strong>Correct Answer Type:</strong> {getChoiceTypeDisplayName(currentTemplate.correctChoiceType)}</p>
                  </div>
                </div>
              )}
              
              {selectedTab === 'choice' && (
                <div className="aa-preview-card">
                  <div className="aa-preview-choice">
                    {currentTemplate.choiceImage && (
                      <div className="aa-preview-image">
                        <img src={currentTemplate.choiceImage} alt={currentTemplate.choiceValue || 'Choice'} />
                      </div>
                    )}
                    <div className="aa-preview-value">
                      {currentTemplate.choiceValue || (currentTemplate.soundText && `Sound: ${currentTemplate.soundText}`) || 'No Value'}
                    </div>
                  </div>
                  
                  <div className="aa-preview-details">
                    <p><strong>Type:</strong> {getChoiceTypeDisplayName(currentTemplate.choiceType)}</p>
                    <p><strong>Has Image:</strong> {currentTemplate.choiceImage ? 'Yes' : 'No'}</p>
                    <p><strong>Has Sound:</strong> {currentTemplate.soundText ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
              
              {selectedTab === 'sentence' && (
                <div className="aa-preview-card">
                  <h4 className="aa-preview-title">{currentTemplate.title}</h4>
                  
                  <div className="aa-preview-details">
                    <p><strong>Category:</strong> {currentTemplate.category}</p>
                    <p><strong>Reading Level:</strong> {currentTemplate.readingLevel}</p>
                    <p><strong>Pages:</strong> {currentTemplate.sentenceText?.length || 0}</p>
                    <p><strong>Questions:</strong> {currentTemplate.sentenceQuestions?.length || 0}</p>
                  </div>
                  
                  {currentTemplate.sentenceText?.length > 0 && (
                    <div className="aa-page-preview">
                      <h5>First Page</h5>
                      <div className="aa-preview-page">
                        {currentTemplate.sentenceText[0].image && (
                          <div className="aa-page-image">
                            <img src={currentTemplate.sentenceText[0].image} alt="Page illustration" />
                          </div>
                        )}
                        <p className="aa-page-text">{currentTemplate.sentenceText[0].text}</p>
                      </div>
                    </div>
                  )}
                  
                  {currentTemplate.sentenceQuestions?.length > 0 && (
                    <div className="aa-questions-preview">
                      <h5>Sample Question</h5>
                      <div className="aa-preview-question">
                        <p className="aa-question-text">{currentTemplate.sentenceQuestions[0].questionText}</p>
                        <p><strong>Correct Answer:</strong> {currentTemplate.sentenceQuestions[0].sentenceCorrectAnswer}</p>
                        <div className="aa-options-preview">
                          <p><strong>Options:</strong></p>
                          <ul>
                            {currentTemplate.sentenceQuestions[0].sentenceOptionAnswers.map((option, index) => (
                              <li key={index} className={index === 0 ? "aa-correct-option" : ""}>
                                {option} {index === 0 ? '(Correct)' : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="aa-modal-footer">
              <button 
                className="aa-modal-close-btn"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Approve Confirmation Modal */}
      {isApproveModalOpen && currentTemplate && (
        <div className="aa-modal-overlay">
          <div className="aa-modal">
            <div className="aa-modal-header">
              <h3>Confirm Approval</h3>
              <button 
                className="aa-modal-close"
                onClick={() => setIsApproveModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="aa-modal-body">
              <div className="aa-approve-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <p>
                Are you sure you want to approve this template? 
                Once approved, it will be available for teachers to use in assessments.
              </p>
              
              <div className="aa-template-summary">
                {selectedTab === 'question' && (
                  <p><strong>Question:</strong> {currentTemplate.templateText}</p>
                )}
                {selectedTab === 'choice' && (
                  <p><strong>Choice:</strong> {currentTemplate.choiceValue || currentTemplate.soundText || 'No Value'}</p>
                )}
                {selectedTab === 'sentence' && (
                  <p><strong>Title:</strong> {currentTemplate.title}</p>
                )}
              </div>
            </div>
            
            <div className="aa-modal-footer">
              <button 
                className="aa-modal-cancel"
                onClick={() => setIsApproveModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="aa-modal-submit"
                onClick={handleApprove}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {isRejectModalOpen && currentTemplate && (
        <div className="aa-modal-overlay">
          <div className="aa-modal">
            <div className="aa-modal-header">
              <h3>Provide Rejection Feedback</h3>
              <button 
                className="aa-modal-close"
                onClick={() => setIsRejectModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="aa-modal-body">
              <p>Please provide feedback to the teacher about why this template was rejected:</p>
              
              <div className="aa-template-summary">
                {selectedTab === 'question' && (
                  <p><strong>Question:</strong> {currentTemplate.templateText}</p>
                )}
                {selectedTab === 'choice' && (
                  <p><strong>Choice:</strong> {currentTemplate.choiceValue || currentTemplate.soundText || 'No Value'}</p>
                )}
                {selectedTab === 'sentence' && (
                  <p><strong>Title:</strong> {currentTemplate.title}</p>
                )}
              </div>
              
              <textarea
                className="aa-feedback-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please explain why this template is being rejected and what changes are needed..."
                rows={4}
                required
              ></textarea>
            </div>
            
            <div className="aa-modal-footer">
              <button 
                className="aa-modal-cancel"
                onClick={() => setIsRejectModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="aa-modal-submit"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Reject with Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;