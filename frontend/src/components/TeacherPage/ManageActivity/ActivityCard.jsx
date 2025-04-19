import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faLock, faClock } from '@fortawesome/free-solid-svg-icons';
import './ActivityCard.css';

const ActivityCard = ({ activity, activityStructures }) => {
  // Find the corresponding activity structure icon
  const structureKey = Object.keys(activityStructures).find(key => 
    activityStructures[key].categories.some(cat => activity.categories.includes(cat))
  );
  
  const structure = structureKey ? activityStructures[structureKey] : null;
  
  // Determine card type based on activity status
  const getCardType = () => {
    if (activity.status === 'pending') return 'warning';
    if (activity.status === 'approved') return 'success';
    if (activity.status === 'locked') return 'locked';
    
    // Default types based on activity type
    if (activity.type === 'assessment') return 'assessment';
    if (activity.type === 'practice') return 'practice';
    return 'primary';
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`activity-card ${getCardType()}`}>
      <div className="activity-card-header">
        <h3 className="activity-title">{activity.title}</h3>
        {activity.status === 'locked' && (
          <div className="locked-indicator">
            <FontAwesomeIcon icon={faLock} />
          </div>
        )}
        {activity.status === 'pending' && (
          <div className="pending-indicator">
            <FontAwesomeIcon icon={faClock} />
          </div>
        )}
      </div>
      
      <div className="activity-card-body">
        <div className="activity-metadata">
          <div className="activity-antas">
            <span className="metadata-label">Antas:</span>
            <span className="metadata-value">{activity.level}</span>
          </div>
          
          <div className="activity-categories">
            <span className="metadata-label">Categories:</span>
            <div className="category-tags">
              {activity.categories.map(category => (
                <span key={category} className="category-tag">{category}</span>
              ))}
            </div>
          </div>
          
          <div className="activity-type">
            <span className="metadata-label">Type:</span>
            <span className="metadata-value">
              {activity.type === 'template' && 'Activity Template'}
              {activity.type === 'assessment' && 'Pre-Assessment'}
              {activity.type === 'practice' && 'Practice Module'}
            </span>
          </div>
          
          <div className="activity-date">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">{formatDate(activity.createdAt)}</span>
          </div>
          
          {activity.lastModified && (
            <div className="activity-date">
              <span className="metadata-label">Last Modified:</span>
              <span className="metadata-value">{formatDate(activity.lastModified)}</span>
            </div>
          )}
        </div>
        
        <div className="activity-structure">
          {structure && (
            <div className="structure-info">
              <div className="structure-icon">{structure.icon}</div>
              <div className="structure-title">{structure.title}</div>
            </div>
          )}
        </div>
        
        <div className="activity-actions">
          <Link to={`/teacher/preview-activity/${activity.id}`} className="btn btn-preview">
            <FontAwesomeIcon icon={faEye} /> Preview
          </Link>
          
          {activity.status !== 'locked' && (
            <>
              <Link to={`/teacher/edit-activity/${activity.id}`} className="btn btn-edit">
                <FontAwesomeIcon icon={faEdit} /> Edit
              </Link>
              
              <button className="btn btn-delete">
                <FontAwesomeIcon icon={faTrash} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;