import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

const PreAssessmentResults = ({ assessmentData }) => {
  if (!assessmentData) {
    return (
      <div className="empty-state">
        <h3>No Pre-Assessment Data Available</h3>
        <p>The pre-assessment may not have been completed for this student yet.</p>
      </div>
    );
  }
  
  // Get CSS class based on skill category
  const getSkillClass = (category) => {
    switch (category) {
      case 'Vowel Sound': return 'vowel-sound';
      case 'Syllable Blending': return 'syllable-blending';
      case 'Word Recognition': return 'word-recognition';
      case 'Reading Comprehension': return 'reading-comprehension';
      default: return '';
    }
  };
  
  const { skillDetails = [] } = assessmentData;
  
  return (
    <div className="assessment-results">
      <div className="assessment-info">
        <div className="info-icon">
          <FaInfoCircle />
        </div>
        <div className="info-text">
          <p>
            Based on the pre-assessment conducted on {assessmentData.assessmentDate},
            we've determined that this student is at <strong>{assessmentData.readingLevel}</strong>.
            Below are the detailed results of their reading skills assessment.
          </p>
        </div>
      </div>
      
      <div className="skill-results">
        <h3>Reading Skills Analysis</h3>
        <div className="skill-bars">
          {skillDetails.map((skill, index) => (
            <div key={index} className="skill-bar-container">
              <div className="skill-label">
                <span>{skill.category}</span>
                <span className="skill-score">{skill.score}%</span>
              </div>
              <div className="skill-bar-wrapper">
                <div
                  className={`skill-bar-fill ${getSkillClass(skill.category)}`}
                  style={{ width: `${skill.score}%` }}
                ></div>
              </div>
              <div className="skill-analysis">
                <p>{skill.analysis}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="assessment-conclusion">
        <h3>Recommendations</h3>
        <p>
          Based on this assessment, we recommend focusing on activities that develop 
          the student's skills in <strong>{assessmentData.focusAreas || 'sound and syllable recognition'}</strong>.
          Activities should be at <strong>{assessmentData.recommendedLevel || assessmentData.readingLevel}</strong> level.
        </p>
      </div>
    </div>
  );
};

export default PreAssessmentResults;