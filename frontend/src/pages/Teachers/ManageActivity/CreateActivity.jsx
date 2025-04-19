import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  faHeadphones
} from '@fortawesome/free-solid-svg-icons';
import '../../css/Teachers/CreateActivity.css';

// Import mock data
import { 
  readingLevels, 
  categories, 
  activityStructures 
} from '../../data/Teachers/activityData';

const CreateActivity = () => {
  const navigate = useNavigate();

  // Basic activity information
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    level: readingLevels[1] || '', // Skip "All Levels"
    category: categories[1] || '',  // Skip "All Categories"
    type: 'template',
    contentType: 'reading',
    description: ''
  });

  // Content-specific state
  const [readingPassages, setReadingPassages] = useState([
    { id: 1, text: '', syllables: '', translation: '', image: null, imagePreview: null, audioFile: null }
  ]);
  const [imageItems, setImageItems] = useState([
    { id: 1, caption: '', image: null, imagePreview: null }
  ]);
  const [voiceItems, setVoiceItems] = useState([
    { id: 1, text: '', correctPronunciation: '', audioSample: null, image: null, imagePreview: null }
  ]);
  const [questions, setQuestions] = useState([
    { 
      id: 1, 
      questionText: '', 
      options: ['', '', '', ''], 
      correctAnswer: 0,
      hint: '' 
    }
  ]);

  // Validation state
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

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

  // Handle reading passage changes
  const handlePassageChange = (index, field, value) => {
    const updatedPassages = [...readingPassages];
    updatedPassages[index][field] = value;
    setReadingPassages(updatedPassages);
  };

  // Handle image upload for reading passage
  const handlePassageImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedPassages = [...readingPassages];
        updatedPassages[index].image = file;
        updatedPassages[index].imagePreview = reader.result;
        setReadingPassages(updatedPassages);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image items changes
  const handleImageItemChange = (index, field, value) => {
    const updatedItems = [...imageItems];
    updatedItems[index][field] = value;
    setImageItems(updatedItems);
  };

  // Handle image upload for image items
  const handleImageItemUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedItems = [...imageItems];
        updatedItems[index].image = file;
        updatedItems[index].imagePreview = reader.result;
        setImageItems(updatedItems);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle voice items changes
  const handleVoiceItemChange = (index, field, value) => {
    const updatedItems = [...voiceItems];
    updatedItems[index][field] = value;
    setVoiceItems(updatedItems);
  };

  // Handle audio upload for voice items
  const handleVoiceAudioUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedItems = [...voiceItems];
      updatedItems[index].audioSample = file;
      setVoiceItems(updatedItems);
    }
  };

  // Handle voice item image upload
  const handleVoiceImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedItems = [...voiceItems];
        updatedItems[index].image = file;
        updatedItems[index].imagePreview = reader.result;
        setVoiceItems(updatedItems);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle question changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  // Handle option changes
  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  // Handle correct answer selection
  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].correctAnswer = optionIndex;
    setQuestions(updatedQuestions);
  };

  // Add new reading passage
  const addReadingPassage = () => {
    const newId = readingPassages.length > 0 
      ? Math.max(...readingPassages.map(item => item.id)) + 1 
      : 1;
    
    setReadingPassages([
      ...readingPassages,
      { id: newId, text: '', syllables: '', translation: '', image: null, imagePreview: null, audioFile: null }
    ]);
  };

  // Remove reading passage
  const removeReadingPassage = (id) => {
    if (readingPassages.length <= 1) return;
    setReadingPassages(readingPassages.filter(passage => passage.id !== id));
  };

  // Add new image item
  const addImageItem = () => {
    const newId = imageItems.length > 0 
      ? Math.max(...imageItems.map(item => item.id)) + 1 
      : 1;
    
    setImageItems([
      ...imageItems,
      { id: newId, caption: '', image: null, imagePreview: null }
    ]);
  };

  // Remove image item
  const removeImageItem = (id) => {
    if (imageItems.length <= 1) return;
    setImageItems(imageItems.filter(item => item.id !== id));
  };

  // Add new voice item
  const addVoiceItem = () => {
    const newId = voiceItems.length > 0 
      ? Math.max(...voiceItems.map(item => item.id)) + 1 
      : 1;
    
    setVoiceItems([
      ...voiceItems,
      { id: newId, text: '', correctPronunciation: '', audioSample: null, image: null, imagePreview: null }
    ]);
  };

  // Remove voice item
  const removeVoiceItem = (id) => {
    if (voiceItems.length <= 1) return;
    setVoiceItems(voiceItems.filter(item => item.id !== id));
  };

  // Add new question
  const addQuestion = () => {
    const newId = questions.length > 0 
      ? Math.max(...questions.map(q => q.id)) + 1 
      : 1;
    
    setQuestions([
      ...questions,
      { 
        id: newId, 
        questionText: '', 
        options: ['', '', '', ''], 
        correctAnswer: 0,
        hint: '' 
      }
    ]);
  };

  // Remove question
  const removeQuestion = (id) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Validate the form
  const validateForm = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!basicInfo.title.trim()) {
        newErrors.title = 'Title is required';
      }
      
      if (!basicInfo.level) {
        newErrors.level = 'Reading level is required';
      }
      
      if (!basicInfo.category) {
        newErrors.category = 'Category is required';
      }
      
      if (!basicInfo.type) {
        newErrors.type = 'Activity type is required';
      }
      
      if (!basicInfo.contentType) {
        newErrors.contentType = 'Content type is required';
      }
    } else if (step === 2) {
      // Validate content based on type
      if (basicInfo.contentType === 'reading') {
        if (readingPassages.some(passage => !passage.text.trim())) {
          newErrors.passages = 'All passages must have text';
        }
      } else if (basicInfo.contentType === 'image') {
        if (imageItems.some(item => !item.image)) {
          newErrors.images = 'All items must have an image';
        }
      } else if (basicInfo.contentType === 'voice') {
        if (voiceItems.some(item => !item.text.trim())) {
          newErrors.voice = 'All voice items must have text';
        }
      }
      
      // Validate questions
      if (questions.some(q => !q.questionText.trim())) {
        newErrors.questions = 'All questions must have text';
      }
      
      if (questions.some(q => q.options.some(opt => !opt.trim()))) {
        newErrors.options = 'All options must have text';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm(currentStep)) {
      if (currentStep === 1) {
        setCurrentStep(2);
        window.scrollTo(0, 0);
      } else {
        // Submit the form data
        console.log('Form submitted:', {
          basicInfo,
          content: basicInfo.contentType === 'reading' ? readingPassages :
                  basicInfo.contentType === 'image' ? imageItems :
                  voiceItems,
          questions
        });
        
        // Redirect to manage activities
        navigate('/teacher/manage-activities');
      }
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    } else {
      navigate('/teacher/manage-activities');
    }
  };

  return (
    <div className="create-activity-container">
      <div className="create-activity-header">
        <h1 className="page-title">{currentStep === 1 ? 'Create New Activity' : 'Configure Content'}</h1>
        <p className="page-subtitle">
          {currentStep === 1 
            ? 'Provide basic information about the activity' 
            : 'Add content and questions for the activity'}
        </p>
      </div>

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
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            <div className="basic-info-section">
              <div className="form-group">
                <label htmlFor="title">Activity Title <span className="required">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={basicInfo.title}
                  onChange={handleBasicInfoChange}
                  placeholder="Enter a descriptive title..."
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <div className="error-message">{errors.title}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="level">Reading Level (Antas) <span className="required">*</span></label>
                  <div className="custom-select">
                    <select
                      id="level"
                      name="level"
                      value={basicInfo.level}
                      onChange={handleBasicInfoChange}
                      className={errors.level ? 'error' : ''}
                    >
                      <option value="">Select a level</option>
                      {readingLevels.slice(1).map((level, index) => (
                        <option key={index} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  {errors.level && <div className="error-message">{errors.level}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category <span className="required">*</span></label>
                  <div className="custom-select">
                    <select
                      id="category"
                      name="category"
                      value={basicInfo.category}
                      onChange={handleBasicInfoChange}
                      className={errors.category ? 'error' : ''}
                    >
                      <option value="">Select a category</option>
                      {categories.slice(1).map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  {errors.category && <div className="error-message">{errors.category}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Activity Type <span className="required">*</span></label>
                  <div className="custom-select">
                    <select
                      id="type"
                      name="type"
                      value={basicInfo.type}
                      onChange={handleBasicInfoChange}
                      className={errors.type ? 'error' : ''}
                    >
                      <option value="template">Activity Template</option>
                      <option value="assessment">Pre-Assessment</option>
                      <option value="practice">Practice Module</option>
                    </select>
                  </div>
                  {errors.type && <div className="error-message">{errors.type}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="contentType">Content Type <span className="required">*</span></label>
                  <div className="custom-select">
                    <select
                      id="contentType"
                      name="contentType"
                      value={basicInfo.contentType}
                      onChange={handleBasicInfoChange}
                      className={errors.contentType ? 'error' : ''}
                    >
                      <option value="reading">Reading Passages</option>
                      <option value="image">Image Based</option>
                      <option value="voice">Voice to Text</option>
                    </select>
                  </div>
                  {errors.contentType && <div className="error-message">{errors.contentType}</div>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={basicInfo.description}
                  onChange={handleBasicInfoChange}
                  rows="4"
                  placeholder="Describe the activity and its learning objectives..."
                ></textarea>
              </div>

              <div className="content-type-preview">
                <h3>Selected Content Type: 
                  {basicInfo.contentType === 'reading' && <span> Reading Passages</span>}
                  {basicInfo.contentType === 'image' && <span> Image Based</span>}
                  {basicInfo.contentType === 'voice' && <span> Voice to Text</span>}
                </h3>
                <div className="content-type-description">
                  {basicInfo.contentType === 'reading' && (
                    <div className="type-info">
                      <FontAwesomeIcon icon={faFont} className="type-icon reading" />
                      <div>
                        <p><strong>Reading Passages:</strong> Create text-based activities with syllable breakdowns and supporting visuals.</p>
                        <p>Ideal for activities focused on reading comprehension, syllable recognition, and text-based exercises.</p>
                      </div>
                    </div>
                  )}
                  {basicInfo.contentType === 'image' && (
                    <div className="type-info">
                      <FontAwesomeIcon icon={faImage} className="type-icon image" />
                      <div>
                        <p><strong>Image Based:</strong> Create visually-driven activities with supporting captions and questions.</p>
                        <p>Perfect for visual recognition, vocabulary building, and image-based assessment activities.</p>
                      </div>
                    </div>
                  )}
                  {basicInfo.contentType === 'voice' && (
                    <div className="type-info">
                      <FontAwesomeIcon icon={faVolumeUp} className="type-icon voice" />
                      <div>
                        <p><strong>Voice to Text:</strong> Create pronunciation and speaking activities with audio samples.</p>
                        <p>Ideal for oral reading assessments, pronunciation practice, and speech recognition exercises.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="content-config-section">
              <div className="section-title-bar">
                <h2 className="section-title">
                  {basicInfo.contentType === 'reading' && 'Reading Passages'}
                  {basicInfo.contentType === 'image' && 'Image Content'}
                  {basicInfo.contentType === 'voice' && 'Voice to Text Content'}
                </h2>
                <div className="info-tooltip">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <div className="tooltip-content">
                    {basicInfo.contentType === 'reading' && 
                      'Add reading passages with text, syllable breakdowns, and supporting images'}
                    {basicInfo.contentType === 'image' && 
                      'Add images with captions for visual recognition activities'}
                    {basicInfo.contentType === 'voice' && 
                      'Add text for students to read aloud with pronunciation guides'}
                  </div>
                </div>
              </div>

              {/* Reading Passages Content */}
              {basicInfo.contentType === 'reading' && (
                <div className="reading-passages">
                  {errors.passages && <div className="error-message section-error">{errors.passages}</div>}
                  
                  {readingPassages.map((passage, index) => (
                    <div className="passage-item" key={passage.id}>
                      <div className="item-header">
                        <h3>Passage {index + 1}</h3>
                        <button 
                          type="button" 
                          className="remove-item-btn"
                          onClick={() => removeReadingPassage(passage.id)}
                          disabled={readingPassages.length <= 1}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group passage-text">
                          <label>Passage Text <span className="required">*</span></label>
                          <textarea
                            value={passage.text}
                            onChange={(e) => handlePassageChange(index, 'text', e.target.value)}
                            placeholder="Enter the reading passage text..."
                            rows="3"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group passage-syllables">
                          <label>Syllable Breakdown</label>
                          <input
                            type="text"
                            value={passage.syllables}
                            onChange={(e) => handlePassageChange(index, 'syllables', e.target.value)}
                            placeholder="Ex: A-so ni Li-za (hyphenated syllables)"
                          />
                        </div>
                        
                        <div className="form-group passage-translation">
                          <label>Translation/Notes (optional)</label>
                          <input
                            type="text"
                            value={passage.translation}
                            onChange={(e) => handlePassageChange(index, 'translation', e.target.value)}
                            placeholder="Translation or additional notes"
                          />
                        </div>
                      </div>
                      
                      <div className="form-row media-row">
                        <div className="form-group passage-image">
                          <label>Supporting Image</label>
                          <div className="image-upload-container">
                            {passage.imagePreview ? (
                              <div className="image-preview">
                                <img src={passage.imagePreview} alt="Preview" />
                                <button 
                                  type="button" 
                                  className="remove-image-btn"
                                  onClick={() => handlePassageChange(index, 'imagePreview', null)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            ) : (
                              <div className="upload-placeholder">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`passage-image-${passage.id}`}
                                  onChange={(e) => handlePassageImageUpload(index, e)}
                                  className="file-input"
                                />
                                <label htmlFor={`passage-image-${passage.id}`} className="file-label">
                                  <FontAwesomeIcon icon={faImage} />
                                  <span>Choose Image</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="form-group passage-audio">
                          <label>Audio Recording (optional)</label>
                          <div className="audio-upload-container">
                            <input
                              type="file"
                              accept="audio/*"
                              id={`passage-audio-${passage.id}`}
                              className="file-input"
                            />
                            <label htmlFor={`passage-audio-${passage.id}`} className="file-label">
                              <FontAwesomeIcon icon={faHeadphones} />
                              <span>Upload Audio</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    className="add-item-btn"
                    onClick={addReadingPassage}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Another Passage
                  </button>
                </div>
              )}

              {/* Image Based Content */}
              {basicInfo.contentType === 'image' && (
                <div className="image-items">
                  {errors.images && <div className="error-message section-error">{errors.images}</div>}
                  
                  {imageItems.map((item, index) => (
                    <div className="image-item" key={item.id}>
                      <div className="item-header">
                        <h3>Image {index + 1}</h3>
                        <button 
                          type="button" 
                          className="remove-item-btn"
                          onClick={() => removeImageItem(item.id)}
                          disabled={imageItems.length <= 1}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </div>
                      
                      <div className="form-row image-content-row">
                        <div className="form-group image-upload">
                          <label>Image <span className="required">*</span></label>
                          <div className="image-upload-container large">
                            {item.imagePreview ? (
                              <div className="image-preview">
                                <img src={item.imagePreview} alt="Preview" />
                                <button 
                                  type="button" 
                                  className="remove-image-btn"
                                  onClick={() => handleImageItemChange(index, 'imagePreview', null)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            ) : (
                              <div className="upload-placeholder">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`image-item-${item.id}`}
                                  onChange={(e) => handleImageItemUpload(index, e)}
                                  className="file-input"
                                />
                                <label htmlFor={`image-item-${item.id}`} className="file-label">
                                  <FontAwesomeIcon icon={faImage} />
                                  <span>Choose Image</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="form-group image-caption">
                          <label>Caption/Description</label>
                          <textarea
                            value={item.caption}
                            onChange={(e) => handleImageItemChange(index, 'caption', e.target.value)}
                            placeholder="Describe the image or add a caption..."
                            rows="4"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    className="add-item-btn"
                    onClick={addImageItem}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Another Image
                  </button>
                </div>
              )}

              {/* Voice to Text Content */}
              {basicInfo.contentType === 'voice' && (
                <div className="voice-items">
                  {errors.voice && <div className="error-message section-error">{errors.voice}</div>}
                  
                  {voiceItems.map((item, index) => (
                    <div className="voice-item" key={item.id}>
                      <div className="item-header">
                        <h3>Voice Prompt {index + 1}</h3>
                        <button 
                          type="button" 
                          className="remove-item-btn"
                          onClick={() => removeVoiceItem(item.id)}
                          disabled={voiceItems.length <= 1}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group voice-text">
                          <label>Text to Read <span className="required">*</span></label>
                          <textarea
                            value={item.text}
                            onChange={(e) => handleVoiceItemChange(index, 'text', e.target.value)}
                            placeholder="Enter the text that students will read aloud..."
                            rows="3"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group voice-pronunciation">
                          <label>Correct Pronunciation Notes</label>
                          <textarea
                            value={item.correctPronunciation}
                            onChange={(e) => handleVoiceItemChange(index, 'correctPronunciation', e.target.value)}
                            placeholder="Notes on proper pronunciation, emphasis, or common mistakes..."
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="form-row media-row">
                        <div className="form-group voice-audio">
                          <label>Sample Audio Recording</label>
                          <div className="audio-upload-container">
                            {item.audioSample ? (
                              <div className="audio-preview">
                                <p className="audio-file-name">{item.audioSample.name}</p>
                                <button 
                                  type="button" 
                                  className="remove-audio-btn"
                                  onClick={() => handleVoiceItemChange(index, 'audioSample', null)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  id={`voice-audio-${item.id}`}
                                  onChange={(e) => handleVoiceAudioUpload(index, e)}
                                  className="file-input"
                                />
                                <label htmlFor={`voice-audio-${item.id}`} className="file-label">
                                  <FontAwesomeIcon icon={faHeadphones} />
                                  <span>Upload Audio</span>
                                </label>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="form-group voice-image">
                          <label>Supporting Image (optional)</label>
                          <div className="image-upload-container">
                            {item.imagePreview ? (
                              <div className="image-preview">
                                <img src={item.imagePreview} alt="Preview" />
                                <button 
                                  type="button" 
                                  className="remove-image-btn"
                                  onClick={() => handleVoiceItemChange(index, 'imagePreview', null)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            ) : (
                              <div className="upload-placeholder">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`voice-image-${item.id}`}
                                  onChange={(e) => handleVoiceImageUpload(index, e)}
                                  className="file-input"
                                />
                                <label htmlFor={`voice-image-${item.id}`} className="file-label">
                                  <FontAwesomeIcon icon={faImage} />
                                  <span>Choose Image</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    className="add-item-btn"
                    onClick={addVoiceItem}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Another Voice Prompt
                  </button>
                </div>
              )}

              {/* Questions Section */}
              <div className="section-divider"></div>
              
              <div className="section-title-bar">
                <h2 className="section-title">Questions</h2>
                <div className="info-tooltip">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <div className="tooltip-content">
                    Add questions to test understanding of the content. Each question should have multiple-choice options.
                  </div>
                </div>
              </div>

              <div className="questions-section">
                {errors.questions && <div className="error-message section-error">{errors.questions}</div>}
                {errors.options && <div className="error-message section-error">{errors.options}</div>}
                
                {questions.map((question, qIndex) => (
                  <div className="question-item" key={question.id}>
                    <div className="item-header">
                      <h3>Question {qIndex + 1}</h3>
                      <button 
                        type="button" 
                        className="remove-item-btn"
                        onClick={() => removeQuestion(question.id)}
                        disabled={questions.length <= 1}
                      >
                        <FontAwesomeIcon icon={faTrash} /> Remove
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label>Question Text <span className="required">*</span></label>
                      <textarea
                        value={question.questionText}
                        onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                        placeholder="Enter the question..."
                        rows="2"
                      ></textarea>
                    </div>
                    
                    <div className="options-container">
                      <label>Answer Options <span className="required">*</span></label>
                      
                      {question.options.map((option, optIndex) => (
                        <div className="option-row" key={optIndex}>
                          <div className="option-input">
                            <input
                              type="radio"
                              id={`q${question.id}_opt${optIndex}`}
                              name={`q${question.id}_correct`}
                              checked={question.correctAnswer === optIndex}
                              onChange={() => handleCorrectAnswerChange(qIndex, optIndex)}
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                          </div>
                          {question.correctAnswer === optIndex && (
                            <div className="correct-answer-label">Correct Answer</div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="form-group">
                      <label>
                        Hint/Explanation
                        <div className="tooltip">
                          <FontAwesomeIcon icon={faQuestionCircle} />
                          <span className="tooltiptext">Provide a helpful hint or explanation that will be shown if the student answers incorrectly</span>
                        </div>
                      </label>
                      <textarea
                        value={question.hint}
                        onChange={(e) => handleQuestionChange(qIndex, 'hint', e.target.value)}
                        placeholder="Hint or explanation to help students understand the correct answer..."
                        rows="2"
                      ></textarea>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  className="add-item-btn"
                  onClick={addQuestion}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Another Question
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="back-btn"
              onClick={handleBack}
            >
              <FontAwesomeIcon icon={faArrowLeft} /> {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            <button 
              type="submit" 
              className="next-btn"
            >
              {currentStep === 1 ? 'Next: Configure Content' : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateActivity;