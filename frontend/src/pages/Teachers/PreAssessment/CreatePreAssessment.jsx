import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faCloudUploadAlt,
  faExclamationTriangle,
  faFilter,
  faSearch,
  faSpinner,
  faLayerGroup,
  faPlus,
  faInfoCircle,
  faCheckCircle,
  faTimesCircle,
  faAngleRight,
  faEye,
  faChevronLeft,
  faChevronRight,
  faQuestion,
  faListOl,
  faCheckSquare,
  faQuestionCircle,
  faBook,
  faBookReader,
  faArrowRight,
  faLightbulb,
  faClipboardList,
  faImage,
  faFileAlt,
  faEdit,
  faHeadphones
} from '@fortawesome/free-solid-svg-icons';
import '../../../css/Teachers/CreatePreAssessment.css';
import ActivityPreviewModal from '../../../components/TeacherPage/PreAssessment/ActivityPreviewModal';
import QuestionSelectionPanel from '../../../components/TeacherPage/PreAssessment/QuestionSelection';
import Tooltip from '../../../components/TeacherPage/PreAssessment/Tooltip';

const CreatePreAssessment = () => {
  const navigate = useNavigate();
  
  // State for pre-assessment creation
  const [loading, setLoading] = useState(true);
  const [approvedActivities, setApprovedActivities] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [preAssessmentTitle, setPreAssessmentTitle] = useState('');
  const [preAssessmentDescription, setPreAssessmentDescription] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewActivity, setPreviewActivity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Available reading levels (Antas)
  const readingLevels = [
    "All Levels",
    "Antas Una",
    "Antas Dalawa",
    "Antas Tatlo",
    "Antas Apat",
    "Antas Lima"
  ];

  // Available categories
  const categories = [
    "All Categories",
    "Pagtukoy ng Tunog",
    "Pagbasa ng Salita",
    "Pagsusuri ng Pantig",
    "Pag-unawa sa Binasa",
    "Talasalitaan"
  ];

  // Load approved activities
  useEffect(() => {
    const fetchApprovedActivities = async () => {
      setLoading(true);
      try {
        // First check localStorage for newly added activities
        const newlyAddedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
        
        // Then load from our mock data
        const allActivities = [...mockModule.default, ...newlyAddedActivities];
        
        // Filter for only approved templates
        const approved = allActivities.filter(activity => 
          activity.type === 'template' && 
          (activity.status === 'approved' || activity.status === 'locked')
        );
        
        // Process to ensure each activity has the necessary properties
        const processedActivities = approved.map(activity => ({
          ...activity,
          levels: activity.levels || [],
          categories: activity.categories || ['General']
        }));
        
        setApprovedActivities(processedActivities);
      } catch (error) {
        console.error('Error loading approved activities:', error);
        setError('Failed to load approved activities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApprovedActivities();
  }, []);
  
  // Filter activities based on selected level, category, and search query
  const filteredActivities = approvedActivities.filter(activity => {
    // Filter by level
    if (selectedLevel !== 'All Levels' && activity.level !== selectedLevel) {
      return false;
    }
    
    // Filter by category
    if (selectedCategory !== 'All Categories' && 
        !activity.categories?.some(cat => cat.includes(selectedCategory))) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Group activities by level for better organization
  const activitiesByLevel = {};
  filteredActivities.forEach(activity => {
    if (!activitiesByLevel[activity.level]) {
      activitiesByLevel[activity.level] = [];
    }
    activitiesByLevel[activity.level].push(activity);
  });
  
  // Handle question selection/deselection
  const toggleQuestionSelection = (activityId, levelId, questionId) => {
    // Find the activity and level
    const activity = approvedActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    const level = activity.levels.find(l => l.id === levelId);
    if (!level) return;
    
    const question = level.questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Check if question is already selected
    const existingIndex = selectedQuestions.findIndex(sq => 
      sq.activityId === activityId && sq.levelId === levelId && sq.questionId === questionId
    );
    
    if (existingIndex >= 0) {
      // Remove if already selected
      const newSelectedQuestions = [...selectedQuestions];
      newSelectedQuestions.splice(existingIndex, 1);
      setSelectedQuestions(newSelectedQuestions);
    } else {
      // Add if not selected
      setSelectedQuestions([
        ...selectedQuestions,
        {
          activityId,
          levelId,
          questionId,
          activityTitle: activity.title,
          levelName: level.levelName || `Level ${level.id}`,
          questionText: question.questionText,
          contentType: question.contentType,
          question: { ...question }
        }
      ]);
    }
  };
  
  // Check if a question is selected
  const isQuestionSelected = (activityId, levelId, questionId) => {
    return selectedQuestions.some(sq => 
      sq.activityId === activityId && 
      sq.levelId === levelId && 
      sq.questionId === questionId
    );
  };
  
  // Count selected questions per activity
  const getSelectedQuestionsCount = (activityId) => {
    return selectedQuestions.filter(sq => sq.activityId === activityId).length;
  };
  
  // Open activity preview modal
  const openPreviewModal = (activity) => {
    setPreviewActivity(activity);
    setShowPreviewModal(true);
  };
  
  // Close activity preview modal
  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewActivity(null);
  };
  
  // Handle next/prev step
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate form
      if (!preAssessmentTitle.trim()) {
        setError('Please enter a title for the pre-assessment');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate selections
      if (selectedQuestions.length === 0) {
        setError('Please select at least one question for the pre-assessment');
        return;
      }
      setCurrentStep(3);
    }
    window.scrollTo(0, 0);
  };
  
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!preAssessmentTitle.trim()) {
      setError('Please enter a title for the pre-assessment');
      return;
    }
    
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question for the pre-assessment');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Group selected questions by activity and level
      const groupedQuestions = {};
      
      selectedQuestions.forEach(sq => {
        if (!groupedQuestions[sq.activityId]) {
          groupedQuestions[sq.activityId] = {};
        }
        
        if (!groupedQuestions[sq.activityId][sq.levelId]) {
          groupedQuestions[sq.activityId][sq.levelId] = [];
        }
        
        groupedQuestions[sq.activityId][sq.levelId].push(sq.question);
      });
      
      // Prepare the levels for the pre-assessment
      const preAssessmentLevels = [];
      
      Object.entries(groupedQuestions).forEach(([activityId, levelGroups]) => {
        const activity = approvedActivities.find(a => a.id === parseInt(activityId));
        
        Object.entries(levelGroups).forEach(([levelId, questions]) => {
          const originalLevel = activity?.levels.find(l => l.id === parseInt(levelId));
          
          preAssessmentLevels.push({
            id: preAssessmentLevels.length + 1,
            levelName: originalLevel?.levelName || `Level ${preAssessmentLevels.length + 1}`,
            sourceActivityId: parseInt(activityId),
            sourceActivityTitle: activity?.title || "Unknown Activity",
            passage: originalLevel?.passage || { text: "" },
            questions: questions
          });
        });
      });
      
      // Extract unique categories from selected questions
      const selectedCategories = [...new Set(
        selectedQuestions.map(sq => {
          const activity = approvedActivities.find(a => a.id === sq.activityId);
          return activity?.categories || [];
        }).flat()
      )];
      
      // Determine dominant level
      const levelCounts = {};
      selectedQuestions.forEach(sq => {
        const activity = approvedActivities.find(a => a.id === sq.activityId);
        if (activity?.level) {
          levelCounts[activity.level] = (levelCounts[activity.level] || 0) + 1;
        }
      });
      
      let dominantLevel = "Multiple Levels";
      let maxCount = 0;
      
      Object.entries(levelCounts).forEach(([level, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantLevel = level;
        }
      });
      
      // Prepare the pre-assessment data
      const preAssessmentData = {
        id: Date.now(), // Generate temp ID
        title: preAssessmentTitle,
        description: preAssessmentDescription,
        type: 'assessment',
        status: 'pending',
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        creator: "Current Teacher",
        level: dominantLevel,
        categories: selectedCategories,
        sourceActivities: [...new Set(selectedQuestions.map(sq => sq.activityId))],
        levels: preAssessmentLevels
      };
      
      console.log('Creating pre-assessment:', preAssessmentData);
      
      // In a real implementation, you would send this to your backend
      // For now, we'll just wait a bit and then store in localStorage
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store in localStorage for demo purposes
      const existingActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
      localStorage.setItem('mockActivities', JSON.stringify([...existingActivities, preAssessmentData]));
      
      setSubmitSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/teacher/manage-activities');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting pre-assessment:', error);
      setError('Failed to submit pre-assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render success state
  if (submitSuccess) {
    return (
      <div className="pre-assess-container">
        <div className="pre-assess-success">
          <FontAwesomeIcon icon={faCheckCircle} className="pre-assess-success-icon" />
          <h2>Pre-Assessment Created Successfully!</h2>
          <p>Your pre-assessment has been submitted and is now pending approval.</p>
          <p>You will be redirected to the activities page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pre-assess-container">
      <div className="pre-assess-header">
        <h1>Create New Pre-Assessment</h1>
        <p className="pre-assess-subtitle">
          Build a customized pre-assessment by selecting specific questions from approved activities.
        </p>
        <button 
          className="pre-assess-back-btn"
          onClick={() => navigate('/teacher/manage-activities')}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Activities
        </button>
      </div>
      
      {error && (
        <div className="pre-assess-error">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Progress Steps */}
      <div className="pre-assess-steps">
        <div className={`pre-assess-step ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="pre-assess-step-number">1</div>
          <div className="pre-assess-step-label">Basic Information</div>
        </div>
        <div className="pre-assess-step-connector"></div>
        <div className={`pre-assess-step ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="pre-assess-step-number">2</div>
          <div className="pre-assess-step-label">Select Questions</div>
        </div>
        <div className="pre-assess-step-connector"></div>
        <div className={`pre-assess-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="pre-assess-step-number">3</div>
          <div className="pre-assess-step-label">Review & Submit</div>
        </div>
      </div>
      
      <div className="pre-assess-form-wrapper">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="pre-assess-section">
              <h2 className="pre-assess-section-title">Pre-Assessment Details</h2>
              
              <div className="pre-assess-info-card">
                <div className="pre-assess-info-icon">
                  <FontAwesomeIcon icon={faLightbulb} />
                </div>
                <div className="pre-assess-info-content">
                  <h3>Creating an Effective Pre-Assessment</h3>
                  <p>
                    Pre-assessments help identify students' strengths and areas for improvement 
                    before instruction begins. A well-designed pre-assessment should:
                  </p>
                  <ul>
                    <li>Cover key concepts that will be taught</li>
                    <li>Include a variety of question types</li>
                    <li>Be appropriate for the students' reading level</li>
                    <li>Provide clear instructions and expectations</li>
                  </ul>
                </div>
              </div>
              
              <div className="pre-assess-form-group">
                <label htmlFor="title">
                  Pre-Assessment Title <span className="pre-assess-required">*</span>
                  <Tooltip text="Choose a clear, descriptive title that reflects the content and purpose of this pre-assessment." />
                </label>
                <input
                  type="text"
                  id="title"
                  value={preAssessmentTitle}
                  onChange={(e) => setPreAssessmentTitle(e.target.value)}
                  placeholder="E.g., 'Antas Dalawa: Pagkilala sa mga Tunog at Salita'"
                  required
                  className={!preAssessmentTitle.trim() && error ? 'pre-assess-input-error' : ''}
                />
                {!preAssessmentTitle.trim() && error && (
                  <div className="pre-assess-field-error">Title is required</div>
                )}
              </div>
              
              <div className="pre-assess-form-group">
                <label htmlFor="description">
                  Description
                  <Tooltip text="Provide details about what this pre-assessment evaluates and how it should be administered." />
                </label>
                <textarea
                  id="description"
                  value={preAssessmentDescription}
                  onChange={(e) => setPreAssessmentDescription(e.target.value)}
                  placeholder="Describe what skills this pre-assessment evaluates and any specific instructions for administration..."
                  rows="4"
                ></textarea>
              </div>
              
              <div className="pre-assess-purpose-section">
                <h3>
                  <FontAwesomeIcon icon={faQuestionCircle} /> Purpose of Pre-Assessment
                </h3>
                <div className="pre-assess-purpose-grid">
                  <div className="pre-assess-purpose-card">
                    <div className="pre-assess-purpose-icon">
                      <FontAwesomeIcon icon={faClipboardList} />
                    </div>
                    <h4>Diagnostic Tool</h4>
                    <p>
                      Identifies specific learning needs and gaps in 
                      students' understanding of reading concepts.
                    </p>
                  </div>
                  
                  <div className="pre-assess-purpose-card">
                    <div className="pre-assess-purpose-icon">
                      <FontAwesomeIcon icon={faBookReader} />
                    </div>
                    <h4>Tailored Instruction</h4>
                    <p>
                      Helps plan personalized interventions and teaching 
                      strategies based on individual student needs.
                    </p>
                  </div>
                  
                  <div className="pre-assess-purpose-card">
                    <div className="pre-assess-purpose-icon">
                      <FontAwesomeIcon icon={faCheckSquare} />
                    </div>
                    <h4>Progress Tracking</h4>
                    <p>
                      Establishes a baseline to measure improvement and 
                      growth throughout the learning process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Select Questions */}
          {currentStep === 2 && (
            <div className="pre-assess-section">
              <h2 className="pre-assess-section-title">
                <FontAwesomeIcon icon={faListOl} /> Select Questions for Assessment
              </h2>
              
              <div className="pre-assess-guidance">
                <div className="pre-assess-guidance-icon">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </div>
                <div className="pre-assess-guidance-content">
                  <h3>Creating a Balanced Assessment</h3>
                  <p>
                    For the most effective pre-assessment, select questions from various 
                    activities and levels that test different reading skills. This will 
                    provide a comprehensive view of students' abilities.
                  </p>
                  <div className="pre-assess-guidance-note">
                    <strong>Tip:</strong> You can preview any activity to see all its questions before making selections.
                  </div>
                </div>
              </div>
              
              <div className="pre-assess-filters">
                <div className="pre-assess-filter-header">
                  <FontAwesomeIcon icon={faFilter} /> Filter Activities
                  <Tooltip text="Use these filters to narrow down and find specific activities." />
                </div>
                
                <div className="pre-assess-filter-controls">
                  <div className="pre-assess-filter-group">
                    <label>Reading Level:</label>
                    <select 
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                    >
                      {readingLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="pre-assess-filter-group">
                    <label>Category:</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="pre-assess-filter-group pre-assess-search">
                    <label>Search:</label>
                    <div className="pre-assess-search-input">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by activity title"
                      />
                      <FontAwesomeIcon icon={faSearch} className="pre-assess-search-icon" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pre-assess-activities-section">
                <div className="pre-assess-selection-summary">
                  <div className="pre-assess-summary-heading">
                    <FontAwesomeIcon icon={faCheck} /> Questions Selected: 
                    <span className="pre-assess-count">{selectedQuestions.length}</span>
                  </div>
                  
                  {selectedQuestions.length > 0 && (
                    <button 
                      type="button" 
                      className="pre-assess-view-selected-btn"
                      onClick={() => setCurrentStep(3)}
                    >
                      Review Selected Questions <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  )}
                </div>
                
                {loading ? (
                  <div className="pre-assess-loading">
                    <FontAwesomeIcon icon={faSpinner} spin className="pre-assess-spinner" />
                    <p>Loading approved activities...</p>
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="pre-assess-empty">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="pre-assess-empty-icon" />
                    <h3>No Approved Activities Found</h3>
                    <p>There are no approved activities matching your filter criteria.</p>
                    <div className="pre-assess-empty-actions">
                      {(selectedLevel !== 'All Levels' || selectedCategory !== 'All Categories' || searchQuery) && (
                        <button 
                          type="button" 
                          className="pre-assess-clear-btn"
                          onClick={() => {
                            setSelectedLevel('All Levels');
                            setSelectedCategory('All Categories');
                            setSearchQuery('');
                          }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pre-assess-activities-content">
                    {Object.entries(activitiesByLevel).map(([level, activities]) => (
                      <div className="pre-assess-level-group" key={level}>
                        <h3 className="pre-assess-level-header">
                          <FontAwesomeIcon icon={faLayerGroup} />
                          {level}
                        </h3>
                        
                        <div className="pre-assess-activity-cards">
                          {activities.map(activity => (
                            <div 
                              key={activity.id} 
                              className="pre-assess-activity-card"
                            >
                              <div className="pre-assess-activity-header">
                                <div className="pre-assess-activity-title-area">
                                  <h4 className="pre-assess-activity-title">
                                    {activity.title}
                                  </h4>
                                  <div className="pre-assess-activity-meta">
                                    {activity.categories?.map((category, idx) => (
                                      <span key={idx} className="pre-assess-category-tag">
                                        {category}
                                      </span>
                                    ))}
                                    <span className="pre-assess-type-tag">
                                      {activity.contentType || 'General'}
                                    </span>
                                  </div>
                                </div>
                                <div className="pre-assess-activity-selection">
                                  <span className="pre-assess-selected-count">
                                    {getSelectedQuestionsCount(activity.id) > 0 ? (
                                      <>
                                        <FontAwesomeIcon icon={faCheck} className="pre-assess-check-icon" />
                                        {getSelectedQuestionsCount(activity.id)} selected
                                      </>
                                    ) : 'No questions selected'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="pre-assess-activity-description">
                                <p>{activity.description || 'No description provided'}</p>
                              </div>
                              
                              <div className="pre-assess-activity-stats">
                                <div className="pre-assess-stat">
                                  <FontAwesomeIcon icon={faLayerGroup} />
                                  <span>{activity.levels?.length || 0} level(s)</span>
                                </div>
                                <div className="pre-assess-stat">
                                  <FontAwesomeIcon icon={faQuestion} />
                                  <span>{activity.levels?.reduce((count, level) => count + (level.questions?.length || 0), 0) || 0} question(s)</span>
                                </div>
                              </div>
                              
                              <div className="pre-assess-activity-actions">
                                <button 
                                  type="button"
                                  className="pre-assess-preview-btn"
                                  onClick={() => openPreviewModal(activity)}
                                >
                                  <FontAwesomeIcon icon={faEye} /> Preview Activity
                                </button>
                                
                                <button 
                                  type="button"
                                  className="pre-assess-select-btn"
                                  onClick={() => {
                                    // First preview, then allow selection
                                    openPreviewModal(activity);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCheckSquare} /> Select Questions
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="pre-assess-section">
              <h2 className="pre-assess-section-title">
                <FontAwesomeIcon icon={faCheckCircle} /> Review & Submit
              </h2>
              
              <div className="pre-assess-review-summary">
                <div className="pre-assess-review-basic">
                  <h3>Pre-Assessment Information</h3>
                  <div className="pre-assess-review-item">
                    <span className="pre-assess-review-label">Title:</span>
                    <span className="pre-assess-review-value">{preAssessmentTitle}</span>
                  </div>
                  
                  {preAssessmentDescription && (
                    <div className="pre-assess-review-item pre-assess-review-description">
                      <span className="pre-assess-review-label">Description:</span>
                      <span className="pre-assess-review-value">{preAssessmentDescription}</span>
                    </div>
                  )}
                  
                  <div className="pre-assess-review-item">
                    <span className="pre-assess-review-label">Total Questions:</span>
                    <span className="pre-assess-review-value">{selectedQuestions.length}</span>
                  </div>
                  
                  <div className="pre-assess-review-item">
                    <span className="pre-assess-review-label">Source Activities:</span>
                    <span className="pre-assess-review-value">
                      {new Set(selectedQuestions.map(q => q.activityTitle)).size}
                    </span>
                  </div>
                </div>
                
                <div className="pre-assess-edit-section">
                  <button 
                    type="button" 
                    className="pre-assess-edit-btn"
                    onClick={() => setCurrentStep(1)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit Details
                  </button>
                </div>
              </div>
              
              <div className="pre-assess-selected-questions">
                <h3>Selected Questions</h3>
                
                {selectedQuestions.length === 0 ? (
                  <div className="pre-assess-no-questions">
                    <p>No questions have been selected. Please go back and select at least one question.</p>
                    <button 
                      type="button" 
                      className="pre-assess-btn-secondary"
                      onClick={() => setCurrentStep(2)}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} /> Go Back and Select Questions
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="pre-assess-questions-list">
                      {selectedQuestions.map((question, index) => (
                        <div key={index} className="pre-assess-question-preview">
                          <div className="pre-assess-question-header">
                            <div className="pre-assess-question-number">Question {index + 1}</div>
                            <div className="pre-assess-question-source">
                              From: <span>{question.activityTitle}</span> - <span>{question.levelName}</span>
                            </div>
                            <button 
                              type="button"
                              className="pre-assess-remove-question"
                              onClick={() => toggleQuestionSelection(question.activityId, question.levelId, question.questionId)}
                              title="Remove this question"
                            >
                              <FontAwesomeIcon icon={faTimesCircle} />
                            </button>
                          </div>
                          
                          <div className="pre-assess-question-content">
                            <div className="pre-assess-question-type">
                              <FontAwesomeIcon icon={
                                question.contentType === 'text' ? faFileAlt :
                                question.contentType === 'image' ? faImage :
                                faHeadphones
                              } />
                              <span>{question.contentType}</span>
                            </div>
                            
                            <div className="pre-assess-question-text">
                              {question.questionText}
                            </div>
                            
                            {question.question.options && (
                              <div className="pre-assess-question-options">
                                <div className="pre-assess-options-label">Answer Options:</div>
                                <div className="pre-assess-options-list">
                                  {question.question.options.map((option, optIdx) => (
                                    <div 
                                      key={optIdx} 
                                      className={`pre-assess-option ${optIdx === question.question.correctAnswer ? 'pre-assess-correct-option' : ''}`}
                                    >
                                      {optIdx === question.question.correctAnswer && (
                                        <FontAwesomeIcon icon={faCheck} className="pre-assess-correct-icon" />
                                      )}
                                      <span>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="pre-assess-final-notice">
                <div className="pre-assess-notice-icon">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </div>
                <div className="pre-assess-notice-content">
                  <p>
                    <strong>Note:</strong> After submission, this pre-assessment will be sent to an administrator for approval
                    before it can be assigned to students. You will be notified once it's approved.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Form Navigation */}
          <div className="pre-assess-form-navigation">
            {currentStep > 1 && (
              <button
                type="button"
                className="pre-assess-btn-back"
                onClick={handlePrevStep}
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faChevronLeft} /> Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                className="pre-assess-btn-next"
                onClick={handleNextStep}
                disabled={currentStep === 1 && !preAssessmentTitle.trim()}
              >
                Next <FontAwesomeIcon icon={faChevronRight} />
              </button>
            ) : (
              <button
                type="submit"
                className="pre-assess-btn-submit"
                disabled={submitting || selectedQuestions.length === 0}
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
                  </>
                ) : (
                  <>
                    Submit for Approval <FontAwesomeIcon icon={faCloudUploadAlt} />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Preview Modal */}
      {showPreviewModal && previewActivity && (
        <ActivityPreviewModal 
          activity={previewActivity}
          onClose={closePreviewModal}
          onSelectQuestion={toggleQuestionSelection}
          selectedQuestions={selectedQuestions}
          isQuestionSelected={isQuestionSelected}
        />
      )}
    </div>
  );
};

export default CreatePreAssessment;

