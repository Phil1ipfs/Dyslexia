// src/pages/Teachers/ManageCategories/ChoiceTemplateForm.jsx
import React, { useState, useEffect } from "react";

import "../../../css/Teachers/ManageCategories/TemplateForm.css";



const CHOICE_TYPES = [
  "patinigBigLetter",
  "patinigSmallLetter",
  "patinigSound",
  "katinigBigLetter",
  "katinigSmallLetter",
  "katinigSound",
  "malapatinigText",
  "wordText",
  "wordSound"
];

const ChoiceTemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    choiceType: "",
    choiceValue: "",
    choiceImage: "",
    soundText: "",
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  
  useEffect(() => {
    if (template) {
      setForm({
        choiceType: template.choiceType || "",
        choiceValue: template.choiceValue || "",
        choiceImage: template.choiceImage || "",
        soundText: template.soundText || ""
      });
      
      if (template.choiceImage) {
        setPreviewImage(template.choiceImage);
      }
    }
  }, [template]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // For now, preview the image locally
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
      setForm({
        ...form,
        choiceImage: reader.result // In a real app, you'd upload to a server
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Extract only fields needed based on choice type
    const formData = {
      choiceType: form.choiceType,
      choiceValue: form.choiceValue,
      choiceImage: form.choiceImage,
      soundText: form.soundText
    };
    
    // For sound-only choices, choiceValue can be null
    if (form.choiceType.includes('Sound') && !form.choiceValue) {
      formData.choiceValue = null;
    }
    
    onSave(formData);
  };
  
  const needsImage = !form.choiceType.includes('Sound');
  const needsSound = form.choiceType.includes('Sound');
  const needsValue = !form.choiceType.includes('Sound') || form.choiceType === 'wordSound';
  
  return (
    <div className="template-form-container">
      <h3>{template ? "Edit Choice Template" : "Create New Choice Template"}</h3>
      
      <form onSubmit={handleSubmit} className="template-form">
        <div className="form-group">
          <label htmlFor="choiceType">Choice Type:</label>
          <select
            id="choiceType"
            name="choiceType"
            value={form.choiceType}
            onChange={handleChange}
            required
          >
            <option value="">Select a choice type</option>
            {CHOICE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        {needsValue && (
          <div className="form-group">
            <label htmlFor="choiceValue">Choice Value:</label>
            <input
              type="text"
              id="choiceValue"
              name="choiceValue"
              value={form.choiceValue || ''}
              onChange={handleChange}
              placeholder="e.g. A, a, BA, aso, etc."
              required={needsValue}
            />
          </div>
        )}
        
        {needsImage && (
          <div className="form-group">
            <label htmlFor="choiceImage">Choice Image:</label>
            <input
              type="file"
              id="choiceImage"
              name="choiceImageFile"
              onChange={handleImageUpload}
              accept="image/*"
            />
            {previewImage && (
              <div className="image-preview">
                <img src={previewImage} alt="Preview" />
              </div>
            )}
            <input
              type="text"
              name="choiceImage"
              value={form.choiceImage || ''}
              onChange={handleChange}
              placeholder="Or enter an image URL"
              className="image-url-input"
            />
          </div>
        )}
        
        {needsSound && (
          <div className="form-group">
            <label htmlFor="soundText">Sound Text:</label>
            <input
              type="text"
              id="soundText"
              name="soundText"
              value={form.soundText || ''}
              onChange={handleChange}
              placeholder="e.g. /ah/, /ba/, /i-bon/"
              required={needsSound}
            />
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
              (needsValue && !form.choiceValue) ||
              (needsSound && !form.soundText)
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