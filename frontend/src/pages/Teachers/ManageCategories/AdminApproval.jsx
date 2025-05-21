// src/pages/Teachers/ManageCategories/AdminApproval.jsx
import React, { useState } from "react";
import "../../../css/Teachers/ManageCategories/AdminApproval.css";


const AdminApproval = ({ templates, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState("question");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Get pending templates
  const pendingTemplates = {
    question: templates.questionTemplates.filter(t => !t.isApproved),
    choice: templates.choiceTemplates.filter(t => !t.isActive),
    sentence: templates.sentenceTemplates.filter(t => !t.isApproved)
  };
  
  // Filter templates based on search and category
  const filteredTemplates = pendingTemplates[activeTab].filter(template => {
    // Search term filter
    const searchMatch = 
      activeTab === "question" ? template.templateText.toLowerCase().includes(searchTerm.toLowerCase()) :
      activeTab === "choice" ? (template.choiceValue || "").toLowerCase().includes(searchTerm.toLowerCase()) :
      template.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const categoryMatch = 
      filterCategory === "all" ? true :
      template.category === filterCategory;
    
    return searchMatch && categoryMatch;
  });
  
  // Get unique categories
  const categories = ["all"];
  if (activeTab === "question") {
    templates.questionTemplates.forEach(t => {
      if (t.category && !categories.includes(t.category)) {
        categories.push(t.category);
      }
    });
  } else if (activeTab === "sentence") {
    templates.sentenceTemplates.forEach(t => {
      if (t.category && !categories.includes(t.category)) {
        categories.push(t.category);
      }
    });
  }
  
  const handleApprove = (id) => {
    onApprove(activeTab, id);
  };
  
  const openRejectModal = (template) => {
    setSelectedTemplate(template);
    setRejectionFeedback("");
    setShowFeedbackModal(true);
  };
  
  const handleReject = () => {
    if (!selectedTemplate) return;
    
    onReject(activeTab, selectedTemplate._id, rejectionFeedback);
    setShowFeedbackModal(false);
    setSelectedTemplate(null);
    setRejectionFeedback("");
  };
  
  return (
    <div className="admin-approval-container">
      <div className="aa-header">
        <h2>Admin Approval</h2>
        <p>Review and approve templates submitted by teachers.</p>
      </div>
      
      <div className="aa-tabs">
        <button 
          className={`aa-tab ${activeTab === 'question' ? 'active' : ''}`}
          onClick={() => setActiveTab('question')}
        >
          Question Templates
          <span className="aa-count">{pendingTemplates.question.length}</span>
        </button>
        <button 
          className={`aa-tab ${activeTab === 'choice' ? 'active' : ''}`}
          onClick={() => setActiveTab('choice')}
        >
          Choice Templates
          <span className="aa-count">{pendingTemplates.choice.length}</span>
        </button>
        <button 
          className={`aa-tab ${activeTab === 'sentence' ? 'active' : ''}`}
          onClick={() => setActiveTab('sentence')}
        >
          Sentence Templates
          <span className="aa-count">{pendingTemplates.sentence.length}</span>
        </button>
      </div>
      
      <div className="aa-filters">
        <div className="aa-search">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {(activeTab === "question" || activeTab === "sentence") && (
          <div className="aa-filter-group">
            <label>Category:</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="aa-template-list">
        {filteredTemplates.length === 0 ? (
          <div className="aa-no-templates">
            <p>No pending templates to approve.</p>
          </div>
        ) : (
          <div className="aa-table">
            {activeTab === "question" && (
              <>
                <div className="aa-header-row">
                  <div className="aa-header-cell">Question Text</div>
                  <div className="aa-header-cell">Category</div>
                  <div className="aa-header-cell">Question Type</div>
                  <div className="aa-header-cell">Actions</div>
                </div>
                
                {filteredTemplates.map(template => (
                  <div key={template._id} className="aa-row">
                    <div className="aa-cell">{template.templateText}</div>
                    <div className="aa-cell">{template.category}</div>
                    <div className="aa-cell">{template.questionType}</div>
                    <div className="aa-cell aa-actions">
                      <button 
                        className="aa-approve-btn"
                        onClick={() => handleApprove(template._id)}
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                      <button 
                        className="aa-reject-btn"
                        onClick={() => openRejectModal(template)}
                      >
                        <i className="fas fa-times"></i> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {activeTab === "choice" && (
              <>
                <div className="aa-header-row">
                  <div className="aa-header-cell">Value</div>
                  <div className="aa-header-cell">Type</div>
                  <div className="aa-header-cell">Image</div>
                  <div className="aa-header-cell">Sound</div>
                  <div className="aa-header-cell">Actions</div>
                </div>
                
                {filteredTemplates.map(template => (
                  <div key={template._id} className="aa-row">
                    <div className="aa-cell">{template.choiceValue || '(Sound Only)'}</div>
                    <div className="aa-cell">{template.choiceType}</div>
                    <div className="aa-cell">
                      {template.choiceImage ? (
                        <img 
                          src={template.choiceImage} 
                          alt={template.choiceValue || 'Choice'} 
                          className="aa-choice-image"
                        />
                      ) : (
                        <span>No Image</span>
                      )}
                    </div>
                    <div className="aa-cell">
                      {template.soundText ? template.soundText : 'No Sound'}
                    </div>
                    <div className="aa-cell aa-actions">
                      <button 
                        className="aa-approve-btn"
                        onClick={() => handleApprove(template._id)}
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                      <button 
                        className="aa-reject-btn"
                        onClick={() => openRejectModal(template)}
                      >
                        <i className="fas fa-times"></i> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {activeTab === "sentence" && (
              <>
                <div className="aa-header-row">
                  <div className="aa-header-cell">Title</div>
                  <div className="aa-header-cell">Reading Level</div>
                  <div className="aa-header-cell">Pages</div>
                  <div className="aa-header-cell">Questions</div>
                  <div className="aa-header-cell">Actions</div>
                </div>
                
                {filteredTemplates.map(template => (
                  <div key={template._id} className="aa-row">
                    <div className="aa-cell">{template.title}</div>
                    <div className="aa-cell">{template.readingLevel}</div>
                    <div className="aa-cell">{template.sentenceText?.length || 0}</div>
                    <div className="aa-cell">{template.sentenceQuestions?.length || 0}</div>
                    <div className="aa-cell aa-actions">
                      <button 
                        className="aa-approve-btn"
                        onClick={() => handleApprove(template._id)}
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                      <button 
                        className="aa-reject-btn"
                        onClick={() => openRejectModal(template)}
                      >
                        <i className="fas fa-times"></i> Reject
                      </button>
                      <button 
                        className="aa-preview-btn"
                        onClick={() => {/* Show preview */}}
                      >
                        <i className="fas fa-eye"></i> Preview
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      
      {showFeedbackModal && (
        <div className="aa-modal-overlay">
          <div className="aa-modal">
            <div className="aa-modal-header">
              <h3>Rejection Feedback</h3>
              <button 
                className="aa-modal-close"
                onClick={() => setShowFeedbackModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="aa-modal-body">
              <p>Please provide feedback for why this template is being rejected:</p>
              <textarea
                className="aa-feedback-textarea"
                value={rejectionFeedback}
                onChange={e => setRejectionFeedback(e.target.value)}
                placeholder="Enter feedback for the teacher..."
                rows={5}
                required
              ></textarea>
            </div>
            <div className="aa-modal-footer">
              <button 
                className="aa-modal-cancel"
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </button>
              <button 
                className="aa-modal-submit"
                onClick={handleReject}
                disabled={!rejectionFeedback.trim()}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;