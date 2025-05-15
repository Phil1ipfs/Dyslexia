import React, { useState, useEffect } from 'react';
import { 
  FaLightbulb, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaStar, 
  FaClock, 
  FaArrowRight, 
  FaEdit,
  FaEye,
  FaPlayCircle,
  FaSyncAlt,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import StudentApiService from '../../../services/Teachers/StudentApiService';

// CSS will be included in an artifact

const PrescriptiveAnalysis = ({ student, recommendations = [], onEditActivity }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentRecommendations, setStudentRecommendations] = useState(recommendations);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [expandedRecommendations, setExpandedRecommendations] = useState({});

  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      setStudentRecommendations(recommendations);
    } else if (student?.id) {
      loadRecommendations(student.id);
    }
  }, [student, recommendations]);

  const loadRecommendations = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await StudentApiService.getPrescriptiveRecommendations(studentId);
      
      if (Array.isArray(result)) {
        setStudentRecommendations(result);
      } else {
        setStudentRecommendations([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading prescriptive recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
      setLoading(false);
    }
  };

  const handleToggleActivities = (recommendationId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [recommendationId]: !prev[recommendationId]
    }));
  };

  const handleToggleRecommendation = (recommendationId) => {
    setExpandedRecommendations(prev => ({
      ...prev,
      [recommendationId]: !prev[recommendationId]
    }));
  };

  const getRecommendationStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'literexia-status-completed';
      case 'in_progress':
        return 'literexia-status-in-progress';
      case 'pushed_to_mobile':
        return 'literexia-status-pushed';
      case 'draft':
      default:
        return 'literexia-status-draft';
    }
  };

  const getRecommendationStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pushed_to_mobile':
        return 'Pushed to Mobile';
      case 'draft':
      default:
        return 'Draft';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'literexia-priority-high';
      case 'medium':
        return 'literexia-priority-medium';
      case 'low':
        return 'literexia-priority-low';
      default:
        return 'literexia-priority-medium';
    }
  };

  const handleEditActivity = (activity) => {
    if (onEditActivity) {
      onEditActivity(activity);
    }
  };

  if (loading) {
    return (
      <div className="literexia-loading">
        <FaSyncAlt className="literexia-spinner" />
        <p>Loading prescriptive recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="literexia-error">
        <FaExclamationTriangle />
        <p>{error}</p>
        <button onClick={() => loadRecommendations(student?.id)} className="literexia-retry-btn">
          <FaSyncAlt /> Retry
        </button>
      </div>
    );
  }

  if (!studentRecommendations || studentRecommendations.length === 0) {
    return (
      <div className="literexia-empty-state">
        <FaLightbulb className="literexia-empty-icon" />
        <h3>No Prescriptive Recommendations Available</h3>
        <p>There are no personalized recommendations for this student yet. Continue evaluating their progress to generate recommendations.</p>
      </div>
    );
  }

  return (
    <div className="literexia-prescriptive-container">
      <div className="literexia-recommendations-header">
        <div className="literexia-header-info">
          <h3>
            <FaLightbulb /> Personalized Learning Recommendations
          </h3>
          <p>
            Based on {student?.name || 'this student'}'s performance in the {student?.readingLevel || 'current'} reading level. 
            These recommendations are designed to address specific learning needs.
          </p>
        </div>
      </div>

      <div className="literexia-recommendations-list">
        {studentRecommendations.map((recommendation) => (
          <div 
            key={recommendation.id} 
            className={`literexia-recommendation-card ${getRecommendationStatusClass(recommendation.status)}`}
          >
            <div className="literexia-recommendation-header" onClick={() => handleToggleRecommendation(recommendation.id)}>
              <div className="literexia-recommendation-title">
                <h4>{recommendation.title}</h4>
                <div className="literexia-recommendation-meta">
                  <span className="literexia-category-pill">{recommendation.category}</span>
                  {recommendation.priorityLevel && (
                    <span className={`literexia-priority-pill ${getPriorityClass(recommendation.priorityLevel)}`}>
                      {recommendation.priorityLevel.charAt(0).toUpperCase() + recommendation.priorityLevel.slice(1)} Priority
                    </span>
                  )}
                  <span className={`literexia-status-pill ${getRecommendationStatusClass(recommendation.status)}`}>
                    {getRecommendationStatusText(recommendation.status)}
                  </span>
                </div>
              </div>
              <div className="literexia-recommendation-toggle">
                {expandedRecommendations[recommendation.id] ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>

            {expandedRecommendations[recommendation.id] && (
              <div className="literexia-recommendation-content">
                {recommendation.description && (
                  <div className="literexia-recommendation-description">
                    <p>{recommendation.description}</p>
                  </div>
                )}

                {recommendation.analysis && (
                  <div className="literexia-recommendation-analysis">
                    <h5>Analysis</h5>
                    <p>{recommendation.analysis}</p>
                  </div>
                )}

                {recommendation.recommendation && (
                  <div className="literexia-recommendation-suggestion">
                    <h5>Recommendation</h5>
                    <p>{recommendation.recommendation}</p>
                  </div>
                )}

                {recommendation.score !== undefined && (
                  <div className="literexia-recommendation-scores">
                    <div className="literexia-score-item">
                      <span className="literexia-score-label">Current Score:</span>
                      <span className="literexia-score-value">{recommendation.score}%</span>
                    </div>
                    {recommendation.targetScore && (
                      <div className="literexia-score-item">
                        <span className="literexia-score-label">Target Score:</span>
                        <span className="literexia-score-value">{recommendation.targetScore}%</span>
                      </div>
                    )}
                  </div>
                )}

                {recommendation.notes && (
                  <div className="literexia-recommendation-notes">
                    <h5>Teacher Notes</h5>
                    <p>{recommendation.notes}</p>
                  </div>
                )}

                <div className="literexia-recommendation-actions">
                  <button 
                    className="literexia-edit-btn"
                    onClick={() => handleEditActivity(recommendation)}
                  >
                    <FaEdit /> Edit & Push to Mobile
                  </button>
                  
                  {recommendation.activities && recommendation.activities.length > 0 && (
                    <button 
                      className="literexia-toggle-activities"
                      onClick={() => handleToggleActivities(recommendation.id)}
                    >
                      {expandedActivities[recommendation.id] ? 'Hide Activities' : 'Show Activities'} 
                      {expandedActivities[recommendation.id] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  )}
                </div>

                {expandedActivities[recommendation.id] && recommendation.activities && recommendation.activities.length > 0 && (
                  <div className="literexia-activities-list">
                    <h5>Suggested Activities</h5>
                    {recommendation.activities.map((activity, index) => (
                      <div key={index} className="literexia-activity-item">
                        <div className="literexia-activity-icon">
                          {activity.activityType === 'interactive' && <FaPlayCircle />}
                          {activity.activityType === 'reading' && <FaEye />}
                          {!activity.activityType && <FaLightbulb />}
                        </div>
                        <div className="literexia-activity-details">
                          <h6>{activity.title}</h6>
                          {activity.description && <p>{activity.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrescriptiveAnalysis;