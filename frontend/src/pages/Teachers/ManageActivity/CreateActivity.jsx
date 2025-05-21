import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSave,
  faTrash,
  faPlus,
  faVolumeUp,
  faImage,
  faFont,
  faInfoCircle,
  faQuestionCircle,
  faHeadphones,
  faArrowRight,
  faCheck,
  faCloudUploadAlt,
  faLayerGroup,
  faEdit,   
  faSpinner,
  faExclamationTriangle,
  faBookOpen,
  faList,
  faLanguage,
  faMicrophone,
  faTextHeight
} from '@fortawesome/free-solid-svg-icons';
import "../../../css/Teachers/CreateActivity.css";

// Define reading levels and categories (skipping the "All" options for creation forms)
const readingLevels = [
  "Low Emerging",
  "Transitioning",
  "Developing",
  "Fluent"
];

const categories = [
  "Alphabet Knowledge",
  "Phonological Awareness",
  "Decoding",
  "Word Recognition",
  "Reading Comprehension"
];

// Activity structures for different template types
const activityStructures = {
  template: {
    name: "Assessment Template",
    description: "Create a complete assessment with multiple questions"
  },
  question: {
    name: "Question Template",
    description: "Create a reusable question template for assessments"
  },
  choice: {
    name: "Choice Template",
    description: "Create reusable answer choices for question templates"
  },
  sentence: {
    name: "Reading Passage",
    description: "Create a multi-page reading passage with comprehension questions"
  }
};

// Question types based on category
const questionTypes = {
  "Alphabet Knowledge": ["patinig", "katinig"],
  "Phonological Awareness": ["malapantig"],
  "Decoding": ["word"],
  "Word Recognition": ["word"],
  "Reading Comprehension": ["sentence"]
};

// Choice types based on question type
const choiceTypes = {
  "patinig": ["patinigBigLetter", "patinigSmallLetter", "patinigSound"],
  "katinig": ["katinigBigLetter", "katinigSmallLetter", "katinigSound"],
  "malapantig": ["malapatinigText", "wordText"],
  "word": ["wordText", "wordSound"],
  "sentence": [] // Sentence types don't use choices in the same way
};

const CreateActivity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type') || 'template';

  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalLevels, setTotalLevels] = useState(1);

  // Basic activity information
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    level: readingLevels[0] || '', // Default to first reading level
    category: categories[0] || '',  // Default to first category
    type: typeFromQuery,
    questionType: '',
    choiceType: '',
    description: '',
    hasReadingPassage: typeFromQuery === 'sentence' // Only sentence templates have reading passages by default
  });

  // State for levels with flexible question types
  const [levels, setLevels] = useState([
    {
      id: 1,
      levelName: 'Level 1',
      // Reading passage section (for sentence templates)
      passage: {
        text: '',
        translation: '',
        syllables: '',
        audioFile: null,
        imageFile: null,
        imagePreview: null
      },
      // Questions can be of different types
      questions: [
        {
          id: 1,
          questionNumber: 1,
          questionText: '',
          contentType: 'text', // text, image, audio
          options: ['', ''],
          correctAnswer: 0,
          hint: '',
          // For image type questions
          imageFile: null,
          imagePreview: null,
          // For audio type questions
          audioFile: null
        }
      ]
    }
  ]);

  // Load question types when category changes
  useEffect(() => {
    if (basicInfo.category && questionTypes[basicInfo.category]) {
      // Set default question type to first available for this category
      const availableTypes = questionTypes[basicInfo.category];
      if (availableTypes.length > 0 && !basicInfo.questionType) {
        setBasicInfo(prev => ({
          ...prev,
          questionType: availableTypes[0]
        }));
      }
    }
  }, [basicInfo.category]);

  // Load choice types when question type changes
  useEffect(() => {
    if (basicInfo.questionType && choiceTypes[basicInfo.questionType]) {
      // Set default choice type to first available for this question type
      const availableChoiceTypes = choiceTypes[basicInfo.questionType];
      if (availableChoiceTypes.length > 0 && !basicInfo.choiceType) {
        setBasicInfo(prev => ({
          ...prev,
          choiceType: availableChoiceTypes[0]
        }));
      }
    }
  }, [basicInfo.questionType]);

  // Get default content type icons
  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'text': return faFont;
      case 'image': return faImage;
      case 'audio': return faVolumeUp;
      default: return faFont;
    }
  };

  // Validation state
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle basic info changes
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo({
      ...basicInfo,
      [name]: value
    });

    // Clear any existing errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Handle reading passage toggle
  const handleReadingPassageToggle = (hasPassage) => {
    setBasicInfo({
      ...basicInfo,
      hasReadingPassage: hasPassage
    });
  };

  // Get current level
  const getCurrentLevel = () => {
    return levels.find(level => level.id === currentLevel) || levels[0];
  };

  // Add a new level
  const addNewLevel = () => {
    const newLevelId = totalLevels + 1;
    setLevels(prevLevels => [
      ...prevLevels,
      {
        id: newLevelId,
        levelName: `Level ${newLevelId}`,
        passage: {
          text: '',
          translation: '',
          syllables: '',
          audioFile: null,
          imageFile: null,
          imagePreview: null
        },
        questions: [
          {
            id: Date.now(),
            questionNumber: 1,
            questionText: '',
            contentType: 'text',
            options: ['', ''],
            correctAnswer: 0,
            hint: '',
            imageFile: null,
            imagePreview: null,
            audioFile: null
          }
        ]
      }
    ]);
    setTotalLevels(newLevelId);
  };

  // Remove a level
  const removeLevel = (levelId) => {
    if (levels.length <= 1) return;

    setLevels(prevLevels => prevLevels.filter(level => level.id !== levelId));

    // If we're removing the current level, switch to the first one
    if (currentLevel === levelId) {
      setCurrentLevel(levels[0].id !== levelId ? levels[0].id : levels[1].id);
    }

    setTotalLevels(prevLevels => prevLevels - 1);
  };

  // Switch to a different level
  const switchLevel = (levelId) => {
    setCurrentLevel(levelId);
  };

  // Handle passage changes for the current level
  const handlePassageChange = (field, value) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            passage: {
              ...level.passage,
              [field]: value
            }
          }
          : level
      )
    );
  };

  // Handle image upload for passage
  const handlePassageImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handlePassageChange('imageFile', file);
      handlePassageChange('imagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle audio upload for passage
  const handlePassageAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handlePassageChange('audioFile', file);
  };

  // Handle question changes
  const handleQuestionChange = (questionId, field, value) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map(question =>
              question.id === questionId
                ? { ...question, [field]: value }
                : question
            )
          }
          : level
      )
    );
  };

  // Handle content type change for a question
  const handleQuestionContentTypeChange = (questionId, contentType) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map(question =>
              question.id === questionId
                ? { ...question, contentType }
                : question
            )
          }
          : level
      )
    );
  };

  // Handle image upload for question
  const handleQuestionImageUpload = (questionId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleQuestionChange(questionId, 'imageFile', file);
      handleQuestionChange(questionId, 'imagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle audio upload for question
  const handleQuestionAudioUpload = (questionId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleQuestionChange(questionId, 'audioFile', file);
  };

  // Handle option changes
  const handleOptionChange = (questionId, optionIndex, value) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map(question =>
              question.id === questionId
                ? {
                  ...question,
                  options: question.options.map((opt, i) =>
                    i === optionIndex ? value : opt
                  )
                }
                : question
            )
          }
          : level
      )
    );
  };

  // Handle correct answer selection
  const handleCorrectAnswerChange = (questionId, optionIndex) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map(question =>
              question.id === questionId
                ? { ...question, correctAnswer: optionIndex }
                : question
            )
          }
          : level
      )
    );
  };

  // Add new question
  const addQuestion = () => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj) return;

    const newQuestionNumber = currentLevelObj.questions.length + 1;

    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: [
              ...level.questions,
              {
                id: Date.now(),
                questionNumber: newQuestionNumber,
                questionText: '',
                contentType: 'text',
                options: ['', ''],
                correctAnswer: 0,
                hint: '',
                imageFile: null,
                imagePreview: null,
                audioFile: null
              }
            ]
          }
          : level
      )
    );
  };

  // Remove question
  const removeQuestion = (questionId) => {
    const currentLevelObj = getCurrentLevel();
    if (!currentLevelObj || currentLevelObj.questions.length <= 1) return;

    const updatedQuestions = currentLevelObj.questions
      .filter(q => q.id !== questionId)
      .map((q, idx) => ({
        ...q,
        questionNumber: idx + 1
      }));

    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: updatedQuestions
          }
          : level
      )
    );
  };

  // Add option to a question
  const addOption = (questionId) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map(question =>
              question.id === questionId
                ? {
                  ...question,
                  options: [...question.options, '']
                }
                : question
            )
          }
          : level
      )
    );
  };

  // Remove option from a question
  const removeOption = (questionId, optionIndex) => {
    setLevels(prevLevels =>
      prevLevels.map(level =>
        level.id === currentLevel
          ? {
            ...level,
            questions: level.questions.map(question =>
              question.id === questionId && question.options.length > 2
                ? {
                  ...question,
                  options: question.options.filter((_, idx) => idx !== optionIndex),
                  correctAnswer: question.correctAnswer === optionIndex 
                    ? 0 
                    : question.correctAnswer > optionIndex 
                      ? question.correctAnswer - 1 
                      : question.correctAnswer
                }
                : question
            )
          }
          : level
      )
    );
  };

  // Tooltip component for information tips
  const InfoTooltip = ({ text }) => (
    <div className="info-tooltip">
      <FontAwesomeIcon icon={faQuestionCircle} className="tooltip-icon" />
      <div className="tooltip-content">{text}</div>
    </div>
  );

  // Validate the current step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Validate basic info
      if (!basicInfo.title.trim()) {
        newErrors.title = 'Title is required';
      }

      if (!basicInfo.level) {
        newErrors.level = 'Reading level is required';
      }

      if (!basicInfo.category) {
        newErrors.category = 'Category is required';
      }

      // Validate template-specific fields
      if (basicInfo.type === 'question' && !basicInfo.questionType) {
        newErrors.questionType = 'Question type is required';
      }

      if (basicInfo.type === 'choice' && !basicInfo.choiceType) {
        newErrors.choiceType = 'Choice type is required';
      }
    }
    else if (step === 2) {
      // Get current level data
      const currentLevelObj = getCurrentLevel();

      if (!currentLevelObj) {
        newErrors.level = 'Level data not found';
        setErrors(newErrors);
        return false;
      }

      // Validate passage if hasReadingPassage is true or it's a sentence template
      if ((basicInfo.hasReadingPassage || basicInfo.type === 'sentence') && !currentLevelObj.passage.text.trim()) {
        newErrors.passage = 'Passage text is required';
      }

      // Validate questions for template, question, and sentence types (not for choice type)
      if (basicInfo.type !== 'choice') {
        // Validate questions
        if (currentLevelObj.questions.some(q => !q.questionText.trim())) {
          newErrors.questions = 'All questions must have text';
        }

        // Only validate options for non-sentence templates
        if (basicInfo.type !== 'sentence' && 
            currentLevelObj.questions.some(q => q.options.some(opt => !opt.trim()))) {
          newErrors.options = 'All options must have text';
        }
      }
      
      // For choice templates, validate the choice value
      if (basicInfo.type === 'choice') {
        if (!basicInfo.choiceValue) {
          newErrors.choiceValue = 'Choice value is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      // Validate and move to step 2
      if (validateStep(1)) {
        setCurrentStep(2);
        window.scrollTo(0, 0);
      }
    }
    else if (currentStep === 2) {
      if (validateStep(2)) {
        if (levels.length > 1 && currentLevel < totalLevels) {
          // Move to next level
          const nextLevelId = levels.find(level => level.id > currentLevel)?.id;
          if (nextLevelId) {
            setCurrentLevel(nextLevelId);
          } else {
            setCurrentStep(3); // Review step
          }
        } else {
          setCurrentStep(3); // Review step
        }
        window.scrollTo(0, 0);
      }
    }
    else if (currentStep === 3) {
      // Submit the form
      setSubmitting(true);

      try {
        // Prepare data for submission
        const formData = {
          ...basicInfo,
          levels: levels.map(level => ({
            id: level.id,
            levelName: level.levelName,
            passage: level.passage,
            questions: level.questions
          })),
          status: 'pending', // Set status to pending for admin approval
          createdAt: new Date().toISOString()
        };

        console.log('Submitting form data:', formData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real implementation, you would post this data to your backend
        // For this example, we'll store it in localStorage for demo purposes
        
        // Create a new activity entry based on the template type
        const newActivity = {
          id: Date.now(), // Generate a temp ID
          title: basicInfo.title,
          level: basicInfo.level,
          category: basicInfo.category,
          type: basicInfo.type,
          templateType: basicInfo.type, // Store template type
          status: "pending",
          createdAt: new Date().toISOString(),
          levels: formData.levels,
          description: basicInfo.description,
        };
        
        // Add type-specific properties
        if (basicInfo.type === 'question') {
          newActivity.questionType = basicInfo.questionType;
          newActivity.applicableChoiceTypes = choiceTypes[basicInfo.questionType] || [];
          newActivity.correctChoiceType = basicInfo.correctChoiceType || (newActivity.applicableChoiceTypes[0] || '');
        }
        else if (basicInfo.type === 'choice') {
          newActivity.choiceType = basicInfo.choiceType;
          newActivity.choiceValue = basicInfo.choiceValue;
          newActivity.hasImage = !!basicInfo.imageFile;
          newActivity.hasAudio = !!basicInfo.audioFile;
          newActivity.soundText = basicInfo.soundText;
        }
        else if (basicInfo.type === 'sentence') {
          newActivity.pages = levels.reduce((total, level) => 
            total + (level.passage?.pageCount || 1), 0);
          newActivity.questions = levels.reduce((total, level) => 
            total + (level.questions?.length || 0), 0);
        }
        else if (basicInfo.type === 'template') {
          newActivity.questionCount = levels.reduce((total, level) => 
            total + (level.questions?.length || 0), 0);
          newActivity.contentType = basicInfo.hasReadingPassage ? "Reading" : "Interactive";
        }
        
        // In a real app, you would save this to your database
        // For now, we'll just store it in localStorage
        console.log("New activity created:", newActivity);
        
        // Update mock data in localStorage for demo purposes
        const existingActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
        localStorage.setItem('mockActivities', JSON.stringify([...existingActivities, newActivity]));

        setSubmitSuccess(true);

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/teacher/manage-activities');
        }, 2000);
      } catch (error) {
        console.error('Error submitting form:', error);
        setErrors({ submit: 'Failed to submit the template. Please try again.' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 2 && currentLevel > 1) {
        // Go back to previous level
        const prevLevelId = [...levels]
          .sort((a, b) => a.id - b.id)
          .filter(level => level.id < currentLevel)
          .pop()?.id;

        if (prevLevelId) {
          setCurrentLevel(prevLevelId);
        } else {
          setCurrentStep(1);
        }
      } else {
        setCurrentStep(currentStep - 1);
      }
      window.scrollTo(0, 0);
    } else {
      navigate('/teacher/manage-activities');
    }
  };

  // Success state after submission
  if (submitSuccess) {
    return (
      <div className="create-activity-container">
        <div className="success-state">
          <FontAwesomeIcon icon={faCheck} className="success-icon" />
          <h2>Template Created Successfully!</h2>
          <p>Your template has been submitted and is now pending approval.</p>
          <p>You will be redirected to the activities page.</p>
        </div>
      </div>
    );
  }

  // Function to get the form title based on template type
  const getFormTitle = () => {
    if (currentStep === 1) {
      const templateName = activityStructures[basicInfo.type]?.name || 'Activity';
      return `Create New ${templateName}`;
    }
    
    if (currentStep === 2) {
      return `Configure ${getCurrentLevel()?.levelName || 'Level'} Content`;
    }
    
    return 'Review & Submit';
  }

  return (
    <div className="create-activity-container">
      <div className="header-container">
        <div className="create-activity-header">
          <h1 className="page-header">{getFormTitle()}</h1>
          <p className="page-subtitle">
            {currentStep === 1 ? 'Provide basic information about the template' :
              currentStep === 2 ? 'Add content and questions for this level' :
                'Review all levels and submit template for approval'}
          </p>
        </div>
      </div>

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

      {/* Error message */}
      {errors.submit && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{errors.submit}</span>
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="basic-info-section">
              <div className="form-group">
                <label htmlFor="title">
                  Template Title <span className="required">*</span>
                  <InfoTooltip text="Give your template a descriptive title. This will help teachers identify and use it later." />
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={basicInfo.title}
                  onChange={handleBasicInfoChange}
                  placeholder={`Enter a descriptive title for this ${basicInfo.type} template`}
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <div className="error-message">{errors.title}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="level">
                    Reading Level (Antas) <span className="required">*</span>
                    <InfoTooltip text="Select the appropriate reading level for this template based on the student's grade level." />
                  </label>
                  <div className="custom-select">
                    <select
                      id="level"
                      name="level"
                      value={basicInfo.level}
                      onChange={handleBasicInfoChange}
                      className={errors.level ? 'error' : ''}
                    >
                      <option value="">Select a level</option>
                      {readingLevels.map((level, index) => (
                        <option key={index} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  {errors.level && <div className="error-message">{errors.level}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    Category <span className="required">*</span>
                    <InfoTooltip text="Select a category that best describes the focus of your template (e.g., Alphabet Knowledge, Word Recognition)." />
                  </label>
                  <div className="custom-select">
                    <select
                      id="category"
                      name="category"
                      value={basicInfo.category}
                      onChange={handleBasicInfoChange}
                      className={errors.category ? 'error' : ''}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  {errors.category && <div className="error-message">{errors.category}</div>}
                </div>
              </div>

              {/* Question Type selector - only for question templates */}
              {basicInfo.type === 'question' && basicInfo.category && (
                <div className="form-group">
                  <label htmlFor="questionType">
                    Question Type <span className="required">*</span>
                    <InfoTooltip text="Select the specific type of question for this template." />
                  </label>
                  <div className="custom-select">
                    <select
                      id="questionType"
                      name="questionType"
                      value={basicInfo.questionType}
                      onChange={handleBasicInfoChange}
                      className={errors.questionType ? 'error' : ''}
                    >
                      <option value="">Select a question type</option>
                      {questionTypes[basicInfo.category]?.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  {errors.questionType && <div className="error-message">{errors.questionType}</div>}
                </div>
              )}

              {/* Choice Type selector - only for choice templates or when questionType is selected */}
              {(basicInfo.type === 'choice' || (basicInfo.type === 'question' && basicInfo.questionType)) && (
                <div className="form-group">
                  <label htmlFor="choiceType">
                    {basicInfo.type === 'choice' ? 'Choice Type' : 'Correct Choice Type'} <span className="required">*</span>
                    <InfoTooltip text={basicInfo.type === 'choice' ? 
                      "Select the type of choice this template represents." : 
                      "Select which type of choice would be the correct answer for this question type."} />
                  </label>
                  <div className="custom-select">
                    <select
                      id="choiceType"
                      name={basicInfo.type === 'choice' ? "choiceType" : "correctChoiceType"}
                      value={basicInfo.type === 'choice' ? basicInfo.choiceType : basicInfo.correctChoiceType}
                      onChange={handleBasicInfoChange}
                      className={errors.choiceType ? 'error' : ''}
                    >
                      <option value="">Select a choice type</option>
                      {basicInfo.questionType && choiceTypes[basicInfo.questionType]?.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  {errors.choiceType && <div className="error-message">{errors.choiceType}</div>}
                </div>
              )}

              {/* For choice templates - add value, sound text, etc. */}
              {basicInfo.type === 'choice' && basicInfo.choiceType && (
                <>
                  <div className="form-group">
                    <label htmlFor="choiceValue">
                      Choice Value <span className="required">*</span>
                      <InfoTooltip text="Enter the text value for this choice (e.g., 'A' for a letter choice)." />
                    </label>
                    <input
                      type="text"
                      id="choiceValue"
                      name="choiceValue"
                      value={basicInfo.choiceValue || ''}
                      onChange={handleBasicInfoChange}
                      placeholder="Enter the value for this choice"
                      className={errors.choiceValue ? 'error' : ''}
                    />
                    {errors.choiceValue && <div className="error-message">{errors.choiceValue}</div>}
                  </div>

                  {/* Sound text for audio-related choice types */}
                  {basicInfo.choiceType.includes('Sound') && (
                    <div className="form-group">
                      <label htmlFor="soundText">
                        Sound Text Representation <span className="required">*</span>
                        <InfoTooltip text="Enter how this sound would be written (e.g., '/ah/' for the 'a' sound)." />
                      </label>
                      <input
                        type="text"
                        id="soundText"
                        name="soundText"
                        value={basicInfo.soundText || ''}
                        onChange={handleBasicInfoChange}
                        placeholder="Enter text representation of the sound (e.g., '/ah/')"
                        className={errors.soundText ? 'error' : ''}
                      />
                      {errors.soundText && <div className="error-message">{errors.soundText}</div>}
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label htmlFor="description">
                  Description
                  <InfoTooltip text="Provide a brief description of this template and how it should be used." />
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={basicInfo.description}
                  onChange={handleBasicInfoChange}
                  rows="4"
                  placeholder="Describe the template and its purpose..."
                ></textarea>
              </div>

              {/* Content structure selection - only for templates and sentences */}
              {(basicInfo.type === 'template' || basicInfo.type === 'sentence') && (
                <div className="content-structure-selection">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faLayerGroup} /> Content Structure
                    <InfoTooltip text={basicInfo.type === 'template' ? 
                      "Choose if your template has a reading passage followed by questions, or just questions." :
                      "Reading passages include text content with optional images and audio."} />
                  </h3>

                  {basicInfo.type === 'template' && (
                    <div className="structure-options">
                      <div 
                        className={`structure-option ${basicInfo.hasReadingPassage ? 'active' : ''}`}
                        onClick={() => handleReadingPassageToggle(true)}
                      >
                        <div className="structure-icon">
                          <FontAwesomeIcon icon={faBookOpen} />
                        </div>
                        <div className="structure-content">
                          <h4>Reading Passage with Questions</h4>
                          <p>Includes a reading passage or story followed by comprehension questions</p>
                        </div>
                      </div>

                      <div 
                        className={`structure-option ${!basicInfo.hasReadingPassage ? 'active' : ''}`}
                        onClick={() => handleReadingPassageToggle(false)}
                      >
                        <div className="structure-icon">
                          <FontAwesomeIcon icon={faList} />
                        </div>
                        <div className="structure-content">
                          <h4>Questions Only</h4>
                          <p>Contains only question-based activities without a reading passage</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Level configuration - only for template and sentence types */}
              {(basicInfo.type === 'template' || basicInfo.type === 'sentence') && (
                <div className="level-configuration">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faLayerGroup} /> Activity Levels
                    <InfoTooltip text="You can create multiple levels for progressive difficulty. Each level can have its own reading passage and questions." />
                  </h3>

                  <div className="level-list">
                    {levels.map(level => (
                      <div key={level.id} className="level-item">
                        <span className="level-name">{level.levelName}</span>
                        {levels.length > 1 && (
                          <button
                            type="button"
                            className="remove-level-btn"
                            onClick={() => removeLevel(level.id)}
                            title="Remove this level"
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
              )}
            </div>
          )}

          {/* Step 2: Content Configuration */}
          {currentStep === 2 && (
            <div className="content-config-section">
              {/* Level navigation - only for multi-level templates */}
              {levels.length > 1 && (
                <div className="level-navigation">
                  <h3 className="section-title">Configuration for:</h3>
                  <div className="level-tabs">
                    {levels.map(level => (
                      <button
                        key={level.id}
                        type="button"
                        className={`level-tab ${level.id === currentLevel ? 'active' : ''}`}
                        onClick={() => switchLevel(level.id)}
                      >
                        {level.levelName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reading Passage (if applicable) */}
              {(basicInfo.hasReadingPassage || basicInfo.type === 'sentence') && (
                <div className="passage-section">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faBookOpen} /> Reading Passage
                    <InfoTooltip text="Create the main reading passage for this level. This is what students will read before answering questions." />
                  </h3>

                  {errors.passage && <div className="error-message section-error">{errors.passage}</div>}

                  <div className="passage-item-grid">
                    <div className="passage-label">
                      <h3>Passage Text</h3>
                    </div>

                    <div className="passage-fields">
                      <label>
                        Text Content <span className="required">*</span>
                        <InfoTooltip text="Enter the main text passage that students will read. Keep it appropriate for the selected reading level." />
                      </label>
                      <textarea
                        value={getCurrentLevel()?.passage?.text || ''}
                        onChange={(e) => handlePassageChange('text', e.target.value)}
                        placeholder="Enter the reading passage text..."
                        rows="4"
                        className={errors.passage ? 'error' : ''}
                      ></textarea>
                    </div>

                    <div className="passage-fields">
                      <label>
                        Syllable Breakdown
                        <InfoTooltip text="Break down words into syllables to help with pronunciation (e.g., 'ka-mi-ting')." />
                      </label>
                      <textarea
                        value={getCurrentLevel()?.passage?.syllables || ''}
                        onChange={(e) => handlePassageChange('syllables', e.target.value)}
                        placeholder="Break down words by syllables (e.g., 'ka-mi-ting')"
                        rows="2"
                      ></textarea>
                    </div>

                    <div className="passage-fields">
                      <label>
                        Translation/Notes
                        <InfoTooltip text="Optional: Provide English translation or notes about the passage for teachers." />
                      </label>
                      <textarea
                        value={getCurrentLevel()?.passage?.translation || ''}
                        onChange={(e) => handlePassageChange('translation', e.target.value)}
                        placeholder="Optional: Provide translation or notes"
                        rows="2"
                      ></textarea>
                    </div>

                    <div className="media-row-vertical">
                      <div className="upload-block">
                        <label>
                          Supporting Image
                          <InfoTooltip text="Upload an image that illustrates the passage to aid comprehension." />
                        </label>
                        <div className="image-upload-container">
                          {getCurrentLevel()?.passage?.imagePreview ? (
                            <div className="image-preview">
                              <img src={getCurrentLevel().passage.imagePreview} alt="Preview" />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => {
                                  handlePassageChange('imageFile', null);
                                  handlePassageChange('imagePreview', null);
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          ) : (
                            <div className="upload-placeholder">
                              <input
                                type="file"
                                accept="image/*"
                                id="passage-image"
                                onChange={handlePassageImageUpload}
                                className="file-input"
                              />
                              <label htmlFor="passage-image" className="file-label">
                                <FontAwesomeIcon icon={faImage} />
                                <span>Choose Image</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="upload-block">
                        <label>
                          Audio Recording
                          <InfoTooltip text="Upload an audio recording of the passage to help with pronunciation." />
                        </label>
                        <div className="audio-upload-container">
                          <input
                            type="file"
                            accept="audio/*"
                            id="passage-audio"
                            className="file-input"
                            onChange={handlePassageAudioUpload}
                          />
                          <label htmlFor="passage-audio" className="file-label">
                            <FontAwesomeIcon icon={faHeadphones} />
                            <span>Upload Audio</span>
                          </label>
                        </div>

                        {getCurrentLevel()?.passage?.audioFile && (
                          <div className="audio-preview">
                            <span className="audio-filename">{getCurrentLevel().passage.audioFile.name}</span>
                            <button
                              type="button"
                              className="remove-audio-btn"
                              onClick={() => handlePassageChange('audioFile', null)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions section */}
              {basicInfo.type !== 'choice' && (
                <div className="questions-section">
                  <div className="section-title-bar">
                    <h3 className="section-title">
                      <FontAwesomeIcon icon={faList} /> Questions
                      <InfoTooltip text={basicInfo.type === 'question' 
                        ? "Create the question template. This will be used for creating assessments." 
                        : "Create questions to test comprehension. Questions can be text-based, image-based, or audio-based."} />
                    </h3>
                  </div>

                  {errors.questions && <div className="error-message section-error">{errors.questions}</div>}
                  {errors.options && <div className="error-message section-error">{errors.options}</div>}

                  {getCurrentLevel()?.questions.map((question, qIndex) => (
                    <div className="question-card" key={question.id}>
                      <div className="item-header">
                        <h3>Question {question.questionNumber}</h3>
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => removeQuestion(question.id)}
                          disabled={getCurrentLevel().questions.length <= 1}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </div>

                      {/* Question Content Type Selection */}
                      <div className="question-content-type">
                        <label>
                          Question Type
                          <InfoTooltip text="Select the type of question: text-only, image-based, or audio-based." />
                        </label>
                        <div className="content-type-buttons">
                          <button
                            type="button"
                            className={`content-type-button ${question.contentType === 'text' ? 'active' : ''}`}
                            onClick={() => handleQuestionContentTypeChange(question.id, 'text')}
                          >
                            <FontAwesomeIcon icon={faFont} />
                            <span>Text</span>
                          </button>
                          <button
                            type="button"
                            className={`content-type-button ${question.contentType === 'image' ? 'active' : ''}`}
                            onClick={() => handleQuestionContentTypeChange(question.id, 'image')}
                          >
                            <FontAwesomeIcon icon={faImage} />
                            <span>Image</span>
                          </button>
                          <button
                            type="button"
                            className={`content-type-button ${question.contentType === 'audio' ? 'active' : ''}`}
                            onClick={() => handleQuestionContentTypeChange(question.id, 'audio')}
                          >
                            <FontAwesomeIcon icon={faMicrophone} />
                            <span>Audio</span>
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          Question Text <span className="required">*</span>
                          <InfoTooltip text="Enter the question that will be presented to the student." />
                        </label>
                        <textarea
                          value={question.questionText}
                          onChange={(e) => handleQuestionChange(question.id, 'questionText', e.target.value)}
                          placeholder="Enter your question text here..."
                          rows="2"
                          className={errors.questions ? 'error' : ''}
                        ></textarea>
                      </div>

                      {/* Content based on question type */}
                      {question.contentType === 'image' && (
                        <div className="form-group">
                          <label>
                            Question Image
                            <InfoTooltip text="Upload an image that will be shown with this question." />
                          </label>
                          <div className="image-upload-container">
                            {question.imagePreview ? (
                              <div className="image-preview">
                                <img src={question.imagePreview} alt="Question visual" />
                                <button
                                  type="button"
                                  className="remove-image-btn"
                                  onClick={() => {
                                    handleQuestionChange(question.id, 'imageFile', null);
                                    handleQuestionChange(question.id, 'imagePreview', null);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            ) : (
                              <div className="upload-placeholder">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`question-image-${question.id}`}
                                  onChange={(e) => handleQuestionImageUpload(question.id, e)}
                                  className="file-input"
                                />
                                <label htmlFor={`question-image-${question.id}`} className="file-label">
                                  <FontAwesomeIcon icon={faImage} />
                                  <span>Choose Image</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {question.contentType === 'audio' && (
                        <div className="form-group">
                          <label>
                            Question Audio
                            <InfoTooltip text="Upload an audio file that will be played with this question." />
                          </label>
                          <div className="audio-upload-container">
                            <input
                              type="file"
                              accept="audio/*"
                              id={`question-audio-${question.id}`}
                              className="file-input"
                              onChange={(e) => handleQuestionAudioUpload(question.id, e)}
                            />
                            <label htmlFor={`question-audio-${question.id}`} className="file-label">
                              <FontAwesomeIcon icon={faHeadphones} />
                              <span>Upload Audio</span>
                            </label>
                          </div>

                          {question.audioFile && (
                            <div className="audio-preview">
                              <span className="audio-filename">{question.audioFile.name}</span>
                              <button
                                type="button"
                                className="remove-audio-btn"
                                onClick={() => handleQuestionChange(question.id, 'audioFile', null)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

<div className="form-group">
                        <label>
                          Hint (optional)
                          <InfoTooltip text="Provide a hint that can be shown to the student if they're having trouble." />
                        </label>
                        <input
                          type="text"
                          value={question.hint}
                          onChange={(e) => handleQuestionChange(question.id, 'hint', e.target.value)}
                          placeholder="Enter a hint to help students (optional)"
                        />
                      </div>

                      {/* Only show options for non-sentence templates */}
                      {basicInfo.type !== 'sentence' && (
                        <div className="options-container">
                          <div className="options-header">
                            <label>
                              Answer Options <span className="required">*</span>
                              <InfoTooltip text="Create multiple choice options. Mark one as the correct answer." />
                            </label>
                            {question.options.length < 4 && (
                              <button
                                type="button"
                                className="add-option-btn"
                                onClick={() => addOption(question.id)}
                              >
                                <FontAwesomeIcon icon={faPlus} /> Add Option
                              </button>
                            )}
                          </div>

                          {question.options.map((option, oIndex) => (
                            <div className="option-row" key={oIndex}>
                              <div className="radio-container">
                                <input
                                  type="radio"
                                  id={`q${question.id}-o${oIndex}`}
                                  name={`q${question.id}-correct`}
                                  checked={question.correctAnswer === oIndex}
                                  onChange={() => handleCorrectAnswerChange(question.id, oIndex)}
                                />
                                <label htmlFor={`q${question.id}-o${oIndex}`}>Correct</label>
                              </div>

                              <div className="option-input">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleOptionChange(question.id, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                  className={errors.options ? 'error' : ''}
                                />
                              </div>

                              {question.options.length > 2 && (
                                <button
                                  type="button"
                                  className="remove-option-btn"
                                  onClick={() => removeOption(question.id, oIndex)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* For sentence templates, add sentence-specific fields */}
                      {basicInfo.type === 'sentence' && (
                        <div className="sentence-question-container">
                          <div className="sentence-question-header">
                            <label>
                              Question Options <span className="required">*</span>
                              <InfoTooltip text="Add the correct answer and alternatives for this reading comprehension question." />
                            </label>
                          </div>
                          
                          <div className="form-group">
                            <label>
                              Correct Answer <span className="required">*</span>
                              <InfoTooltip text="Enter the correct answer for this question." />
                            </label>
                            <input
                              type="text"
                              value={question.correctAnswer || ''}
                              onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                              placeholder="Enter the correct answer"
                              className={errors.options ? 'error' : ''}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>
                              Alternative Options <span className="required">*</span>
                              <InfoTooltip text="Enter incorrect options that will be shown alongside the correct answer." />
                            </label>
                            {question.options.map((option, oIndex) => (
                              <div className="option-row" key={oIndex}>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleOptionChange(question.id, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                  className={errors.options ? 'error' : ''}
                                />
                                
                                {question.options.length > 1 && (
                                  <button
                                    type="button"
                                    className="remove-option-btn"
                                    onClick={() => removeOption(question.id, oIndex)}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            {question.options.length < 3 && (
                              <button
                                type="button"
                                className="add-option-btn"
                                onClick={() => addOption(question.id)}
                              >
                                <FontAwesomeIcon icon={faPlus} /> Add Option
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-question-btn"
                    onClick={addQuestion}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Another Question
                  </button>
                </div>
              )}

              {/* Choice template specific fields */}
              {basicInfo.type === 'choice' && (
                <div className="choice-config-section">
                  <div className="section-title-bar">
                    <h3 className="section-title">
                      <FontAwesomeIcon icon={faList} /> Choice Configuration
                      <InfoTooltip text="Configure the details for this choice template." />
                    </h3>
                  </div>

                  <div className="choice-card">
                    <div className="form-group">
                      <label>
                        Choice Display Value <span className="required">*</span>
                        <InfoTooltip text="Enter the value that will be shown to students (e.g., letter 'A')." />
                      </label>
                      <input
                        type="text"
                        value={basicInfo.choiceValue || ''}
                        onChange={(e) => handleBasicInfoChange({target: {name: 'choiceValue', value: e.target.value}})}
                        placeholder="Enter choice value"
                        className={errors.choiceValue ? 'error' : ''}
                      />
                      {errors.choiceValue && <div className="error-message">{errors.choiceValue}</div>}
                    </div>

                    {basicInfo.choiceType && basicInfo.choiceType.includes('Sound') && (
                      <div className="form-group">
                        <label>
                          Sound Text <span className="required">*</span>
                          <InfoTooltip text="Enter how this sound is represented in text (e.g., '/ah/')." />
                        </label>
                        <input
                          type="text"
                          value={basicInfo.soundText || ''}
                          onChange={(e) => handleBasicInfoChange({target: {name: 'soundText', value: e.target.value}})}
                          placeholder="Enter sound representation (e.g., '/ah/')"
                          className={errors.soundText ? 'error' : ''}
                        />
                        {errors.soundText && <div className="error-message">{errors.soundText}</div>}
                      </div>
                    )}

                    {/* Image upload for choice */}
                    <div className="form-group">
                      <label>
                        Choice Image
                        <InfoTooltip text="Upload an image that represents this choice (e.g., the letter 'A' or a dog for the word 'aso')." />
                      </label>
                      <div className="image-upload-container">
                        {basicInfo.imagePreview ? (
                          <div className="image-preview">
                            <img src={basicInfo.imagePreview} alt="Choice visual" />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={() => {
                                setBasicInfo({
                                  ...basicInfo,
                                  imageFile: null,
                                  imagePreview: null
                                });
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ) : (
                          <div className="upload-placeholder">
                            <input
                              type="file"
                              accept="image/*"
                              id="choice-image"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setBasicInfo({
                                    ...basicInfo,
                                    imageFile: file,
                                    imagePreview: reader.result
                                  });
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="file-input"
                            />
                            <label htmlFor="choice-image" className="file-label">
                              <FontAwesomeIcon icon={faImage} />
                              <span>Choose Image</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Audio upload for choice */}
                    {basicInfo.choiceType && (basicInfo.choiceType.includes('Sound') || basicInfo.choiceType.includes('sound')) && (
                      <div className="form-group">
                        <label>
                          Choice Audio
                          <InfoTooltip text="Upload an audio file for this choice (e.g., the sound of the letter 'A')." />
                        </label>
                        <div className="audio-upload-container">
                          <input
                            type="file"
                            accept="audio/*"
                            id="choice-audio"
                            className="file-input"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setBasicInfo({
                                ...basicInfo,
                                audioFile: file
                              });
                            }}
                          />
                          <label htmlFor="choice-audio" className="file-label">
                            <FontAwesomeIcon icon={faHeadphones} />
                            <span>Upload Audio</span>
                          </label>
                        </div>

                        {basicInfo.audioFile && (
                          <div className="audio-preview">
                            <span className="audio-filename">{basicInfo.audioFile.name}</span>
                            <button
                              type="button"
                              className="remove-audio-btn"
                              onClick={() => setBasicInfo({...basicInfo, audioFile: null})}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="review-section">
              <div className="review-notice">
                <FontAwesomeIcon icon={faInfoCircle} className="notice-icon" />
                <p>Please review your template before submitting. Once submitted, it will be sent for admin approval.</p>
              </div>
              
              <div className="review-card">
                <h3>Basic Information</h3>
                <div className="review-item">
                  <span className="review-label">Title:</span>
                  <span className="review-value">{basicInfo.title}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Reading Level:</span>
                  <span className="review-value">{basicInfo.level}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Category:</span>
                  <span className="review-value">{basicInfo.category}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Template Type:</span>
                  <span className="review-value">
                    {basicInfo.type === 'template' ? 'Assessment Template' :
                      basicInfo.type === 'question' ? 'Question Template' :
                      basicInfo.type === 'choice' ? 'Choice Template' :
                      basicInfo.type === 'sentence' ? 'Reading Passage' : 'Unknown Type'}
                  </span>
                </div>

                {/* Template type specific info */}
                {basicInfo.type === 'question' && (
                  <>
                    <div className="review-item">
                      <span className="review-label">Question Type:</span>
                      <span className="review-value">{basicInfo.questionType}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Correct Choice Type:</span>
                      <span className="review-value">{basicInfo.correctChoiceType}</span>
                    </div>
                  </>
                )}

                {basicInfo.type === 'choice' && (
                  <>
                    <div className="review-item">
                      <span className="review-label">Choice Type:</span>
                      <span className="review-value">{basicInfo.choiceType}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Choice Value:</span>
                      <span className="review-value">{basicInfo.choiceValue}</span>
                    </div>
                    {basicInfo.soundText && (
                      <div className="review-item">
                        <span className="review-label">Sound Text:</span>
                        <span className="review-value">{basicInfo.soundText}</span>
                      </div>
                    )}
                    <div className="review-item">
                      <span className="review-label">Has Image:</span>
                      <span className="review-value">{basicInfo.imageFile ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Has Audio:</span>
                      <span className="review-value">{basicInfo.audioFile ? 'Yes' : 'No'}</span>
                    </div>
                  </>
                )}

                {basicInfo.type === 'template' && (
                  <div className="review-item">
                    <span className="review-label">Structure:</span>
                    <span className="review-value">
                      {basicInfo.hasReadingPassage ? 'Reading Passage with Questions' : 'Questions Only'}
                    </span>
                  </div>
                )}

                {basicInfo.description && (
                  <div className="review-item">
                    <span className="review-label">Description:</span>
                    <span className="review-value">{basicInfo.description}</span>
                  </div>
                )}
              </div>

              <div className="review-card">
                <h3>Content Structure</h3>
                <div className="review-item">
                  <span className="review-label">Number of Levels:</span>
                  <span className="review-value">{levels.length}</span>
                </div>
              </div>

              {levels.map(level => (
                <div className="review-card level-review" key={level.id}>
                  <h3>{level.levelName}</h3>
                  
                  {(basicInfo.hasReadingPassage || basicInfo.type === 'sentence') && level.passage && (
                    <div className="review-item">
                      <span className="review-label">Passage:</span>
                      <span className="review-value passage-preview">
                        {level.passage.text.length > 100 ? level.passage.text.substring(0, 100) + '...' : level.passage.text}
                      </span>
                    </div>
                  )}
                  
                  {basicInfo.type !== 'choice' && (
                    <>
                      <div className="review-item">
                        <span className="review-label">Questions:</span>
                        <span className="review-value">{level.questions.length}</span>
                      </div>
                      
                      <div className="review-item questions-preview">
                        <span className="review-label">Questions Preview:</span>
                        <div className="questions-list">
                          {level.questions.slice(0, 3).map((q, idx) => (
                            <div key={idx} className="question-preview">
                              <p><strong>Q{idx+1}:</strong> {q.questionText}</p>
                              <div className="question-type-tag">
                                <FontAwesomeIcon icon={getContentTypeIcon(q.contentType)} />
                                <span>{q.contentType.charAt(0).toUpperCase() + q.contentType.slice(1)}</span>
                              </div>
                            </div>
                          ))}
                          {level.questions.length > 3 && (
                            <p className="more-questions">...and {level.questions.length - 3} more questions</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <button
                    type="button"
                    className="edit-level-btn"
                    onClick={() => {
                      setCurrentLevel(level.id);
                      setCurrentStep(2);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit Level
                  </button>
                </div>
              ))}
              
              <div className="approval-info">
                <h3>Submission Process</h3>
                <p>When you submit this template:</p>
                <ul>
                  <li>It will be sent to administrators for review</li>
                  <li>You'll be able to view its status in the "Pending Approval" tab</li>
                  <li>Once approved, it can be used to create assessments and activities</li>
                </ul>
              </div>
            </div>
          )}

          {/* Form Navigation */}
          <div className="form-navigation">
            <button
              type="button"
              className="back-btn"
              onClick={handleBack}
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                  {currentStep === 3 ? 'Submitting...' : 'Saving...'}
                </>
              ) : (
                <>
                  {currentStep === 1 ? 'Next' :
                    currentStep === 2 ? (
                      levels.length > 1 && currentLevel < totalLevels ? (
                        <>Next Level <FontAwesomeIcon icon={faArrowRight} /></>
                      ) : (
                        <>Review <FontAwesomeIcon icon={faArrowRight} /></>
                      )
                    ) : 'Submit Template for Approval'}
                  {currentStep < 3 && currentStep === 2 && levels.length > 1 && currentLevel >= totalLevels && <FontAwesomeIcon icon={faArrowRight} />}
                  {currentStep < 3 && currentStep === 1 && <FontAwesomeIcon icon={faArrowRight} />}
                  {currentStep === 3 && <FontAwesomeIcon icon={faCloudUploadAlt} />}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateActivity;