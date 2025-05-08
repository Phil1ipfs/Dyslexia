import React from 'react';
import { 
  FaChartLine, 
  FaStar, 
  FaCalendarAlt, 
  FaCheckCircle
} from 'react-icons/fa';
import '../ManageProgress/css/AssessmentSummaryCard.css';

const AssessmentSummaryCard = ({ assessmentData }) => {
  if (!assessmentData) return null;

  // Check if student has been assessed
  const isAssessed = assessmentData.readingLevel && assessmentData.readingLevel !== 'Not Assessed';
  
  // Get reading level color based on the level
  const getLevelColor = (level) => {
    if (!level || level === 'Not Assessed') return '#DC3545'; // Red for not assessed
    
    switch(level.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return '#1f7d67'; 
      
      case 'developing':
      case 'emergent':
        return '#FF9800'; // Orange for developing levels
      
      case 'transitioning':
        return '#FFD600'; // Yellow for transitioning
      
      case 'at grade level':
        return '#4CAF50'; // Green for at grade level
      
      case 'fluent':
        return '#3F51B5'; // Blue/indigo for fluent
      
      case 'advanced':
        return '#673AB7'; // Purple for advanced
      
      default:
        return '#4C6FD6'; // Default blue
    }
  };
  
  // Calculate score from the reading percentage - prioritize scores.overall if available
  // This is the critical fix that was missing
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

  // Debug output to console to verify data
  console.log('Assessment data received:', assessmentData);
  console.log('Reading percentage:', readingPercentage);
  console.log('Score calculated:', score);
  
  return (
    <div className="literexia-assessment-card" style={{ 
      borderTopColor: getLevelColor(assessmentData.readingLevel) 
    }}>
      <div className="literexia-assessment-header">
        <h3 className="literexia-assessment-title">
          <FaChartLine style={{ color: '#3B4F81' }} /> 
          Reading Assessment (CRLA)
        </h3>
        <div 
          className="literexia-score-badge"
          style={{ 
            backgroundColor: isAssessed ? (
              score >= 85 ? '#4CAF50' : 
              score >= 70 ? '#3B4F81' : 
              score >= 50 ? '#FF9800' : '#1f7d67'
            ) : '#DC3545'
          }}
        >
          {score}%
        </div>
      </div>
      
      <div className="literexia-assessment-content">
        <div className="literexia-assessment-item">
          <div 
            className="literexia-item-icon"
            style={{ 
              backgroundColor: `${getLevelColor(assessmentData.readingLevel)}15`,
              color: getLevelColor(assessmentData.readingLevel)
            }}
          >
            <FaStar />
          </div>
          <div className="literexia-item-content">
            <div 
              className="literexia-item-value"
              style={{ color: getLevelColor(assessmentData.readingLevel) }}
            >
              {assessmentData.readingLevel || "Not Assessed"}
            </div>
            <div className="literexia-item-label">
              Current Reading Level
            </div>
          </div>
        </div>
        
        <div className="literexia-assessment-item">
          <div 
            className="literexia-item-icon"
            style={{ 
              backgroundColor: 'rgba(108, 117, 125, 0.1)',
              color: '#6c757d'
            }}
          >
            <FaCalendarAlt />
          </div>
          <div className="literexia-item-content">
            <div 
              className="literexia-item-value"
              style={{ color: '#6c757d' }}
            >
              {formatDate(assessmentDate)}
            </div>
            <div className="literexia-item-label">
              Assessment Date
            </div>
          </div>
        </div>
        
        <div className="literexia-assessment-divider"></div>
        
        <div className="literexia-assessment-recommendation">
          <FaCheckCircle 
            style={{ color: getLevelColor(recommendedLevel) }}
          />
          <span className="literexia-recommendation-label">
            Recommended Level:
          </span>
          <span 
            className="literexia-recommendation-value"
            style={{ 
              backgroundColor: `${getLevelColor(recommendedLevel)}15`,
              color: getLevelColor(recommendedLevel)
            }}
          >
            {recommendedLevel || "Not Assessed"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryCard;