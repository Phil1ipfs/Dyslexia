// src/pages/Teachers/ManageCategories/SentenceTemplateForm.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faInfoCircle, 
  faPlus, 
  faTrash,
  faUpload,
  faBook,
  faQuestionCircle
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/TemplateForm.css";

const READING_LEVELS = [
  "Low Emerging",
  "High Emerging",
  "Developing",
  "Transitioning",
  "At Grade Level"
];

const SentenceTemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: "",
    category: "Reading Comprehension", // This is fixed
    readingLevel: "",
    sentenceText: [
      { pageNumber: 1, text: "", image: "", imageFile: null }
    ],
    sentenceQuestions: [
      { 
        questionNumber: 1, 
        questionText: "", 
        sentenceCorrectAnswer: "", 
        sentenceOptionAnswers: ["", ""] 
      }
    ]
  });
  
  const [currentPage, setCurrentPage] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [errors, setErrors] = useState({});
  const [pageImages, setPageImages] = useState([null]);
  
  // Load template data if editing
  useEffect(() => {
    if (template) {
      const updatedForm = {
        title: template.title || "",
        category: "Reading Comprehension",
        readingLevel: template.readingLevel || "",
        sentenceText: template.sentenceText?.length > 0 
          ? template.sentenceText.map(page => ({
              ...page,
              imageFile: null // Add imageFile property for file uploads
            }))
          : [{ pageNumber: 1, text: "", image: "", imageFile: null }],
        sentenceQuestions: template.sentenceQuestions?.length > 0
          ? template.sentenceQuestions
          : [{ 
              questionNumber: 1, 
              questionText: "", 
              sentenceCorrectAnswer: "", 
              sentenceOptionAnswers: ["", "", "", ""] 
            }]
      };
      
      setForm(updatedForm);
      
      // Set page images for preview
      if (template.sentenceText?.length > 0) {
        setPageImages(template.sentenceText.map(page => page.image || null));
      }
    }
  }, [template]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field-specific errors
    setErrors({
      ...errors,
      [name]: undefined
    });
    
    setForm({
      ...form,
      [name]: value
    });
  };
  
  const handlePageChange = (e, pageIndex, field) => {
    const { value } = e.target;
    
    // Clear page-specific errors
    setErrors({
      ...errors,
      [`page_${pageIndex}_${field}`]: undefined
    });
    
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
  
  const handlePageImageUpload = (e, pageIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clear image error
    setErrors({
      ...errors,
      [`page_${pageIndex}_image`]: undefined
    });
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      const newPageImages = [...pageImages];
      newPageImages[pageIndex] = reader.result;
      setPageImages(newPageImages);
      
      // Update the form with the file and image URL
      const updatedPages = [...form.sentenceText];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        imageFile: file,
        image: reader.result // In a real app, you'd upload to a server and store the URL
      };
      
      setForm({
        ...form,
        sentenceText: updatedPages
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleQuestionChange = (e, questionIndex, field, optionIndex = null) => {
    const { value } = e.target;
    
    // Clear question-specific errors
    setErrors({
      ...errors,
      [`question_${questionIndex}_${field}`]: undefined
    });
    
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
      
      // If updating the correct answer, also update the first option
      if (field === 'sentenceCorrectAnswer') {
        const options = [...updatedQuestions[questionIndex].sentenceOptionAnswers];
        options[0] = value; // First option is always the correct one
        
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          sentenceOptionAnswers: options
        };
      }
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
        { pageNumber: newPageNumber, text: "", image: "", imageFile: null }
      ]
    });
    
    // Add a placeholder for the new page image
    setPageImages([...pageImages, null]);
    
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
    
    // Remove the page image
    const updatedPageImages = [...pageImages];
    updatedPageImages.splice(pageIndex, 1);
    setPageImages(updatedPageImages);
    
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
    
    // Validate form
    const newErrors = {};
    if (!form.title) newErrors.title = "Story title is required";
    if (!form.readingLevel) newErrors.readingLevel = "Reading level is required";
    
    // Validate pages
    form.sentenceText.forEach((page, pageIndex) => {
      if (!page.text) newErrors[`page_${pageIndex}_text`] = "Page text is required";
      if (!page.image) newErrors[`page_${pageIndex}_image`] = "Page image is required";
    });
    
    // Validate questions
    form.sentenceQuestions.forEach((question, questionIndex) => {
      if (!question.questionText) newErrors[`question_${questionIndex}_questionText`] = "Question text is required";
      if (!question.sentenceCorrectAnswer) newErrors[`question_${questionIndex}_sentenceCorrectAnswer`] = "Correct answer is required";
      
      // Validate options
      question.sentenceOptionAnswers.forEach((option, optionIndex) => {
        if (!option) newErrors[`question_${questionIndex}_option_${optionIndex}`] = `Option ${optionIndex + 1} is required`;
      });
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(form);
  };
  
  return (
    <div className="template-form-container sentence-form">
      <h3>{template ? "Edit Reading Passage Template" : "Create New Reading Passage Template"}</h3>
      
      <form onSubmit={handleSubmit} className="template-form">
        <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
          <label htmlFor="title">
            Story Title:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Enter a descriptive title for this reading passage. This helps you and other teachers identify the passage.
              </span>
            </div>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Si Maria at ang mga Bulaklak"
            required
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>
        
        <div className={`form-group ${errors.readingLevel ? 'has-error' : ''}`}>
          <label htmlFor="readingLevel">
            Reading Level:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Select the appropriate reading level for this passage. This determines which students will see this passage based on their abilities.
              </span>
            </div>
          </label>
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
          {errors.readingLevel && <div className="error-message">{errors.readingLevel}</div>}
        </div>
        
        <div className="sentence-pages-section">
          <h4>
            <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px' }} />
            Story Pages
            <div className="tooltip" style={{ marginLeft: '8px' }}>
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Create the pages of your reading passage. Each page should have text and an accompanying image. Students will see one page at a time.
              </span>
            </div>
          </h4>
          
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
              <FontAwesomeIcon icon={faPlus} /> Add Page
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
                  title={form.sentenceText.length <= 1 ? "Cannot remove the only page" : "Remove this page"}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              
              <div className={`form-group ${errors[`page_${index}_text`] ? 'has-error' : ''}`}>
                <label htmlFor={`page-text-${index}`}>
                  Page Text:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Enter the text content for this page. Keep it short and simple for dyslexic students.
                    </span>
                  </div>
                </label>
                <textarea
                  id={`page-text-${index}`}
                  value={page.text}
                  onChange={(e) => handlePageChange(e, index, 'text')}
                  placeholder="Enter the text for this page of the story..."
                  rows={4}
                  required
                ></textarea>
                {errors[`page_${index}_text`] && (
                  <div className="error-message">{errors[`page_${index}_text`]}</div>
                )}
              </div>
              
              <div className={`form-group ${errors[`page_${index}_image`] ? 'has-error' : ''}`}>
                <label htmlFor={`page-image-${index}`}>
                  Page Image:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Upload an image that illustrates this page of the story. Images help dyslexic students understand the content.
                    </span>
                  </div>
                </label>
                
                <div className="file-input-container">
                  <label className="file-input-label">
                    <FontAwesomeIcon icon={faUpload} />
                    {pageImages[index] ? "Change Image" : "Upload Image"}
                    <input
                      type="file"
                      id={`page-image-file-${index}`}
                      onChange={(e) => handlePageImageUpload(e, index)}
                      accept="image/*"
                      className="image-input-hidden"
                    />
                  </label>
                </div>
                
                {pageImages[index] && (
                  <div className="image-preview">
                    <img src={pageImages[index]} alt={`Preview for page ${page.pageNumber}`} />
                  </div>
                )}
                
                {errors[`page_${index}_image`] && (
                  <div className="error-message">{errors[`page_${index}_image`]}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="sentence-questions-section">
          <h4>
            <FontAwesomeIcon icon={faQuestionCircle} style={{ marginRight: '8px' }} />
            Comprehension Questions
            <div className="tooltip" style={{ marginLeft: '8px' }}>
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Create questions that test the student's understanding of the reading passage. Each question should have a correct answer and several incorrect options.
              </span>
            </div>
          </h4>
          
          <div className="question-tabs">
            {form.sentenceQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className={`question-tab ${currentQuestion === index ? 'active' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                Q{question.questionNumber}
              </button>
            ))}
            <button 
              type="button" 
              className="add-question-btn"
              onClick={addQuestion}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Question
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
                  title={form.sentenceQuestions.length <= 1 ? "Cannot remove the only question" : "Remove this question"}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              
              <div className={`form-group ${errors[`question_${index}_questionText`] ? 'has-error' : ''}`}>
                <label htmlFor={`question-text-${index}`}>
                  Question Text:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Enter the text of the comprehension question. Make it clear and specific.
                    </span>
                  </div>
                </label>
                <input
                  type="text"
                  id={`question-text-${index}`}
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(e, index, 'questionText')}
                  placeholder="e.g. Sino ang pangunahing tauhan sa kwento?"
                  required
                />
                {errors[`question_${index}_questionText`] && (
                  <div className="error-message">{errors[`question_${index}_questionText`]}</div>
                )}
              </div>
              
              <div className={`form-group ${errors[`question_${index}_sentenceCorrectAnswer`] ? 'has-error' : ''}`}>
                <label htmlFor={`correct-answer-${index}`}>
                  Correct Answer:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Enter the correct answer to this question. This will automatically be the first option in the answer choices.
                    </span>
                  </div>
                </label>
                <input
                  type="text"
                  id={`correct-answer-${index}`}
                  value={question.sentenceCorrectAnswer}
                  onChange={(e) => handleQuestionChange(e, index, 'sentenceCorrectAnswer')}
                  placeholder="e.g. Si Maria"
                  required
                />
                {errors[`question_${index}_sentenceCorrectAnswer`] && (
                  <div className="error-message">{errors[`question_${index}_sentenceCorrectAnswer`]}</div>
                )}
              </div>
              
              <div className="form-group">
                <label>
                  Answer Options:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Enter all possible answer choices. The first option is automatically the correct answer from above. Add three more incorrect options.
                    </span>
                  </div>
                </label>
                <div className="answer-options">
                  {question.sentenceOptionAnswers.map((option, optionIndex) => (
                    <div key={optionIndex} className="option-input">
                      <input
                        type="text"
                        value={optionIndex === 0 ? question.sentenceCorrectAnswer : option}
                        onChange={(e) => handleQuestionChange(e, index, 'sentenceOptionAnswers', optionIndex)}
                        placeholder={`Option ${optionIndex + 1}`}
                        disabled={optionIndex === 0} // First option is always the correct answer
                        required
                      />
                      <span className={optionIndex === 0 ? 'correct-badge' : ''}>
                        {optionIndex === 0 ? 'Correct Answer' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="form-help-text">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    The first option is automatically your correct answer. Fill in the three other options as incorrect choices.
                  </span>
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