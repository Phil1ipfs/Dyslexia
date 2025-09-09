import React from 'react';
import { 
  FaChartLine, 
  FaStar, 
  FaCalendarAlt
} from 'react-icons/fa';
import '../ManageProgress/css/AssessmentSummaryCard.css'; 

const AssessmentSummaryCard = ({ assessmentData, student }) => {
  console.log('🔥 AssessmentSummaryCard RENDERED');
  console.log('🔥 assessmentData:', assessmentData);
  console.log('🔥 student:', student);
  
  if (!assessmentData) {
    console.log('🔥 No assessmentData, returning null');
    return null;
  }

  // Check if student has been assessed - use student's reading level from users table
  const studentReadingLevel = student?.readingLevel || 'Not Assessed';
  const isAssessed = studentReadingLevel && studentReadingLevel !== 'Not Assessed';
  
  console.log('🔥 studentReadingLevel:', studentReadingLevel);
  console.log('🔥 isAssessed:', isAssessed);
  
  // Get reading level class based on the level
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'unique-reading-level-not-assessed';
    
    switch(level.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return 'unique-reading-level-early';
      
      case 'developing':
      case 'emergent':
        return 'unique-reading-level-developing';
      
      case 'transitioning':
      case 'at grade level':
      case 'fluent':
        return 'unique-reading-level-fluent';
      
      case 'advanced':
        return 'unique-reading-level-advanced';
      
      default:
        return 'unique-reading-level-not-assessed';
    }
  };
  
  // Calculate score from available data sources
  let readingPercentage;
  let assessmentType;
  
  // Check if student has completed main assessment (category_results exists)
  
  // Check if this is ACTUAL post-assessment data (category_results from main assessment)
  // vs transformed pre-assessment data
  const isPostAssessment = assessmentData.categories && 
                           assessmentData.categories.length > 0 && 
                           assessmentData.assessmentType !== 'pre-assessment' && // Key check!
                           assessmentData.categories.some(cat => 
                             cat.categoryName && 
                             cat.score !== undefined && 
                             cat.isPassed !== undefined
                           ) &&
                           (assessmentData.overallScore > 0 || // Has meaningful score, OR
                            assessmentData.categories.some(cat => cat.isCompleted === true)); // Has completed categories
  
  console.log('Is Post Assessment:', isPostAssessment);
  console.log('Assessment Type:', assessmentData.assessmentType);
  
  if (isPostAssessment) {
    // This is category_results format (Post-Assessment)
    assessmentType = 'Post-Assessment';
    readingPercentage = assessmentData.overallScore || 0;
    console.log('Using Post-Assessment - overallScore:', assessmentData.overallScore);
  } else {
    // This is pre-assessment - use stored readingPercentage from users table
    assessmentType = 'Pre-Assessment';
    readingPercentage = student?.readingPercentage || 0; // Use readingPercentage from users table
    console.log('Using Pre-Assessment - readingPercentage from users table:', readingPercentage);
  }
  
  // Round the percentage for display
  const score = Math.round(readingPercentage);
  
  // Get score class based on score
  const getScoreClass = (score) => {
    if (!isAssessed) return 'unique-score-not-assessed';
    
    if (score >= 85) return 'unique-score-excellent';
    if (score >= 70) return 'unique-score-good';
    if (score >= 50) return 'unique-score-average';
    return 'unique-score-needs-improvement';
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
  
  // Always use reading level from student (users table)
  const displayReadingLevel = studentReadingLevel;
  
  // Get level class
  const currentLevelClass = getReadingLevelClass(displayReadingLevel);
  const scoreClass = getScoreClass(score);
  
  return (
    <div className={`unique-literexia-assessment-card ${currentLevelClass}`}>
      <div className="unique-literexia-assessment-header">
        <h3 className="unique-literexia-assessment-title">
          <FaChartLine className="unique-literexia-header-icon" />
          (CRLA Based) {assessmentType && `- ${assessmentType}`}
        </h3>
        <div className={`unique-literexia-score-badge ${scoreClass}`}>
          {score}%
        </div>
      </div>
      
      <div className="unique-literexia-assessment-content">
        <div className="unique-literexia-assessment-item">
          <div className={`unique-literexia-item-icon ${currentLevelClass}`}>
            <FaStar />
          </div>
          <div className="unique-literexia-item-content">
            <div className="unique-literexia-item-label">
              Current Reading Level
            </div>
            <div className={`unique-literexia-item-value ${currentLevelClass}`}>
              {displayReadingLevel}
            </div>
          </div>
        </div>
        
        <div className="unique-literexia-assessment-item">
          <div className="unique-literexia-item-icon unique-calendar-icon">
            <FaCalendarAlt />
          </div>
          <div className="unique-literexia-item-content">
            <div className="unique-literexia-item-label">
              Assessment Date
            </div>
            <div className="unique-literexia-item-value unique-date-value">
              {formatDate(assessmentDate)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryCard;