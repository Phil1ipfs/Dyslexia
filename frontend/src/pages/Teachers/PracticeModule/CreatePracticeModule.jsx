import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSave,
  faPlus,
  faFileAlt,
  faTrash,
  faExclamationTriangle,
  faInfoCircle,
  faCheck,
  faSpinner,
  faBookOpen,
  faImage,
  faVolumeUp,
  faFont,
  faMicrophone,
  faLayerGroup,
  faQuestionCircle,
  faHeadphones,
  faCalendarAlt,
  faUser,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import './CreatePracticeModule.css';

// Import mock data
import { readingLevels, categories } from '../../../data/Teachers/activityData';

// This component creates targeted practice modules for students who are struggling
// with specific activities/topics
const CreatePracticeModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activityId, studentId } = useParams();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalActivity, setOriginalActivity] = useState(null);
  const [student, setStudent] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  
  // Practice module details
  const [practiceModule, setPracticeModule] = useState({
    title: '',
    description: '',
    targetLevel: '',
    targetCategory: '',
    originalActivityId: activityId || '',
    status: 'active',
    levels: []
  });
  
  // Current level being edited
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // Use this to track if the form has been submitted successfully
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Load original activity and student data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch original activity (using mock data for now)
        if (activityId) {
          // First check localStorage for newly added activities
          const newlyAddedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
          let activity = newlyAddedActivities.find(a => Number(a.id) === Number(activityId));
          
          // If not found in localStorage, check mock data
          if (!activity) {
            const mockModule = await import('../../../data/Teachers/activitiesMockData');
            const mockData = mockModule.default;
            activity = mockData.find(a => Number(a.id) === Number(activityId));
          }
          
          if (activity) {
            setOriginalActivity(activity);
            
            // Pre-populate form with activity data
            setPracticeModule(prev => ({
              ...prev,
              title: `Practice: ${activity.title}`,
              description: `Practice module for students struggling with ${activity.title}`,
              targetLevel: activity.level || '',
              targetCategory: activity.categories?.[0] || '',
              originalActivityId: activity.id
            }));
            
            // Create initial level based on original activity
            if (activity.levels && activity.levels.length > 0) {
              const firstLevel = activity.levels[0];
              const simplifiedLevel = {
                id: 1,
                levelName: 'Practice Level 1',
                contentType: firstLevel.contentType || 'image',
                content: firstLevel.content ? [...firstLevel.content] : [],
                questions: firstLevel.questions ? 
                  firstLevel.questions.map(q => ({
                    ...q,
                    hint: q.hint || "Try again! Think about what you learned in class."
                  })) : []
              };
              
              setPracticeModule(prev => ({
                ...prev,
                levels: [simplifiedLevel]
              }));
            } else {
              // Create default level if original has none
              setPracticeModule(prev => ({
                ...prev,
                levels: [{
                  id: 1,
                  levelName: 'Practice Level 1',
                  contentType: 'image',
                  content: [],
                  questions: [{
                    id: Date.now(),
                    questionText: '',
                    contentType: 'image',
                    options: ['', ''],
                    correctAnswer: 0,
                    hint: "Try again! Think about what you learned in class.",
                    imageUrl: null,
                    audioUrl: null,
                    optionAudioUrls: [null, null]
                  }]
                }]
              }));
            }
          }
        }
        
        // Fetch student data if studentId is provided
        if (studentId) {
          // Mock student data for now
          setStudent({
            id: studentId,
            name: "Juan Dela Cruz",
            grade: "Grade 2",
            level: "Antas Dalawa",
            recentActivities: [
              { id: 1, title: "Pagbasa ng Bugtong", score: 3, maxScore: 10, date: "2025-04-15" },
              { id: 2, title: "Mga Hayop sa Bukid", score: 7, maxScore: 10, date: "2025-04-12" }
            ]
          });
        }
        
      } catch (error) {
        console.error("Error loading data:", error);
        setErrors({ general: "Failed to load activity data. Please try again." });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activityId, studentId]);
  
  // Get current level object
  const getCurrentLevel = () => {
    return practiceModule.levels.find(level => level.id === currentLevel) || practiceModule.levels[0];
  };
  
  // Handlers for basic information updates
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setPracticeModule(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Add a new level
  const addNewLevel = () => {
    const newLevelId = Math.max(0, ...practiceModule.levels.map(l => l.id)) + 1;
    
    setPracticeModule(prev => ({
      ...prev,
      levels: [
        ...prev.levels,
        {
          id: newLevelId,
          levelName: `Practice Level ${newLevelId}`,
          contentType: 'image',
          content: [],
          questions: [{
            id: Date.now(),
            questionText: '',
            contentType: 'image',
            options: ['', ''],
            correctAnswer: 0,
            hint: "Try again! Think about what you learned in class.",
            imageUrl: null,
            audioUrl: null,
            optionAudioUrls: [null, null]
          }]
        }
      ]
    }));
  };
  
  // Remove a level
  const removeLevel = (levelId) => {
    if (practiceModule.levels.length <= 1) {
      return; // Don't remove if it's the only level
    }
    
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.filter(level => level.id !== levelId)
    }));
    
    // If we're removing the current level, switch to the first remaining level
    if (currentLevel === levelId) {
      const remainingLevels = practiceModule.levels.filter(level => level.id !== levelId);
      if (remainingLevels.length > 0) {
        setCurrentLevel(remainingLevels[0].id);
      }
    }
  };
  
  // Update level name
  const updateLevelName = (levelId, newName) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === levelId ? { ...level, levelName: newName } : level
      )
    }));
  };
  
  // Switch content type for the current level
  const switchContentType = (newContentType) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? { 
              ...level, 
              contentType: newContentType,
              // Reset content based on new type if needed
              content: level.contentType !== newContentType ? [] : level.content
            }
          : level
      )
    }));
  };
  
  // Add a question to the current level
  const addQuestion = () => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj) return;
    
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: [
                ...level.questions,
                {
                  id: Date.now(),
                  questionText: '',
                  contentType: 'image',
                  options: ['', ''],
                  correctAnswer: 0,
                  hint: "Try again! Think about what you learned in class.",
                  imageUrl: null,
                  audioUrl: null,
                  optionAudioUrls: [null, null]
                }
              ]
            }
          : level
      )
    }));
  };
  
  // Remove a question
  const removeQuestion = (questionId) => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj || currentLevelObj.questions.length <= 1) return;
    
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.filter(q => q.id !== questionId)
            }
          : level
      )
    }));
  };
  
  // Update a question field
  const updateQuestion = (index, field, value) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, idx) =>
                idx === index
                  ? { ...q, [field]: value }
                  : q
              )
            }
          : level
      )
    }));
    
    // Clear validation error for questions if exists
    if (errors.questions) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.questions;
        return updated;
      });
    }
  };
  
  // Update question content type
  const updateQuestionType = (index, contentType) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, idx) =>
                idx === index
                  ? { ...q, contentType }
                  : q
              )
            }
          : level
      )
    }));
  };
  
  // Update option text
  const updateOption = (questionIndex, optionIndex, value) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? {
                      ...q,
                      options: q.options.map((opt, oIdx) =>
                        oIdx === optionIndex ? value : opt
                      )
                    }
                  : q
              )
            }
          : level
      )
    }));
    
    // Clear validation error for options if exists
    if (errors.options) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.options;
        return updated;
      });
    }
  };
  
  // Set correct answer
  const setCorrectAnswer = (questionIndex, optionIndex) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? { ...q, correctAnswer: optionIndex }
                  : q
              )
            }
          : level
      )
    }));
  };
  
  // Handle file uploads for questions (images, audio)
  const handleQuestionFileUpload = (questionIndex, fileType, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // For now, we'll just use a simple URL for mock data
    // In a real implementation, you would upload the file to a server
    const fileUrl = URL.createObjectURL(file);
    
    updateQuestion(
      questionIndex, 
      fileType === 'image' ? 'imageUrl' : 'audioUrl', 
      fileUrl
    );
  };
  
  // Handle audio upload for answer options
  const handleOptionAudioUpload = (questionIndex, optionIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Create a URL for the audio file
    const audioUrl = URL.createObjectURL(file);
    
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? {
                      ...q,
                      optionAudioUrls: q.optionAudioUrls.map((url, oIdx) =>
                        oIdx === optionIndex ? audioUrl : url
                      )
                    }
                  : q
              )
            }
          : level
      )
    }));
  };
  
  // Remove option audio
  const removeOptionAudio = (questionIndex, optionIndex) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? {
                      ...q,
                      optionAudioUrls: q.optionAudioUrls.map((url, oIdx) =>
                        oIdx === optionIndex ? null : url
                      )
                    }
                  : q
              )
            }
          : level
      )
    }));
  };
  
  // Add a new option to a question
  const addOption = (questionIndex) => {
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? { 
                      ...q, 
                      options: [...q.options, ''],
                      optionAudioUrls: [...(q.optionAudioUrls || []), null]
                    }
                  : q
              )
            }
          : level
      )
    }));
  };
  
  // Remove an option from a question
  const removeOption = (questionIndex, optionIndex) => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj) return;
    
    const question = currentLevelObj.questions[questionIndex];
    if (!question || question.options.length <= 2) return; // Maintain at least 2 options
    
    setPracticeModule(prev => ({
      ...prev,
      levels: prev.levels.map(level =>
        level.id === currentLevel
          ? {
              ...level,
              questions: level.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? {
                      ...q,
                      options: q.options.filter((_, oIdx) => oIdx !== optionIndex),
                      optionAudioUrls: q.optionAudioUrls.filter((_, oIdx) => oIdx !== optionIndex),
                      // Adjust correctAnswer if necessary
                      correctAnswer: q.correctAnswer === optionIndex
                        ? 0
                        : q.correctAnswer > optionIndex
                          ? q.correctAnswer - 1
                          : q.correctAnswer
                    }
                  : q
              )
            }
          : level
      )
    }));
  };
  
  // Validate the current form step
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!practiceModule.title.trim()) {
        newErrors.title = 'Practice module title is required';
      }
      
      if (!practiceModule.targetLevel) {
        newErrors.targetLevel = 'Target level is required';
      }
      
      if (!practiceModule.targetCategory) {
        newErrors.targetCategory = 'Target category is required';
      }
    }
    
    if (step === 2) {
      const currentLevelObj = getCurrentLevel();
      
      if (!currentLevelObj) {
        newErrors.level = 'No level data found';
        setErrors(newErrors);
        return false;
      }
      
      // Check questions
      if (currentLevelObj.questions.some(q => !q.questionText.trim())) {
        newErrors.questions = 'All questions must have text';
      }
      
      // Check options
      if (currentLevelObj.questions.some(q => q.options.some(opt => !opt.trim()))) {
        newErrors.options = 'All options must have text';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form navigation
  const nextStep = () => {
    if (currentStep === 1) {
      if (validateStep(1)) {
        setCurrentStep(2);
        window.scrollTo(0, 0);
      }
    } else if (currentStep === 2) {
      if (validateStep(2)) {
        // If there are more levels, go to the next one
        const levels = practiceModule.levels.sort((a, b) => a.id - b.id);
        const currentLevelIndex = levels.findIndex(l => l.id === currentLevel);
        
        if (currentLevelIndex < levels.length - 1) {
          setCurrentLevel(levels[currentLevelIndex + 1].id);
        } else {
          setCurrentStep(3); // Final review
        }
        window.scrollTo(0, 0);
      }
    }
  };
  
  const prevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Check if we need to go back to previous level
      const levels = practiceModule.levels.sort((a, b) => a.id - b.id);
      const currentLevelIndex = levels.findIndex(l => l.id === currentLevel);
      
      if (currentLevelIndex > 0) {
        setCurrentLevel(levels[currentLevelIndex - 1].id);
      } else {
        setCurrentStep(1);
      }
    } else {
      navigate('/teacher/manage-activities');
    }
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep < 3) {
      nextStep();
      return;
    }
    
    // Validate entire form
    const isValid = practiceModule.levels.every(level => {
      // Check questions
      const questionsValid = level.questions.every(q => q.questionText.trim() !== '');
      
      // Check options
      const optionsValid = level.questions.every(q => 
        q.options.every(opt => opt.trim() !== '')
      );
      
      return questionsValid && optionsValid;
    });
    
    if (!isValid) {
      setErrors({ general: 'Please review all questions and options in each level' });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // In a real implementation, this would be an API call
      console.log('Submitting practice module:', practiceModule);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store in localStorage for demo purposes
      const existingModules = JSON.parse(localStorage.getItem('practiceModules') || '[]');
      const newModule = {
        ...practiceModule,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: {
          id: 1,
          name: 'Current Teacher'
        }
      };
      
      localStorage.setItem('practiceModules', JSON.stringify([...existingModules, newModule]));
      
      // If student was selected, create assignment
      if (student) {
        const assignments = JSON.parse(localStorage.getItem('practiceAssignments') || '[]');
        const newAssignment = {
          id: Date.now(),
          practiceModuleId: newModule.id,
          studentId: student.id,
          assignedBy: 1, // Current teacher ID
          assignedAt: new Date().toISOString(),
          status: 'assigned'
        };
        
        localStorage.setItem('practiceAssignments', JSON.stringify([...assignments, newAssignment]));
      }
      
      setSubmitSuccess(true);
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/teacher/practice-modules');
      }, 2000);
    } catch (error) {
      console.error('Error submitting practice module:', error);
      setErrors({ general: 'Failed to submit practice module. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Tooltip component for information tips
  const InfoTooltip = ({ text }) => (
    <div className="info-tooltip">
      <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
      <div className="tooltip-content">{text}</div>
    </div>
  );

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Success state
  if (submitSuccess) {
    return (
      <div className="create-practice-container">
        <div className="success-state">
          <FontAwesomeIcon icon={faCheck} className="success-icon" />
          <h2>Practice Module Created Successfully!</h2>
          <p>The practice module has been created and is now available for assignment.</p>
          {student && (
            <p>This module has been assigned to <strong>{student.name}</strong>.</p>
          )}
          <p>You will be redirected to the practice modules page.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="create-practice-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="spinner-icon" />
          <h2>Loading Data...</h2>
          <p>Please wait while we prepare the practice module.</p>
        </div>
      </div>
    );
  }

  // Content type definitions with icons and descriptions
  const contentTypes = [
    {
      id: 'image',
      name: 'Question with Image or Audio Based',
      icon: faImage,
      description: 'Visually-driven activities with supporting captions and questions with audio or texts or images'
    },
    {
      id: 'reading',
      name: 'Reading Passages',
      icon: faBookOpen,
      description: 'Text-based activities with syllable breakdowns and supporting visuals'
    },
  ];

  return (
    <div className="create-practice-container">
      <div className="practice-header">
        <h1>
          {currentStep === 1 ? 'Create Practice Module' :
            currentStep === 2 ? `Configure ${getCurrentLevel()?.levelName || 'Level'}` :
              'Review & Submit Practice Module'}
        </h1>
        <p className="subtitle">
          {currentStep === 1 ? 'Create a targeted practice for students struggling with specific content' :
            currentStep === 2 ? 'Configure questions and content for this practice level' :
              'Review all content and submit the practice module'}
        </p>
      </div>

      {/* Original activity reference card */}
      {originalActivity && (
        <div className="reference-card">
          <div className="reference-header">
            <h3><FontAwesomeIcon icon={faInfoCircle} /> Based on Original Activity</h3>
          </div>
          <div className="reference-content">
            <div className="reference-details">
              <p className="reference-title">{originalActivity.title}</p>
              <div className="reference-meta">
                <span><FontAwesomeIcon icon={faLayerGroup} /> {originalActivity.level}</span>
                <span><FontAwesomeIcon icon={faBookOpen} /> {originalActivity.categories?.[0]}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student reference card */}
      {student && (
        <div className="reference-card student-card">
          <div className="reference-header">
            <h3><FontAwesomeIcon icon={faUser} /> Target Student</h3>
          </div>
          <div className="reference-content">
            <div className="reference-details">
              <p className="reference-title">{student.name}</p>
              <div className="reference-meta">
                <span><FontAwesomeIcon icon={faLayerGroup} /> {student.level}</span>
                <span><FontAwesomeIcon icon={faCalendarAlt} /> {student.grade}</span>
              </div>
              <div className="student-performance">
                <h4><FontAwesomeIcon icon={faChartLine} /> Recent Performance</h4>
                <div className="performance-items">
                  {student.recentActivities.map((activity, index) => (
                    <div key={index} className="performance-item">
                      <div className="activity-name">{activity.title}</div>
                      <div className="activity-score">
                        Score: <strong>{activity.score}/{activity.maxScore}</strong>
                        <span className="activity-date">{formatDate(activity.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Steps indicator */}
      <div className="steps-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Basic Information</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Content Configuration</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Review & Submit</div>
        </div>
      </div>

      {/* Error messages */}
      {errors.general && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>

            <div className="form-group">
              <label htmlFor="title">
                Practice Module Title <span className="required">*</span>
                <InfoTooltip text="Give your practice module a descriptive title to help identify its purpose." />
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={practiceModule.title}
                onChange={handleBasicInfoChange}
                className={errors.title ? 'error' : ''}
                placeholder="E.g., Practice: Pagkilala sa mga Hayop"
              />
              {errors.title && <div className="field-error">{errors.title}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="targetLevel">
                  Target Level (Antas) <span className="required">*</span>
                  <InfoTooltip text="Select the appropriate reading level for this practice module." />
                </label>
                <select
                  id="targetLevel"
                  name="targetLevel"
                  value={practiceModule.targetLevel}
                  onChange={handleBasicInfoChange}
                  className={errors.targetLevel ? 'error' : ''}
                >
                  <option value="">Select a level</option>
                  {readingLevels.slice(1).map((level, index) => (
                    <option key={index} value={level}>{level}</option>
                  ))}
                </select>
                {errors.targetLevel && <div className="field-error">{errors.targetLevel}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="targetCategory">
                  Target Category <span className="required">*</span>
                  <InfoTooltip text="Choose the primary skill focus for this practice module." />
                </label>
                <select
                  id="targetCategory"
                  name="targetCategory"
                  value={practiceModule.targetCategory}
                  onChange={handleBasicInfoChange}
                  className={errors.targetCategory ? 'error' : ''}
                >
                  <option value="">Select a category</option>
                  {categories.slice(1).map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
                {errors.targetCategory && <div className="field-error">{errors.targetCategory}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description
                <InfoTooltip text="Provide a brief description of what students will practice in this module." />
              </label>
              <textarea
                id="description"
                name="description"
                value={practiceModule.description}
                onChange={handleBasicInfoChange}
                rows="4"
                placeholder="Describe the practice module and its learning objectives..."
              ></textarea>
            </div>

            {/* Level management */}
            <div className="level-management">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faLayerGroup} /> Practice Levels
              </h3>
              <p className="helper-text">
                You can create multiple levels with different content for progressive practice.
              </p>

              <div className="level-list">
                {practiceModule.levels.map(level => (
                  <div key={level.id} className="level-item">
                    <input
                      type="text"
                      value={level.levelName}
                      onChange={(e) => updateLevelName(level.id, e.target.value)}
                      className="level-name-input"
                    />
                    {practiceModule.levels.length > 1 && (
                      <button
                        type="button"
                        className="remove-level-btn"
                        onClick={() => removeLevel(level.id)}
                        aria-label="Remove level"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-level-btn"
                  onClick={addNewLevel}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add New Level
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Content Configuration */}
        {currentStep === 2 && (
          <div className="content-config-section">
            {/* Level navigation */}
            <div className="level-navigation">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faLayerGroup} /> Configure Level:
              </h3>
              <div className="level-tabs">
                {practiceModule.levels.map(level => (
                  <button
                    key={level.id}
                    type="button"
                    className={`level-tab ${level.id === currentLevel ? 'active' : ''}`}
                    onClick={() => setCurrentLevel(level.id)}
                  >
                    {level.levelName}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type Selection */}
            <div className="content-type-selection">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faFileAlt} /> Content Type
              </h3>
              <div className="content-type-options">
                {contentTypes.map(type => (
                  <div
                    key={type.id}
                    className={`content-type-option ${getCurrentLevel()?.contentType === type.id ? 'active' : ''}`}
                    onClick={() => switchContentType(type.id)}
                  >
                    <div className="content-type-icon">
                      <FontAwesomeIcon icon={type.icon} />
                    </div>
                    <div className="content-type-details">
                      <div className="content-type-name">{type.name}</div>
                      <div className="content-type-description">{type.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions Section */}
            <div className="questions-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faQuestionCircle} /> Practice Questions
              </h3>

              {errors.questions && (
                <div className="error-message section-error">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{errors.questions}</span>
                </div>
              )}

              {errors.options && (
                <div className="error-message section-error">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{errors.options}</span>
                </div>
              )}

              {getCurrentLevel()?.questions.map((question, qIndex) => (
                <div key={question.id} className="question-card">
                  <div className="question-header">
                    <h4>Question {qIndex + 1}</h4>
                    <button
                      type="button"
                      className="remove-question-btn"
                      onClick={() => removeQuestion(question.id)}
                      disabled={getCurrentLevel().questions.length <= 1}
                      aria-label="Remove question"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Remove
                    </button>
                  </div>

                  {/* Question Content Type Selection */}
                  <div className="question-type-selection">
                    <label>Question Type</label>
                    <div className="type-buttons">
                      <button
                        type="button"
                        className={`type-button ${question.contentType === 'text' ? 'active' : ''}`}
                        onClick={() => updateQuestionType(qIndex, 'text')}
                      >
                        <FontAwesomeIcon icon={faFont} />
                        <span>Text</span>
                      </button>
                      <button
                        type="button"
                        className={`type-button ${question.contentType === 'image' ? 'active' : ''}`}
                        onClick={() => updateQuestionType(qIndex, 'image')}
                      >
                        <FontAwesomeIcon icon={faImage} />
                        <span>Image</span>
                      </button>
                      <button
                        type="button"
                        className={`type-button ${question.contentType === 'audio' ? 'active' : ''}`}
                        onClick={() => updateQuestionType(qIndex, 'audio')}
                      >
                        <FontAwesomeIcon icon={faMicrophone} />
                        <span>Audio</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Question Text <span className="required">*</span>
                    </label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                      placeholder="Enter the question text..."
                      rows="2"
                      className={errors.questions ? 'error' : ''}
                    ></textarea>
                  </div>

                  {/* Media based on question type */}
                  {question.contentType === 'image' && (
                    <div className="question-media">
                      <label>Question Image</label>
                      <div className="upload-container">
                        {question.imageUrl ? (
                          <div className="image-preview">
                            <img
                              src={question.imageUrl}
                              alt="Question visual"
                              className="preview-image"
                            />
                            <button
                              type="button"
                              className="remove-media-btn"
                              onClick={() => updateQuestion(qIndex, 'imageUrl', null)}
                              aria-label="Remove image"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ) : (
                          <label className="upload-placeholder">
                            <FontAwesomeIcon icon={faImage} className="upload-icon" />
                            <span>Choose Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQuestionFileUpload(qIndex, 'image', e)}
                              className="file-input"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {question.contentType === 'audio' && (
                    <div className="question-media">
                      <label>Question Audio</label>
                      <div className="upload-container">
                        {question.audioUrl ? (
                          <div className="audio-preview">
                            <audio
                              controls
                              src={question.audioUrl}
                              className="audio-player"
                            ></audio>
                            <button
                              type="button"
                              className="remove-media-btn"
                              onClick={() => updateQuestion(qIndex, 'audioUrl', null)}
                              aria-label="Remove audio"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ) : (
                          <label className="upload-placeholder">
                            <FontAwesomeIcon icon={faHeadphones} className="upload-icon" />
                            <span>Upload Audio</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleQuestionFileUpload(qIndex, 'audio', e)}
                              className="file-input"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Answer Options */}
                  <div className="options-container">
                    <div className="options-header">
                      <label>
                        Answer Options <span className="required">*</span>
                      </label>
                      {question.options.length < 4 && (
                        <button
                          type="button"
                          className="add-option-btn"
                          onClick={() => addOption(qIndex)}
                        >
                          <FontAwesomeIcon icon={faPlus} /> Add Option
                        </button>
                      )}
                    </div>

                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-row">
                        <div className="option-radio">
                          <input
                            type="radio"
                            id={`q${question.id}-opt${oIndex}`}
                            name={`question-${question.id}-correct`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => setCorrectAnswer(qIndex, oIndex)}
                          />
                          <label htmlFor={`q${question.id}-opt${oIndex}`}>
                            Correct
                          </label>
                        </div>

                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className={errors.options ? 'error' : ''}
                        />
                        
                        {/* Option audio controls */}
                        <div className="option-audio-controls">
                          {question.optionAudioUrls && question.optionAudioUrls[oIndex] ? (
                            <div className="audio-preview">
                              <audio 
                                controls 
                                src={question.optionAudioUrls[oIndex]} 
                                className="audio-player"
                              ></audio>
                              <button
                                type="button"
                                className="remove-media-btn"
                                onClick={() => removeOptionAudio(qIndex, oIndex)}
                                aria-label="Remove audio"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          ) : (
                            <label className="option-audio-upload">
                              <FontAwesomeIcon icon={faHeadphones} />
                              <span>Add Audio</span>
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleOptionAudioUpload(qIndex, oIndex, e)}
                                className="file-input"
                              />
                            </label>
                          )}
                        </div>

                        {question.options.length > 2 && (
                          <button
                            type="button"
                            className="remove-option-btn"
                            onClick={() => removeOption(qIndex, oIndex)}
                            aria-label="Remove option"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label>
                      Hint/Explanation
                      <InfoTooltip text="This will be shown to the student after answering incorrectly." />
                    </label>
                    <textarea
                      value={question.hint}
                      onChange={(e) => updateQuestion(qIndex, 'hint', e.target.value)}
                      placeholder="Provide a helpful hint or explanation for this question"
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="add-question-btn"
                onClick={addQuestion}
              >
                <FontAwesomeIcon icon={faPlus} /> Add New Question
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="review-section">
            <h2 className="section-title">Review & Submit</h2>

            <div className="review-notice">
              <FontAwesomeIcon icon={faInfoCircle} className="notice-icon" />
              <p>Please review all information before submitting your practice module.</p>
            </div>

            {/* Basic Information Summary */}
            <div className="review-card">
              <h3>Basic Information</h3>
              <div className="review-item">
                <span className="review-label">Title:</span>
                <span className="review-value">{practiceModule.title}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Level:</span>
                <span className="review-value">{practiceModule.targetLevel}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Category:</span>
                <span className="review-value">{practiceModule.targetCategory}</span>
              </div>
              {practiceModule.description && (
                <div className="review-item description">
                  <span className="review-label">Description:</span>
                  <span className="review-value">{practiceModule.description}</span>
                </div>
              )}
            </div>

            {/* Levels Summary */}
            <div className="review-card">
              <h3>Practice Structure</h3>
              <div className="review-item">
                <span className="review-label">Number of Levels:</span>
                <span className="review-value">{practiceModule.levels.length}</span>
              </div>

              {practiceModule.levels.map((level, index) => (
                <div key={level.id} className="level-review">
                  <div className="level-review-header">
                    <h4>{level.levelName || `Level ${index + 1}`}</h4>
                    <div className="level-type-badge">
                      <FontAwesomeIcon
                        icon={
                          level.contentType === 'reading' ? faBookOpen :
                          level.contentType === 'image' ? faImage :
                          faVolumeUp
                        }
                      />
                      <span>
                        {level.contentType === 'reading' ? 'Reading Based' :
                         level.contentType === 'image' ? 'Image Based' :
                         'Audio Based'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="edit-level-btn"
                      onClick={() => {
                        setCurrentLevel(level.id);
                        setCurrentStep(2);
                      }}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Edit Level
                    </button>
                  </div>

                  <div className="level-content-summary">
                    <div className="summary-row">
                      <span className="summary-label">Questions:</span>
                      <span className="summary-value">{level.questions?.length || 0}</span>
                    </div>

                    <div className="questions-preview">
                      {level.questions?.slice(0, 2).map((q, idx) => (
                        <div key={idx} className="question-preview">
                          <span className="question-number">Q{idx + 1}:</span>
                          <span className="question-text">
                            {q.questionText ?
                              (q.questionText.length > 80 ?
                                q.questionText.substring(0, 80) + '...' :
                                q.questionText) :
                              'Question text not entered'}
                          </span>
                          <div className="question-type-tag">
                            <FontAwesomeIcon
                              icon={
                                q.contentType === 'text' ? faFont :
                                q.contentType === 'image' ? faImage :
                                faMicrophone
                              }
                            />
                            <span>{q.contentType.charAt(0).toUpperCase() + q.contentType.slice(1)}</span>
                          </div>
                        </div>
                      ))}

                      {level.questions?.length > 2 && (
                        <div className="more-questions">
                          ...and {level.questions.length - 2} more questions
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Targeted Student Information */}
            {student && (
              <div className="review-card">
                <h3>Assignment Information</h3>
                <div className="review-item">
                  <span className="review-label">Assign To:</span>
                  <span className="review-value">{student.name}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Student Level:</span>
                  <span className="review-value">{student.level}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Grade:</span>
                  <span className="review-value">{student.grade}</span>
                </div>
                <p className="assignment-note">
                  <FontAwesomeIcon icon={faInfoCircle} /> This practice module will be automatically assigned to the student upon submission.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Form Navigation */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-back"
            onClick={prevStep}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            type="submit"
            className="btn-next"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                {currentStep === 3 ? 'Submitting...' : 'Saving...'}
              </>
            ) : (
              <>
                {currentStep === 1 && (
                  <>Next</>
                )}
                {currentStep === 2 && (
                  <>Review</>
                )}
                {currentStep === 3 && (
                  <>Create Practice Module</>
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePracticeModule;