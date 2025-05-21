import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSave,
  faTrash,
  faPlus,
  faImage,
  faInfoCircle,
  faQuestionCircle,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faBookOpen,
  faList
} from '@fortawesome/free-solid-svg-icons';
import "../../../css/Teachers/CreateActivity.css";

// Define reading levels and categories according to your data model
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

// Question types available for each category based on your schema
const questionTypes = {
  "Alphabet Knowledge": ["patinig", "katinig"],
  "Phonological Awareness": ["malapantig"],
  "Decoding": ["word"],
  "Word Recognition": ["word"],
  "Reading Comprehension": ["sentence"]
};

const CreateActivity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type') || 'template';

  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(1);

  // Basic activity information
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    level: readingLevels[0] || '', 
    category: categories[0] || '',  
    type: typeFromQuery,
    description: '',
    // Only for reading comprehension - determines if we show passage content fields
    hasReadingPassage: typeFromQuery === 'sentence' || false 
  });

  // State for questions and passage - structured to match your JSON schema
  const [activityContent, setActivityContent] = useState({
    // Reading passage section (for Reading Comprehension category)
    sentenceText: [
      {
        pageNumber: 1,
        text: '',
        image: null,
        imagePreview: null
      }
    ],
    // Questions array
    questions: [
      {
        id: 1,
        questionType: '', // Based on category: patinig, katinig, malapantig, word, sentence
        questionText: '',
        questionImage: null,
        questionImagePreview: null,
        questionValue: '', // For holding values like letters or syllables
        choiceOptions: [
          {
            optionText: '',
            isCorrect: true
          },
          {
            optionText: '',
            isCorrect: false
          }
        ],
        order: 1
      }
    ],
    // For Reading Comprehension - separate sentence questions
    sentenceQuestions: [
      {
        questionNumber: 1,
        questionText: '',
        sentenceCorrectAnswer: '',
        sentenceOptionAnswers: ['', '', '', '']
      }
    ]
  });

  // Get question type based on category
  useEffect(() => {
    if (basicInfo.category && questionTypes[basicInfo.category]) {
      const defaultQuestionType = questionTypes[basicInfo.category][0];
      
      // Update all questions to have the default question type for this category
      setActivityContent(prev => ({
        ...prev,
        questions: prev.questions.map(q => ({
          ...q,
          questionType: defaultQuestionType
        }))
      }));
    }
  }, [basicInfo.category]);

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

  // Handle reading passage toggle for Reading Comprehension
  const handleReadingPassageToggle = (hasPassage) => {
    setBasicInfo({
      ...basicInfo,
      hasReadingPassage: hasPassage
    });
  };

  // Handle sentence text page changes (for Reading Comprehension)
  const handleSentenceTextChange = (pageIndex, field, value) => {
    setActivityContent(prev => ({
      ...prev,
      sentenceText: prev.sentenceText.map((page, idx) => 
        idx === pageIndex ? { ...page, [field]: value } : page
      )
    }));
  };

  // Handle image upload for sentence text page
  const handleSentenceImageUpload = (pageIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleSentenceTextChange(pageIndex, 'image', file);
      handleSentenceTextChange(pageIndex, 'imagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Add a new page to the sentence text
  const addSentenceTextPage = () => {
    const newPageNumber = activityContent.sentenceText.length + 1;
    
    setActivityContent(prev => ({
      ...prev,
      sentenceText: [
        ...prev.sentenceText,
        {
          pageNumber: newPageNumber,
          text: '',
          image: null,
          imagePreview: null
        }
      ]
    }));
  };

  // Remove a page from the sentence text
  const removeSentenceTextPage = (pageIndex) => {
    if (activityContent.sentenceText.length <= 1) return;

    setActivityContent(prev => ({
      ...prev,
      sentenceText: prev.sentenceText
        .filter((_, idx) => idx !== pageIndex)
        .map((page, idx) => ({
          ...page,
          pageNumber: idx + 1
        }))
    }));
  };

  // Handle question changes
  const handleQuestionChange = (questionIndex, field, value) => {
    setActivityContent(prev => ({
      ...prev,
      questions: prev.questions.map((question, idx) =>
        idx === questionIndex ? { ...question, [field]: value } : question
      )
    }));
  };

  // Handle image upload for question
  const handleQuestionImageUpload = (questionIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleQuestionChange(questionIndex, 'questionImage', file);
      handleQuestionChange(questionIndex, 'questionImagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle option changes
  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    setActivityContent(prev => ({
      ...prev,
      questions: prev.questions.map((question, qIdx) =>
        qIdx === questionIndex
          ? {
            ...question,
            choiceOptions: question.choiceOptions.map((option, oIdx) =>
              oIdx === optionIndex ? { ...option, [field]: value } : option
            )
          }
          : question
      )
    }));
  };

  // Set correct answer (making all others false)
  const setCorrectAnswer = (questionIndex, optionIndex) => {
    setActivityContent(prev => ({
      ...prev,
      questions: prev.questions.map((question, qIdx) =>
        qIdx === questionIndex
          ? {
            ...question,
            choiceOptions: question.choiceOptions.map((option, oIdx) => ({
              ...option,
              isCorrect: oIdx === optionIndex
            }))
          }
          : question
      )
    }));
  };

  // Handle sentence question changes (for Reading Comprehension)
  const handleSentenceQuestionChange = (questionIndex, field, value) => {
    setActivityContent(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, idx) =>
        idx === questionIndex ? { ...question, [field]: value } : question
      )
    }));
  };

  // Handle sentence question option changes
  const handleSentenceOptionChange = (questionIndex, optionIndex, value) => {
    setActivityContent(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, qIdx) => {
        if (qIdx !== questionIndex) return question;
        
        const newOptions = [...question.sentenceOptionAnswers];
        newOptions[optionIndex] = value;
        
        return {
          ...question,
          sentenceOptionAnswers: newOptions
        };
      })
    }));
  };

  // Set correct answer for sentence question
  const setSentenceCorrectAnswer = (questionIndex, value) => {
    setActivityContent(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, qIdx) =>
        qIdx === questionIndex
          ? {
            ...question,
            sentenceCorrectAnswer: value
          }
          : question
      )
    }));
  };

  // Add new question
  const addQuestion = () => {
    const newQuestionNumber = activityContent.questions.length + 1;
    const defaultQuestionType = basicInfo.category && questionTypes[basicInfo.category] 
      ? questionTypes[basicInfo.category][0] 
      : '';

    // For regular categories
    if (basicInfo.category !== 'Reading Comprehension' || !basicInfo.hasReadingPassage) {
      setActivityContent(prev => ({
        ...prev,
        questions: [
          ...prev.questions,
          {
            id: Date.now(),
            questionType: defaultQuestionType,
            questionText: '',
            questionImage: null,
            questionImagePreview: null,
            questionValue: '',
            choiceOptions: [
              {
                optionText: '',
                isCorrect: true
              },
              {
                optionText: '',
                isCorrect: false
              }
            ],
            order: newQuestionNumber
          }
        ]
      }));
    } 
    // For Reading Comprehension with passage
    else {
      setActivityContent(prev => ({
        ...prev,
        sentenceQuestions: [
          ...prev.sentenceQuestions,
          {
            questionNumber: prev.sentenceQuestions.length + 1,
            questionText: '',
            sentenceCorrectAnswer: '',
            sentenceOptionAnswers: ['', '', '', '']
          }
        ]
      }));
    }
  };

  // Remove question
  const removeQuestion = (questionIndex) => {
    // For regular categories
    if (basicInfo.category !== 'Reading Comprehension' || !basicInfo.hasReadingPassage) {
      if (activityContent.questions.length <= 1) return;

      setActivityContent(prev => ({
        ...prev,
        questions: prev.questions
          .filter((_, idx) => idx !== questionIndex)
          .map((question, idx) => ({
            ...question,
            order: idx + 1
          }))
      }));
    } 
    // For Reading Comprehension with passage
    else {
      if (activityContent.sentenceQuestions.length <= 1) return;

      setActivityContent(prev => ({
        ...prev,
        sentenceQuestions: prev.sentenceQuestions
          .filter((_, idx) => idx !== questionIndex)
          .map((question, idx) => ({
            ...question,
            questionNumber: idx + 1
          }))
      }));
    }
  };

  // Add option to a question
  const addOption = (questionIndex) => {
    setActivityContent(prev => ({
      ...prev,
      questions: prev.questions.map((question, idx) =>
        idx === questionIndex
          ? {
            ...question,
            choiceOptions: [
              ...question.choiceOptions,
              {
                optionText: '',
                isCorrect: false
              }
            ]
          }
          : question
      )
    }));
  };

  // Remove option from a question
  const removeOption = (questionIndex, optionIndex) => {
    const question = activityContent.questions[questionIndex];
    if (!question || question.choiceOptions.length <= 2) return;

    // Handle the case where we're removing the correct answer
    const isRemovingCorrect = question.choiceOptions[optionIndex].isCorrect;

    setActivityContent(prev => ({
      ...prev,
      questions: prev.questions.map((question, qIdx) =>
        qIdx === questionIndex
          ? {
            ...question,
            choiceOptions: question.choiceOptions
              .filter((_, oIdx) => oIdx !== optionIndex)
              .map((option, newIdx) => {
                // If we removed the correct answer, make the first option correct
                if (isRemovingCorrect && newIdx === 0) {
                  return { ...option, isCorrect: true };
                }
                return option;
              })
          }
          : question
      )
    }));
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
    }
    else if (step === 2) {
      // Validate passage if it's a reading comprehension activity
      if (basicInfo.category === 'Reading Comprehension' && basicInfo.hasReadingPassage) {
        const hasEmptyPage = activityContent.sentenceText.some(page => !page.text.trim());
        if (hasEmptyPage) {
          newErrors.passage = 'All passage pages must have content';
        }

        // Validate sentence questions
        if (activityContent.sentenceQuestions.some(q => !q.questionText.trim())) {
          newErrors.sentenceQuestions = 'All questions must have text';
        }

        if (activityContent.sentenceQuestions.some(q => !q.sentenceCorrectAnswer.trim())) {
          newErrors.sentenceCorrectAnswer = 'All questions must have a correct answer';
        }
      } else {
        // Validate regular questions
        if (activityContent.questions.some(q => !q.questionText.trim())) {
          newErrors.questions = 'All questions must have text';
        }

        // Validate options
        if (activityContent.questions.some(q => 
          q.choiceOptions.some(opt => !opt.optionText.trim())
        )) {
          newErrors.options = 'All options must have text';
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
        setCurrentStep(3); // Review step
        window.scrollTo(0, 0);
      }
    }
    else if (currentStep === 3) {
      // Submit the form
      setSubmitting(true);

      try {
        // Prepare data for submission in the format matching your database schema
        let formData;
        
        // For Reading Comprehension with passage - format according to sentence_templates.json
        if (basicInfo.category === 'Reading Comprehension' && basicInfo.hasReadingPassage) {
          formData = {
            title: basicInfo.title,
            category: basicInfo.category,
            readingLevel: basicInfo.level,
            sentenceText: activityContent.sentenceText.map(page => ({
              pageNumber: page.pageNumber,
              text: page.text,
              image: page.image ? URL.createObjectURL(page.image) : null
            })),
            sentenceQuestions: activityContent.sentenceQuestions.map(q => ({
              questionNumber: q.questionNumber,
              questionText: q.questionText,
              sentenceCorrectAnswer: q.sentenceCorrectAnswer,
              sentenceOptionAnswers: q.sentenceOptionAnswers
            })),
            isApproved: false,
            createdBy: "Current Teacher ID", // Replace with actual user ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
          };
        } 
        // For other categories - format according to main_assessment.json
        else {
          formData = {
            readingLevel: basicInfo.level,
            category: basicInfo.category,
            questions: activityContent.questions.map(q => ({
              questionType: q.questionType,
              questionText: q.questionText,
              questionImage: q.questionImage ? URL.createObjectURL(q.questionImage) : null,
              questionValue: q.questionValue,
              choiceOptions: q.choiceOptions,
              order: q.order
            })),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }

        console.log('Submitting form data:', formData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create a new activity entry for the UI display
        const newActivity = {
          id: Date.now(), // Generate a temp ID
          title: basicInfo.title,
          level: basicInfo.level,
          category: basicInfo.category,
          templateType: basicInfo.type,
          status: "pending",
          createdAt: new Date().toISOString(),
          description: basicInfo.description,
          
          // For different template types
          ...(basicInfo.category === 'Reading Comprehension' && basicInfo.hasReadingPassage 
            ? { pages: activityContent.sentenceText.length, questions: activityContent.sentenceQuestions.length } 
            : { questionCount: activityContent.questions.length })
        };
        
        // In a real app, you would save this to your database
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
        setErrors({ submit: 'Failed to submit the activity. Please try again.' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
          <h2>Activity Created Successfully!</h2>
          <p>Your activity has been submitted and is now pending approval.</p>
          <p>You will be redirected to the activities page.</p>
        </div>
      </div>
    );
  }

  // View for Step 3: Review
  const renderReview = () => {
    // For Reading Comprehension with passage
    if (basicInfo.category === 'Reading Comprehension' && basicInfo.hasReadingPassage) {
      return (
        <div className="review-section">
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
            <span className="review-label">Description:</span>
            <span className="review-value">{basicInfo.description || 'No description provided.'}</span>
          </div>

          <h3>Reading Passage</h3>
          <div className="review-subitem">
            <span className="review-label">Number of Pages:</span>
            <span className="review-value">{activityContent.sentenceText.length}</span>
          </div>
          {activityContent.sentenceText.map((page, pageIndex) => (
            <div key={pageIndex} className="review-page">
              <h4>Page {page.pageNumber}</h4>
              <div className="review-page-content">
                <p>{page.text}</p>
                {page.imagePreview && (
                  <div className="review-image">
                    <img src={page.imagePreview} alt={`Page ${page.pageNumber}`} />
                  </div>
                )}
              </div>
            </div>
          ))}

          <h3>Questions</h3>
          {activityContent.sentenceQuestions.map((question, qIndex) => (
            <div key={qIndex} className="review-question">
              <h4>Question {question.questionNumber}</h4>
              <div className="review-question-text">{question.questionText}</div>
              <div className="review-options">
                <div className="review-correct-answer">
                  <span className="review-label">Correct Answer:</span>
                  <span className="review-value">{question.sentenceCorrectAnswer}</span>
                </div>
                <div className="review-option-list">
                  <span className="review-label">Option Answers:</span>
                  <ul>
                    {question.sentenceOptionAnswers.map((option, oIndex) => (
                      <li key={oIndex}>{option}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } 
    // For other categories
    else {
      return (
        <div className="review-section">
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
            <span className="review-label">Description:</span>
            <span className="review-value">{basicInfo.description || 'No description provided.'}</span>
          </div>

          <h3>Questions</h3>
          {activityContent.questions.map((question, qIndex) => (
            <div key={qIndex} className="review-question">
              <h4>Question {qIndex + 1}</h4>
              <div className="review-question-text">{question.questionText}</div>
              {question.questionImagePreview && (
                <div className="review-image">
                  <img src={question.questionImagePreview} alt={`Question ${qIndex + 1}`} />
                </div>
              )}
              {question.questionValue && (
                <div className="review-question-value">
                  <span className="review-label">Value:</span>
                  <span className="review-value">{question.questionValue}</span>
                </div>
              )}
              <div className="review-options">
                <h5>Options:</h5>
                <ul>
                  {question.choiceOptions.map((option, oIndex) => (
                    <li key={oIndex} className={option.isCorrect ? 'correct-option' : ''}>
                      {option.optionText} {option.isCorrect && '(Correct)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="create-activity-container">
      <div className="header-container">
        <div className="create-activity-header">
          <h1 className="page-header">
            {currentStep === 1 ? 'Create New Activity' :
              currentStep === 2 ? 'Configure Activity Content' :
                'Review & Submit'}
          </h1>
          <p className="page-subtitle">
            {currentStep === 1 ? 'Provide basic information about the activity' :
              currentStep === 2 ? 'Add content and questions for this activity' :
                'Review and submit activity for approval'}
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
                  Activity Title <span className="required">*</span>
                  <InfoTooltip text="Give your activity a descriptive title. This will help teachers and students identify the activity." />
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={basicInfo.title}
                  onChange={handleBasicInfoChange}
                  placeholder="Enter a descriptive title (e.g., 'Pagbasa ng Bugtong: Antas Una')"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <div className="error-message">{errors.title}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="level">
                    Reading Level (Antas) <span className="required">*</span>
                    <InfoTooltip text="Select the appropriate reading level for this activity based on the CRLA curriculum." />
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
                    <InfoTooltip text="Select a CRLA category (Alphabet Knowledge, Phonological Awareness, etc.)" />
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

              <div className="form-group">
                <label htmlFor="description">
                  Description
                  <InfoTooltip text="Provide a brief description of what students will learn in this activity." />
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={basicInfo.description}
                  onChange={handleBasicInfoChange}
                  rows="4"
                  placeholder="Describe the activity and its learning objectives..."
                ></textarea>
              </div>

              {/* Only show Reading Passage toggle if it's Reading Comprehension */}
              {basicInfo.category === 'Reading Comprehension' && (
                <div className="content-structure-selection">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faBookOpen} /> Activity Structure
                    <InfoTooltip text="Choose if your activity has a reading passage followed by questions, or just questions." />
                  </h3>

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
                </div>
              )}
            </div>
          )}

          {/* Step 2: Content Configuration */}
          {currentStep === 2 && (
            <div className="content-config-section">
              {/* Reading Passage (if it's Reading Comprehension with passage) */}
              {basicInfo.category === 'Reading Comprehension' && basicInfo.hasReadingPassage && (
                <div className="passage-section">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faBookOpen} /> Reading Passage
                    <InfoTooltip text="Create a reading passage that students will read before answering questions." />
                  </h3>

                  {errors.passage && <div className="error-message section-error">{errors.passage}</div>}

                  {/* Create pages for the passage */}
                  {activityContent.sentenceText.map((page, pageIndex) => (
                    <div className="passage-page" key={pageIndex}>
                      <div className="page-header">
                        <h4>Page {page.pageNumber}</h4>
                        {activityContent.sentenceText.length > 1 && (
                          <button
                            type="button"
                            className="remove-page-btn"
                            onClick={() => removeSentenceTextPage(pageIndex)}
                          >
                            <FontAwesomeIcon icon={faTrash} /> Remove Page
                          </button>
                        )}
                      </div>

                      <div className="form-group">
                        <label>
                          Page Text <span className="required">*</span>
                          <InfoTooltip text="Enter the text for this page of the passage." />
                        </label>
                        <textarea
                          value={page.text}
                          onChange={(e) => handleSentenceTextChange(pageIndex, 'text', e.target.value)}
                          placeholder="Enter the text for this page..."
                          rows="4"
                          className={errors.passage ? 'error' : ''}
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>
                          Page Image
                          <InfoTooltip text="Upload an image to illustrate this page of the passage." />
                        </label>
                        <div className="image-upload-container">
                          {page.imagePreview ? (
                            <div className="image-preview">
                              <img src={page.imagePreview} alt="Page preview" />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => {
                                  handleSentenceTextChange(pageIndex, 'image', null);
                                  handleSentenceTextChange(pageIndex, 'imagePreview', null);
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
                                id={`page-image-${pageIndex}`}
                                onChange={(e) => handleSentenceImageUpload(pageIndex, e)}
                                className="file-input"
                              />
                              <label htmlFor={`page-image-${pageIndex}`} className="file-label">
                                <FontAwesomeIcon icon={faImage} />
                                <span>Choose Image</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-page-btn"
                    onClick={addSentenceTextPage}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Another Page
                  </button>
                </div>
              )}

              {/* Questions section - different for Reading Comprehension with passage */}
              <div className="questions-section">
                <div className="section-title-bar">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faList} /> Questions
                    <InfoTooltip text="Create questions for this activity. These will be presented to students to assess their understanding." />
                  </h3>
                </div>

                {errors.questions && <div className="error-message section-error">{errors.questions}</div>}
                {errors.options && <div className="error-message section-error">{errors.options}</div>}
                {errors.sentenceQuestions && <div className="error-message section-error">{errors.sentenceQuestions}</div>}
                {errors.sentenceCorrectAnswer && <div className="error-message section-error">{errors.sentenceCorrectAnswer}</div>}

                {/* Reading Comprehension with passage has special question format */}
                {basicInfo.category === 'Reading Comprehension' && basicInfo.hasReadingPassage ? (
                  // Sentence questions for reading comprehension
                  activityContent.sentenceQuestions.map((question, qIndex) => (
                    <div className="question-card" key={qIndex}>
                      <div className="item-header">
                        <h3>Question {question.questionNumber}</h3>
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => removeQuestion(qIndex)}
                          disabled={activityContent.sentenceQuestions.length <= 1}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </div>

                      <div className="form-group">
                        <label>
                          Question Text <span className="required">*</span>
                          <InfoTooltip text="Enter the question that will be presented to the student." />
                        </label>
                        <textarea
                          value={question.questionText}
                          onChange={(e) => handleSentenceQuestionChange(qIndex, 'questionText', e.target.value)}
                          placeholder="Enter your question text here..."
                          rows="2"
                          className={errors.sentenceQuestions ? 'error' : ''}
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>
                          Correct Answer <span className="required">*</span>
                          <InfoTooltip text="Enter the correct answer for this question." />
                        </label>
                        <input
                          type="text"
                          value={question.sentenceCorrectAnswer}
                          onChange={(e) => setSentenceCorrectAnswer(qIndex, e.target.value)}
                          placeholder="Enter the correct answer..."
                          className={errors.sentenceCorrectAnswer ? 'error' : ''}
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Answer Options <span className="required">*</span>
                          <InfoTooltip text="Enter all possible answer options. The first option should match the correct answer." />
                        </label>
                        {question.sentenceOptionAnswers.map((option, oIndex) => (
                          <div key={oIndex} className="option-row">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleSentenceOptionChange(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className={errors.sentenceOptions ? 'error' : ''}
                            />
                            {oIndex === 0 && <span className="correct-option-flag">Correct</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Regular questions for other categories
                  activityContent.questions.map((question, qIndex) => (
                    <div className="question-card" key={question.id}>
                      <div className="item-header">
                        <h3>Question {qIndex + 1}</h3>
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => removeQuestion(qIndex)}
                          disabled={activityContent.questions.length <= 1}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </div>

                      <div className="form-group">
                        <label>
                          Question Text <span className="required">*</span>
                          <InfoTooltip text="Enter the question that will be presented to the student." />
                        </label>
                        <textarea
                          value={question.questionText}
                          onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                          placeholder="Enter your question text here..."
                          rows="2"
                          className={errors.questions ? 'error' : ''}
                        ></textarea>
                      </div>

                      {/* Question Image - optional */}
                      <div className="form-group">
                        <label>
                          Question Image (Optional)
                          <InfoTooltip text="Upload an image for this question if needed." />
                        </label>
                        <div className="image-upload-container">
                          {question.questionImagePreview ? (
                            <div className="image-preview">
                              <img src={question.questionImagePreview} alt="Question preview" />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => {
                                  handleQuestionChange(qIndex, 'questionImage', null);
                                  handleQuestionChange(qIndex, 'questionImagePreview', null);
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
                                id={`question-image-${qIndex}`}
                                onChange={(e) => handleQuestionImageUpload(qIndex, e)}
                                className="file-input"
                              />
                              <label htmlFor={`question-image-${qIndex}`} className="file-label">
                                <FontAwesomeIcon icon={faImage} />
                                <span>Choose Image</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Question Value - for specific categories */}
                      {(question.questionType === 'patinig' || 
                        question.questionType === 'katinig' ||
                        question.questionType === 'malapantig') && (
                        <div className="form-group">
                          <label>
                            Question Value
                            <InfoTooltip text="Enter the value that this question refers to (e.g., letter, syllable)." />
                          </label>
                          <input
                            type="text"
                            value={question.questionValue || ''}
                            onChange={(e) => handleQuestionChange(qIndex, 'questionValue', e.target.value)}
                            placeholder={
                              question.questionType === 'patinig' ? 'Enter vowel (e.g., A)' : 
                              question.questionType === 'katinig' ? 'Enter consonant (e.g., B)' :
                              'Enter syllable (e.g., BA)'
                            }
                          />
                        </div>
                      )}

                      {/* Answer Options */}
                      <div className="form-group">
                        <label>
                          Answer Options <span className="required">*</span>
                          <InfoTooltip text="Enter answer options for this question. Select the correct answer." />
                        </label>
                        <div className="options-container">
                          {question.choiceOptions.map((option, oIndex) => (
                            <div key={oIndex} className="option-row">
                              <input
                                type="radio"
                                id={`option-${qIndex}-${oIndex}`}
                                name={`correct-answer-${qIndex}`}
                                checked={option.isCorrect}
                                onChange={() => setCorrectAnswer(qIndex, oIndex)}
                                className="option-radio"
                              />
                              <input
                                type="text"
                                value={option.optionText}
                                onChange={(e) => handleOptionChange(qIndex, oIndex, 'optionText', e.target.value)}
                                placeholder={`Option ${oIndex + 1}`}
                                className={errors.options ? 'error' : ''}
                              />
                              {question.choiceOptions.length > 2 && (
                                <button
                                  type="button"
                                  className="remove-option-btn"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Add Option Button */}
                        <button
                          type="button"
                          className="add-option-btn"
                          onClick={() => addOption(qIndex)}
                        >
                          <FontAwesomeIcon icon={faPlus} /> Add Option
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  className="add-question-btn"
                  onClick={addQuestion}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Question
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="review-step">
              <h2>Review Your Activity</h2>
              <p className="review-instructions">
                Please review your activity details below. If everything looks correct, click Submit to create the activity.
              </p>

              {renderReview()}
            </div>
          )}

          {/* Form navigation buttons */}
          <div className="form-navigation">
            <button
              type="button"
              className="btn-back"
              onClick={handleBack}
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </button>

            <button
              type="submit"
              className="btn-next"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                </>
              ) : currentStep < 3 ? (
                'Next'
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} /> Submit
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