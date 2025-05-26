// src/pages/Teachers/ManageCategories/ChoiceTemplateForm.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faInfoCircle, 
  faImage, 
  faVolumeUp,
  faUpload,
  faFont,
  faLanguage
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/TemplateForm.css";

// Choice types with improved descriptions
const CHOICE_TYPES = [
  { 
    value: "patinigBigLetter", 
    label: "Vowel (Patinig) - UPPERCASE", 
    description: "Capital vowel letters (A, E, I, O, U)",
    needsImage: true, 
    needsSound: false, 
    example: "A, E, I, O, U",
    icon: faFont
  },
  { 
    value: "patinigSmallLetter", 
    label: "Vowel (Patinig) - lowercase", 
    description: "Small vowel letters (a, e, i, o, u)",
    needsImage: true, 
    needsSound: false, 
    example: "a, e, i, o, u",
    icon: faFont
  },
  { 
    value: "patinigSound", 
    label: "Vowel (Patinig) - Sound", 
    description: "Vowel sounds represented with text",
    needsImage: true, 
    needsSound: true, 
    example: "/ah/, /eh/, /ee/",
    icon: faVolumeUp
  },
  { 
    value: "katinigBigLetter", 
    label: "Consonant (Katinig) - UPPERCASE", 
    description: "Capital consonant letters (B, K, D, etc.)",
    needsImage: true, 
    needsSound: false, 
    example: "B, K, D, L, M",
    icon: faFont
  },
  { 
    value: "katinigSmallLetter", 
    label: "Consonant (Katinig) - lowercase", 
    description: "Small consonant letters (b, k, d, etc.)",
    needsImage: true, 
    needsSound: false, 
    example: "b, k, d, l, m",
    icon: faFont
  },
  { 
    value: "katinigSound", 
    label: "Consonant (Katinig) - Sound", 
    description: "Consonant sounds represented with text",
    needsImage: true, 
    needsSound: true, 
    example: "/buh/, /kuh/, /duh/",
    icon: faVolumeUp
  },
  { 
    value: "malapatinigText", 
    label: "Syllable (Malapantig)", 
    description: "Syllable blocks for blending activities",
    needsImage: false, 
    needsSound: false, 
    example: "BA, BE, BI, BO, BU",
    icon: faLanguage
  },
  { 
    value: "wordText", 
    label: "Complete Word", 
    description: "Complete words with corresponding images",
    needsImage: true, 
    needsSound: false, 
    example: "aso, bola, bahay",
    icon: faLanguage
  },
  { 
    value: "wordSound", 
    label: "Word Sound", 
    description: "Word sounds with corresponding images",
    needsImage: true, 
    needsSound: true, 
    example: "/a-so/, /bo-la/",
    icon: faVolumeUp
  }
];

const ChoiceTemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    choiceType: "",
    choiceValue: "",
    choiceImage: "",
    choiceImageFile: null, // For file upload
    soundText: "",
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedChoiceTypeInfo, setSelectedChoiceTypeInfo] = useState(null);
  
  // Load template data if editing
  useEffect(() => {
    if (template) {
      setForm({
        choiceType: template.choiceType || "",
        choiceValue: template.choiceValue || "",
        choiceImage: template.choiceImage || "",
        choiceImageFile: null,
        soundText: template.soundText || ""
      });
      
      if (template.choiceImage) {
        setPreviewImage(template.choiceImage);
      }
      
      // Set the selected choice type info
      const typeInfo = CHOICE_TYPES.find(type => type.value === template.choiceType);
      setSelectedChoiceTypeInfo(typeInfo);
    }
  }, [template]);
  
  // Update selected choice type info when type changes
  useEffect(() => {
    if (form.choiceType) {
      const typeInfo = CHOICE_TYPES.find(type => type.value === form.choiceType);
      setSelectedChoiceTypeInfo(typeInfo);
    } else {
      setSelectedChoiceTypeInfo(null);
    }
  }, [form.choiceType]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field-specific errors
    setErrors({
      ...errors,
      [name]: undefined
    });
    
    if (name === 'choiceType') {
      // Reset some fields when changing choice type
      const typeInfo = CHOICE_TYPES.find(type => type.value === value);
      
      setForm({
        ...form,
        choiceType: value,
        // Reset value if switching between sound and non-sound types
        choiceValue: (typeInfo && typeInfo.needsSound && !form.soundText) ? "" : form.choiceValue,
        // Clear sound if switching to non-sound type
        soundText: (typeInfo && typeInfo.needsSound) ? form.soundText : ""
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clear image error if present
    setErrors({
      ...errors,
      choiceImage: undefined
    });
    
    // Preview the image locally
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
      setForm({
        ...form,
        choiceImageFile: file,
        choiceImage: reader.result // In a real app, you'd upload to a server
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!form.choiceType) newErrors.choiceType = "Choice type is required";
    
    // Check if value or sound is required based on the choice type
    if (selectedChoiceTypeInfo) {
      if (!selectedChoiceTypeInfo.needsSound && !form.choiceValue) {
        newErrors.choiceValue = "Choice value is required for this type";
      }
      
      if (selectedChoiceTypeInfo.needsSound && !form.soundText) {
        newErrors.soundText = "Sound text is required for this type";
      }
      
      if (selectedChoiceTypeInfo.needsImage && !previewImage) {
        newErrors.choiceImage = "Image is required for this type";
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Prepare data for submission
    const formData = {
      choiceType: form.choiceType,
      choiceValue: form.choiceValue || null, // Allow null for sound-only choices
      choiceImage: form.choiceImage || null,
      soundText: form.soundText || null
    };
    
    onSave(formData);
  };
  
  return (
    <div className="template-form-container">
      <h3>{template ? "Edit Choice Template" : "Create New Choice Template"}</h3>
      
      <form onSubmit={handleSubmit} className="template-form">
        <div className={`form-group ${errors.choiceType ? 'has-error' : ''}`}>
          <label htmlFor="choiceType">
            Choice Type:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Select what kind of answer choice this is. Different question types use different choice types.
              </span>
            </div>
          </label>
          <select
            id="choiceType"
            name="choiceType"
            value={form.choiceType}
            onChange={handleChange}
            required
          >
            <option value="">Select a choice type</option>
            {CHOICE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.choiceType && <div className="error-message">{errors.choiceType}</div>}
          
          {selectedChoiceTypeInfo && (
            <div className="form-help-text">
              <FontAwesomeIcon icon={selectedChoiceTypeInfo.icon} />
              <span>
                {selectedChoiceTypeInfo.description}. Examples: {selectedChoiceTypeInfo.example}
                {selectedChoiceTypeInfo.needsImage && " (requires an image)"}
                {selectedChoiceTypeInfo.needsSound && " (requires sound text)"}
              </span>
            </div>
          )}
        </div>
        
        {/* Display value field for non-sound types or wordSound */}
        {(!selectedChoiceTypeInfo || !selectedChoiceTypeInfo.needsSound || selectedChoiceTypeInfo.value === 'wordSound') && (
          <div className={`form-group ${errors.choiceValue ? 'has-error' : ''}`}>
            <label htmlFor="choiceValue">
              Choice Value:
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                <span className="tooltip-text">
                  Enter the text that represents this choice (e.g., a letter like "A" or a word like "aso").
                </span>
              </div>
            </label>
            <input
              type="text"
              id="choiceValue"
              name="choiceValue"
              value={form.choiceValue || ''}
              onChange={handleChange}
              placeholder={selectedChoiceTypeInfo ? 
                `e.g., ${selectedChoiceTypeInfo.example.split(', ')[0]}` : 
                "Enter choice value"
              }
              required={selectedChoiceTypeInfo && !selectedChoiceTypeInfo.needsSound}
            />
            {errors.choiceValue && <div className="error-message">{errors.choiceValue}</div>}
          </div>
        )}
        
        {/* Only show image field when needed */}
        {selectedChoiceTypeInfo && selectedChoiceTypeInfo.needsImage && (
          <div className={`form-group ${errors.choiceImage ? 'has-error' : ''}`}>
            <label htmlFor="choiceImage">
              Choice Image:
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                <span className="tooltip-text">
                  Upload an image that represents this choice. For letters, use a clear image of the letter. For words, use a picture of what the word represents.
                </span>
              </div>
            </label>
            
            <div className="file-input-container">
              <label className="file-input-label">
                <FontAwesomeIcon icon={faUpload} />
                {previewImage ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  id="choiceImageFile"
                  name="choiceImageFile"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="image-input-hidden"
                />
              </label>
            </div>
            
            {previewImage && (
              <div className="image-preview">
                <img src={previewImage} alt="Preview" />
              </div>
            )}
            
            {errors.choiceImage && <div className="error-message">{errors.choiceImage}</div>}
          </div>
        )}
        
        {/* Only show sound field when needed */}
        {selectedChoiceTypeInfo && selectedChoiceTypeInfo.needsSound && (
          <div className={`form-group ${errors.soundText ? 'has-error' : ''}`}>
            <label htmlFor="soundText">
              Sound Text:
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                <span className="tooltip-text">
                  Enter the text that represents the sound (e.g., "/ah/", "/ba/"). This is how the sound will be displayed.
                </span>
              </div>
            </label>
            <input
              type="text"
              id="soundText"
              name="soundText"
              value={form.soundText || ''}
              onChange={handleChange}
              placeholder={selectedChoiceTypeInfo.value.includes('patinig') ? 
                "e.g., /ah/, /eh/" : 
                selectedChoiceTypeInfo.value.includes('katinig') ?
                "e.g., /buh/, /kuh/" :
                "e.g., /ba-ta/, /a-so/"
              }
              required={selectedChoiceTypeInfo.needsSound}
            />
            {errors.soundText && <div className="error-message">{errors.soundText}</div>}
            
            <div className="form-help-text">
              <FontAwesomeIcon icon={faVolumeUp} />
              <span>
                Use slashes to indicate sounds, like "/ah/" for the sound of "a". For word sounds, you can use syllable notation like "/ba-ta/".
              </span>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
            disabled={
              !form.choiceType || 
              (selectedChoiceTypeInfo && !selectedChoiceTypeInfo.needsSound && !form.choiceValue) ||
              (selectedChoiceTypeInfo && selectedChoiceTypeInfo.needsSound && !form.soundText) ||
              (selectedChoiceTypeInfo && selectedChoiceTypeInfo.needsImage && !previewImage)
            }
          >
            {template ? "Update Choice" : "Create Choice"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChoiceTemplateForm;