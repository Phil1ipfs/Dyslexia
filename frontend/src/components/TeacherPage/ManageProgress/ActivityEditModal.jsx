import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaEdit,
  FaSave, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaPlus, 
  FaTrash,
  FaUser,
  FaImage,
  FaFont,
  FaHeadphones,
  FaMicrophone,
  FaSpinner,
  FaQuestionCircle,
  FaBookOpen,
  FaCheckCircle,
  FaMobile
} from 'react-icons/fa';
import './css/ActivityEditModal.css';



const ActivityEditModal = ({ activity, onClose, onSave, student }) => {
  // State for basic activity info
  const [title, setTitle] = useState(activity.title || '');
  const [description, setDescription] = useState(activity.description || '');
  const [difficulty, setDifficulty] = useState(activity.difficulty || 'Medium');
  const [currentStep, setCurrentStep] = useState(1);
  const [contentType, setContentType] = useState(activity.contentType || 'image');
  
  // State for content items (based on content type)
  const [contentItems, setContentItems] = useState(activity.content || []);
  
  // State for questions
  const [questions, setQuestions] = useState(activity.questions || [
    {
      id: 1,
      questionText: "What sound do you hear?",
      contentType: "image",
      options: ["A", "E", "I", "O"],
      correctAnswer: 0,
      feedback: "The vowel 'A' has a deep sound."
    },
    {
      id: 2,
      questionText: "Which letter makes the 'oh' sound?",
      contentType: "image",
      options: ["A", "U", "O", "I"],
      correctAnswer: 2,
      feedback: "The letter 'O' makes the 'oh' sound."
    }
  ]);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Content type definitions with icons and descriptions
  const contentTypes = [
    {
      id: 'image',
      name: 'Question with Image or Audio Based',
      icon: FaImage,
      description: 'Visually-driven activities with supporting captions and questions with audio or texts or images'
    },
    {
      id: 'reading',
      name: 'Reading Passages',
      icon: FaBookOpen,
      description: 'Text-based activities with syllable breakdowns and supporting visuals'
    }
  ];
  
  // Initialize content items based on content type
  useEffect(() => {
    if (contentItems.length === 0) {
      // Create default content based on type
      if (contentType === 'reading') {
        setContentItems([
          {
            id: Date.now(),
            text: '',
            syllables: '',
            translation: '',
            imageFile: null,
            imagePreview: null,
            audioFile: null
          }
        ]);
      } else if (contentType === 'image') {
        setContentItems([
          {
            id: Date.now(),
            caption: '',
            imageFile: null,
            imagePreview: null
          }
        ]);
      }
    }
  }, [contentType, contentItems]);
  
  // Helper function to create default content item
  const createDefaultContent = () => {
    const base = { id: Date.now() };
    
    if (contentType === 'reading') {
      return {
        ...base,
        text: '',
        syllables: '',
        translation: '',
        imageFile: null,
        imagePreview: null,
        audioFile: null
      };
    } else {
      return {
        ...base,
        caption: '',
        imageFile: null,
        imagePreview: null
      };
    }
  };
  
  // Helper function to create default question
  const createDefaultQuestion = () => {
    return {
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
      optionAudioUrls: [null, null]
    };
  };
  
  // Content management functions
  const addContentItem = () => {
    setContentItems([...contentItems, createDefaultContent()]);
  };
  
  const removeContentItem = (id) => {
    if (contentItems.length <= 1) return;
    setContentItems(contentItems.filter(item => item.id !== id));
  };
  
  const updateContentItem = (id, field, value) => {
    setContentItems(contentItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  // Handle image upload for content
  const handleContentImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      updateContentItem(id, 'imageFile', file);
      updateContentItem(id, 'imagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle audio upload for content
  const handleContentAudioUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const audioUrl = URL.createObjectURL(file);
    updateContentItem(id, 'audioFile', file);
    updateContentItem(id, 'audioUrl', audioUrl);
  };
  
  // Question management functions
  const addQuestion = () => {
    setQuestions([...questions, createDefaultQuestion()]);
  };
  
  const removeQuestion = (id) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };
  
  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };
  
  // Handle image upload for question
  const handleQuestionImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      updateQuestion(id, 'imageFile', file);
      updateQuestion(id, 'imagePreview', reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle audio upload for question
  const handleQuestionAudioUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const audioUrl = URL.createObjectURL(file);
    updateQuestion(id, 'audioFile', file);
    updateQuestion(id, 'audioUrl', audioUrl);
  };
  
  // Option management functions
  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
      } : q
    ));
  };
  
  const addOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: [...q.options, ''],
        optionAudioFiles: [...(q.optionAudioFiles || []), null],
        optionAudioUrls: [...(q.optionAudioUrls || []), null]
      } : q
    ));
  };
  
  const removeOption = (questionId, optionIndex) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.options.length <= 2) return;
    
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options.filter((_, idx) => idx !== optionIndex),
        optionAudioFiles: (q.optionAudioFiles || []).filter((_, idx) => idx !== optionIndex),
        optionAudioUrls: (q.optionAudioUrls || []).filter((_, idx) => idx !== optionIndex),
        correctAnswer: q.correctAnswer === optionIndex 
          ? 0 
          : q.correctAnswer > optionIndex 
            ? q.correctAnswer - 1 
            : q.correctAnswer
      } : q
    ));
  };
  
  const setCorrectAnswer = (questionId, optionIndex) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, correctAnswer: optionIndex } : q
    ));
  };
  
  // Handle option audio upload
  const handleOptionAudioUpload = (questionId, optionIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const audioUrl = URL.createObjectURL(file);
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        optionAudioFiles: (q.optionAudioFiles || []).map((f, idx) => idx === optionIndex ? file : f),
        optionAudioUrls: (q.optionAudioUrls || []).map((u, idx) => idx === optionIndex ? audioUrl : u)
      } : q
    ));
  };
  
  // Remove option audio
  const removeOptionAudio = (questionId, optionIndex) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        optionAudioFiles: (q.optionAudioFiles || []).map((f, idx) => idx === optionIndex ? null : f),
        optionAudioUrls: (q.optionAudioUrls || []).map((u, idx) => idx === optionIndex ? null : u)
      } : q
    ));
  };
  
  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Validation functions
  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!title.trim()) {
        newErrors.title = "Title is required";
      }
      
      if (!description.trim()) {
        newErrors.description = "Description is required";
      }
    }
    else if (currentStep === 2) {
      if (contentType === 'reading' && contentItems.some(item => !item.text.trim())) {
        newErrors.content = "All reading passages must have text";
      }
      
      if (contentType === 'image' && contentItems.some(item => !item.imagePreview)) {
        newErrors.content = "All image-based content must have images";
      }
    }
    else if (currentStep === 3) {
      if (questions.some(q => !q.questionText.trim())) {
        newErrors.questions = "All questions must have text";
      }
      
      if (questions.some(q => q.options.some(opt => !opt.trim()))) {
        newErrors.options = "All options must have text";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateAllSteps = () => {
    const allErrors = {};
    
    // Basic info validation
    if (!title.trim()) {
      allErrors.title = "Title is required";
    }
    
    if (!description.trim()) {
      allErrors.description = "Description is required";
    }
    
    // Content validation
    if (contentType === 'reading' && contentItems.some(item => !item.text.trim())) {
      allErrors.content = "All reading passages must have text";
    }
    
    if (contentType === 'image' && contentItems.some(item => !item.imagePreview)) {
      allErrors.content = "All image-based content must have images";
    }
    
    // Questions validation
    if (questions.some(q => !q.questionText.trim())) {
      allErrors.questions = "All questions must have text";
    }
    
    if (questions.some(q => q.options.some(opt => !opt.trim()))) {
      allErrors.options = "All options must have text";
    }
    
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };
  
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentStep < 4) {
      nextStep();
      return;
    }
    
    // Final validation before saving
    if (!validateAllSteps()) {
      // If validation fails, go to the first step with errors
      if (errors.title || errors.description) {
        setCurrentStep(1);
      } else if (errors.content) {
        setCurrentStep(2);
      } else if (errors.questions || errors.options) {
        setCurrentStep(3);
      }
      return;
    }
    
    setSubmitting(true);
    
    // Prepare the data to save
    const updatedActivity = {
      ...activity,
      id: activity.id,
      title,
      description,
      difficulty,
      contentType,
      content: contentItems,
      questions,
      status: 'pushed_to_mobile', // Directly push to mobile
      lastModified: new Date().toISOString()
    };
    
    // Simulate API call
    setTimeout(() => {
      onSave(updatedActivity);
      setSubmitting(false);
    }, 1000);
  };
  
  // Get difficulty text based on level
  const getDifficultyText = (level) => {
    switch(level) {
      case 'Easy': return 'Easy - For beginners';
      case 'Medium': return 'Medium - For those with basic knowledge';
      case 'Hard': return 'Hard - For advanced learners';
      default: return level;
    }
  };
  
  // Render the steps content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderContentStep();
      case 3:
        return renderQuestionsStep();
      case 4:
        return renderReviewStep();
      default:
        return renderBasicInfoStep();
    }
  };
  
  // Step 1: Basic Information
  const renderBasicInfoStep = () => {
    return (
      <div className="literexia-form-section">
        <h3>Activity Information</h3>
        
        <div className="literexia-form-group">
          <label htmlFor="title">
            Activity Title <span className="literexia-required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? 'literexia-error' : ''}
          />
          {errors.title && <div className="literexia-error-message">{errors.title}</div>}
        </div>
        
        <div className="literexia-form-group">
          <label htmlFor="description">
            Activity Description <span className="literexia-required">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            placeholder="Provide a brief description of the learning objectives for this activity"
            className={errors.description ? 'literexia-error' : ''}
          ></textarea>
          {errors.description && <div className="literexia-error-message">{errors.description}</div>}
        </div>
        
        <div className="literexia-form-group">
          <label htmlFor="difficulty">Difficulty Level</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Easy">{getDifficultyText('Easy')}</option>
            <option value="Medium">{getDifficultyText('Medium')}</option>
            <option value="Hard">{getDifficultyText('Hard')}</option>
          </select>
        </div>
        
        {/* Content Type Selection */}
        <div className="literexia-content-type-selection">
          <h3>Content Type</h3>
          <div className="literexia-content-type-options">
            {contentTypes.map(type => (
              <div
                key={type.id}
                className={`literexia-content-type-option ${contentType === type.id ? 'active' : ''}`}
                onClick={() => setContentType(type.id)}
              >
                <div className="literexia-content-type-icon">
                  <type.icon />
                </div>
                <div className="literexia-content-type-details">
                  <div className="literexia-content-type-name">{type.name}</div>
                  <div className="literexia-content-type-description">{type.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Step 2: Content
  const renderContentStep = () => {
    return (
      <div className="literexia-content-items-section">
        <h3>
          {contentType === 'reading' ? 'Reading Passages' : 'Image Content'}
        </h3>
        
        {errors.content && (
          <div className="literexia-error-banner">
            <FaExclamationTriangle />
            <p>{errors.content}</p>
          </div>
        )}
        
        {contentItems.map((item, index) => (
          <div key={item.id} className="literexia-content-item">
            <div className="literexia-item-header">
              <h4>{contentType === 'reading' ? `Passage ${index + 1}` : `Content Item ${index + 1}`}</h4>
              <button
                type="button"
                className="literexia-remove-item-btn"
                onClick={() => removeContentItem(item.id)}
                disabled={contentItems.length <= 1}
              >
                <FaTrash />
              </button>
            </div>
            
            {contentType === 'reading' ? (
              <>
                <div className="literexia-form-group">
                  <label>Text <span className="literexia-required">*</span></label>
                  <textarea
                    rows="4"
                    value={item.text || ''}
                    onChange={e => updateContentItem(item.id, 'text', e.target.value)}
                    placeholder="Enter passage text..."
                    className={errors.content ? 'literexia-error' : ''}
                  />
                </div>
                
                <div className="literexia-form-row">
                  <div className="literexia-form-group">
                    <label>Syllables</label>
                    <textarea
                      rows="2"
                      value={item.syllables || ''}
                      onChange={e => updateContentItem(item.id, 'syllables', e.target.value)}
                      placeholder="e.g., syl-la-bles"
                    />
                  </div>
                  <div className="literexia-form-group">
                    <label>Notes</label>
                    <textarea
                      rows="2"
                      value={item.translation || ''}
                      onChange={e => updateContentItem(item.id, 'translation', e.target.value)}
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="literexia-form-group">
                <label>Caption</label>
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={e => updateContentItem(item.id, 'caption', e.target.value)}
                  placeholder="Enter a caption for this image..."
                />
              </div>
            )}
            
            <div className="literexia-media-row">
              <div className="literexia-media-column">
                <label>Image {contentType === 'image' && <span className="literexia-required">*</span>}</label>
                {item.imagePreview ? (
                  <div className="literexia-image-preview">
                    <img src={item.imagePreview} alt="" />
                    <button 
                      type="button" 
                      onClick={() => {
                        updateContentItem(item.id, 'imageFile', null);
                        updateContentItem(item.id, 'imagePreview', null);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <label className="literexia-upload-placeholder">
                    <FaImage /> Choose Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleContentImageUpload(item.id, e)} 
                    />
                  </label>
                )}
              </div>
              
              <div className="literexia-media-column">
                <label>Audio</label>
                {item.audioUrl ? (
                  <div className="literexia-audio-preview">
                    <audio controls src={item.audioUrl} />
                    <button 
                      type="button" 
                      onClick={() => {
                        updateContentItem(item.id, 'audioFile', null);
                        updateContentItem(item.id, 'audioUrl', null);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <label className="literexia-upload-placeholder">
                    <FaHeadphones /> Upload Audio
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={e => handleContentAudioUpload(item.id, e)} 
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          className="literexia-add-item-btn" 
          onClick={addContentItem}
        >
          <FaPlus /> Add {contentType === 'reading' ? 'Passage' : 'Content Item'}
        </button>
      </div>
    );
  };
  
  // Step 3: Questions
  const renderQuestionsStep = () => {
    return (
      <div className="literexia-questions-section">
        <h3>Questions</h3>
        
        {(errors.questions || errors.options) && (
          <div className="literexia-error-banner">
            <FaExclamationTriangle />
            <p>{errors.questions || errors.options}</p>
          </div>
        )}
        
        {questions.map((question, qIndex) => (
          <div key={question.id} className="literexia-question-card">
            <div className="literexia-question-header">
              <h4>Question {qIndex + 1}</h4>
              <button
                type="button"
                className="literexia-remove-question-btn"
                onClick={() => removeQuestion(question.id)}
                disabled={questions.length <= 1}
              >
                <FaTrash />
              </button>
            </div>
            
            {/* Question type selection */}
            <div className="literexia-question-type-selection">
              <label>Question Type</label>
              <div className="literexia-type-buttons">
                <button
                  type="button"
                  className={`literexia-type-button ${question.contentType === 'text' ? 'active' : ''}`}
                  onClick={() => updateQuestion(question.id, 'contentType', 'text')}
                >
                  <FaFont />
                  <span>Text</span>
                </button>
                <button
                  type="button"
                  className={`literexia-type-button ${question.contentType === 'image' ? 'active' : ''}`}
                  onClick={() => updateQuestion(question.id, 'contentType', 'image')}
                >
                  <FaImage />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  className={`literexia-type-button ${question.contentType === 'audio' ? 'active' : ''}`}
                  onClick={() => updateQuestion(question.id, 'contentType', 'audio')}
                >
                  <FaMicrophone />
                  <span>Audio</span>
                </button>
              </div>
            </div>
            
            <div className="literexia-form-group">
              <label>
                Question Text <span className="literexia-required">*</span>
              </label>
              <textarea
                value={question.questionText}
                onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                placeholder="Enter the question text..."
                rows="2"
                className={errors.questions ? 'literexia-error' : ''}
              ></textarea>
            </div>
            
            {/* Media based on question type */}
            {question.contentType === 'image' && (
              <div className="literexia-question-media">
                <label>Question Image</label>
                <div className="literexia-upload-container">
                  {question.imagePreview ? (
                    <div className="literexia-image-preview">
                      <img
                        src={question.imagePreview}
                        alt="Question visual"
                        className="literexia-preview-image"
                      />
                      <button
                        type="button"
                        className="literexia-remove-media-btn"
                        onClick={() => {
                          updateQuestion(question.id, 'imageFile', null);
                          updateQuestion(question.id, 'imagePreview', null);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ) : (
                    <label className="literexia-upload-placeholder">
                      <FaImage className="literexia-upload-icon" />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleQuestionImageUpload(question.id, e)}
                        className="literexia-file-input"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
            
            {question.contentType === 'audio' && (
              <div className="literexia-question-media">
                <label>Question Audio</label>
                <div className="literexia-upload-container">
                  {question.audioUrl ? (
                    <div className="literexia-audio-preview">
                      <audio
                        controls
                        src={question.audioUrl}
                        className="literexia-audio-player"
                      ></audio>
                      <button
                        type="button"
                        className="literexia-remove-media-btn"
                        onClick={() => {
                          updateQuestion(question.id, 'audioFile', null);
                          updateQuestion(question.id, 'audioUrl', null);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ) : (
                    <label className="literexia-upload-placeholder">
                      <FaHeadphones className="literexia-upload-icon" />
                      <span>Upload Audio</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleQuestionAudioUpload(question.id, e)}
                        className="literexia-file-input"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
            
            {/* Answer Options */}
            <div className="literexia-options-container">
              <div className="literexia-options-header">
                <label>
                  Answer Options <span className="literexia-required">*</span>
                </label>
                <button
                  type="button"
                  className="literexia-add-option-btn"
                  onClick={() => addOption(question.id)}
                >
                  <FaPlus /> Add Option
                </button>
              </div>
              
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="literexia-option-row">
                  <div className="literexia-option-radio">
                    <input
                      type="radio"
                      id={`q${question.id}-opt${oIndex}`}
                      name={`question-${question.id}-correct`}
                      checked={question.correctAnswer === oIndex}
                      onChange={() => setCorrectAnswer(question.id, oIndex)}
                    />
                    <label htmlFor={`q${question.id}-opt${oIndex}`}>
                      Correct
                    </label>
                  </div>
                  
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    className={errors.options ? 'literexia-error' : ''}
                  />
                  
                  {/* Option audio */}
                  <div className="literexia-option-audio-controls">
                    {question.optionAudioUrls && question.optionAudioUrls[oIndex] ? (
                      <div className="literexia-audio-preview">
                        <audio
                          controls
                          src={question.optionAudioUrls[oIndex]}
                          className="literexia-audio-player"
                        ></audio>
                        <button
                          type="button"
                          className="literexia-remove-media-btn"
                          onClick={() => removeOptionAudio(question.id, oIndex)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ) : (
                      <label className="literexia-option-audio-upload">
                        <FaHeadphones />
                        <span>Add Audio</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleOptionAudioUpload(question.id, oIndex, e)}
                          className="literexia-file-input"
                        />
                      </label>
                    )}
                  </div>
                  
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      className="literexia-remove-option-btn"
                      onClick={() => removeOption(question.id, oIndex)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="literexia-form-group">
              <label>
                Hint/Explanation
                <div className="literexia-info-tooltip">
                  <FaQuestionCircle className="literexia-tooltip-icon" />
                  <span className="literexia-tooltip-content">This will be shown to the student after answering incorrectly.</span>
                </div>
              </label>
              <textarea
                value={question.hint || ''}
                onChange={(e) => updateQuestion(question.id, 'hint', e.target.value)}
                placeholder="Optional: Provide a hint or explanation for this question"
                rows="2"
              ></textarea>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          className="literexia-add-question-btn"
          onClick={addQuestion}
        >
          <FaPlus /> Add New Question
        </button>
      </div>
    );
  };
  
  // Step 4: Review
  const renderReviewStep = () => {
    return (
      <div className="literexia-review-section">
        <h3>Review Activity</h3>
        
        <div className="literexia-info-banner">
          <FaInfoCircle />
          <p>
            Review your activity before pushing it to {student?.name}'s mobile device. 
            Once submitted, the activity will be immediately available on their mobile app.
          </p>
        </div>
        
        <div className="literexia-review-card">
          <h4>Basic Information</h4>
          <div className="literexia-review-details">
            <div className="literexia-review-item">
              <span className="literexia-review-label">Title:</span>
              <span className="literexia-review-value">{title}</span>
            </div>
            <div className="literexia-review-item">
              <span className="literexia-review-label">Description:</span>
              <span className="literexia-review-value">{description}</span>
            </div>
            <div className="literexia-review-item">
              <span className="literexia-review-label">Difficulty:</span>
              <span className="literexia-review-value">{difficulty}</span>
            </div>
            <div className="literexia-review-item">
              <span className="literexia-review-label">Content Type:</span>
              <span className="literexia-review-value">
                {contentType === 'reading' ? 'Reading Passages' : 'Image-based Content'}
              </span>
            </div>
          </div>
          
          <button 
            type="button" 
            className="literexia-edit-step-btn"
            onClick={() => setCurrentStep(1)}
          >
            <FaEdit /> Edit
          </button>
        </div>
        
        <div className="literexia-review-card">
          <h4>Content</h4>
          <div className="literexia-review-summary">
            <p>
              This activity has {contentItems.length} {contentType === 'reading' ? 'reading passage(s)' : 'content item(s)'}.
              {contentType === 'reading' && contentItems.length > 0 && contentItems[0].text && (
                <span className="literexia-text-preview">
                  First passage begins with: "{contentItems[0].text.substring(0, 50)}..."
                </span>
              )}
            </p>
          </div>
          
          <button 
            type="button" 
            className="literexia-edit-step-btn"
            onClick={() => setCurrentStep(2)}
          >
            <FaEdit /> Edit
          </button>
        </div>
        
        <div className="literexia-review-card">
          <h4>Questions</h4>
          <div className="literexia-review-summary">
            <p>This activity has {questions.length} question(s):</p>
            <ul className="literexia-questions-summary">
              {questions.slice(0, 3).map((q, index) => (
                <li key={index}>
                  <strong>Q{index + 1}:</strong> {q.questionText.length > 50 ? 
                    q.questionText.substring(0, 50) + '...' : 
                    q.questionText} 
                  <span className="literexia-question-type">
                    ({q.contentType} question with {q.options.length} options)
                  </span>
                </li>
              ))}
              {questions.length > 3 && (
                <li>...and {questions.length - 3} more question(s)</li>
              )}
            </ul>
          </div>
          
          <button 
            type="button" 
            className="literexia-edit-step-btn"
            onClick={() => setCurrentStep(3)}
          >
            <FaEdit /> Edit
          </button>
        </div>
        
        <div className="literexia-push-mobile-notice">
          <div className="literexia-notice-icon">
            <FaMobile />
          </div>
          <div className="literexia-notice-content">
            <h4>Ready to Push to Mobile</h4>
            <p>
              This activity will be immediately available on {student?.name}'s mobile 
              device after submission. No administrator approval is required.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Main render function
  return (
    <div className="literexia-modal-overlay">
      <div className="literexia-activity-edit-modal">
        {/* Modal Header */}
        <div className="literexia-modal-header">
          <div className="literexia-modal-title">
            <h2>Customize Activity for {student?.name || 'Student'}</h2>
            <div className="literexia-student-badge">
              <FaUser /> {student?.readingLevel || 'Level 2'}
            </div>
          </div>
          <button className="literexia-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {/* Error banner */}
        {Object.keys(errors).length > 0 && (
          <div className="literexia-error-banner">
            <FaExclamationTriangle />
            <p>Please fix the errors before continuing</p>
          </div>
        )}
        
        {/* Steps indicator */}
        <div className="literexia-steps-indicator">
          <div className={`literexia-step ${currentStep >= 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>
            <div className="literexia-step-number">1</div>
            <div className="literexia-step-label">Basic Info</div>
          </div>
          <div className="literexia-step-connector"></div>
          
          <div className={`literexia-step ${currentStep >= 2 ? 'active' : ''}`} onClick={() => validateCurrentStep() && setCurrentStep(2)}>
            <div className="literexia-step-number">2</div>
            <div className="literexia-step-label">Content</div>
          </div>
          <div className="literexia-step-connector"></div>
          
          <div className={`literexia-step ${currentStep >= 3 ? 'active' : ''}`} onClick={() => validateCurrentStep() && setCurrentStep(3)}>
            <div className="literexia-step-number">3</div>
            <div className="literexia-step-label">Questions</div>
          </div>
          <div className="literexia-step-connector"></div>
          
          <div className={`literexia-step ${currentStep >= 4 ? 'active' : ''}`} onClick={() => validateCurrentStep() && setCurrentStep(4)}>
            <div className="literexia-step-number">4</div>
            <div className="literexia-step-label">Review</div>
          </div>
        </div>
        
        {/* Modal Info Banner */}
        <div className="literexia-modal-info-banner">
          <FaInfoCircle />
          <p>
            Customizing this activity will create a personalized version tailored to {student?.name || 'this student'}'s 
            specific needs. The customized activity will be sent directly to the student's mobile device.
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="literexia-edit-form">
          {renderStepContent()}
          
          {/* Form navigation */}
          <div className="literexia-form-actions">
            {currentStep > 1 ? (
              <button type="button" className="literexia-cancel-btn" onClick={prevStep}>
                Back
              </button>
            ) : (
              <button type="button" className="literexia-cancel-btn" onClick={onClose}>
                Cancel
              </button>
            )}
            
            <button type="submit" className="literexia-save-btn" disabled={submitting}>
              {submitting ? (
                <>
                  <FaSpinner className="literexia-spinner" /> Processing...
                </>
              ) : currentStep < 4 ? (
                'Continue'
              ) : (
                <>
                  <FaSave /> Save and Push to Mobile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityEditModal;