import React from 'react';
import { 
  FaChartLine, 
  FaStar, 
  FaCalendarAlt, 
  FaCheckCircle
} from 'react-icons/fa';
import './professional-styles.css';

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

  // Get recommended level - use recommendedLevel if available, otherwise use current level
  const recommendedLevel = assessmentData.recommendedLevel || assessmentData.readingLevel;
  
  // Get level class
  const currentLevelClass = getReadingLevelClass(assessmentData.readingLevel);
  const recommendedLevelClass = getReadingLevelClass(recommendedLevel);
  const scoreClass = getScoreClass(score);
  
  return (
    <div className="reader-card reader-assessment-card">
      <div className="reader-assessment-header">
        <h3 className="reader-assessment-title">
          <FaChartLine className="reader-header-icon" />
          Reading Assessment (CRLA)
        </h3>
        <div className={`reader-score-badge ${scoreClass}`}>
          {score}%
        </div>
      </div>
      
      <div className="reader-assessment-content">
        <div className={`reader-assessment-item ${currentLevelClass}`}>
          <div className="reader-item-icon">
            <FaStar />
          </div>
          <div className="reader-item-content">
            <div className="reader-item-value">
              {assessmentData.readingLevel || "Not Assessed"}
            </div>
            <div className="reader-item-label">
              Current Reading Level
            </div>
          </div>
        </div>
        
        <div className="reader-assessment-item">
          <div className="reader-item-icon calendar-icon">
            <FaCalendarAlt />
          </div>
          <div className="reader-item-content">
            <div className="reader-item-value date-value">
              {formatDate(assessmentDate)}
            </div>
            <div className="reader-item-label">
              Assessment Date
            </div>
          </div>
        </div>
        
        <div className="reader-assessment-divider"></div>
        
        <div className="reader-assessment-recommendation">
          <FaCheckCircle className={`reader-recommendation-icon ${recommendedLevelClass}`} />
          <span className="reader-recommendation-label">
            Recommended Level:
          </span>
          <span className={`reader-recommendation-value ${recommendedLevelClass}`}>
            {recommendedLevel || "Not Assessed"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryCard;