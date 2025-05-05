import React, { useState } from 'react';
import { FaInfoCircle, FaChartBar, FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../ManageProgress/css/AssessmentResults.css'; 

const AssessmentResults = ({ assessmentData }) => {
  const [expandedSkill, setExpandedSkill] = useState(null);
  
  if (!assessmentData) {
    return (
      <div className="assessment-results__empty-state">
        <h3>Walang Datos ng Pagsusuri</h3>
        <p>Ang paunang pagsusuri ay maaaring hindi pa naisagawa para sa mag-aaral na ito.</p>
      </div>
    );
  }
  
  // Toggle expanded skill
  const toggleSkill = (index) => {
    setExpandedSkill(expandedSkill === index ? null : index);
  };
  
  // Get skill class based on category
  const getSkillClass = (category) => {
    switch (category) {
      case 'Patinig':
        return 'assessment-results__skill-bar--patinig';
      case 'Pantig':
        return 'assessment-results__skill-bar--pantig';
      case 'Pagkilala ng Salita':
        return 'assessment-results__skill-bar--salita';
      case 'Pag-unawa sa Binasa':
        return 'assessment-results__skill-bar--pag-unawa';
      default:
        return '';
    }
  };
  
  // Get recommendation based on reading level
  const getRecommendationText = () => {
    switch (assessmentData.readingLevel) {
      case 'Antas 1':
        return 'Batay sa pagsusuri, inirerekomenda naming magsanay sa pagkilala ng mga patinig at pantig. Tutukan ang mga gawain sa Antas 1.';
      case 'Antas 2':
        return 'Batay sa pagsusuri, inirerekomenda naming magsanay sa pagkilala ng mga pantig at pagbuo ng mga salita. Tutukan ang mga gawain sa Antas 2.';
      case 'Antas 3':
        return 'Batay sa pagsusuri, inirerekomenda naming magsanay sa pagkilala ng mga salita at pag-unawa ng maikling pangungusap. Tutukan ang mga gawain sa Antas 3.';
      case 'Antas 4':
        return 'Batay sa pagsusuri, inirerekomenda naming magsanay sa pag-unawa ng mga talata at pagkilala ng mahahalagang detalye. Tutukan ang mga gawain sa Antas 4.';
      case 'Antas 5':
        return 'Batay sa pagsusuri, inirerekomenda naming magsanay sa pag-unawa ng mga buong teksto at pagsusuri ng nilalaman. Tutukan ang mga gawain sa Antas 5.';
      default:
        return `Batay sa pagsusuri, inirerekomenda naming tutukan ang ${assessmentData.focusAreas || 'pagkilala ng tunog at pantig'}.`;
    }
  };
  
  return (
    <div className="assessment-results">
      {/* Assessment Information Banner */}
      <div className="assessment-results__info-banner">
        <div className="assessment-results__info-icon">
          <FaInfoCircle />
        </div>
        <div className="assessment-results__info-content">
          <h3>Tungkol sa Comprehensive Reading and Literacy Assessment (CRLA)</h3>
          <p>
            Batay sa pagsusuri na isinagawa noong <strong>{assessmentData.assessmentDate}</strong>, 
            natukoy namin na ang mag-aaral na ito ay nasa <strong>{assessmentData.readingLevel}</strong>. 
            Ipinakikita sa ibaba ang detalyadong resulta ng kanyang mga kakayahan sa pagbasa.
          </p>
        </div>
      </div>
      
      {/* Skill Analysis Section */}
      <div className="assessment-results__skills-section">
        <h3 className="assessment-results__section-title">
          <FaChartBar className="assessment-results__section-icon" /> 
          Pagsusuri ng mga Kakayahan sa Pagbasa
        </h3>
        
        <div className="assessment-results__skill-list">
          {assessmentData.skillDetails.map((skill, index) => (
            <div key={index} className="assessment-results__skill-item">
              <div className="assessment-results__skill-header">
                <div className="assessment-results__skill-title">
                  <span className="assessment-results__skill-name">{skill.category}</span>
                  <span className="assessment-results__skill-score">{skill.score}%</span>
                </div>
                <button 
                  className="assessment-results__expand-btn"
                  onClick={() => toggleSkill(index)}
                >
                  {expandedSkill === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              
              <div className="assessment-results__skill-bar-wrapper">
                <div
                  className={`assessment-results__skill-bar ${getSkillClass(skill.category)}`}
                  style={{ width: `${skill.score}%` }}
                ></div>
              </div>
              
              <div className="assessment-results__skill-analysis">
                <p>{skill.analysis}</p>
              </div>
              
              {/* Expanded details for the skill */}
              {expandedSkill === index && skill.sampleQuestions && skill.sampleQuestions.length > 0 && (
                <div className="assessment-results__skill-details">
                  <h4>Mga Halimbawang Tanong</h4>
                  <div className="assessment-results__sample-questions">
                    {skill.sampleQuestions.map((question, qIndex) => (
                      <div key={qIndex} className="assessment-results__question-item">
                        <div className="assessment-results__question-text">
                          <span className="assessment-results__question-number">Q{qIndex + 1}:</span>
                          {question.text}
                        </div>
                        
                        <div className="assessment-results__question-answers">
                          <div className="assessment-results__answer-row">
                            <div className="assessment-results__answer-label">Sagot ng Mag-aaral:</div>
                            <div className={`assessment-results__answer-value ${question.correct ? 'assessment-results__answer--correct' : 'assessment-results__answer--incorrect'}`}>
                              {question.studentAnswer}
                              {question.correct ? (
                                <FaCheck className="assessment-results__icon-correct" />
                              ) : (
                                <FaTimes className="assessment-results__icon-incorrect" />
                              )}
                            </div>
                          </div>
                          
                          {!question.correct && (
                            <div className="assessment-results__answer-row">
                              <div className="assessment-results__answer-label">Tamang Sagot:</div>
                              <div className="assessment-results__answer-value assessment-results__answer--correct">
                                {question.correctAnswer}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Recommendations Section */}
      <div className="assessment-results__conclusion">
        <h3 className="assessment-results__conclusion-title">Rekomendasyon</h3>
        <p className="assessment-results__conclusion-text">
          {getRecommendationText()}
        </p>
        <div className="assessment-results__focus-areas">
          <strong>Mga Pangunahing Aspeto na Dapat Pagtuunan:</strong> 
          <span className="assessment-results__focus-value">{assessmentData.focusAreas || 'pagkilala ng mga tunog at pantig'}</span>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;