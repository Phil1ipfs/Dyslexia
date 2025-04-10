// src/widgets/TeacherPage/StandardPracticeForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../widgets/TeacherPage/StandardPracticeForm.css";
import { FaPlus, FaTrash, FaCheck, FaUpload, FaSave } from "react-icons/fa";

const StandardPracticeForm = ({ concept }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    questions: [
      {
        questionText: "",
        image: null,
        imagePreview: null,
        choices: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
        hint: "",
      },
    ],
    moduleType: "standard",
    concept: concept || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle question text change
  const handleQuestionChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[currentQuestion] = {
        ...updatedQuestions[currentQuestion],
        questionText: value,
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  // Handle hint change
  const handleHintChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[currentQuestion] = {
        ...updatedQuestions[currentQuestion],
        hint: value,
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => {
          const updatedQuestions = [...prev.questions];
          updatedQuestions[currentQuestion] = {
            ...updatedQuestions[currentQuestion],
            image: file,
            imagePreview: reader.result,
          };
          return { ...prev, questions: updatedQuestions };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle choice text change
  const handleChoiceChange = (index, value) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      const updatedChoices = [...updatedQuestions[currentQuestion].choices];
      updatedChoices[index] = { ...updatedChoices[index], text: value };
      updatedQuestions[currentQuestion] = {
        ...updatedQuestions[currentQuestion],
        choices: updatedChoices,
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  // Set the correct answer
  const handleCorrectAnswerChange = (index) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      const updatedChoices = updatedQuestions[currentQuestion].choices.map(
        (choice, i) => ({
          ...choice,
          isCorrect: i === index,
        })
      );
      updatedQuestions[currentQuestion] = {
        ...updatedQuestions[currentQuestion],
        choices: updatedChoices,
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  // Add a new choice
  const addChoice = () => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[currentQuestion] = {
        ...updatedQuestions[currentQuestion],
        choices: [
          ...updatedQuestions[currentQuestion].choices,
          { text: "", isCorrect: false },
        ],
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  // Remove a choice
  const removeChoice = (index) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      const updatedChoices = [...updatedQuestions[currentQuestion].choices];
      updatedChoices.splice(index, 1);
      
      // If we removed the correct answer, set the first one as correct
      let hasCorrectAnswer = updatedChoices.some(choice => choice.isCorrect);
      if (!hasCorrectAnswer && updatedChoices.length > 0) {
        updatedChoices[0].isCorrect = true;
      }
      
      updatedQuestions[currentQuestion] = {
        ...updatedQuestions[currentQuestion],
        choices: updatedChoices,
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  // Add a new question
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "",
          image: null,
          imagePreview: null,
          choices: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
          ],
          hint: "",
        },
      ],
    }));
    setCurrentQuestion(formData.questions.length);
  };

  // Go to previous question
  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Go to next question
  const goToNextQuestion = () => {
    if (currentQuestion < formData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Remove the current question
  const removeCurrentQuestion = () => {
    if (formData.questions.length <= 1) {
      return; // Don't allow removing the last question
    }

    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions.splice(currentQuestion, 1);
      return { ...prev, questions: updatedQuestions };
    });

    // Adjust current question index if needed
    if (currentQuestion >= formData.questions.length - 1) {
      setCurrentQuestion(formData.questions.length - 2);
    }
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Module title is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    // Validate current question
    if (!formData.questions[currentQuestion].questionText.trim()) {
      errors.questionText = "Question text is required";
    }

    // Check if at least two choices exist
    if (formData.questions[currentQuestion].choices.length < 2) {
      errors.choices = "At least two choices are required";
    }

    // Check if all choices have text
    const emptyChoices = formData.questions[currentQuestion].choices.some(
      (choice) => !choice.text.trim()
    );
    if (emptyChoices) {
      errors.choiceText = "All choices must have text";
    }

    // Check if there's a correct answer selected
    const hasCorrectAnswer = formData.questions[currentQuestion].choices.some(
      (choice) => choice.isCorrect
    );
    if (!hasCorrectAnswer) {
      errors.correctAnswer = "A correct answer must be selected";
    }

    return errors;
  };

  // Handle saving the practice module
  const handleSave = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would normally send the data to MongoDB
      // For demonstration purposes, we'll just log and simulate a success
      console.log("Form data to be sent to MongoDB:", formData);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus("Practice module saved successfully!");
      // Navigate back or to a confirmation page
      // navigate("/teacher/practice-modules");
      
    } catch (error) {
      console.error("Error saving practice module:", error);
      setSaveStatus("Error saving practice module. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling and going back
  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      navigate(-1);
    }
  };

  return (
    <div className="standard-practice-form">
      <div className="form-header">
        <h2>Create Standard Practice Module</h2>
        <p className="concept-label">Concept: {concept || "General Practice"}</p>
      </div>

      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-group">
          <label htmlFor="title">Module Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={errors.title ? "error" : ""}
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={errors.description ? "error" : ""}
          />
          {errors.description && (
            <span className="error-text">{errors.description}</span>
          )}
        </div>
      </div>

      <div className="form-section">
        <div className="question-header">
          <h3>Question {currentQuestion + 1} of {formData.questions.length}</h3>
          <div className="question-actions">
            <button
              type="button"
              className="btn-remove"
              onClick={removeCurrentQuestion}
              disabled={formData.questions.length <= 1}
              title="Remove Question"
            >
              <FaTrash /> Remove
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="questionText">Question Text:</label>
          <textarea
            id="questionText"
            value={formData.questions[currentQuestion].questionText}
            onChange={handleQuestionChange}
            className={errors.questionText ? "error" : ""}
          />
          {errors.questionText && (
            <span className="error-text">{errors.questionText}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="imageUpload">Question Image (Optional):</label>
          <div className="image-upload-container">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            <label htmlFor="imageUpload" className="file-label">
              <FaUpload /> {formData.questions[currentQuestion].image
                ? "Change Image"
                : "Upload Image"}
            </label>
          </div>
          {formData.questions[currentQuestion].imagePreview && (
            <div className="image-preview">
              <img
                src={formData.questions[currentQuestion].imagePreview}
                alt="Question"
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Answer Choices:</label>
          {errors.choices && <span className="error-text">{errors.choices}</span>}
          {errors.choiceText && (
            <span className="error-text">{errors.choiceText}</span>
          )}
          {errors.correctAnswer && (
            <span className="error-text">{errors.correctAnswer}</span>
          )}

          <div className="choices-container">
            {formData.questions[currentQuestion].choices.map((choice, index) => (
              <div key={index} className="choice-item">
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => handleChoiceChange(index, e.target.value)}
                  placeholder={`Choice ${index + 1}`}
                  className={errors.choiceText ? "error" : ""}
                />
                <div className="choice-actions">
                  <button
                    type="button"
                    className={`btn-correct ${choice.isCorrect ? "selected" : ""}`}
                    onClick={() => handleCorrectAnswerChange(index)}
                    title="Mark as Correct Answer"
                  >
                    {choice.isCorrect && <FaCheck />}
                    {choice.isCorrect ? "Correct" : "Mark Correct"}
                  </button>
                  <button
                    type="button"
                    className="btn-remove-choice"
                    onClick={() => removeChoice(index)}
                    disabled={formData.questions[currentQuestion].choices.length <= 2}
                    title="Remove Choice"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-add-choice" onClick={addChoice}>
            <FaPlus /> Add Choice
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="hint">Hint/Explanation (Optional):</label>
          <textarea
            id="hint"
            value={formData.questions[currentQuestion].hint}
            onChange={handleHintChange}
            placeholder="Provide a hint or explanation for this question"
          />
        </div>
      </div>

      <div className="question-navigation">
        <button
          type="button"
          className="btn-nav"
          onClick={goToPreviousQuestion}
          disabled={currentQuestion === 0}
        >
          Previous Question
        </button>
        <span>
          Question {currentQuestion + 1} of {formData.questions.length}
        </span>
        <button
          type="button"
          className="btn-nav"
          onClick={goToNextQuestion}
          disabled={currentQuestion === formData.questions.length - 1}
        >
          Next Question
        </button>
      </div>

      <button type="button" className="btn-add-question" onClick={addQuestion}>
        <FaPlus /> Add Question
      </button>

      {saveStatus && <div className="save-status">{saveStatus}</div>}

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-save"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : <><FaSave /> Save Practice Module</>}
        </button>
      </div>
    </div>
  );
};

export default StandardPracticeForm;