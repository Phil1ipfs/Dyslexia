// Updated AddActivityModal with multi-level support
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

const AddActivityModal = ({ onClose, readingLevels, categories, activityTypes }) => {
  // Form state
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(readingLevels[0] || '');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
  const [selectedType, setSelectedType] = useState(activityTypes[0]?.id || '');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('reading'); // 'reading', 'image', 'voice'
  const [formError, setFormError] = useState('');
  const [levels, setLevels] = useState([
    {
      id: 1,
      levelName: 'Level 1',
      contentType: 'reading',
      content: [
        { id: 1, text: '', syllables: '', translation: '', image: null, imagePreview: null }
      ],
      questions: [
        { 
          id: 1, 
          questionText: '', 
          options: ['', '', '', ''], 
          correctAnswer: 0,
          hint: '' 
        }
      ]
    }
  ]);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // Reset form error when inputs change
  useEffect(() => {
    if (formError) setFormError('');
  }, [title, selectedLevel, selectedCategory, selectedType]);
  
  // Add a new level
  const addNewLevel = () => {
    const newLevelId = Math.max(...levels.map(l => l.id), 0) + 1;
    setLevels(prevLevels => [
      ...prevLevels,
      {
        id: newLevelId,
        levelName: `Level ${newLevelId}`,
        contentType: 'reading',
        content: [
          { id: Date.now(), text: '', syllables: '', translation: '', image: null, imagePreview: null }
        ],
        questions: [
          { 
            id: Date.now(), 
            questionText: '', 
            options: ['', '', '', ''], 
            correctAnswer: 0,
            hint: '' 
          }
        ]
      }
    ]);
  };
  
  // Remove a level
  const removeLevel = (levelId) => {
    if (levels.length <= 1) return;
    setLevels(prevLevels => prevLevels.filter(level => level.id !== levelId));
    
    // If we're removing the current level, switch to the first one
    if (currentLevel === levelId) {
      const remainingLevels = levels.filter(level => level.id !== levelId);
      if (remainingLevels.length > 0) {
        setCurrentLevel(remainingLevels[0].id);
      }
    }
  };
  
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
    
    // Update the current level's content type
    setLevels(prevLevels => 
      prevLevels.map(level => 
        level.id === currentLevel 
          ? {...level, contentType: type} 
          : level
      )
    );
  };
  
  // Handle form submission for second step
  const handleStepTwoSubmit = (e) => {
    e.preventDefault();
    
    // Here you would submit the complete form data
    console.log({
      title,
      antas: selectedLevel,
      category: selectedCategory,
      type: selectedType,
      description,
      levels
    });
    
    // Close the modal
    onClose();
  };
  
  // Go back to first step
  const goBack = () => {
    setStep(1);
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
                  {activityTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
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
              
              <div className="level-management">
                <h3 className="section-title">
                  <FontAwesomeIcon icon={faLayerGroup} /> Activity Levels
                </h3>
                <p className="helper-text">
                  You can create multiple levels for this activity. Each level can have different content types and questions.
                </p>
                
                <div className="level-list">
                  {levels.map(level => (
                    <div key={level.id} className="level-item">
                      <span className="level-name">{level.levelName}</span>
                      {levels.length > 1 && (
                        <button 
                          type="button"
                          className="remove-level-btn"
                          onClick={() => removeLevel(level.id)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    className="btn-add-level"
                    onClick={addNewLevel}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add New Level
                  </button>
                </div>
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
              <div className="level-navigation">
                <h3 className="section-title">Configure Level:</h3>
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
                    <div className="content-type-label">Text Reading</div>
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
                  
                  <div 
                    className={`content-type-option ${contentType === 'voice' ? 'active' : ''}`}
                    onClick={() => handleContentTypeChange('voice')}
                  >
                    <div className="content-type-icon">
                      <FontAwesomeIcon icon={faVolumeUp} />
                    </div>
                    <div className="content-type-label">Voice to Text</div>
                    <div className="content-type-desc">Speech recognition activities</div>
                  </div>
                </div>
              </div>
              
              <div className="content-type-details">
                {contentType === 'reading' && (
                  <div className="text-content-form">
                    <h3 className="section-title">Reading Passage Content</h3>
                    <p className="helper-text">
                      Text-based activities include reading passages, syllable exercises, and comprehension questions.
                    </p>
                    <div className="form-group">
                      <label className="form-label">Passage Text</label>
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        placeholder="Enter reading passage text..."
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Syllable Breakdown</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ex: A-so ni Li-za (hyphenated syllables)"
                      />
                    </div>
                    <button type="button" className="btn-add-section">
                      <FontAwesomeIcon icon={faPlus} /> Add Reading Passage
                    </button>
                  </div>
                )}
                
                {contentType === 'image' && (
                  <div className="image-content-form">
                    <h3 className="section-title">Image Based Content</h3>
                    <p className="helper-text">
                      Image-based activities include visual prompts, picture matching, and visual comprehension exercises.
                    </p>
                    <div className="form-group">
                      <label className="form-label">Upload Image</label>
                      <div className="upload-placeholder">
                        <input type="file" id="image-upload" className="file-input" accept="image/*" />
                        <label htmlFor="image-upload" className="file-label">
                          <FontAwesomeIcon icon={faImage} />
                          <span>Choose Image</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Image Caption</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter caption or description of the image..."
                      />
                    </div>
                    <button type="button" className="btn-add-section">
                      <FontAwesomeIcon icon={faPlus} /> Add Image Item
                    </button>
                  </div>
                )}
                
                {contentType === 'voice' && (
                  <div className="voice-content-form">
                    <h3 className="section-title">Voice to Text Content</h3>
                    <p className="helper-text">
                      Voice-to-text activities help assess pronunciation and oral reading skills through speech recognition.
                    </p>
                    <div className="form-group">
                      <label className="form-label">Text to Read</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        placeholder="Enter text for students to read aloud..."
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sample Audio (Optional)</label>
                      <div className="upload-placeholder">
                        <input type="file" id="audio-upload" className="file-input" accept="audio/*" />
                        <label htmlFor="audio-upload" className="file-label">
                          <FontAwesomeIcon icon={faVolumeUp} />
                          <span>Upload Audio</span>
                        </label>
                      </div>
                    </div>
                    <button type="button" className="btn-add-section">
                      <FontAwesomeIcon icon={faPlus} /> Add Voice Prompt
                    </button>
                  </div>
                )}
              </div>
              
              {/* Questions Section */}
              <div className="questions-section">
                <h3 className="section-title">Questions</h3>
                <p className="helper-text">
                  Create questions to test understanding of the content. Each question should have multiple choices.
                </p>
                
                <div className="question-item">
                  <div className="form-group">
                    <label className="form-label">Question Text</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Enter question text..."
                    ></textarea>
                  </div>
                  
                  <div className="options-container">
                    <label className="form-label">Answer Options</label>
                    {[0, 1, 2, 3].map(index => (
                      <div key={index} className="option-row">
                        <input 
                          type="radio" 
                          id={`option-${index}`} 
                          name="correct-answer" 
                          className="option-radio" 
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder={`Option ${index + 1}`} 
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Hint/Explanation</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Provide a hint or explanation that will be shown if the student answers incorrectly..."
                    ></textarea>
                  </div>
                </div>
                
                <button type="button" className="btn-add-section">
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