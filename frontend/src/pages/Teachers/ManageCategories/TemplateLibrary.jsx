// src/pages/Teachers/ManageCategories/TemplateLibrary.jsx
import React, { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import QuestionTemplateForm from "./QuestionTemplateForm";
import ChoiceTemplateForm from "./ChoiceTemplateForm";
import SentenceTemplateForm from "./SentenceTemplateForm";
import "../../../css/Teachers/ManageCategories/TemplateLibrary.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faEye, faTrash, faTimes, 
  faExclamationTriangle, faSearch, faCheckCircle,
  faInfoCircle, faLock, faLanguage, faVolumeUp,
  faImage, faFont, faBook, faCheck, faBan,
  faPuzzlePiece, faAsterisk, faFile, faFileAlt, 
  faBookOpen, faComments, faFilter, faArrowRight,
  faClipboardList, faChartLine, faUserGraduate,
  faLayerGroup, faCogs, faBullseye, faUsers,
  faGraduationCap, faSync, faExclamationCircle,
  faCheckDouble, faFileImage
} from '@fortawesome/free-solid-svg-icons';

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="tl-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="tl-tooltip-icon" />
    <span className="tl-tooltip-text">{text}</span>
  </div>
);

// Specific tooltip for rejection reasons
const RejectionTooltip = ({ reason }) => (
  <div className="tl-rejection-reason-tooltip">
    <FontAwesomeIcon icon={faExclamationCircle} className="tl-rejection-icon" />
    <span className="tl-tooltip-text">
      <strong>Rejection Reason:</strong><br />
      {reason}
    </span>
  </div>
);

const TemplateLibrary = ({ templates, setTemplates }) => {
  const [nestedTabIndex, setNestedTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitConfirmDialogOpen, setIsSubmitConfirmDialogOpen] = useState(false);
  const [isSubmitSuccessDialogOpen, setIsSubmitSuccessDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [tempFormData, setTempFormData] = useState(null);

  // Get template type based on nested tab index
  const getTemplateType = () => {
    switch (nestedTabIndex) {
      case 0:
        return "question";
      case 1:
        return "choice";
      case 2:
        return "sentence";
      default:
        return "question";
    }
  };

  // Get current templates based on nested tab index
  const getCurrentTemplates = () => {
    switch (nestedTabIndex) {
      case 0:
        return templates.questionTemplates;
      case 1:
        return templates.choiceTemplates;
      case 2:
        return templates.sentenceTemplates;
      default:
        return [];
    }
  };

  // Get template statistics
  const getTemplateStats = () => {
    const currentTemplates = getCurrentTemplates();
    const approved = currentTemplates.filter(t => 
      nestedTabIndex === 0 ? t.isApproved : 
      nestedTabIndex === 1 ? t.isActive : 
      t.isApproved
    ).length;
    const pending = currentTemplates.filter(t => 
      !t.isApproved && !t.isRejected
    ).length;
    const rejected = currentTemplates.filter(t => t.isRejected).length;
    
    return {
      total: currentTemplates.length,
      approved,
      pending,
      rejected
    };
  };

  const stats = getTemplateStats();

  // Filter templates based on search and filters
  const filteredTemplates = getCurrentTemplates().filter(template => {
    // Search term filter
    const searchMatch = 
      nestedTabIndex === 0 ? template.templateText?.toLowerCase().includes(searchTerm.toLowerCase()) :
      nestedTabIndex === 1 ? (template.choiceValue || template.soundText || "").toLowerCase().includes(searchTerm.toLowerCase()) :
      template.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const categoryMatch = 
      filterCategory === "all" ? true :
      nestedTabIndex === 0 ? template.category === filterCategory :
      nestedTabIndex === 2 ? template.category === filterCategory :
      true; // Choice templates don't have categories
    
    // Status filter - now includes rejected status
    const statusMatch = 
      filterStatus === "all" ? true :
      filterStatus === "approved" ? (
        nestedTabIndex === 0 ? template.isApproved : 
        nestedTabIndex === 1 ? template.isActive : 
        template.isApproved
      ) :
      filterStatus === "rejected" ? (
        nestedTabIndex === 0 ? template.isRejected : 
        nestedTabIndex === 1 ? template.isRejected : 
        template.isRejected
      ) :
      // Pending status (neither approved nor rejected)
      nestedTabIndex === 0 ? (!template.isApproved && !template.isRejected) : 
      nestedTabIndex === 1 ? (!template.isActive && !template.isRejected) : 
      (!template.isApproved && !template.isRejected);
    
    return searchMatch && categoryMatch && statusMatch;
  });

  // Get unique categories for the current template type
  const getCategories = () => {
    const categories = ["all"];
    if (nestedTabIndex === 0) {
      templates.questionTemplates.forEach(t => {
        if (t.category && !categories.includes(t.category)) {
          categories.push(t.category);
        }
      });
    } else if (nestedTabIndex === 2) {
      templates.sentenceTemplates.forEach(t => {
        if (t.category && !categories.includes(t.category)) {
          categories.push(t.category);
        }
      });
    }
    return categories;
  };

  // Check if a template can be edited (only if it's rejected)
  const canEditTemplate = (template) => {
    if (nestedTabIndex === 0) {
      return template.isRejected && !template.pendingApproval;
    } else if (nestedTabIndex === 1) {
      return template.isRejected && !template.pendingApproval;
    } else {
      return template.isRejected && !template.pendingApproval;
    }
  };

  // Check if a template can be deleted (only if it's rejected)
  const canDeleteTemplate = (template) => {
    if (nestedTabIndex === 0) {
      return template.isRejected && !template.pendingApproval;
    } else if (nestedTabIndex === 1) {
      return template.isRejected && !template.pendingApproval;
    } else {
      return template.isRejected && !template.pendingApproval;
    }
  };

  const handleAddTemplate = () => {
    setCurrentTemplate(null);
    setIsFormDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    // Check if template can be edited
    if (!canEditTemplate(template)) {
      alert("Only rejected templates can be modified. Templates that are approved or pending cannot be edited.");
      return;
    }
    
    setCurrentTemplate(template);
    setIsFormDialogOpen(true);
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleDeleteConfirm = (template) => {
    // Check if template can be deleted
    if (!canDeleteTemplate(template)) {
      alert("Only rejected templates can be deleted. Templates that are approved or pending cannot be deleted.");
      return;
    }
    
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    // In a real app, you'd make an API call to delete the template
    const updatedTemplates = { ...templates };
    if (nestedTabIndex === 0) {
      updatedTemplates.questionTemplates = updatedTemplates.questionTemplates.filter(
        t => t._id !== templateToDelete._id
      );
    } else if (nestedTabIndex === 1) {
      updatedTemplates.choiceTemplates = updatedTemplates.choiceTemplates.filter(
        t => t._id !== templateToDelete._id
      );
    } else if (nestedTabIndex === 2) {
      updatedTemplates.sentenceTemplates = updatedTemplates.sentenceTemplates.filter(
        t => t._id !== templateToDelete._id
      );
    }
    setTemplates(updatedTemplates);
    setIsDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleFormSubmit = (formData) => {
    // Store the form data temporarily
    setTempFormData(formData);
    // Show confirmation dialog for admin approval
    setIsSubmitConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!tempFormData) return;
    
    // Now process the form data for submission
    const updatedTemplates = { ...templates };
    
    if (nestedTabIndex === 0) {
      if (currentTemplate) {
        // Update existing template
        updatedTemplates.questionTemplates = updatedTemplates.questionTemplates.map(
          t => t._id === currentTemplate._id ? {
            ...tempFormData, 
            _id: currentTemplate._id, 
            isApproved: false,
            isRejected: false,
            pendingApproval: true
          } : t
        );
      } else {
        // Add new template
        updatedTemplates.questionTemplates = [
          ...updatedTemplates.questionTemplates,
          { 
            ...tempFormData, 
            _id: Date.now().toString(), 
            isApproved: false,
            isRejected: false,
            pendingApproval: true
          }
        ];
      }
    } else if (nestedTabIndex === 1) {
      if (currentTemplate) {
        updatedTemplates.choiceTemplates = updatedTemplates.choiceTemplates.map(
          t => t._id === currentTemplate._id ? {
            ...tempFormData, 
            _id: currentTemplate._id, 
            isActive: false,
            isRejected: false,
            pendingApproval: true
          } : t
        );
      } else {
        updatedTemplates.choiceTemplates = [
          ...updatedTemplates.choiceTemplates,
          { 
            ...tempFormData, 
            _id: Date.now().toString(), 
            isActive: false,
            isRejected: false,
            pendingApproval: true
          }
        ];
      }
    } else if (nestedTabIndex === 2) {
      if (currentTemplate) {
        updatedTemplates.sentenceTemplates = updatedTemplates.sentenceTemplates.map(
          t => t._id === currentTemplate._id ? {
            ...tempFormData, 
            _id: currentTemplate._id, 
            isApproved: false,
            isRejected: false,
            pendingApproval: true
          } : t
        );
      } else {
        updatedTemplates.sentenceTemplates = [
          ...updatedTemplates.sentenceTemplates,
          { 
            ...tempFormData, 
            _id: Date.now().toString(), 
            isApproved: false,
            isRejected: false,
            pendingApproval: true
          }
        ];
      }
    }
    
    setTemplates(updatedTemplates);
    setIsFormDialogOpen(false);
    setIsSubmitConfirmDialogOpen(false);
    setCurrentTemplate(null);
    setTempFormData(null);
    setIsSubmitSuccessDialogOpen(true);
    
    // Auto close success message after 3 seconds
    setTimeout(() => {
      setIsSubmitSuccessDialogOpen(false);
    }, 3000);
  };

  // Helper to get choice type display name
  const getChoiceTypeDisplayName = (type) => {
    const displayNames = {
      "patinigBigLetter": "Vowel (Uppercase)",
      "patinigSmallLetter": "Vowel (Lowercase)",
      "patinigSound": "Vowel Sound",
      "katinigBigLetter": "Consonant (Uppercase)",
      "katinigSmallLetter": "Consonant (Lowercase)",
      "katinigSound": "Consonant Sound",
      "malapatinigText": "Syllable Block",
      "wordText": "Complete Word",
      "wordSound": "Word Sound"
    };
    return displayNames[type] || type;
  };

  // Helper to get appropriate icon for choice type
  const getChoiceTypeIcon = (type) => {
    if (type?.includes('Sound')) {
      return faVolumeUp;
    } else if (type?.includes('Letter')) {
      return faFont;
    } else if (type?.includes('Text')) {
      return faLanguage;
    } else {
      return faFont;
    }
  };

  // Helper to get simplified question type for display
  const getQuestionTypeDisplay = (type) => {
    if (type === "patinig") return "Vowel (Patinig)";
    if (type === "katinig") return "Consonant (Katinig)";
    if (type === "malapantig") return "Syllable (Malapantig)";
    if (type === "word") return "Word";
    if (type === "sentence") return "Reading Passage";
    return type;
  };

  // Helper to get template status display (approved, pending, or rejected)
  const getTemplateStatusDisplay = (template) => {
    // For Question Templates
    if (nestedTabIndex === 0) {
      if (template.isApproved) {
        return { icon: faCheckCircle, label: "Approved", className: "tl-approved" };
      } else if (template.isRejected) {
        return { 
          icon: faBan, 
          label: "Rejected", 
          className: "tl-rejected",
          reason: template.rejectionReason || "Quality standards not met - please review and improve content"
        };
      } else {
        return { icon: faLock, label: "Pending Approval", className: "tl-pending" };
      }
    }
    // For Choice Templates
    else if (nestedTabIndex === 1) {
      if (template.isActive) {
        return { icon: faCheckCircle, label: "Active", className: "tl-approved" };
      } else if (template.isRejected) {
        return { 
          icon: faBan, 
          label: "Rejected", 
          className: "tl-rejected",
          reason: template.rejectionReason || "Content does not meet curriculum standards - please revise"
        };
      } else {
        return { icon: faLock, label: "Pending Approval", className: "tl-pending" };
      }
    }
    // For Sentence Templates
    else {
      if (template.isApproved) {
        return { icon: faCheckCircle, label: "Approved", className: "tl-approved" };
      } else if (template.isRejected) {
        return { 
          icon: faBan, 
          label: "Rejected", 
          className: "tl-rejected",
          reason: template.rejectionReason || "Reading level or content inappropriate - needs adjustment"
        };
      } else {
        return { icon: faLock, label: "Pending Approval", className: "tl-pending" };
      }
    }
  };

  // Helper to get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case "Alphabet Knowledge":
        return faFont;
      case "Phonological Awareness":
        return faVolumeUp;
      case "Decoding":
        return faFile;
      case "Word Recognition":
        return faPuzzlePiece;
      case "Reading Comprehension":
        return faBookOpen;
      default:
        return faFileAlt;
    }
  };

  return (
    <div className="template-library">
      <div className="tl-header">
        <h2>
          <FontAwesomeIcon icon={faClipboardList} />
          Template Library Management
        </h2>
        <p>Create, manage, and organize reusable templates for questions, choices, and reading passages to streamline assessment creation and ensure educational quality.</p>
        <button 
          className="tl-add-button"
          onClick={handleAddTemplate}
        >
          <FontAwesomeIcon icon={faPlus} className="tl-icon" /> 
          Create New {getTemplateType()} Template
        </button>
      </div>

      {/* Template Overview Stats */}
      <div className="tl-template-overview">
        <div className="tl-overview-header">
          <h3>Template Library Overview</h3>
          <p>Monitor your template creation progress and approval status across all categories</p>
        </div>
        
        <div className="tl-overview-stats">
          <div className="tl-stat-card total">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{stats.total}</div>
              <div className="tl-stat-label">Total Templates</div>
            </div>
          </div>
          
          <div className="tl-stat-card approved">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{stats.approved}</div>
              <div className="tl-stat-label">Approved/Active</div>
            </div>
          </div>
          
          <div className="tl-stat-card pending">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{stats.pending}</div>
              <div className="tl-stat-label">Pending Approval</div>
            </div>
          </div>
          
          <div className="tl-stat-card rejected">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faBan} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{stats.rejected}</div>
              <div className="tl-stat-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="tl-system-info">
        <h3>About Template Library Process</h3>
        <div className="tl-info-grid">
          <div className="tl-info-card">
            <div className="tl-info-icon">
              <FontAwesomeIcon icon={faCogs} />
            </div>
            <div className="tl-info-content">
              <h4>Reusable Components</h4>
              <p>
                Create standardized templates that can be reused across multiple assessments, 
                ensuring consistency and reducing development time for educators.
              </p>
            </div>
          </div>

          <div className="tl-info-card">
            <div className="tl-info-icon">
              <FontAwesomeIcon icon={faCheckDouble} />
            </div>
            <div className="tl-info-content">
              <h4>Quality Assurance</h4>
              <p>
                All templates undergo administrative review to ensure educational quality, 
                appropriate difficulty levels, and alignment with learning objectives.
              </p>
            </div>
          </div>

          <div className="tl-info-card">
            <div className="tl-info-icon">
              <FontAwesomeIcon icon={faSync} />
            </div>
            <div className="tl-info-content">
              <h4>Flexible Template Types</h4>
              <p>
                Support for multiple template formats including question patterns, 
                answer choices, and complete reading passages with comprehension elements.
              </p>
            </div>
          </div>

        
        </div>
      </div>

      {/* Process Flow */}
      <div className="tl-process-flow">
        <h3>Template Library Process Flow</h3>
        <div className="tl-flow-steps">
          <div className="tl-flow-step">
            <div className="tl-step-number">1</div>
            <div className="tl-step-content">
              <h4>Template Creation</h4>
              <p>Teachers design and create reusable templates for questions, choices, and reading passages.</p>
            </div>
          </div>
          <div className="tl-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="tl-flow-step">
            <div className="tl-step-number">2</div>
            <div className="tl-step-content">
              <h4>Quality Review</h4>
              <p>Templates undergo administrative review for educational standards and content appropriateness.</p>
            </div>
          </div>
          <div className="tl-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="tl-flow-step">
            <div className="tl-step-number">3</div>
            <div className="tl-step-content">
              <h4>Library Integration</h4>
              <p>Approved templates are added to the library and become available for assessment creation.</p>
            </div>
          </div>
          <div className="tl-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="tl-flow-step">
            <div className="tl-step-number">4</div>
            <div className="tl-step-content">
              <h4>Assessment Building</h4>
              <p>Teachers utilize approved templates to rapidly create comprehensive assessments.</p>
            </div>
          </div>
          <div className="tl-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="tl-flow-step">
            <div className="tl-step-number">5</div>
            <div className="tl-step-content">
              <h4>Continuous Improvement</h4>
              <p>Templates are refined based on usage feedback and educational effectiveness metrics.</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs 
        selectedIndex={nestedTabIndex} 
        onSelect={index => {
          setNestedTabIndex(index);
          setSearchTerm("");
          setFilterCategory("all");
          setFilterStatus("all");
        }}
        className="tl-nested-tabs"
      >
        <TabList className="tl-nested-tab-list">
          <Tab 
            className={nestedTabIndex === 0 ? "tl-nested-tab active" : "tl-nested-tab"}
          >
            <FontAwesomeIcon icon={faLanguage} style={{ marginRight: '8px' }} />
            Question Templates <span className="tl-count">{templates.questionTemplates.length}</span>
          </Tab>
          <Tab 
            className={nestedTabIndex === 1 ? "tl-nested-tab active" : "tl-nested-tab"}
          >
            <FontAwesomeIcon icon={faFont} style={{ marginRight: '8px' }} />
            Choice Templates <span className="tl-count">{templates.choiceTemplates.length}</span>
          </Tab>
          <Tab 
            className={nestedTabIndex === 2 ? "tl-nested-tab active" : "tl-nested-tab"}
          >
            <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px' }} />
            Sentence Templates <span className="tl-count">{templates.sentenceTemplates.length}</span>
          </Tab>
        </TabList>

        <div className="tl-filters">
          <div className="tl-search">
            <input
              type="text"
              placeholder={`Search ${getTemplateType()} templates...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <span className="tl-search-icon">
              <FontAwesomeIcon icon={faSearch} />
            </span>
          </div>

          {(nestedTabIndex === 0 || nestedTabIndex === 2) && (
            <div className="tl-filter-group">
              <label>
                <FontAwesomeIcon icon={faPuzzlePiece} className="tl-filter-icon" /> Category:
              </label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="tl-category-select"
              >
                {getCategories().map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="tl-filter-group">
            <label>
              <FontAwesomeIcon icon={faFilter} className="tl-filter-icon" /> Status:
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="approved">Approved/Active</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="tl-template-list">
          <TabPanel>
            {/* Question Templates */}
            {filteredTemplates.length === 0 ? (
              <div className="tl-no-templates">
                <div className="tl-empty-icon">
                  <FontAwesomeIcon icon={faFileAlt} />
                </div>
                <h3>No question templates found</h3>
                <p>Create your first question template to start building reusable assessment components.</p>
                <button
                  className="tl-create-first"
                  onClick={handleAddTemplate}
                >
                  <FontAwesomeIcon icon={faPlus} /> Create Question Template
                </button>
              </div>
            ) : (
              <div className="tl-table">
                <div className="tl-header-row">
                  <div className="tl-header-cell">Question Text</div>
                  <div className="tl-header-cell">
                    <FontAwesomeIcon icon={faPuzzlePiece} className="tl-header-icon" />
                    Category
                  </div>
                  <div className="tl-header-cell">Question Type</div>
                  <div className="tl-header-cell">
                    <FontAwesomeIcon icon={faCheckCircle} className="tl-header-icon" />
                    Status
                  </div>
                  <div className="tl-header-cell">Actions</div>
                </div>
                
                {filteredTemplates.map(template => {
                  const status = getTemplateStatusDisplay(template);
                  return (
                    <div key={template._id} className="tl-row">
                      <div className="tl-cell">{template.templateText}</div>
                      <div className="tl-cell">
                        <FontAwesomeIcon icon={getCategoryIcon(template.category)} className="tl-cell-icon" />
                        {template.category}
                      </div>
                      <div className="tl-cell">
                        {getQuestionTypeDisplay(template.questionType)}
                      </div>
                      <div className="tl-cell">
                        <span className={`tl-status ${status.className}`}>
                          <FontAwesomeIcon icon={status.icon} className="tl-status-icon" /> 
                          {status.label}
                          {status.reason && template.isRejected && (
                            <RejectionTooltip reason={status.reason} />
                          )}
                        </span>
                      </div>
                      <div className="tl-cell tl-actions">
                        {/* Only show edit and delete buttons for rejected templates */}
                        {template.isRejected && (
                          <>
                            <button
                              className="tl-action-btn tl-edit-btn"
                              onClick={() => handleEditTemplate(template)}
                              title="Edit Template"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="tl-action-btn tl-delete-btn"
                              onClick={() => handleDeleteConfirm(template)}
                              title="Delete Template"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                        {/* Preview button is always visible */}
                        <button
                          className="tl-action-btn tl-preview-btn"
                          onClick={() => handlePreviewTemplate(template)}
                          title="Preview Template"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabPanel>

          <TabPanel>
            {/* Choice Templates */}
            {filteredTemplates.length === 0 ? (
              <div className="tl-no-templates">
                <div className="tl-empty-icon">
                <FontAwesomeIcon icon={faFont} />
               </div>
               <h3>No choice templates found</h3>
               <p>Create your first choice template to start building reusable answer options.</p>
               <button
                 className="tl-create-first"
                 onClick={handleAddTemplate}
               >
                 <FontAwesomeIcon icon={faPlus} /> Create Choice Template
               </button>
             </div>
           ) : (
             <div className="tl-table">
               <div className="tl-header-row">
                 <div className="tl-header-cell">Value</div>
                 <div className="tl-header-cell">Type</div>
                 <div className="tl-header-cell">
                   <FontAwesomeIcon icon={faFileImage} className="tl-header-icon" />
                   Media
                 </div>
                 <div className="tl-header-cell">
                   <FontAwesomeIcon icon={faCheckCircle} className="tl-header-icon" />
                   Status
                 </div>
                 <div className="tl-header-cell">Actions</div>
               </div>
               
               {filteredTemplates.map(template => {
                 const status = getTemplateStatusDisplay(template);
                 return (
                   <div key={template._id} className="tl-row">
                     <div className="tl-cell tl-choice-value">
                       {template.choiceValue ? template.choiceValue : 
                        template.soundText ? <span className="tl-phonetic">{template.soundText}</span> : 
                        <FontAwesomeIcon icon={faImage} className="tl-image-placeholder" />}
                     </div>
                     <div className="tl-cell">
                       <FontAwesomeIcon icon={getChoiceTypeIcon(template.choiceType)} className="tl-cell-icon" />
                       {getChoiceTypeDisplayName(template.choiceType)}
                     </div>
                     <div className="tl-cell">
                       <div className="tl-choice-preview">
                         {template.choiceImage && <FontAwesomeIcon icon={faImage} />}
                         {template.soundText && <FontAwesomeIcon icon={faVolumeUp} />}
                         {!template.choiceImage && !template.soundText && "—"}
                       </div>
                     </div>
                     <div className="tl-cell">
                       <span className={`tl-status ${status.className}`}>
                         <FontAwesomeIcon icon={status.icon} className="tl-status-icon" /> 
                         {status.label}
                         {status.reason && template.isRejected && (
                           <RejectionTooltip reason={status.reason} />
                         )}
                       </span>
                     </div>
                     <div className="tl-cell tl-actions">
                       {/* Only show edit and delete buttons for rejected templates */}
                       {template.isRejected && (
                         <>
                           <button
                             className="tl-action-btn tl-edit-btn"
                             onClick={() => handleEditTemplate(template)}
                             title="Edit Template"
                           >
                             <FontAwesomeIcon icon={faEdit} />
                           </button>
                           <button
                             className="tl-action-btn tl-delete-btn"
                             onClick={() => handleDeleteConfirm(template)}
                             title="Delete Template"
                           >
                             <FontAwesomeIcon icon={faTrash} />
                           </button>
                         </>
                       )}
                       {/* Preview button is always visible */}
                       <button
                         className="tl-action-btn tl-preview-btn"
                         onClick={() => handlePreviewTemplate(template)}
                         title="Preview Template"
                       >
                         <FontAwesomeIcon icon={faEye} />
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </TabPanel>

         <TabPanel>
           {/* Sentence Templates */}
           {filteredTemplates.length === 0 ? (
             <div className="tl-no-templates">
               <div className="tl-empty-icon">
                 <FontAwesomeIcon icon={faBook} />
               </div>
               <h3>No sentence templates found</h3>
               <p>Create your first reading passage template to start building comprehension activities.</p>
               <button
                 className="tl-create-first"
                 onClick={handleAddTemplate}
               >
                 <FontAwesomeIcon icon={faPlus} /> Create Sentence Template
               </button>
             </div>
           ) : (
             <div className="tl-table">
               <div className="tl-header-row">
                 <div className="tl-header-cell">Title</div>
                 <div className="tl-header-cell">
                   <FontAwesomeIcon icon={faPuzzlePiece} className="tl-header-icon" />
                   Category
                 </div>
                 <div className="tl-header-cell">Reading Level</div>
                 <div className="tl-header-cell">
                   <FontAwesomeIcon icon={faCheckCircle} className="tl-header-icon" />
                   Status
                 </div>
                 <div className="tl-header-cell">Actions</div>
               </div>
               
               {filteredTemplates.map(template => {
                 const status = getTemplateStatusDisplay(template);
                 return (
                   <div key={template._id} className="tl-row">
                     <div className="tl-cell">{template.title}</div>
                     <div className="tl-cell">
                       <FontAwesomeIcon icon={getCategoryIcon(template.category)} className="tl-cell-icon" />
                       {template.category}
                     </div>
                     <div className="tl-cell">
                       <FontAwesomeIcon icon={faGraduationCap} className="tl-cell-icon" />
                       {template.readingLevel}
                     </div>
                     <div className="tl-cell">
                       <span className={`tl-status ${status.className}`}>
                         <FontAwesomeIcon icon={status.icon} className="tl-status-icon" /> 
                         {status.label}
                         {status.reason && template.isRejected && (
                           <RejectionTooltip reason={status.reason} />
                         )}
                       </span>
                     </div>
                     <div className="tl-cell tl-actions">
                       {/* Only show edit and delete buttons for rejected templates */}
                       {template.isRejected && (
                         <>
                           <button
                             className="tl-action-btn tl-edit-btn"
                             onClick={() => handleEditTemplate(template)}
                             title="Edit Template"
                           >
                             <FontAwesomeIcon icon={faEdit} />
                           </button>
                           <button
                             className="tl-action-btn tl-delete-btn"
                             onClick={() => handleDeleteConfirm(template)}
                             title="Delete Template"
                           >
                             <FontAwesomeIcon icon={faTrash} />
                           </button>
                         </>
                       )}
                       {/* Preview button is always visible */}
                       <button
                         className="tl-action-btn tl-preview-btn"
                         onClick={() => handlePreviewTemplate(template)}
                         title="Preview Template"
                       >
                         <FontAwesomeIcon icon={faEye} />
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </TabPanel>
       </div>
     </Tabs>

     {/* Form Dialog */}
     {isFormDialogOpen && (
       <div className="tl-dialog-overlay">
         <div className="tl-dialog tl-form-dialog">
           <div className="tl-dialog-header">
             <h3>
               {currentTemplate ? `Edit ${getTemplateType()} Template` : `Create New ${getTemplateType()} Template`}
             </h3>
             <button 
               className="tl-dialog-close"
               onClick={() => setIsFormDialogOpen(false)}
             >
               <FontAwesomeIcon icon={faTimes} />
             </button>
           </div>
           
           <div className="tl-dialog-body">
             {nestedTabIndex === 0 && (
               <QuestionTemplateForm 
                 template={currentTemplate}
                 onSave={handleFormSubmit}
                 onCancel={() => setIsFormDialogOpen(false)}
               />
             )}
             {nestedTabIndex === 1 && (
               <ChoiceTemplateForm 
                 template={currentTemplate}
                 onSave={handleFormSubmit}
                 onCancel={() => setIsFormDialogOpen(false)}
               />
             )}
             {nestedTabIndex === 2 && (
               <SentenceTemplateForm 
                 template={currentTemplate}
                 onSave={handleFormSubmit}
                 onCancel={() => setIsFormDialogOpen(false)}
               />
             )}
           </div>
         </div>
       </div>
     )}

     {/* Submit Confirmation Dialog */}
     {isSubmitConfirmDialogOpen && (
       <div className="tl-dialog-overlay">
         <div className="tl-dialog tl-confirm-dialog">
           <div className="tl-dialog-header">
             <h3>
               <FontAwesomeIcon icon={faLock} className="tl-modal-header-icon" />
               Submit for Admin Approval
             </h3>
             <button 
               className="tl-dialog-close"
               onClick={() => setIsSubmitConfirmDialogOpen(false)}
             >
               <FontAwesomeIcon icon={faTimes} />
             </button>
           </div>
           
           <div className="tl-dialog-body">
             <div className="tl-confirm-icon">
               <FontAwesomeIcon icon={faLock} />
             </div>
             <div className="tl-confirm-message">
               <p>Your template will be submitted for admin approval before it can be used in assessments.</p>
               <p>Once submitted, it will appear with "Pending Approval" status and cannot be modified until approved or rejected.</p>
               <p className="tl-confirm-question">Would you like to submit this template now?</p>
             </div>
             
             <div className="tl-submission-summary">
               <h4>Template Summary:</h4>
               <div className="tl-summary-details">
                 <div className="tl-summary-item">
                   <span className="tl-summary-label">Type:</span>
                   <span className="tl-summary-value">{getTemplateType()} Template</span>
                 </div>
                 {tempFormData && nestedTabIndex === 0 && (
                   <>
                     <div className="tl-summary-item">
                       <span className="tl-summary-label">Category:</span>
                       <span className="tl-summary-value">{tempFormData.category}</span>
                     </div>
                     <div className="tl-summary-item">
                       <span className="tl-summary-label">Question Type:</span>
                       <span className="tl-summary-value">{getQuestionTypeDisplay(tempFormData.questionType)}</span>
                     </div>
                   </>
                 )}
                 {tempFormData && nestedTabIndex === 1 && (
                   <div className="tl-summary-item">
                     <span className="tl-summary-label">Choice Type:</span>
                     <span className="tl-summary-value">{getChoiceTypeDisplayName(tempFormData.choiceType)}</span>
                   </div>
                 )}
                 {tempFormData && nestedTabIndex === 2 && (
                   <>
                     <div className="tl-summary-item">
                       <span className="tl-summary-label">Title:</span>
                       <span className="tl-summary-value">{tempFormData.title}</span>
                     </div>
                     <div className="tl-summary-item">
                       <span className="tl-summary-label">Reading Level:</span>
                       <span className="tl-summary-value">{tempFormData.readingLevel}</span>
                     </div>
                   </>
                 )}
               </div>
             </div>
           </div>
           
           <div className="tl-dialog-footer">
             <button 
               className="tl-dialog-btn tl-cancel-btn"
               onClick={() => setIsSubmitConfirmDialogOpen(false)}
             >
               <FontAwesomeIcon icon={faArrowRight} /> Go Back and Edit
             </button>
             <button 
               className="tl-dialog-btn tl-confirm-btn"
               onClick={handleConfirmSubmit}
             >
               <FontAwesomeIcon icon={faLock} /> Submit for Approval
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Preview Dialog */}
     {isPreviewDialogOpen && previewTemplate && (
       <div className="tl-dialog-overlay">
         <div className="tl-dialog tl-preview-dialog">
           <div className="tl-dialog-header">
             <h3>
               <FontAwesomeIcon icon={faEye} className="tl-modal-header-icon" />
               Template Preview
             </h3>
             <button 
               className="tl-dialog-close"
               onClick={() => setIsPreviewDialogOpen(false)}
             >
               <FontAwesomeIcon icon={faTimes} />
             </button>
           </div>
           
           <div className="tl-dialog-body">
             {/* Preview content based on template type */}
             {nestedTabIndex === 0 && (
               <div className="tl-question-preview">
                 <div className="tl-preview-card">
                   <div className="tl-preview-header">
                     <h4>Question Template</h4>
                     <span className={`tl-preview-status ${getTemplateStatusDisplay(previewTemplate).className}`}>
                       <FontAwesomeIcon icon={getTemplateStatusDisplay(previewTemplate).icon} /> 
                       {getTemplateStatusDisplay(previewTemplate).label}
                     </span>
                   </div>
                   
                   {getTemplateStatusDisplay(previewTemplate).reason && previewTemplate.isRejected && (
                     <div className="post-assess-rejection-panel">
                       <div className="post-assess-rejection-header">
                         <FontAwesomeIcon icon={faExclamationCircle} /> Rejection Reason
                       </div>
                       <div className="post-assess-rejection-content">
                         {getTemplateStatusDisplay(previewTemplate).reason}
                       </div>
                     </div>
                   )}
                   
                   <div className="tl-preview-question-text">
                     <span className="tl-preview-label">Question:</span>
                     <div className="tl-preview-value">{previewTemplate.templateText}</div>
                   </div>
                   
                   <div className="tl-preview-grid">
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Category:</span>
                       <span className="tl-preview-data">
                         <FontAwesomeIcon icon={getCategoryIcon(previewTemplate.category)} style={{ marginRight: '6px' }} />
                         {previewTemplate.category}
                       </span>
                     </div>
                     
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Question Type:</span>
                       <span className="tl-preview-data">
                         {getQuestionTypeDisplay(previewTemplate.questionType)}
                       </span>
                     </div>
                     
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Available Choice Types:</span>
                       <div className="tl-preview-choices">
                         {previewTemplate.applicableChoiceTypes.map(type => (
                           <span key={type} className="tl-choice-badge">
                             <FontAwesomeIcon icon={getChoiceTypeIcon(type)} style={{ marginRight: '4px' }} />
                             {getChoiceTypeDisplayName(type)}
                           </span>
                         ))}
                       </div>
                     </div>
                     
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Correct Answer Type:</span>
                       <span className="tl-preview-data tl-correct-answer">
                         <FontAwesomeIcon icon={faCheck} style={{ marginRight: '4px' }} />
                         {getChoiceTypeDisplayName(previewTemplate.correctChoiceType)}
                       </span>
                     </div>
                   </div>
                   
                   {/* Student Experience Simulation */}
                   <div className="tl-student-simulation">
                     <h5>Student View Simulation</h5>
                     <div className="tl-student-question">
                       <div className="tl-question-content">
                         <p className="tl-student-question-text">{previewTemplate.templateText}</p>
                         
                         {previewTemplate.questionType === "patinig" && (
                           <div className="tl-student-visual">
                             <img 
                               src="https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/A_big.png" 
                               alt="Sample Question Visual" 
                               className="tl-sample-image"
                             />
                           </div>
                         )}
                         
                         <div className="tl-student-choices">
                           {previewTemplate.applicableChoiceTypes.includes("patinigSmallLetter") && (
                             <>
                               <div className="tl-student-choice tl-student-choice-correct">
                                 <span>a</span>
                               </div>
                               <div className="tl-student-choice">
                                 <span>e</span>
                               </div>
                             </>
                           )}
                           
                           {previewTemplate.applicableChoiceTypes.includes("patinigSound") && (
                             <>
                               <div className="tl-student-choice tl-student-choice-correct">
                                 <span>/ah/</span>
                               </div>
                               <div className="tl-student-choice">
                                 <span>/eh/</span>
                               </div>
                             </>
                           )}
                           
                           {previewTemplate.applicableChoiceTypes.includes("malapatinigText") && (
                             <>
                               <div className="tl-student-choice tl-student-choice-correct">
                                 <span>BO</span>
                               </div>
                               <div className="tl-student-choice">
                                 <span>LA</span>
                               </div>
                             </>
                           )}
                           
                           {previewTemplate.applicableChoiceTypes.includes("wordText") && (
                             <>
                               <div className="tl-student-choice tl-student-choice-correct">
                                 <span>BOLA</span>
                               </div>
                               <div className="tl-student-choice">
                                 <span>LABO</span>
                               </div>
                             </>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
             
             {nestedTabIndex === 1 && (
               <div className="tl-choice-preview">
                 <div className="tl-preview-card">
                   <div className="tl-preview-header">
                     <h4>Choice Template</h4>
                     <span className={`tl-preview-status ${getTemplateStatusDisplay(previewTemplate).className}`}>
                       <FontAwesomeIcon icon={getTemplateStatusDisplay(previewTemplate).icon} /> 
                       {getTemplateStatusDisplay(previewTemplate).label}
                     </span>
                   </div>
                   
                   {getTemplateStatusDisplay(previewTemplate).reason && previewTemplate.isRejected && (
                     <div className="post-assess-rejection-panel">
                       <div className="post-assess-rejection-header">
                         <FontAwesomeIcon icon={faExclamationCircle} /> Rejection Reason
                       </div>
                       <div className="post-assess-rejection-content">
                         {getTemplateStatusDisplay(previewTemplate).reason}
                       </div>
                     </div>
                   )}
                   
                   <div className="tl-preview-choice-display">
                     {previewTemplate.choiceImage && (
                       <div className="tl-preview-choice-image">
                         <img src={previewTemplate.choiceImage} alt="Choice" />
                       </div>
                     )}
                     
                     <div className="tl-preview-choice-value">
                       {previewTemplate.choiceType?.includes('Sound') ? (
                         <div className="tl-preview-sound">
                           <FontAwesomeIcon icon={faVolumeUp} size="lg" />
                           <span>{previewTemplate.soundText}</span>
                         </div>
                       ) : (
                         <div className="tl-preview-text">
                           {previewTemplate.choiceValue || "(No value)"}
                         </div>
                       )}
                     </div>
                   </div>
                   
                   <div className="tl-preview-details">
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Type:</span>
                       <span className="tl-preview-data">
                         <FontAwesomeIcon icon={getChoiceTypeIcon(previewTemplate.choiceType)} style={{ marginRight: '6px' }} />
                         {getChoiceTypeDisplayName(previewTemplate.choiceType)}
                       </span>
                     </div>
                     
                     {previewTemplate.choiceValue && (
                       <div className="tl-preview-item">
                         <span className="tl-preview-label">Value:</span>
                         <span className="tl-preview-data">{previewTemplate.choiceValue}</span>
                       </div>
                     )}
                     
                     {previewTemplate.soundText && (
                       <div className="tl-preview-item">
                         <span className="tl-preview-label">Sound Representation:</span>
                         <span className="tl-preview-data">{previewTemplate.soundText}</span>
                       </div>
                     )}
                     
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Has Image:</span>
                       <span className="tl-preview-data">
                         {previewTemplate.choiceImage ? (
                           <span className="tl-yes">Yes</span>
                         ) : (
                           <span className="tl-no">No</span>
                         )}
                       </span>
                     </div>
                   </div>
                   
                   {/* Student Experience Simulation */}
                   <div className="tl-student-simulation">
                     <h5>Student View Simulation</h5>
                     <div className="tl-student-choices-sample">
                       <div className="tl-student-choice-sample">
                         {previewTemplate.choiceImage ? (
                           <img 
                             src={previewTemplate.choiceImage} 
                             alt={previewTemplate.choiceValue || previewTemplate.soundText} 
                             className="tl-sample-choice-image" 
                           />
                         ) : previewTemplate.choiceType?.includes('Sound') ? (
                           <div className="tl-sample-sound-icon">
                             <FontAwesomeIcon icon={faVolumeUp} />
                           </div>
                         ) : null}
                         
                         <span className="tl-sample-choice-text">
                           {previewTemplate.choiceType?.includes('Sound') 
                             ? previewTemplate.soundText 
                             : previewTemplate.choiceValue}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
             
             {nestedTabIndex === 2 && (
               <div className="tl-sentence-preview">
                 <div className="tl-preview-card">
                   <div className="tl-preview-header">
                     <h4>{previewTemplate.title}</h4>
                     <span className={`tl-preview-status ${getTemplateStatusDisplay(previewTemplate).className}`}>
                       <FontAwesomeIcon icon={getTemplateStatusDisplay(previewTemplate).icon} /> 
                       {getTemplateStatusDisplay(previewTemplate).label}
                     </span>
                   </div>
                   
                   {getTemplateStatusDisplay(previewTemplate).reason && previewTemplate.isRejected && (
                     <div className="post-assess-rejection-panel">
                       <div className="post-assess-rejection-header">
                         <FontAwesomeIcon icon={faExclamationCircle} /> Rejection Reason
                       </div>
                       <div className="post-assess-rejection-content">
                         {getTemplateStatusDisplay(previewTemplate).reason}
                       </div>
                     </div>
                   )}
                   
                   <div className="tl-preview-details">
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Category:</span>
                       <span className="tl-preview-data">
                         <FontAwesomeIcon icon={getCategoryIcon(previewTemplate.category)} style={{ marginRight: '6px' }} />
                         {previewTemplate.category}
                       </span>
                     </div>
                     
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Reading Level:</span>
                       <span className="tl-preview-data">
                         <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '6px' }} />
                         {previewTemplate.readingLevel}
                       </span>
                     </div>
                     
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Total Pages:</span>
                       <span className="tl-preview-data">{previewTemplate.sentenceText?.length || 0}</span>
                     </div>
                     
                     <div className="tl-preview-item">
                       <span className="tl-preview-label">Questions:</span>
                       <span className="tl-preview-data">{previewTemplate.sentenceQuestions?.length || 0}</span>
                     </div>
                   </div>
                   
                   {/* Show first page as sample */}
                   {previewTemplate.sentenceText?.length > 0 && (
                     <div className="tl-passage-preview">
                       <h5><FontAwesomeIcon icon={faBook} /> Page Preview</h5>
                       
                       <div className="tl-passage-container">
                         {previewTemplate.sentenceText[0].image && (
                           <div className="tl-passage-image-container">
                             <img 
                               src={previewTemplate.sentenceText[0].image} 
                               alt="Page illustration" 
                             />
                           </div>
                         )}
                         
                         <div className="tl-passage-text-container">
                           <p className="tl-passage-text">{previewTemplate.sentenceText[0].text}</p>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {/* Question Sample */}
                   {previewTemplate.sentenceQuestions?.length > 0 && (
                     <div className="tl-questions-preview">
                       <h5><FontAwesomeIcon icon={faComments} /> Question Sample</h5>
                       <div className="tl-sample-question">
                         <div className="tl-sample-question-text">
                           {previewTemplate.sentenceQuestions[0].questionText}
                         </div>
                         
                         <div className="tl-sample-choices">
                           {previewTemplate.sentenceQuestions[0].sentenceOptionAnswers.map((option, index) => (
                             <div 
                               key={index} 
                               className={`tl-sample-choice ${index === 0 ? 'tl-sample-correct' : ''}`}
                             >
                               {option}
                               {index === 0 && (
                                 <span className="tl-correct-marker">
                                   <FontAwesomeIcon icon={faCheck} />
                                 </span>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
           
           <div className="tl-dialog-footer">
             <button 
               className="tl-dialog-btn tl-close-btn"
               onClick={() => setIsPreviewDialogOpen(false)}
             >
               Close Preview
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Delete Confirmation Dialog */}
     {isDeleteDialogOpen && (
       <div className="tl-dialog-overlay">
         <div className="tl-dialog tl-confirm-dialog">
           <div className="tl-dialog-header">
             <h3>
               <FontAwesomeIcon icon={faTrash} className="tl-modal-header-icon" />
               Delete Template
             </h3>
             <button 
               className="tl-dialog-close"
               onClick={() => setIsDeleteDialogOpen(false)}
             >
               <FontAwesomeIcon icon={faTimes} />
             </button>
           </div>
           
           <div className="tl-dialog-body">
             <div className="tl-delete-icon">
               <FontAwesomeIcon icon={faExclamationTriangle} />
             </div>
             <div className="tl-delete-message">
               <h4>Delete Template</h4>
               <p>Are you sure you want to permanently delete this rejected template?</p>
               <p className="tl-delete-warning">
                 This template was rejected and has not been approved for use. 
                 Deleting it will remove it permanently from your template library.
               </p>
             </div>
             
             {templateToDelete && (
               <div className="tl-template-info">
                 {templateToDelete.isRejected && templateToDelete.rejectionReason && (
                   <div className="post-assess-rejection-panel">
                     <div className="post-assess-rejection-header">
                       <FontAwesomeIcon icon={faExclamationCircle} /> Rejection Reason
                     </div>
                     <div className="post-assess-rejection-content">
                       {templateToDelete.rejectionReason}
                     </div>
                   </div>
                 )}
                 
                 {nestedTabIndex === 0 && (
                   <>
                     <p><strong>Question Text:</strong> {templateToDelete.templateText}</p>
                     <p><strong>Category:</strong> {templateToDelete.category}</p>
                   </>
                 )}
                 
                 {nestedTabIndex === 1 && (
                   <>
                     <p><strong>Value:</strong> {templateToDelete.choiceValue || templateToDelete.soundText || 'No Value'}</p>
                     <p><strong>Type:</strong> {getChoiceTypeDisplayName(templateToDelete.choiceType)}</p>
                   </>
                 )}
                 
                 {nestedTabIndex === 2 && (
                   <>
                     <p><strong>Title:</strong> {templateToDelete.title}</p>
                     <p><strong>Reading Level:</strong> {templateToDelete.readingLevel}</p>
                   </>
                 )}
               </div>
             )}
           </div>
           
           <div className="tl-dialog-footer">
             <button 
               className="tl-dialog-btn tl-cancel-btn"
               onClick={() => setIsDeleteDialogOpen(false)}
             >
               Cancel
             </button>
             <button 
               className="tl-dialog-btn tl-delete-confirm-btn"
               onClick={handleDelete}
             >
               <FontAwesomeIcon icon={faTrash} /> Delete Template
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Success Notification */}
     {isSubmitSuccessDialogOpen && (
       <div className="tl-success-notification">
         <div className="tl-success-icon">
           <FontAwesomeIcon icon={faCheckCircle} />
         </div>
         <div className="tl-success-message">
           <p>Template submitted successfully!</p>
           <p className="tl-success-detail">Your template has been sent for admin approval.</p>
         </div>
       </div>
     )}
   </div>
 );
};

export default TemplateLibrary;