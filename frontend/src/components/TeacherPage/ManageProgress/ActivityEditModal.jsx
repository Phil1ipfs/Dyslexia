import React, { useState } from 'react';
import { 
  FaTimes, 
  FaSave, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaPlus, 
  FaTrash,
  FaUser
} from 'react-icons/fa';
import '../ManageProgress/css/ActivityEditModal.css';

const ActivityEditModal = ({ activity, onClose, onSave, student }) => {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description || '');
  const [difficulty, setDifficulty] = useState(activity.difficulty || 'Katamtaman');
  const [questions, setQuestions] = useState(activity.questions || [
    {
      id: 1,
      questionText: "Anong tunog ang naririnig mo?",
      options: ["A", "E", "I", "O"],
      correctAnswer: 0,
      feedback: "Ang patinig 'A' ay may malalim na tunog."
    },
    {
      id: 2,
      questionText: "Aling titik ang gumagawa ng 'oh' na tunog?",
      options: ["A", "U", "O", "I"],
      correctAnswer: 2,
      feedback: "Ang titik 'O' ay gumagawa ng 'oh' na tunog."
    }
  ]);
  const [errors, setErrors] = useState({});
  
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };
  
  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    const options = [...updatedQuestions[questionIndex].options];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setQuestions(updatedQuestions);
  };
  
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        feedback: ""
      }
    ]);
  };
  
  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      return; // Don't remove if it's the only question
    }
    
    setQuestions(questions.filter((_, i) => i !== index));
  };
  
  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push("");
    setQuestions(updatedQuestions);
  };
  
  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length <= 2) {
      return; // Keep at least 2 options
    }
    
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    
    // Adjust correct answer if needed
    if (updatedQuestions[questionIndex].correctAnswer === optionIndex) {
      updatedQuestions[questionIndex].correctAnswer = 0;
    } else if (updatedQuestions[questionIndex].correctAnswer > optionIndex) {
      updatedQuestions[questionIndex].correctAnswer--;
    }
    
    setQuestions(updatedQuestions);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = "Kailangan ang pamagat";
    }
    
    questions.forEach((q, index) => {
      if (!q.questionText?.trim()) {
        newErrors[`question_${index}`] = "Kailangan ang teksto ng tanong";
      }
      
      if (q.options && q.options.some(opt => !opt.trim())) {
        newErrors[`options_${index}`] = "Lahat ng opsyon ay dapat may teksto";
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const updatedActivity = {
      ...activity,
      title,
      description,
      difficulty,
      questions,
      status: 'pending_approval'
    };
    
    onSave(updatedActivity);
  };
  
  // Get difficulty text based on level
  const getDifficultyText = (level) => {
    switch(level) {
      case 'Madali': return 'Madali - Para sa mga nagsisimulang mag-aral';
      case 'Katamtaman': return 'Katamtaman - Para sa mga may batayang kaalaman';
      case 'Mahirap': return 'Mahirap - Para sa mga advanced na mag-aaral';
      default: return level;
    }
  };
  
  return (
    <div className="literexia-modal-overlay">
      <div className="literexia-activity-edit-modal">
        <div className="literexia-modal-header">
          <div className="literexia-modal-title">
            <h2>I-customize ang Aktibidad para kay {student?.name || 'Mag-aaral'}</h2>
            <div className="literexia-student-badge">
              <FaUser /> {student?.readingLevel || 'Antas 2'}
            </div>
          </div>
          <button className="literexia-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {Object.keys(errors).length > 0 && (
          <div className="literexia-error-banner">
            <FaExclamationTriangle />
            <p>Pakiayos ang mga error bago isumite</p>
          </div>
        )}
        
        <div className="literexia-modal-info-banner">
          <FaInfoCircle />
          <p>
            Ang pag-customize ng aktibidad na ito ay gagawa ng personalized na bersyon na angkop sa mga partikular na pangangailangan ni {student?.name || 'mag-aaral'}.
            Ang na-customize na aktibidad ay kailangan ng pag-apruba ng admin bago ito maitalaga.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="literexia-edit-form">
          <div className="literexia-form-section">
            <h3>Pangunahing Impormasyon</h3>
            
            <div className="literexia-form-group">
              <label htmlFor="title">
                Pamagat ng Aktibidad <span className="literexia-required">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? 'literexia-error' : ''}
              />
              {errors.title && <div className="literexia-error-message">{errors.title}</div>}
            </div>
            
            <div className="literexia-form-group">
              <label htmlFor="description">Deskripsyon ng Aktibidad</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                placeholder="Magbigay ng maikling paglalarawan ng layunin ng aktibidad na ito"
              ></textarea>
            </div>
            
            <div className="literexia-form-group">
              <label htmlFor="difficulty">Antas ng Kahirapan</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Madali">{getDifficultyText('Madali')}</option>
                <option value="Katamtaman">{getDifficultyText('Katamtaman')}</option>
                <option value="Mahirap">{getDifficultyText('Mahirap')}</option>
              </select>
            </div>
          </div>
          
          <div className="literexia-form-section literexia-questions-section">
            <div className="literexia-section-header">
              <h3>Mga Tanong sa Aktibidad</h3>
              <button type="button" className="literexia-add-question-btn" onClick={addQuestion}>
                <FaPlus /> Magdagdag ng Tanong
              </button>
            </div>
            
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="literexia-question-card">
                <div className="literexia-question-header">
                  <h4>Tanong {qIndex + 1}</h4>
                  <button 
                    type="button" 
                    className="literexia-remove-question-btn"
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length <= 1}
                    title="Alisin ang tanong"
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="literexia-form-group">
                  <label>
                    Teksto ng Tanong <span className="literexia-required">*</span>
                  </label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                    rows="2"
                    className={errors[`question_${qIndex}`] ? 'literexia-error' : ''}
                    placeholder="Ano ang iyong itatanong?"
                  ></textarea>
                  {errors[`question_${qIndex}`] && (
                    <div className="literexia-error-message">{errors[`question_${qIndex}`]}</div>
                  )}
                </div>
                
                <div className="literexia-options-container">
                  <div className="literexia-options-header">
                    <label>Mga Opsyon ng Sagot <span className="literexia-required">*</span></label>
                    <button
                      type="button"
                      className="literexia-add-option-btn"
                      onClick={() => addOption(qIndex)}
                      title="Magdagdag ng opsyon"
                    >
                      <FaPlus /> Magdagdag ng Opsyon
                    </button>
                  </div>
                  
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="literexia-option-row">
                      <div className="literexia-option-index">{String.fromCharCode(65 + oIndex)}.</div>
                      <div className="literexia-option-input">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className={errors[`options_${qIndex}`] ? 'literexia-error' : ''}
                          placeholder={`Opsyon ${oIndex + 1}`}
                        />
                      </div>
                      <div className="literexia-option-actions">
                        <label className="literexia-correct-option">
                          <input
                            type="radio"
                            name={`correct_${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                          />
                          <span>Tama</span>
                        </label>
                        <button
                          type="button"
                          className="literexia-remove-option-btn"
                          onClick={() => removeOption(qIndex, oIndex)}
                          disabled={question.options.length <= 2}
                          title="Alisin ang opsyon"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {errors[`options_${qIndex}`] && (
                    <div className="literexia-error-message literexia-options-error">{errors[`options_${qIndex}`]}</div>
                  )}
                </div>
                
                <div className="literexia-form-group">
                  <label>Feedback/Hint</label>
                  <textarea
                    value={question.feedback || ''}
                    onChange={(e) => handleQuestionChange(qIndex, 'feedback', e.target.value)}
                    rows="2"
                    placeholder="Magbigay ng kapaki-pakinabang na feedback o hint para sa tanong na ito..."
                  ></textarea>
                </div>
              </div>
            ))}
          </div>
          
          <div className="literexia-form-actions">
            <button type="button" className="literexia-cancel-btn" onClick={onClose}>
              Kanselahin
            </button>
            <button type="submit" className="literexia-save-btn">
              <FaSave /> I-save at Isumite para sa Pag-apruba
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityEditModal;