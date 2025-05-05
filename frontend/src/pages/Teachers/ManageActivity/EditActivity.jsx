import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faArrowLeft,
  faArrowRight,
  faSpinner,
  faCloudUploadAlt,
  faInfoCircle,
  faExclamationTriangle,
  faCheck,
  faHourglassStart,
  faEdit,
  faTrash,
  faPlus,
  faImage,
  faHeadphones,
  faFileAlt,
  faVolumeUp,
  faLayerGroup,
  faQuestionCircle,
  faFont,
  faMicrophone,
  faBookOpen,
  faCheckCircle,
  faTimesCircle,
  faHistory,
  faUserEdit,
  faCalendarAlt,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import '../../../css/Teachers/EditActivity.css';

// Import data sources
import { readingLevels, categories } from '../../../data/Teachers/activityData';

const EditActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ──── State Management ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState(null);
  const [originalActivity, setOriginalActivity] = useState(null); // Store original activity to preserve content types
  const [levels, setLevels] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDetails, setShowRejectionDetails] = useState(false);

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

  // ──── Helper Functions ────────────────────────────────────────────────────────
  // Get current level object
  const getCurrentLevel = () =>
    levels.find(l => l.id === currentLevel)
    || { content: [], questions: [], contentType: 'reading', levelName: '' };

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

  // Create default content item based on content type
  const defaultContent = type => {
    const base = { id: Date.now() };
    if (type === 'reading') return {
      ...base,
      text: '',
      syllables: '',
      translation: '',
      imageFile: null,
      imagePreview: null,
      audioFile: null
    };
    if (type === 'image') return {
      ...base,
      caption: '',
      imageFile: null,
      imagePreview: null
    };
    if (type === 'voice') return {
      ...base,
      text: '',
      pronunciation: '',
      audioFile: null
    };
    return base;
  };

  // Create default question item
  const defaultQuestion = () => ({
    id: Date.now(),
    questionText: '',
    contentType: 'image',
    options: ['', ''],
    correctAnswer: 0,
    hint: '',
    imageFile: null,
    imagePreview: null,
    audioFile: null,
    optionAudioFiles: [null, null],
    optionAudioUrls: [null, null],
  });


  // Upload/replace one option’s audio
  const handleOptionAudioUpload = (questionIndex, optionIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    setLevels(prev =>
      prev.map(level =>
        level.id !== currentLevel
          ? level
          : {
            ...level,
            questions: level.questions.map((q, qi) =>
              qi !== questionIndex
                ? q
                : {
                  ...q,
                  optionAudioFiles: q.optionAudioFiles.map((f, idx) => idx === optionIndex ? file : f),
                  optionAudioUrls: q.optionAudioUrls.map((u, idx) => idx === optionIndex ? url : u),
                }
            ),
          }
      )
    );
  };
  
  // Add this effect to enforce default content type
  useEffect(() => {
    if (currentLevel) {
      const level = getCurrentLevel();
      if (level && !level.contentType) {
        setLevels(prevLevels =>
          prevLevels.map(lvl =>
            lvl.id === currentLevel
              ? { ...lvl, contentType: 'image' }
              : lvl
          )
        );
      }
    }
  }, [currentLevel]);

  // ──── Data Loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check newly added activities in localStorage first
        const newlyAddedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
        let activity = newlyAddedActivities.find(a => Number(a.id) === Number(id));

        // If not found in localStorage, check mock data
        if (!activity) {
          const mockModule = await import('../../../data/Teachers/activitiesMockData');
          const mockData = mockModule.default;
          activity = mockData.find(a => Number(a.id) === Number(id));
        }

        if (!activity) {
          throw new Error('Activity not found');
        }

        // Store original activity data to preserve content types
        setOriginalActivity(activity);

        // Set up basic activity data
        setActivityData({
          id: activity.id,
          title: activity.title || '',
          level: activity.level || readingLevels[1],
          category: activity.categories?.[0] || categories[1],
          type: activity.type || 'template',
          description: activity.description || '',
          status: activity.status || 'draft',
          createdAt: activity.createdAt,
          lastModified: activity.lastModified,
          adminRemarks: activity.adminRemarks || ''
        });

        // Check for rejection reason
        if (activity.status === 'rejected' && activity.adminRemarks) {
          setRejectionReason(activity.adminRemarks);
        }

        // Process levels from activity or create default
        if (activity.levels && activity.levels.length > 0) {
          setLevels(activity.levels.map(level => ({
            ...level,
            // Ensure questions have all required properties
            questions: level.questions.map(q => ({
              id: q.id || Date.now(),
              questionText: q.questionText || '',
              contentType: q.contentType || 'image', // Default to image here too
              options: q.options || ['', ''],
              correctAnswer: q.correctAnswer || 0,
              hint: q.hint || '',
              imagePreview: q.imagePreview || null,
              audioFile: q.audioFile || null
            }))
          })));
          setCurrentLevel(activity.levels[0].id);
        } else {
          // Create default level with content type based on activity
          const defaultContentType = 'image';
          const newLevel = {
            id: 1,
            levelName: 'Level 1',
            contentType: defaultContentType,
            content: [defaultContent(defaultContentType)],
            questions: [defaultQuestion()]
          };
          setLevels([newLevel]);
          setCurrentLevel(1);
        }
      } catch (err) {
        console.error('Error loading activity:', err);
        setError(err.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  // ──── State Updaters ────────────────────────────────────────────────────────
  // Update activity basic information
  const handleActivityChange = e => {
    const { name, value } = e.target;
    setActivityData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field if exists
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // ──── Level Management ────────────────────────────────────────────────────────
  // Add a new level
  const addLevel = () => {
    const currentLevelObj = getCurrentLevel();
    const newLevelId = Math.max(0, ...levels.map(l => l.id)) + 1;

    // Use the same content type as the current level
    const contentType = currentLevelObj?.contentType || 'reading';

    const newLevel = {
      id: newLevelId,
      levelName: `Level ${levels.length + 1}`,
      contentType,
      content: [defaultContent(contentType)],
      questions: [defaultQuestion()]
    };

    setLevels(prevLevels => [...prevLevels, newLevel]);
  };

  // Remove a level
  const removeLevel = levelId => {
    if (levels.length <= 1) {
      return; // Don't remove if it's the only level
    }

    setLevels(prevLevels => prevLevels.filter(level => level.id !== levelId));

    // If we're removing the current level, switch to another one
    if (currentLevel === levelId) {
      const remainingLevels = levels.filter(level => level.id !== levelId);
      if (remainingLevels.length > 0) {
        setCurrentLevel(remainingLevels[0].id);
      }
    }
  };

  // Update level name
  const updateLevelName = (levelId, newName) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === levelId
          ? { ...level, levelName: newName }
          : level
      )
    );
  };

  // ──── Content Type Management ────────────────────────────────────────────────
  // Switch content type for the current level (if allowed)
  const switchContentType = (newContentType) => {
    const currentLevelObj = getCurrentLevel();

    // For rejected activities, maintain original content type structure
    if (activityData.status === 'rejected' && originalActivity) {
      // Find the matching level in the original activity
      const originalLevel = originalActivity.levels?.find(l => l.id === currentLevel);

      // If this level existed in the original and had a different content type, show an error
      if (originalLevel && originalLevel.contentType && originalLevel.contentType !== newContentType) {
        setError(`Cannot change content type for rejected activities. Original type was "${originalLevel.contentType}".`);
        setTimeout(() => setError(null), 5000);
        return;
      }
    }

    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            contentType: newContentType,
            // Reset content based on new type
            content: [defaultContent(newContentType)]
          }
          : level
      )
    );

    // Clear any errors
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated.content;
      return updated;
    });
  };

  // ──── Content Item Management ────────────────────────────────────────────────
  // Add a content item
  // ──── Content Item Management ────────────────────────────────────────────────
  const addContent = () => {
    setLevels(prev =>
      prev.map(lvl =>
        lvl.id === currentLevel
          ? {
            ...lvl,
            content: [
              // if lvl.content is missing or not an array, use []
              ...(Array.isArray(lvl.content) ? lvl.content : []),
              defaultContent(lvl.contentType),
            ],
          }
          : lvl
      )
    );
  };



  // Remove a content item
  const removeContent = contentId => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj || currentLevelObj.content.length <= 1) return;

    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            content: level.content.filter(item => item.id !== contentId)
          }
          : level
      )
    );
  };

  // Update a field in a content item
  const updateContent = (index, field, value) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            content: level.content.map((item, idx) =>
              idx === index
                ? { ...item, [field]: value }
                : item
            )
          }
          : level
      )
    );

    // Clear validation error for content if it exists
    if (validationErrors.content) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.content;
        return updated;
      });
    }
  };

  // Handle image upload for content
  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateContent(index, 'imageFile', file);
      updateContent(index, 'imagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle audio upload for content
  const handleAudioUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    updateContent(index, 'audioFile', file);
    updateContent(index, 'audioUrl', audioUrl);
  };

  // ──── Question Management ────────────────────────────────────────────────────
  // Add a new question
  const addQuestion = () => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj) return;

    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: [...level.questions, defaultQuestion()]
          }
          : level
      )
    );
  };

  // Remove a question
  const removeQuestion = questionId => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj || currentLevelObj.questions.length <= 1) return;

    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.filter(q => q.id !== questionId)
          }
          : level
      )
    );
  };

  // Update a question field
  const updateQuestion = (index, field, value) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
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
    );

    // Clear validation error for questions if it exists
    if (validationErrors.questions) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.questions;
        return updated;
      });
    }
  };

  // Update question content type
  const updateQuestionType = (index, contentType) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
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
    );
  };

  // Update option text
  const updateOption = (questionIndex, optionIndex, value) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
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
    );

    // Clear validation error for options if it exists
    if (validationErrors.options) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.options;
        return updated;
      });
    }
  };

  // Add a new option to a question
  const addOption = (questionIndex) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map((q, qIdx) =>
              qIdx === questionIndex
                ? { ...q, options: [...q.options, ''] }
                : q
            )
          }
          : level
      )
    );
  };

  // Clears out that one option’s audio:

  const removeOptionAudio = (questionIndex, optionIndex) => {
    setLevels(prev =>
      prev.map(level =>
        level.id !== currentLevel
          ? level
          : {
            ...level,
            questions: level.questions.map((q, qi) =>
              qi !== questionIndex
                ? q
                : {
                  ...q,
                  optionAudioFiles: q.optionAudioFiles.map((f, idx) => idx === optionIndex ? null : f),
                  optionAudioUrls: q.optionAudioUrls.map((u, idx) => idx === optionIndex ? null : u),
                }
            ),
          }
      )
    );
  };


  // Remove an option from a question
  const removeOption = (questionIndex, optionIndex) => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj) return;

    const question = currentLevelObj.questions[questionIndex];
    if (!question || question.options.length <= 2) return; // Maintain at least 2 options

    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map((q, qIdx) =>
              qIdx === questionIndex
                ? {
                  ...q,
                  options: q.options.filter((_, oIdx) => oIdx !== optionIndex),
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
    );
  };

  // Set correct answer
  const setCorrectAnswer = (questionIndex, optionIndex) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
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
    );
  };

  // Handle image upload for question
  const handleQuestionImageUpload = (questionIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateQuestion(questionIndex, 'imageFile', file);
      updateQuestion(questionIndex, 'imagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle audio upload for question
  const handleQuestionAudioUpload = (questionIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    updateQuestion(questionIndex, 'audioFile', file);
    updateQuestion(questionIndex, 'audioUrl', audioUrl);
  };

  // ──── Form Navigation ────────────────────────────────────────────────────────
  // Go to next step
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate basic info
      const errors = {};

      if (!activityData.title.trim()) {
        errors.title = 'Title is required';
      }

      if (!activityData.level) {
        errors.level = 'Reading level is required';
      }

      if (!activityData.category) {
        errors.category = 'Category is required';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else if (currentStep === 2) {
      // Check if there are more levels to configure
      const nextLevel = levels.find(level => level.id > currentLevel);
      if (nextLevel) {
        setCurrentLevel(nextLevel.id);
      } else {
        validateCurrentLevel();
        setCurrentStep(3); // Go to review & submit
      }
      window.scrollTo(0, 0);
    }
  };

  // Go to previous step
  const prevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Check if we need to go back to previous level
      const prevLevel = [...levels]
        .sort((a, b) => a.id - b.id)
        .filter(level => level.id < currentLevel)
        .pop();

      if (prevLevel) {
        setCurrentLevel(prevLevel.id);
      } else {
        setCurrentStep(1);
      }
    } else {
      navigate('/teacher/manage-activities');
    }
    window.scrollTo(0, 0);
  };

  // ──── Validation ────────────────────────────────────────────────────────────
  // Validate current level
  const validateCurrentLevel = () => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj) return false;

    const errors = {};

    // Validate content based on content type
    if (currentLevelObj.contentType === 'reading') {
      if (currentLevelObj.content.some(c => !c.text.trim())) {
        errors.content = 'All reading passages must have text';
      }
    } else if (currentLevelObj.contentType === 'image') {
      if (currentLevelObj.content.some(c => !c.imagePreview)) {
        errors.content = 'All image-based content must have images';
      }
    } else if (currentLevelObj.contentType === 'voice') {
      if (currentLevelObj.content.some(c => !c.text.trim())) {
        errors.content = 'All voice prompts must have text';
      }
    }

    // Validate questions
    if (currentLevelObj.questions.some(q => !q.questionText.trim())) {
      errors.questions = 'All questions must have text';
    }

    // Validate options
    if (currentLevelObj.questions.some(q => q.options.some(opt => !opt.trim()))) {
      errors.options = 'All options must have text';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ──── Form Submission ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < 3) {
      nextStep();
      return;
    }

    // Final validation
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];

      // Check content
      if (level.contentType === 'reading' && level.content.some(c => !c.text.trim())) {
        setCurrentLevel(level.id);
        setCurrentStep(2);
        setValidationErrors({ content: 'All reading passages must have text' });
        return;
      }

      if (level.contentType === 'image' && level.content.some(c => !c.imagePreview)) {
        setCurrentLevel(level.id);
        setCurrentStep(2);
        setValidationErrors({ content: 'All image-based content must have images' });
        return;
      }

      // Check questions and options
      if (level.questions.some(q => !q.questionText.trim())) {
        setCurrentLevel(level.id);
        setCurrentStep(2);
        setValidationErrors({ questions: 'All questions must have text' });
        return;
      }

      if (level.questions.some(q => q.options.some(opt => !opt.trim()))) {
        setCurrentLevel(level.id);
        setCurrentStep(2);
        setValidationErrors({ options: 'All options must have text' });
        return;
      }
    }

    // Proceed with submission
    setSubmitting(true);

    try {
      // Prepare the payload
      const payload = {
        ...activityData,
        levels,
        categories: [activityData.category], // Wrap category in array for consistency
        status: 'pending', // Set status to pending approval
        lastModified: new Date().toISOString(),
        submittedAt: new Date().toISOString()
      };

      console.log('Submitting activity:', payload);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update localStorage to reflect changes
      let existingActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');

      // Find and update the activity if it exists in localStorage
      const activityIndex = existingActivities.findIndex(a => Number(a.id) === Number(id));
      if (activityIndex !== -1) {
        existingActivities[activityIndex] = payload;
      } else {
        // Check if it was from the mock data
        const isMockActivity = originalActivity && !existingActivities.some(a => Number(a.id) === Number(originalActivity.id));
        if (isMockActivity) {
          // Add it to localStorage if it was from mock data
          existingActivities.push(payload);
        }
      }

      localStorage.setItem('mockActivities', JSON.stringify(existingActivities));

      setSubmitSuccess(true);

      // Redirect after showing success message
      setTimeout(() => {
        navigate('/teacher/manage-activities');
      }, 2000);
    } catch (err) {
      console.error('Error submitting activity:', err);
      setError('Failed to submit activity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ──── Rendering ────────────────────────────────────────────────────────────
  // Loading state
  if (loading) {
    return (
      <div className="edit-activity-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="spinner-icon" />
          <p>Loading activity data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !activityData) {
    return (
      <div className="edit-activity-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Error Loading Activity</h2>
          <p>{error}</p>
          <button
            className="btn-back"
            onClick={() => navigate('/teacher/manage-activities')}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Activities
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="edit-activity-container">
        <div className="success-state">
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
          <h2>Activity Submitted Successfully!</h2>
          <p>Your activity has been submitted and is now pending approval.</p>
          <p>You will be redirected to the activities page shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-activity-container">
      {/* Header with title and subtitle */}
      <div className="edit-activity-header">
        <h1>
          {currentStep === 1 ? 'Edit Activity' :
            currentStep === 2 ? `Configure ${getCurrentLevel()?.levelName || 'Level'}` :
              'Review & Submit'}
        </h1>
        <p className="subtitle">
          {currentStep === 1 ? 'Update basic information about the activity' :
            currentStep === 2 ? 'Configure content and questions for this level' :
              'Review all changes and submit for approval'}
        </p>
      </div>

      {/* Activity status indicator */}
      {activityData.status === 'rejected' && (
        <div className="activity-status-banner rejected">
          <div className="status-icon">
            <FontAwesomeIcon icon={faTimesCircle} />
          </div>
          <div className="status-content">
            <h3>This activity was rejected by an administrator</h3>
            <p>
              Please review the feedback below and make necessary changes before resubmitting.
              <button
                className="toggle-details-btn"
                onClick={() => setShowRejectionDetails(!showRejectionDetails)}
              >
                {showRejectionDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </p>
            {showRejectionDetails && (
              <div className="rejection-details">
                <div className="rejection-meta">
                  <span><FontAwesomeIcon icon={faCalendarAlt} /> Rejected on: {formatDate(originalActivity?.lastModified)}</span>
                  <span><FontAwesomeIcon icon={faUserEdit} /> Edited by: {originalActivity?.creator || 'Unknown'}</span>
                </div>
                <div className="rejection-reason">
                  <h4>Rejection Reason:</h4>
                  <p>{rejectionReason || 'No specific reason provided. Please review all content for accuracy and completeness.'}</p>
                </div>
              </div>
            )}
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

      {/* Global error message */}
      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="form-section">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faFileAlt} /> Basic Information
            </h2>

            <div className="form-group">
              <label htmlFor="title">
                Activity Title <span className="required">*</span>
                <div className="info-tooltip">
                  <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
                  <span className="tooltip-content">Give your activity a descriptive title that clearly indicates its purpose.</span>
                </div>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={activityData.title}
                onChange={handleActivityChange}
                className={validationErrors.title ? 'error' : ''}
                placeholder="Enter a descriptive title (e.g., 'Pagkilala sa mga Hayop: Antas Una')"
              />
              {validationErrors.title && <div className="field-error">{validationErrors.title}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="level">
                  Reading Level (Antas) <span className="required">*</span>
                  <div className="info-tooltip">
                    <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
                    <span className="tooltip-content">Select the appropriate reading level based on student grade level.</span>
                  </div>
                </label>
                <select
                  id="level"
                  name="level"
                  value={activityData.level}
                  onChange={handleActivityChange}
                  className={validationErrors.level ? 'error' : ''}
                >
                  <option value="">Select a level</option>
                  {readingLevels.slice(1).map((level, index) => (
                    <option key={index} value={level}>{level}</option>
                  ))}
                </select>
                {validationErrors.level && <div className="field-error">{validationErrors.level}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                  <div className="info-tooltip">
                    <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
                    <span className="tooltip-content">Choose the primary skill focus for this activity.</span>
                  </div>
                </label>
                <select
                  id="category"
                  name="category"
                  value={activityData.category}
                  onChange={handleActivityChange}
                  className={validationErrors.category ? 'error' : ''}
                >
                  <option value="">Select a category</option>
                  {categories.slice(1).map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
                {validationErrors.category && <div className="field-error">{validationErrors.category}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="type">
                Activity Type
                <div className="info-tooltip">
                  <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
                  <span className="tooltip-content">Template: Reusable activity structure. Assessment: For evaluation. Practice: For skill development.</span>
                </div>
              </label>
              <select
                id="type"
                name="type"
                value={activityData.type}
                onChange={handleActivityChange}
              >
                <option value="template">Activity Template</option>
                <option value="assessment">Pre-Assessment</option>
                <option value="practice">Practice Module</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description
                <div className="info-tooltip">
                  <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
                  <span className="tooltip-content">Provide a brief description of what students will learn or practice.</span>
                </div>
              </label>
              <textarea
                id="description"
                name="description"
                value={activityData.description}
                onChange={handleActivityChange}
                rows="4"
                placeholder="Describe the activity and its learning objectives..."
              ></textarea>
            </div>

            {/* Activity metadata display */}
            <div className="activity-metadata">
              <h3>
                <FontAwesomeIcon icon={faLayerGroup} /> Activity Information
              </h3>
              <div className="metadata-grid">
                {/* Created */}
                <div className="metadata-item">
                  <FontAwesomeIcon icon={faCalendarAlt} className="metadata-icon" />
                  <div>
                    <div className="metadata-label">Created</div>
                    <div className="metadata-value">
                      {formatDate(activityData.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Last Modified (only if present) */}
                {activityData.lastModified && (
                  <div className="metadata-item">
                    <FontAwesomeIcon icon={faHourglassStart} className="metadata-icon" />
                    <div>
                      <div className="metadata-label">Last Modified</div>
                      <div className="metadata-value">
                        {formatDate(activityData.lastModified)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className={`metadata-item status-${activityData.status}`}>
                  <FontAwesomeIcon
                    icon={
                      activityData.status === 'approved'
                        ? faCheckCircle
                        : activityData.status === 'pending'
                          ? faHourglassStart
                          : faTimesCircle
                    }
                    className="metadata-icon"
                  />
                  <div>
                    <div className="metadata-label">Status</div>
                    <div className={`metadata-value status-${activityData.status}`}>
                      {activityData.status.charAt(0).toUpperCase() +
                        activityData.status.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Level management */}
            <div className="level-management">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faLayerGroup} /> Activity Levels
              </h3>
              <p className="helper-text">
                You can create multiple levels with increasing difficulty. Each level can have its own content and questions.
              </p>

              <div className="level-list">
                {levels.map(level => (
                  <div key={level.id} className="level-item">
                    <input
                      type="text"
                      value={level.levelName}
                      onChange={(e) => updateLevelName(level.id, e.target.value)}
                      className="level-name-input"
                    />
                    {levels.length > 1 && (
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
                  onClick={addLevel}
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
            {/* ─── Level navigation ─────────────────────────────────────────── */}
            <div className="level-navigation">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faLayerGroup} /> Configure Level:
              </h3>
              <div className="level-tabs">
                {levels.map(level => (
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

            {/* ─── Content Type Selection ─────────────────────────────────────── */}
            {getCurrentLevel() && (
              <div className="content-type-selection">
                <h3 className="section-title">
                  <FontAwesomeIcon icon={faFileAlt} /> Content Type
                </h3>
                <div className="content-type-options">
                  {contentTypes.map(type => (
                    <div
                      key={type.id}
                      className={`content-type-option ${getCurrentLevel().contentType === type.id ? 'active' : ''}`}
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
            )}

            {/* ─── Reading‑only Content Items ───────────────────────────────────── */}
            {getCurrentLevel().contentType === 'reading' && (
              <div className="content-items-section">
                <h3 className="section-title">
                  <FontAwesomeIcon icon={faBookOpen} /> Reading Passages
                </h3>

                {getCurrentLevel().content.map((item, idx) => (
                  <div key={item.id} className="content-item">
                    <div className="item-header">
                      <h4>Passage {idx + 1}</h4>
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeContent(item.id)}
                        disabled={getCurrentLevel().content.length <= 1}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Text <span className="required">*</span></label>
                      <textarea
                        rows="4"
                        value={item.text}
                        onChange={e => updateContent(idx, 'text', e.target.value)}
                        placeholder="Enter passage text..."
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Syllables</label>
                        <textarea
                          rows="2"
                          value={item.syllables}
                          onChange={e => updateContent(idx, 'syllables', e.target.value)}
                          placeholder="ka-mi-ting"
                        />
                      </div>
                      <div className="form-group">
                        <label>Notes</label>
                        <textarea
                          rows="2"
                          value={item.translation}
                          onChange={e => updateContent(idx, 'translation', e.target.value)}
                          placeholder="Optional notes..."
                        />
                      </div>
                    </div>

                    <div className="media-row">
                      <div className="media-column">
                        <label>Image</label>
                        {item.imagePreview ? (
                          <div className="image-preview">
                            <img src={item.imagePreview} alt="" />
                            <button type="button" onClick={() => {
                              updateContent(idx, 'imageFile', null);
                              updateContent(idx, 'imagePreview', null);
                            }}>
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ) : (
                          <label className="upload-placeholder">
                            <FontAwesomeIcon icon={faImage} /> Choose Image
                            <input type="file" accept="image/*" onChange={e => handleImageUpload(idx, e)} />
                          </label>
                        )}
                      </div>

                      <div className="media-column">
                        <label>Audio</label>
                        {item.audioUrl ? (
                          <div className="audio-preview">
                            <audio controls src={item.audioUrl} />
                            <button type="button" onClick={() => {
                              updateContent(idx, 'audioFile', null);
                              updateContent(idx, 'audioUrl', null);
                            }}>
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ) : (
                          <label className="upload-placeholder">
                            <FontAwesomeIcon icon={faHeadphones} /> Upload Audio
                            <input type="file" accept="audio/*" onChange={e => handleAudioUpload(idx, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" className="add-item-btn" onClick={addContent}>
                  <FontAwesomeIcon icon={faPlus} /> Add Passage
                </button>
              </div>
            )}


            {/* Questions */}
            {getCurrentLevel() && (
              <div className="questions-section">
                <h3 className="section-title">
                  <FontAwesomeIcon icon={faQuestionCircle} /> Questions
                </h3>

                {validationErrors.questions && (
                  <div className="error-message section-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{validationErrors.questions}</span>
                  </div>
                )}

                {validationErrors.options && (
                  <div className="error-message section-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{validationErrors.options}</span>
                  </div>
                )}

                {getCurrentLevel().questions.map((question, qIndex) => (
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
                        className={validationErrors.questions ? 'error' : ''}
                      ></textarea>
                    </div>

                    {/* Media based on question type */}
                    {question.contentType === 'image' && (
                      <div className="question-media">
                        <label>Question Image</label>
                        <div className="upload-container">
                          {question.imagePreview ? (
                            <div className="image-preview">
                              <img
                                src={question.imagePreview}
                                alt="Question visual"
                                className="preview-image"
                              />
                              <button
                                type="button"
                                className="remove-media-btn"
                                onClick={() => {
                                  updateQuestion(qIndex, 'imageFile', null);
                                  updateQuestion(qIndex, 'imagePreview', null);
                                }}
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
                                onChange={(e) => handleQuestionImageUpload(qIndex, e)}
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
                                onClick={() => {
                                  updateQuestion(qIndex, 'audioFile', null);
                                  updateQuestion(qIndex, 'audioUrl', null);
                                }}
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
                                onChange={(e) => handleQuestionAudioUpload(qIndex, e)}
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
                        {question.options.length < 2 && (
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
                            className={validationErrors.options ? 'error' : ''}
                          />

                          {/* Add this new section for option audio */}
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
                          {/* End of new section */}


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
                        <div className="info-tooltip">
                          <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
                          <span className="tooltip-content">This will be shown to the student after answering incorrectly.</span>
                        </div>
                      </label>
                      <textarea
                        value={question.hint}
                        onChange={(e) => updateQuestion(qIndex, 'hint', e.target.value)}
                        placeholder="Optional: Provide a hint or explanation for this question"
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

                {/* Admin approval notice */}
                <div className="admin-approval-notice">
                  <FontAwesomeIcon icon={faInfoCircle} className="notice-icon" />
                  <div className="notice-content">
                    <p>
                      <strong>Remember:</strong> After submission, this activity will need admin approval before it becomes available to students.
                    </p>
                    {activityData.status === 'rejected' && (
                      <p className="rejected-note">
                        This activity was previously rejected. Please review and address all feedback before resubmitting.
                      </p>
                    )}
                  </div>
                </div>
              </div>


            )}
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="review-section">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faCheckCircle} /> Review & Submit
            </h2>

            <div className="submission-notice">
              <FontAwesomeIcon icon={faInfoCircle} className="notice-icon" />
              <p>
                Please review all information before submitting. Once submitted, the activity will be sent for admin approval.
              </p>
            </div>

            {/* Basic Information Summary */}
            <div className="review-card">
              <h3>
                <FontAwesomeIcon icon={faFileAlt} /> Basic Information
                <button
                  type="button"
                  className="edit-section-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
              </h3>

              <div className="review-item">
                <span className="review-label">Title:</span>
                <span className="review-value">{activityData.title}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Level:</span>
                <span className="review-value">{activityData.level}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Category:</span>
                <span className="review-value">{activityData.category}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Type:</span>
                <span className="review-value">
                  {activityData.type === 'template' && 'Activity Template'}
                  {activityData.type === 'assessment' && 'Pre-Assessment'}
                  {activityData.type === 'practice' && 'Practice Module'}
                </span>
              </div>
              {activityData.description && (
                <div className="review-item description">
                  <span className="review-label">Description:</span>
                  <span className="review-value">{activityData.description}</span>
                </div>
              )}
            </div>

            {/* Levels Summary */}
            <div className="review-card">
              <h3>
                <FontAwesomeIcon icon={faLayerGroup} /> Activity Structure
              </h3>
              <div className="review-item">
                <span className="review-label">Number of Levels:</span>
                <span className="review-value">{levels.length}</span>
              </div>

              {levels.map((level, index) => (
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
                            'Voice Based'}
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
                      <span className="summary-label">Content Items:</span>
                      <span className="summary-value">{level.content?.length || 0}</span>
                    </div>

                    {level.contentType === 'reading' && level.content?.length > 0 && (
                      <div className="summary-row">
                        <span className="summary-label">Passage Preview:</span>
                        <span className="summary-value passage-preview">
                          {level.content[0].text ?
                            (level.content[0].text.length > 100 ?
                              level.content[0].text.substring(0, 100) + '...' :
                              level.content[0].text) :
                            'No passage text entered'}
                        </span>
                      </div>
                    )}

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

            <div className="approval-info">
              <h3>Submission Process</h3>
              <p>When you submit this activity:</p>
              <ul>
                <li>It will be sent to administrators for review</li>
                <li>You can track its status in the "Pending Approval" tab of the Activities page</li>
                <li>Once approved, it will be available to assign to students</li>
                <li>If rejected, you'll receive feedback and can make necessary changes</li>
              </ul>
            </div>
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
                  <>Next <FontAwesomeIcon icon={faArrowRight} /></>
                )}
                {currentStep === 2 && (
                  <>Review <FontAwesomeIcon icon={faArrowRight} /></>
                )}
                {currentStep === 3 && (
                  <>Submit for Approval <FontAwesomeIcon icon={faCloudUploadAlt} /></>
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditActivity;
