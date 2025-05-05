import React from 'react';
import { FaChartLine, FaStar, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import '../ManageProgress/css/AssessmentSummaryCard.css';

const AssessmentSummaryCard = ({ assessmentData }) => {
  if (!assessmentData) return null;
  
  // Get appropriate label based on reading level
  const getLevelLabel = (level) => {
    switch(level) {
      case 'Antas 1':
        return 'Nag-uumpisang Matuto';
      case 'Antas 2':
        return 'Pa-unlad na Nag-aaral';
      case 'Antas 3':
        return 'Sanay na Mag-aaral';
      case 'Antas 4':
        return 'Maalam na Mag-aaral';
      case 'Antas 5':
        return 'Mahusay na Mag-aaral';
      default:
        return level;
    }
  };
  
  // Get score class based on percentage
  const getScoreClass = (score) => {
    if (score >= 85) return "literexia-excellent";
    if (score >= 70) return "literexia-good";
    if (score >= 50) return "literexia-average";
    return "literexia-needs-improvement";
  };
  
  // Calculate overall score
  const calculateOverallScore = () => {
    const scores = Object.values(assessmentData.scores || {});
    if (scores.length === 0) return 0;
    
    const sum = scores.reduce((total, score) => total + score, 0);
    return Math.round(sum / scores.length);
  };

  const overallScore = assessmentData.overallScore || calculateOverallScore();
  
  return (
    <div className="literexia-assessment-card">
      <div className="literexia-assessment-header">
        <h3 className="literexia-assessment-title">
          <FaChartLine className="literexia-header-icon" /> Buod ng Pagsusuri (CRLA)
        </h3>
        <div className={`literexia-score-badge ${getScoreClass(overallScore)}`}>
          {overallScore}%
        </div>
      </div>
      
      <div className="literexia-assessment-content">
        <div className="literexia-assessment-item">
          <div className="literexia-item-icon">
            <FaStar />
          </div>
          <div className="literexia-item-content">
            <div className="literexia-item-value">
              {assessmentData.readingLevel || "Antas 1"}
            </div>
            <div className="literexia-item-label">
              {getLevelLabel(assessmentData.readingLevel || "Antas 1")}
            </div>
          </div>
        </div>
        
        <div className="literexia-assessment-item">
          <div className="literexia-item-icon">
            <FaCalendarAlt />
          </div>
          <div className="literexia-item-content">
            <div className="literexia-item-value">
              {assessmentData.assessmentDate || "Abr. 15, 2025"}
            </div>
            <div className="literexia-item-label">
              Petsa ng Pagsusuri
            </div>
          </div>
        </div>
        
        <div className="literexia-assessment-recommendation">
          <FaCheckCircle className="literexia-recommendation-icon" />
          <span className="literexia-recommendation-label">Inirerekomendang Antas:</span>
          <span className="literexia-recommendation-value">
            {assessmentData.recommendedLevel || assessmentData.readingLevel || "Antas 1"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryCard;