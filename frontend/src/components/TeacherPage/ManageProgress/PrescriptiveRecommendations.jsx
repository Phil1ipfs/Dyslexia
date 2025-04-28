import React from 'react';
import { 
  FaEdit, 
  FaLightbulb, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa';

const PrescriptiveRecommendations = ({ recommendations, onEditActivity }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="empty-state">
        <FaExclamationTriangle className="info-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
        <h3>No Recommendations Available</h3>
        <p>Complete a pre-assessment to generate personalized recommendations.</p>
      </div>
    );
  }

  // Get color class for skill category
  const getCategoryColorClass = (category) => {
    switch (category) {
      case 'Vowel Sound': return 'vowel-sound';
      case 'Syllable Blending': return 'syllable-blending';
      case 'Word Recognition': return 'word-recognition';
      case 'Reading Comprehension': return 'reading-comprehension';
      default: return '';
    }
  };

  return (
    <div className="tab-panel">
      <div className="assessment-info">
        <FaInfoCircle className="info-icon" />
        <div className="info-text">
          <p>
            <strong>System-Generated Recommendations:</strong> Based on the student's pre-assessment results and ongoing progress, 
            the system has identified the following recommendations. These are areas where additional 
            practice or intervention may be beneficial to improve reading comprehension skills.
          </p>
          <p>
            You can edit activities to customize them for this student's specific needs.
            Edited activities will require admin approval before they can be used.
          </p>
        </div>
      </div>

      <div className="activity-list">
        {recommendations.map((rec) => (
          <div key={rec.id} className="activity-item">
            <div className={`activity-icon ${getCategoryColorClass(rec.category)}`}>
              <FaLightbulb />
            </div>
            <div className="activity-details">
              <div className="activity-title">{rec.title}</div>
              <div className="activity-meta">
                <div>{rec.category}</div>
                <div>
                  Current Score: <strong>{rec.score}%</strong> | 
                  Target Score: <strong>{rec.targetScore}%</strong>
                </div>
                <div className="activity-score">
                  {rec.status === 'pending_approval' ? 'Pending Approval' :
                   rec.status === 'completed' ? 'Completed' :
                   rec.status === 'in_progress' ? 'In Progress' :
                   rec.status}
                </div>
              </div>
              <div className="skill-analysis" style={{ marginTop: '0.75rem' }}>
                <p>{rec.analysis || 'No specific analysis provided.'}</p>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #eee'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCheckCircle style={{ color: 'var(--success-color)' }} /> 
                  <span><strong>Recommendation:</strong> {rec.recommendation}</span>
                </div>
                <button
                  className="btn-goto-assign"
                  onClick={() => onEditActivity(rec)}
                  disabled={rec.status === 'pending_approval'}
                  style={{ 
                    opacity: rec.status === 'pending_approval' ? 0.6 : 1,
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <FaEdit /> {rec.status === 'pending_approval' ? 'Awaiting Approval' : 'Edit Activity'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrescriptiveRecommendations;