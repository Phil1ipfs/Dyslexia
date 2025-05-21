// src/pages/Teachers/ManageCategories/SentenceTemplateForm.jsx
import React, { useState, useEffect } from "react";
import "../../../css/Teachers/ManageCategories/TemplateForm.css";



const READING_LEVELS = [
  "Low Emerging",
  "Developing",
  "Transitioning",
  "Fluent"
];

const SentenceTemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: "",
    category: "Reading Comprehension", // This is fixed
    readingLevel: "",
    sentenceText: [
      { pageNumber: 1, text: "", image: "" }
    ],
    sentenceQuestions: [
      { 
        questionNumber: 1, 
        questionText: "", 
        sentenceCorrectAnswer: "", 
        sentenceOptionAnswers: ["", "", "", ""] 
      }
    ]
  });
  
  const [currentPage, setCurrentPage] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  useEffect(() => {
    if (template) {
      setForm({
        title: template.title || "",
        category: "Reading Comprehension",
        readingLevel: template.readingLevel || "",
        sentenceText: template.sentenceText?.length > 0 
          ? template.sentenceText 
          : [{ pageNumber: 1, text: "", image: "" }],
        sentenceQuestions: template.sentenceQuestions?.length > 0
          ? template.sentenceQuestions
          : [{ 
              questionNumber: 1, 
              questionText: "", 
              sentenceCorrectAnswer: "", 
              sentenceOptionAnswers: ["", "", "", ""] 
            }]
      });
    }
  }, [template]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };
  
  const handlePageChange = (e, pageIndex, field) => {
    const { value } = e.target;
    const updatedPages = [...form.sentenceText];
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      [field]: value
    };
    
    setForm({
      ...form,
      sentenceText: updatedPages
    });
  };
  
  const handleQuestionChange = (e, questionIndex, field, optionIndex = null) => {
    const { value } = e.target;
    const updatedQuestions = [...form.sentenceQuestions];
    
    if (optionIndex !== null) {
      // Update an option answer
      const options = [...updatedQuestions[questionIndex].sentenceOptionAnswers];
      options[optionIndex] = value;
      
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        sentenceOptionAnswers: options
      };
    } else {
      // Update question text or correct answer
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        [field]: value
      };
    }
    
    setForm({
      ...form,
      sentenceQuestions: updatedQuestions
    });
  };
  
  const addPage = () => {
    const newPageNumber = form.sentenceText.length + 1;
    setForm({
      ...form,
      sentenceText: [
        ...form.sentenceText,
        { pageNumber: newPageNumber, text: "", image: "" }
      ]
    });
    
    // Switch to the new page
    setCurrentPage(newPageNumber - 1);
  };
  
  const removePage = (pageIndex) => {
    if (form.sentenceText.length <= 1) return;
    
    const updatedPages = form.sentenceText.filter((_, index) => index !== pageIndex);
    // Renumber the pages
    updatedPages.forEach((page, idx) => {
      page.pageNumber = idx + 1;
    });
    
    setForm({
      ...form,
      sentenceText: updatedPages
    });
    
    // Adjust current page if needed
    if (currentPage >= updatedPages.length) {
      setCurrentPage(updatedPages.length - 1);
    }
  };
  
  const addQuestion = () => {
    const newQuestionNumber = form.sentenceQuestions.length + 1;
    setForm({
      ...form,
      sentenceQuestions: [
        ...form.sentenceQuestions,
        { 
          questionNumber: newQuestionNumber, 
          questionText: "", 
          sentenceCorrectAnswer: "", 
          sentenceOptionAnswers: ["", "", "", ""] 
        }
      ]
    });
    
    // Switch to the new question
    setCurrentQuestion(newQuestionNumber - 1);
  };
  
  const removeQuestion = (questionIndex) => {
    if (form.sentenceQuestions.length <= 1) return;
    
    const updatedQuestions = form.sentenceQuestions.filter((_, index) => index !== questionIndex);
    // Renumber the questions
    updatedQuestions.forEach((question, idx) => {
      question.questionNumber = idx + 1;
    });
    
    setForm({
      ...form,
      sentenceQuestions: updatedQuestions
    });
    
    // Adjust current question if needed
    if (currentQuestion >= updatedQuestions.length) {
      setCurrentQuestion(updatedQuestions.length - 1);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };
  
  return (
    <div className="template-form-container sentence-form">
      <h3>{template ? "Edit Sentence Template" : "Create New Sentence Template"}</h3>
      
      <form onSubmit={handleSubmit} className="template-form">
        <div className="form-group">
          <label htmlFor="title">Story Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Si Maria at ang mga Bulaklak"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="readingLevel">Reading Level:</label>
          <select
            id="readingLevel"
            name="readingLevel"
            value={form.readingLevel}
            onChange={handleChange}
            required
          >
            <option value="">Select a reading level</option>
            {READING_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        
        <div className="sentence-pages-section">
          <h4>Story Pages</h4>
          
          <div className="page-tabs">
            {form.sentenceText.map((page, index) => (
              <button
                key={index}
                type="button"
                className={`page-tab ${currentPage === index ? 'active' : ''}`}
                onClick={() => setCurrentPage(index)}
              >
                Page {page.pageNumber}
              </button>
            ))}
            <button 
              type="button" 
              className="add-page-btn"
              onClick={addPage}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
          
          {form.sentenceText.map((page, index) => (
            <div 
              key={index}
              className={`page-content ${currentPage === index ? 'active' : 'hidden'}`}
            >
              <div className="page-header">
                <h5>Page {page.pageNumber}</h5>
                <button 
                  type="button" 
                  className="remove-page-btn"
                  onClick={() => removePage(index)}
                  disabled={form.sentenceText.length <= 1}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor={`page-text-${index}`}>Page Text:</label>
                <textarea
                  id={`page-text-${index}`}
                  value={page.text}
                  onChange={(e) => handlePageChange(e, index, 'text')}
                  placeholder="Enter the page text here..."
                  rows={4}
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor={`page-image-${index}`}>Page Image URL:</label>
                <input
                  type="text"
                  id={`page-image-${index}`}
                  value={page.image}
                  onChange={(e) => handlePageChange(e, index, 'image')}
                  placeholder="e.g. https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/park_flowers.png"
                  required
                />
                {page.image && (
                  <div className="image-preview">
                    <img src={page.image} alt={`Preview for page ${page.pageNumber}`} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="sentence-questions-section">
          <h4>Comprehension Questions</h4>
          
          <div className="question-tabs">
            {form.sentenceQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className={`question-tab ${currentQuestion === index ? 'active' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                Q {question.questionNumber}
              </button>
            ))}
            <button 
              type="button" 
              className="add-question-btn"
              onClick={addQuestion}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
          
          {form.sentenceQuestions.map((question, index) => (
            <div 
              key={index}
              className={`question-content ${currentQuestion === index ? 'active' : 'hidden'}`}
            >
              <div className="question-header">
                <h5>Question {question.questionNumber}</h5>
                <button 
                  type="button" 
                  className="remove-question-btn"
                  onClick={() => removeQuestion(index)}
                  disabled={form.sentenceQuestions.length <= 1}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor={`question-text-${index}`}>Question Text:</label>
                <input
                  type="text"
                  id={`question-text-${index}`}
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(e, index, 'questionText')}
                  placeholder="e.g. Sino ang pangunahing tauhan sa kwento?"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor={`correct-answer-${index}`}>Correct Answer:</label>
                <input
                  type="text"
                  id={`correct-answer-${index}`}
                  value={question.sentenceCorrectAnswer}
                  onChange={(e) => handleQuestionChange(e, index, 'sentenceCorrectAnswer')}
                  placeholder="e.g. Si Maria"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Answer Options:</label>
                <div className="answer-options">
                  {question.sentenceOptionAnswers.map((option, optionIndex) => (
                    <div key={optionIndex} className="option-input">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleQuestionChange(e, index, 'sentenceOptionAnswers', optionIndex)}
                        placeholder={`Option ${optionIndex + 1}`}
                        required
                      />
                      <span className={optionIndex === 0 ? 'correct-badge' : ''}>
                        {optionIndex === 0 ? 'Correct' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="help-text">
                  Note: The first option should be the correct answer and will match the "Correct Answer" field.
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
          >
            {template ? "Update Template" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SentenceTemplateForm;