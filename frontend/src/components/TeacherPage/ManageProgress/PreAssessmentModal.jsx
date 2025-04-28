import React, { useState } from 'react';
import { FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';

const PreAssessmentModal = ({ student, onClose, onSave }) => {
  const [readingLevel, setReadingLevel] = useState(student.readingLevel || 'Antas 1');
  const [vowelScore, setVowelScore] = useState(student.scores?.vowelSound || 0);
  const [syllableScore, setSyllableScore] = useState(student.scores?.syllableBlending || 0);
  const [wordRecognitionScore, setWordRecognitionScore] = useState(student.scores?.wordRecognition || 0);
  const [readingCompScore, setReadingCompScore] = useState(student.scores?.readingComprehension || 0);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (vowelScore < 0 || vowelScore > 100 || 
        syllableScore < 0 || syllableScore > 100 ||
        wordRecognitionScore < 0 || wordRecognitionScore > 100 ||
        readingCompScore < 0 || readingCompScore > 100) {
      setError('All scores must be between 0 and 100');
      return;
    }

    // Prepare the assessment data
    const assessmentData = {
      readingLevel,
      scores: {
        vowelSound: vowelScore,
        syllableBlending: syllableScore,
        wordRecognition: wordRecognitionScore,
        readingComprehension: readingCompScore
      },
      notes,
      date: new Date().toISOString()
    };

    // Call the onSave function with the student and assessment data
    onSave(student, assessmentData);
  };

  const calculateTotalScore = () => {
    return Math.round((parseInt(vowelScore) + parseInt(syllableScore) + 
                      parseInt(wordRecognitionScore) + parseInt(readingCompScore)) / 4);
  };

  return (
    <div className="pre-assessment-modal-overlay">
      <div className="pre-assessment-modal">
        <div className="pre-assessment-modal-header">
          <h2>Record Pre-Assessment for {student.name}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Reading Level Assessment</h3>
            <div className="form-group">
              <label htmlFor="readingLevel">Assigned Reading Level:</label>
              <select 
                id="readingLevel" 
                value={readingLevel} 
                onChange={(e) => setReadingLevel(e.target.value)}
              >
                <option value="Antas 1">Antas Uno</option>
                <option value="Antas 2">Antas Dalawa</option>
                <option value="Antas 3">Antas Tatlo</option>
                <option value="Antas 4">Antas Apat</option>
                <option value="Antas 5">Antas Lima</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Skill Assessments</h3>
            <p className="section-info">Enter scores (0-100) for each skill area based on the pre-assessment results.</p>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vowelScore">Vowel Sound Recognition:</label>
                <input 
                  type="number" 
                  id="vowelScore" 
                  min="0" 
                  max="100" 
                  value={vowelScore} 
                  onChange={(e) => setVowelScore(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="syllableScore">Syllable Blending:</label>
                <input 
                  type="number" 
                  id="syllableScore" 
                  min="0" 
                  max="100" 
                  value={syllableScore} 
                  onChange={(e) => setSyllableScore(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="wordRecognitionScore">Word Recognition:</label>
                <input 
                  type="number" 
                  id="wordRecognitionScore" 
                  min="0" 
                  max="100" 
                  value={wordRecognitionScore} 
                  onChange={(e) => setWordRecognitionScore(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="readingCompScore">Reading Comprehension:</label>
                <input 
                  type="number" 
                  id="readingCompScore" 
                  min="0" 
                  max="100" 
                  value={readingCompScore} 
                  onChange={(e) => setReadingCompScore(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="assessment-summary">
            <div className="summary-total">
              <span>Average Score:</span>
              <span className="total-score">{calculateTotalScore()}%</span>
            </div>
          </div>

          <div className="form-section">
            <h3>Notes</h3>
            <div className="form-group">
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional observations or notes about the student's performance..."
                rows="3"
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              <FaSave /> Save Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreAssessmentModal;