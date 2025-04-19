import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faArrowLeft, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import './AddActivityModal.css';

const AddActivityModal = ({ onClose, readingLevels, categories, activityTypes }) => {
  // Form state
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(readingLevels[0] || '');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
  const [selectedType, setSelectedType] = useState(activityTypes[0]?.id || '');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('text'); // 'text', 'image', 'voice'
  const [formError, setFormError] = useState('');
  
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
      contentType
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
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-next">Next</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStepTwoSubmit}>
            <div className="modal-body">
              <div className="content-type-selection">
                <h3 className="section-title">Choose Content Type</h3>
                
                <div className="content-type-options">
                  <div 
                    className={`content-type-option ${contentType === 'text' ? 'active' : ''}`}
                    onClick={() => setContentType('text')}
                  >
                    <div className="content-type-icon">T</div>
                    <div className="content-type-label">Text Reading</div>
                    <div className="content-type-desc">Reading passages with questions</div>
                  </div>
                  
                  <div 
                    className={`content-type-option ${contentType === 'image' ? 'active' : ''}`}
                    onClick={() => setContentType('image')}
                  >
                    <div className="content-type-icon">I</div>
                    <div className="content-type-label">Image Based</div>
                    <div className="content-type-desc">Activities with visual elements</div>
                  </div>
                  
                  <div 
                    className={`content-type-option ${contentType === 'voice' ? 'active' : ''}`}
                    onClick={() => setContentType('voice')}
                  >
                    <div className="content-type-icon">V</div>
                    <div className="content-type-label">Voice to Text</div>
                    <div className="content-type-desc">Speech recognition activities</div>
                  </div>
                </div>
              </div>
              
              <div className="content-type-details">
                {contentType === 'text' && (
                  <div className="text-content-form">
                    <p className="helper-text">
                      Text-based activities include reading passages, syllable exercises, and comprehension questions.
                    </p>
                    <button type="button" className="btn-add-section">
                      <FontAwesomeIcon icon={faPlus} /> Add Reading Passage
                    </button>
                    {/* Additional text-specific fields would go here */}
                  </div>
                )}
                
                {contentType === 'image' && (
                  <div className="image-content-form">
                    <p className="helper-text">
                      Image-based activities include visual prompts, picture matching, and visual comprehension exercises.
                    </p>
                    <button type="button" className="btn-add-section">
                      <FontAwesomeIcon icon={faPlus} /> Add Image Item
                    </button>
                    {/* Additional image-specific fields would go here */}
                  </div>
                )}
                
                {contentType === 'voice' && (
                  <div className="voice-content-form">
                    <p className="helper-text">
                      Voice-to-text activities help assess pronunciation and oral reading skills through speech recognition.
                    </p>
                    <button type="button" className="btn-add-section">
                      <FontAwesomeIcon icon={faPlus} /> Add Voice Prompt
                    </button>
                    {/* Additional voice-specific fields would go here */}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-back" onClick={goBack}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              <button type="submit" className="btn-save">Save Activity</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddActivityModal;