import React from 'react';
import { 
  FaChartLine, 
  FaStar, 
  FaCalendarAlt
} from 'react-icons/fa';
import '../ManageProgress/css/AssessmentSummaryCard.css'; 

const AssessmentSummaryCard = ({ assessmentData }) => {
  if (!assessmentData) return null;

  // Check if student has been assessed
  const isAssessed = assessmentData.readingLevel && assessmentData.readingLevel !== 'Not Assessed';
  
  // Get reading level class based on the level
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'reading-level-not-assessed';
    
    switch(level.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return 'reading-level-early';
      
      case 'developing':
      case 'emergent':
        return 'reading-level-developing';
      
      case 'transitioning':
      case 'at grade level':
      case 'fluent':
        return 'reading-level-fluent';
      
      case 'advanced':
        return 'reading-level-advanced';
      
      default:
        return 'reading-level-not-assessed';
    }
  };
  
  // Calculate score from the reading percentage
  let readingPercentage;
  if (assessmentData.scores && assessmentData.scores.overall !== undefined) {
    readingPercentage = parseFloat(assessmentData.scores.overall);
  } else if (assessmentData.readingPercentage !== undefined) {
    readingPercentage = assessmentData.readingPercentage;
  } else if (assessmentData.overallScore !== undefined) {
    readingPercentage = assessmentData.overallScore;
  } else {
    readingPercentage = isAssessed ? 75 : 0; // Default only as last resort
  }
  
  // Round the percentage for display
  const score = Math.round(readingPercentage);
  
  // Get score class based on score
  const getScoreClass = (score) => {
    if (!isAssessed) return 'score-not-assessed';
    
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-needs-improvement';
  };
  
  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      // Format as May 7, 2025
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Get the assessment date - check multiple possible properties
  const assessmentDate = assessmentData.assessmentDate || assessmentData.lastAssessmentDate;
  
  // Get level class
  const currentLevelClass = getReadingLevelClass(assessmentData.readingLevel);
  const scoreClass = getScoreClass(score);
  
  return (
    <div className={`literexia-assessment-card ${currentLevelClass}`}>
      <div className="literexia-assessment-header">
        <h3 className="literexia-assessment-title">
          <FaChartLine className="literexia-header-icon" />
          Reading Assessment (CRLA)
        </h3>
        <div className={`literexia-score-badge ${scoreClass}`}>
          {score}%
        </div>
      </div>
      
      <div className="literexia-assessment-content">
        <div className="literexia-assessment-item">
          <div className={`literexia-item-icon ${currentLevelClass}`}>
            <FaStar />
          </div>
          <div className="literexia-item-content">
            <div className="literexia-item-label">
              Current Reading Level
            </div>
            <div className={`literexia-item-value ${currentLevelClass}`}>
              {assessmentData.readingLevel || "Not Assessed"}
            </div>
          </div>
        </div>
        
        <div className="literexia-assessment-item">
          <div className="literexia-item-icon calendar-icon">
            <FaCalendarAlt />
          </div>
          <div className="literexia-item-content">
            <div className="literexia-item-label">
              Assessment Date
            </div>
            <div className="literexia-item-value date-value">
              {formatDate(assessmentDate)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryCard;