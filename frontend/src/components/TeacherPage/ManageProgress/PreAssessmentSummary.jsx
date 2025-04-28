import React from 'react';
import { FaChartLine, FaStar, FaCalendar } from 'react-icons/fa';

const PreAssessmentSummary = ({ assessmentData }) => {
  if (!assessmentData) return null;
  
  return (
    <div className="assessment-summary-card">
      <div className="assessment-header">
        <h3>
          <FaChartLine /> Pre-Assessment Results
        </h3>
        <div className={`badge ${getScoreClass(assessmentData.overallScore || 63)}`}>
          {assessmentData.overallScore || 63}%
        </div>
      </div>
      
      <div className="summary-content">
        <div className="summary-item">
          <FaStar className="summary-icon" />
          <div>
            <div className="summary-value">{assessmentData.readingLevel || "Level 2"}</div>
            <div className="summary-label">Reading Level</div>
          </div>
        </div>
        
        <div className="summary-item">
          <FaCalendar className="summary-icon" />
          <div>
            <div className="summary-value">{assessmentData.assessmentDate || "April 15, 2025"}</div>
            <div className="summary-label">Assessment Date</div>
          </div>
        </div>
        
        <div className="recommended-level">
          <span>Recommended Level:</span> {assessmentData.recommendedLevel || "Level 2"}
        </div>
      </div>
    </div>
  );
};

// Helper function to determine score class based on percentage
const getScoreClass = (score) => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "average";
  return "needs-improvement";
};

export default PreAssessmentSummary;