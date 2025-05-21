import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faPlus,
  faArrowLeft,
  faInfoCircle,
  faFont,
  faImage,
  faVolumeUp,
  faLayerGroup,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import './AddActivityModal.css';

// Modal for adding a new activity template 
const AddActivityModal = ({ onClose, readingLevels, categories, activityTypes }) => {
  // Form state
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(readingLevels[0] || '');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
  const [selectedType, setSelectedType] = useState(activityTypes[0]?.id || '');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('reading'); // 'reading', 'image'
  const [formError, setFormError] = useState('');
  
  // Question and content state
  const [questions, setQuestions] = useState([
    {
      id: 1,
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    }
  ]);
  
  // For reading comprehension category
  const [passageContent, setPassageContent] = useState([
    { 
      pageNumber: 1, 
      text: '', 
      image: null, 
      imagePreview: null 
    }
  ]);

  // Reset form error when inputs change
  useEffect(() => {
    if (formError) setFormError('');
  }, [title, selectedLevel, selectedCategory, selectedType]);

  // Handle form submission for first step
  const handleStepOneSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!title.trim()) {
      setFormError('Please enter an activity title');
      return;
    }

    // Proceed to next step
    setStep(2);
  };

  // Handle content type change
  const handleContentTypeChange = (type) => {
    setContentType(type);
  };

  // Add a new passage page
  const addPassagePage = () => {
    setPassageContent(prev => [
      ...prev,
      {
        pageNumber: prev.length + 1,
        text: '',
        image: null,
        imagePreview: null
      }
    ]);
  };

  // Remove a passage page
  const removePassagePage = (pageIndex) => {
    if (passageContent.length <= 1) return;
    
    setPassageContent(prev => 
      prev.filter((_, idx) => idx !== pageIndex)
        .map((page, idx) => ({
          ...page,
          pageNumber: idx + 1
        }))
    );
  };

  // Update passage text
  const updatePassageText = (pageIndex, text) => {
    setPassageContent(prev => 
      prev.map((page, idx) => 
        idx === pageIndex ? { ...page, text } : page
      )
    );
  };

  // Handle passage image upload
  const handlePassageImageUpload = (pageIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPassageContent(prev => 
        prev.map((page, idx) => 
          idx === pageIndex 
            ? { ...page, image: file, imagePreview: reader.result } 
            : page
        )
      );
    };
    reader.readAsDataURL(file);
  };

  // Add a new question
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: Date.now(),
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]);
  };

  // Remove a question
  const removeQuestion = (questionIndex) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, idx) => idx !== questionIndex));
  };

  // Update question text
  const updateQuestionText = (questionIndex, text) => {
    setQuestions(prev => 
      prev.map((question, idx) => 
        idx === questionIndex ? { ...question, questionText: text } : question
      )
    );
  };

  // Update option text
  const updateOptionText = (questionIndex, optionIndex, text) => {
    setQuestions(prev => 
      prev.map((question, qIdx) => {
        if (qIdx !== questionIndex) return question;
        
        const newOptions = [...question.options];
        newOptions[optionIndex] = text;
        
        return {
          ...question,
          options: newOptions
        };
      })
    );
  };

  // Set correct answer
  const setCorrectAnswer = (questionIndex, optionIndex) => {
    setQuestions(prev => 
      prev.map((question, idx) => 
        idx === questionIndex ? { ...question, correctAnswer: optionIndex } : question
      )
    );
  };

  // Handle form submission for second step
  const handleStepTwoSubmit = (e) => {
    e.preventDefault();

    // Validate content
    let hasError = false;
    
    // Check if reading passage has content (for reading comprehension)
    if (selectedCategory === 'Reading Comprehension' && contentType === 'reading') {
      if (passageContent.some(page => !page.text.trim())) {
        setFormError('All passage pages must have content');
        hasError = true;
      }
    }
    
    // Check if questions have text
    if (questions.some(q => !q.questionText.trim())) {
      setFormError('All questions must have text');
      hasError = true;
    }
    
    // Check if options have text
    if (questions.some(q => q.options.some(opt => !opt.trim()))) {
      setFormError('All options must have text');
      hasError = true;
    }
    
    if (hasError) return;

    // Create the activity based on selected type and category
    let newActivity = {
      id: Date.now(), // Temporary ID for mock data
      title,
      level: selectedLevel,
      category: selectedCategory,
      templateType: selectedType,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    
    // Prepare specific data structure based on category
    if (selectedCategory === "Reading Comprehension" && contentType === "reading") {
      // For reading comprehension with passage
      newActivity = {
        ...newActivity,
        pages: passageContent.length,
        questions: questions.length,
        sentenceText: passageContent.map(page => ({
          pageNumber: page.pageNumber,
          text: page.text,
          image: page.image ? URL.createObjectURL(page.image) : null
        })),
        sentenceQuestions: questions.map((q, idx) => ({
          questionNumber: idx + 1,
          questionText: q.questionText,
          sentenceCorrectAnswer: q.options[q.correctAnswer],
          sentenceOptionAnswers: q.options
        }))
      };
    } else {
      // For other categories
      newActivity = {
        ...newActivity,
        questionCount: questions.length,
        questions: questions.map((q, idx) => ({
          questionType: questionTypes[selectedCategory] ? questionTypes[selectedCategory][0] : '',
          questionText: q.questionText,
          choiceOptions: q.options.map((opt, optIdx) => ({
            optionText: opt,
            isCorrect: optIdx === q.correctAnswer
          })),
          order: idx + 1
        }))
      };
    }

    console.log('New activity:', newActivity);
    
    // Save to localStorage for testing
    const existingActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
    localStorage.setItem('mockActivities', JSON.stringify([...existingActivities, newActivity]));
    
    // Close the modal and notify parent
    onClose(newActivity);
  };

  // Go back to first step
  const goBack = () => {
    setStep(1);
  };

  // Define question types based on category
  const questionTypes = {
    "Alphabet Knowledge": ["patinig", "katinig"],
    "Phonological Awareness": ["malapantig"],
    "Decoding": ["word"],
    "Word Recognition": ["word"],
    "Reading Comprehension": ["sentence"]
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 1 ? 'Add New Activity' : 'Configure Activity Content'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Form steps indicator */}
        <div className="form-steps">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Information</div>
          </div>
          <div className="step-connector"></div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Content Configuration</div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStepOneSubmit}>
            <div className="modal-body">
              {formError && (
                <div className="form-error">
                  <FontAwesomeIcon icon={faInfoCircle} /> {formError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="activity-title">Activity Title</label>
                <input
                  type="text"
                  id="activity-title"
                  className="form-control"
                  placeholder="Enter a descriptive title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reading-level">Reading Level</label>
                <select
                  id="reading-level"
                  className="form-control"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  {readingLevels.map((level, index) => (
                    <option key={index} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="form-control"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="activity-type">Activity Type</label>
                <select
                  id="activity-type"
                  className="form-control"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {activityTypes
                    .filter(type => type.id !== 'practice') // Exclude practice type as per requirements
                    .map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  rows="3"
                  placeholder="Enter activity description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-next">Next</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStepTwoSubmit}>
            <div className="modal-body">
              {formError && (
                <div className="form-error">
                  <FontAwesomeIcon icon={faInfoCircle} /> {formError}
                </div>
              )}

              {/* Content Type Selection - only for Reading Comprehension */}
              {selectedCategory === "Reading Comprehension" && (
                <div className="content-type-selection">
                  <h3 className="section-title">Choose Content Type</h3>

                  <div className="content-type-options">
                    <div
                      className={`content-type-option ${contentType === 'reading' ? 'active' : ''}`}
                      onClick={() => handleContentTypeChange('reading')}
                    >
                      <div className="content-type-icon">
                        <FontAwesomeIcon icon={faFont} />
                      </div>
                      <div className="content-type-label">Reading Passage</div>
                      <div className="content-type-desc">Reading passages with questions</div>
                    </div>

                    <div
                      className={`content-type-option ${contentType === 'image' ? 'active' : ''}`}
                      onClick={() => handleContentTypeChange('image')}
                    >
                      <div className="content-type-icon">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                      <div className="content-type-label">Image Based</div>
                      <div className="content-type-desc">Activities with visual elements</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reading Passage Content - for Reading Comprehension */}
              {selectedCategory === "Reading Comprehension" && contentType === 'reading' && (
                <div className="passage-content">
                  <h3 className="section-title">Reading Passage</h3>
                  
                  {passageContent.map((page, pageIndex) => (
                    <div key={pageIndex} className="passage-page">
                      <div className="page-header">
                        <h4>Page {page.pageNumber}</h4>
                        {passageContent.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-page"
                            onClick={() => removePassagePage(pageIndex)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Page Text</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Enter the passage text for this page..."
                          value={page.text}
                          onChange={(e) => updatePassageText(pageIndex, e.target.value)}
                        ></textarea>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Page Image (Optional)</label>
                        <div className="image-upload-area">
                          {page.imagePreview ? (
                            <div className="image-preview-container">
                              <img 
                                src={page.imagePreview} 
                                alt="Page preview" 
                                className="preview-image" 
                              />
                              <button
                                type="button"
                                className="btn-remove-image"
                                onClick={() => {
                                  setPassageContent(prev => 
                                    prev.map((p, idx) => 
                                      idx === pageIndex 
                                        ? {...p, image: null, imagePreview: null} 
                                        : p
                                    )
                                  );
                                }}
                              >
                                <FontAwesomeIcon icon={faTimes} /> Remove Image
                              </button>
                            </div>
                          ) : (
                            <div className="upload-placeholder">
                              <input
                                type="file"
                                id={`page-image-${pageIndex}`}
                                className="file-input"
                                accept="image/*"
                                onChange={(e) => handlePassageImageUpload(pageIndex, e)}
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
                    className="btn-add-page"
                    onClick={addPassagePage}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Another Page
                  </button>
                </div>
              )}

              {/* Questions Section */}
              <div className="questions-section">
                <h3 className="section-title">Questions</h3>
                <p className="helper-text">
                  Create questions to test understanding of the content. Each question should have multiple choices.
                </p>

                {questions.map((question, qIndex) => (
                  <div key={question.id} className="question-item">
                    <div className="question-header">
                      <h4>Question {qIndex + 1}</h4>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-question"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Enter question text..."
                        value={question.questionText}
                        onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                      ></textarea>
                    </div>

                    <div className="options-container">
                      <label className="form-label">Answer Options</label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="option-row">
                          <input
                            type="radio"
                            id={`option-${qIndex}-${oIndex}`}
                            name={`correct-answer-${qIndex}`}
                            className="option-radio"
                            checked={question.correctAnswer === oIndex}
                            onChange={() => setCorrectAnswer(qIndex, oIndex)}
                          />
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-add-question"
                  onClick={addQuestion}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Another Question
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-back" onClick={goBack}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              <button type="submit" className="btn-save">
                <FontAwesomeIcon icon={faCheck} /> Create Activity
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddActivityModal;