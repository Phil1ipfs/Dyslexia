// src/pages/Teachers/ManageCategories/QuestionTemplateForm.jsx
import React, { useState, useEffect } from "react";

import "../../../css/Teachers/ManageCategories/TemplateForm.css";


// Categories and types
const CATEGORIES = [
  "Alphabet Knowledge",
  "Phonological Awareness",
  "Decoding",
  "Word Recognition",
  "Reading Comprehension"
];

const QUESTION_TYPES = {
  "Alphabet Knowledge": ["patinig", "katinig"],
  "Phonological Awareness": ["malapantig"],
  "Decoding": ["word"],
  "Word Recognition": ["word"],
  "Reading Comprehension": ["sentence"]
};

const CHOICE_TYPES = {
  "patinig": ["patinigBigLetter", "patinigSmallLetter", "patinigSound"],
  "katinig": ["katinigBigLetter", "katinigSmallLetter", "katinigSound"],
  "malapantig": ["malapatinigText", "wordText"],
  "word": ["wordText", "wordSound"],
  "sentence": []
};

const QuestionTemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    category: "",
    questionType: "",
    templateText: "",
    applicableChoiceTypes: [],
    correctChoiceType: ""
  });
  
  const [availableQuestionTypes, setAvailableQuestionTypes] = useState([]);
  const [availableChoiceTypes, setAvailableChoiceTypes] = useState([]);
  
  useEffect(() => {
    if (template) {
      setForm({
        category: template.category || "",
        questionType: template.questionType || "",
        templateText: template.templateText || "",
        applicableChoiceTypes: template.applicableChoiceTypes || [],
        correctChoiceType: template.correctChoiceType || ""
      });
    }
  }, [template]);
  
  useEffect(() => {
    if (form.category) {
      setAvailableQuestionTypes(QUESTION_TYPES[form.category] || []);
    }
  }, [form.category]);
  
  useEffect(() => {
    if (form.questionType) {
      setAvailableChoiceTypes(CHOICE_TYPES[form.questionType] || []);
    }
  }, [form.questionType]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      // Reset dependent fields
      setForm({
        ...form,
        category: value,
        questionType: "",
        applicableChoiceTypes: [],
        correctChoiceType: ""
      });
    } else if (name === 'questionType') {
      // Reset dependent fields
      setForm({
        ...form,
        questionType: value,
        applicableChoiceTypes: [],
        correctChoiceType: ""
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
  };
  
  const handleChoiceTypeToggle = (choiceType) => {
    setForm(prev => {
      const newApplicableChoiceTypes = prev.applicableChoiceTypes.includes(choiceType)
        ? prev.applicableChoiceTypes.filter(type => type !== choiceType)
        : [...prev.applicableChoiceTypes, choiceType];
      
      // If the correctChoiceType is no longer in applicableChoiceTypes, reset it
      const newCorrectChoiceType = newApplicableChoiceTypes.includes(prev.correctChoiceType)
        ? prev.correctChoiceType
        : "";
      
      return {
        ...prev,
        applicableChoiceTypes: newApplicableChoiceTypes,
        correctChoiceType: newCorrectChoiceType
      };
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };
  
  return (
    <div className="template-form-container">
      <h3>{template ? "Edit Question Template" : "Create New Question Template"}</h3>
      
      <form onSubmit={handleSubmit} className="template-form">
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select 
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="questionType">Question Type:</label>
          <select
            id="questionType"
            name="questionType"
            value={form.questionType}
            onChange={handleChange}
            required
            disabled={!form.category}
          >
            <option value="">Select a question type</option>
            {availableQuestionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="templateText">Question Template Text:</label>
          <input
            type="text"
            id="templateText"
            name="templateText"
            value={form.templateText}
            onChange={handleChange}
            placeholder="e.g. Anong katumbas na maliit na letra?"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Applicable Choice Types:</label>
          <div className="choice-types-container">
            {availableChoiceTypes.map(choiceType => (
              <div key={choiceType} className="choice-type-option">
                <input
                  type="checkbox"
                  id={`choice-${choiceType}`}
                  checked={form.applicableChoiceTypes.includes(choiceType)}
                  onChange={() => handleChoiceTypeToggle(choiceType)}
                  disabled={!form.questionType}
                />
                <label htmlFor={`choice-${choiceType}`}>{choiceType}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="correctChoiceType">Correct Answer Type:</label>
          <select
            id="correctChoiceType"
            name="correctChoiceType"
            value={form.correctChoiceType}
            onChange={handleChange}
            required
            disabled={form.applicableChoiceTypes.length === 0}
          >
            <option value="">Select correct answer type</option>
            {form.applicableChoiceTypes.map(choiceType => (
              <option key={choiceType} value={choiceType}>{choiceType}</option>
            ))}
          </select>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
            disabled={
              !form.category || 
              !form.questionType || 
              !form.templateText || 
              form.applicableChoiceTypes.length === 0 || 
              !form.correctChoiceType
            }
          >
            {template ? "Update Template" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionTemplateForm;