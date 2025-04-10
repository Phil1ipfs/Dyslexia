// src/widgets/TeacherPage/StandardPracticeForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaArrowLeft, FaSave, FaCheck, FaTimes } from "react-icons/fa";
import "../../widgets/TeacherPage/StandardPracticeForm.css";

const StandardPracticeForm = ({ concept }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Form state
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      image: null,
      imagePreview: null,
      hint: "",
      choices: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ],
      hasSetCorrectAnswer: false
    }
  ]);

  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    moduleTitle: "",
    moduleDescription: "",
    questions: [{}]
  });

  // Handle image upload
  const handleImageUpload = (e, questionIndex) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors.questions[questionIndex]) {
            newErrors.questions[questionIndex] = {};
          }
          newErrors.questions[questionIndex].image = "File size should be less than 5MB";
          return newErrors;
        });
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors.questions[questionIndex]) {
            newErrors.questions[questionIndex] = {};
          }
          newErrors.questions[questionIndex].image = "Only JPG, PNG, GIF, and WEBP formats are supported";
          return newErrors;
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].image = file;
        newQuestions[questionIndex].imagePreview = reader.result;
        setQuestions(newQuestions);

        // Clear validation error if it exists
        if (validationErrors.questions[questionIndex]?.image) {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.questions[questionIndex]) {
              delete newErrors.questions[questionIndex].image;
            }
            return newErrors;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing an image
  const handleRemoveImage = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].image = null;
    newQuestions[questionIndex].imagePreview = null;
    setQuestions(newQuestions);
  };

  // Handle question text change
  const handleQuestionTextChange = (text, questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].questionText = text;
    setQuestions(newQuestions);

    // Clear validation error if it exists
    if (validationErrors.questions[questionIndex]?.questionText) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.questions[questionIndex]) {
          delete newErrors.questions[questionIndex].questionText;
        }
        return newErrors;
      });
    }
  };

  // Handle hint change
  const handleHintChange = (hint, questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].hint = hint;
    setQuestions(newQuestions);
  };

  // Handle choice text change
  const handleChoiceTextChange = (text, questionIndex, choiceIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].choices[choiceIndex].text = text;
    setQuestions(newQuestions);

    // Clear validation error if it exists
    if (validationErrors.questions[questionIndex]?.choices) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.questions[questionIndex]) {
          delete newErrors.questions[questionIndex].choices;
        }
        return newErrors;
      });
    }
  };

  // Set correct answer
  const handleSetCorrectAnswer = (questionIndex, choiceIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].choices.forEach((choice, idx) => {
      choice.isCorrect = idx === choiceIndex;
    });
    newQuestions[questionIndex].hasSetCorrectAnswer = true;
    setQuestions(newQuestions);

    // Clear validation error if it exists
    if (validationErrors.questions[questionIndex]?.correctAnswer) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.questions[questionIndex]) {
          delete newErrors.questions[questionIndex].correctAnswer;
        }
        return newErrors;
      });
    }
  };

  // Add new question
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        image: null,
        imagePreview: null,
        hint: "",
        choices: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ],
        hasSetCorrectAnswer: false
      }
    ]);
    setCurrentQuestionIndex(questions.length);
    
    // Make sure validation errors array stays in sync
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (!newErrors.questions) {
        newErrors.questions = [];
      }
      newErrors.questions.push({});
      return newErrors;
    });
  };

  // Remove question
  const handleRemoveQuestion = (indexToRemove) => {
    if (questions.length === 1) {
      setFormError("Practice module must have at least one question");
      return;
    }
    
    const newQuestions = questions.filter((_, idx) => idx !== indexToRemove);
    setQuestions(newQuestions);
    
    // Adjust current question index if needed
    if (currentQuestionIndex >= newQuestions.length) {
      setCurrentQuestionIndex(newQuestions.length - 1);
    } else if (currentQuestionIndex === indexToRemove && indexToRemove > 0) {
      setCurrentQuestionIndex(indexToRemove - 1);
    }
    
    // Update validation errors array
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors.questions) {
        newErrors.questions = newErrors.questions.filter((_, idx) => idx !== indexToRemove);
      }
      return newErrors;
    });
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      moduleTitle: "",
      moduleDescription: "",
      questions: questions.map(() => ({}))
    };

    // Validate module title
    if (!moduleTitle.trim()) {
      newErrors.moduleTitle = "Module title is required";
      isValid = false;
    }

    // Validate module description
    if (!moduleDescription.trim()) {
      newErrors.moduleDescription = "Module description is required";
      isValid = false;
    }

    // Validate questions
    questions.forEach((question, idx) => {
      // Validate question text
      if (!question.questionText.trim()) {
        if (!newErrors.questions[idx]) {
          newErrors.questions[idx] = {};
        }
        newErrors.questions[idx].questionText = "Question text is required";
        isValid = false;
      }

      // Validate choices
      const filledChoices = question.choices.filter(choice => choice.text.trim());
      if (filledChoices.length < 2) {
        if (!newErrors.questions[idx]) {
          newErrors.questions[idx] = {};
        }
        newErrors.questions[idx].choices = "At least two choices are required";
        isValid = false;
      }

      // Validate correct answer
      if (!question.hasSetCorrectAnswer) {
        if (!newErrors.questions[idx]) {
          newErrors.questions[idx] = {};
        }
        newErrors.questions[idx].correctAnswer = "Please select a correct answer";
        isValid = false;
      }
    });

    setValidationErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!validateForm()) {
      setFormError("Please fix the errors in the form before submitting");
      return;
    }

    setLoading(true);

    try {
      // Mock API call to MongoDB (to be replaced with actual implementation)
      await mockSaveToDatabase();
      
      setFormSuccess("Practice module saved successfully!");
      setTimeout(() => {
        navigate("/teacher/practice-modules");
      }, 2000);
    } catch (error) {
      setFormError("Failed to save practice module. Please try again.");
      console.error("Error saving practice module:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock function to simulate saving to MongoDB
  const mockSaveToDatabase = () => {
    return new Promise((resolve) => {
      // Prepare data for MongoDB
      const formData = {
        moduleTitle,
        moduleDescription,
        concept,
        moduleType: "standard",
        questions: questions.map(q => ({
          questionText: q.questionText,
          hint: q.hint,
          // Here you would handle image upload to a storage service
          // and save the URL or reference in the database
          imageUrl: q.image ? `storage-url/${q.image.name}` : null,
          choices: q.choices.map(c => ({
            text: c.text,
            isCorrect: c.isCorrect
          }))
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log("Data to be saved to MongoDB:", formData);
      
      // Simulate API delay
      setTimeout(resolve, 1000);
    });
  };

  // Handle navigation between questions
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="standard-practice-form">
      <div className="form-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FaArrowLeft /> Back
        </button>
        <h2>{concept ? `Standard Practice: ${concept}` : "Create Standard Practice Module"}</h2>
      </div>

      {formError && <div className="error-message">{formError}</div>}
      {formSuccess && <div className="success-message">{formSuccess}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section module-info">
          <h3>Module Information</h3>
          
          <div className="form-group">
            <label htmlFor="moduleTitle">Module Title*</label>
            <input
              id="moduleTitle"
              type="text"
              value={moduleTitle}
              onChange={(e) => {
                setModuleTitle(e.target.value);
                if (validationErrors.moduleTitle) {
                  setValidationErrors({...validationErrors, moduleTitle: ""});
                }
              }}
              placeholder="Enter module title"
              className={validationErrors.moduleTitle ? "error" : ""}
            />
            {validationErrors.moduleTitle && (
              <span className="error-text">{validationErrors.moduleTitle}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="moduleDescription">Module Description*</label>
            <textarea
              id="moduleDescription"
              value={moduleDescription}
              onChange={(e) => {
                setModuleDescription(e.target.value);
                if (validationErrors.moduleDescription) {
                  setValidationErrors({...validationErrors, moduleDescription: ""});
                }
              }}
              placeholder="Enter module description"
              className={validationErrors.moduleDescription ? "error" : ""}
              rows={3}
            />
            {validationErrors.moduleDescription && (
              <span className="error-text">{validationErrors.moduleDescription}</span>
            )}
          </div>
        </div>

        <div className="form-section questions-section">
          <div className="questions-header">
            <h3>Questions</h3>
            <div className="question-navigation">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <div className="pagination-controls">
                <button 
                  type="button" 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="nav-button"
                >
                  Previous
                </button>
                {questions.map((_, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className={`page-button ${currentQuestionIndex === idx ? 'active' : ''}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  type="button" 
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="nav-button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {questions.map((question, questionIdx) => (
            <div 
              key={questionIdx} 
              className={`question-form ${questionIdx === currentQuestionIndex ? 'active' : 'hidden'}`}
            >
              <div className="question-header">
                <h4>Question {questionIdx + 1}</h4>
                <button 
                  type="button" 
                  className="remove-question-btn"
                  onClick={() => handleRemoveQuestion(questionIdx)}
                  aria-label="Remove question"
                >
                  <FaTrash /> Remove
                </button>
              </div>

              <div className="form-group">
                <label htmlFor={`questionText-${questionIdx}`}>Question Text*</label>
                <textarea
                  id={`questionText-${questionIdx}`}
                  value={question.questionText}
                  onChange={(e) => handleQuestionTextChange(e.target.value, questionIdx)}
                  placeholder="Enter your question here"
                  className={validationErrors.questions[questionIdx]?.questionText ? "error" : ""}
                  rows={2}
                />
                {validationErrors.questions[questionIdx]?.questionText && (
                  <span className="error-text">
                    {validationErrors.questions[questionIdx].questionText}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor={`questionImage-${questionIdx}`}>Question Image (Optional)</label>
                <div className="image-upload-container">
                  {question.imagePreview ? (
                    <div className="image-preview-container">
                      <img 
                        src={question.imagePreview} 
                        alt="Question preview" 
                        className="image-preview"
                      />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(questionIdx)}
                      >
                        <FaTrash /> Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="file-upload">
                      <input
                        id={`questionImage-${questionIdx}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, questionIdx)}
                        className={validationErrors.questions[questionIdx]?.image ? "error" : ""}
                      />
                      <label htmlFor={`questionImage-${questionIdx}`} className="upload-label">
                        Choose File
                      </label>
                      <span className="file-info">
                        {question.image ? question.image.name : "No file chosen"}
                      </span>
                    </div>
                  )}
                </div>
                {validationErrors.questions[questionIdx]?.image && (
                  <span className="error-text">
                    {validationErrors.questions[questionIdx].image}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor={`hint-${questionIdx}`}>Hint/Explanation (Optional)</label>
                <textarea
                  id={`hint-${questionIdx}`}
                  value={question.hint}
                  onChange={(e) => handleHintChange(e.target.value, questionIdx)}
                  placeholder="Provide a hint or explanation for this question"
                  rows={2}
                />
              </div>

              <div className="form-group choices-group">
                <label>Choices*</label>
                <div className="choices-container">
                  {question.choices.map((choice, choiceIdx) => (
                    <div key={choiceIdx} className="choice-item">
                      <div 
                        className={`choice-correct-indicator ${choice.isCorrect ? 'correct' : ''}`}
                        onClick={() => handleSetCorrectAnswer(questionIdx, choiceIdx)}
                      >
                        {choice.isCorrect ? <FaCheck /> : <FaTimes />}
                      </div>
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => handleChoiceTextChange(e.target.value, questionIdx, choiceIdx)}
                        placeholder={`Choice ${choiceIdx + 1}`}
                        className={validationErrors.questions[questionIdx]?.choices ? "error" : ""}
                      />
                    </div>
                  ))}
                </div>
                {validationErrors.questions[questionIdx]?.choices && (
                  <span className="error-text">
                    {validationErrors.questions[questionIdx].choices}
                  </span>
                )}
                {validationErrors.questions[questionIdx]?.correctAnswer && (
                  <span className="error-text">
                    {validationErrors.questions[questionIdx].correctAnswer}
                  </span>
                )}
                <div className="choice-instructions">
                  Click the indicator to set the correct answer
                </div>
              </div>
            </div>
          ))}

          <div className="add-question-container">
            <button 
              type="button" 
              className="add-question-btn"
              onClick={handleAddQuestion}
            >
              <FaPlus /> Add Question
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
            disabled={loading}
          >
            {loading ? "Saving..." : <><FaSave /> Save Module</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StandardPracticeForm;