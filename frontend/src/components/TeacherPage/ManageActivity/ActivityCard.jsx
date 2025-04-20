// Updated ActivityCard.jsx with enhanced functionality
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEdit, 
  faTrash, 
  faLock, 
  faClock,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faFileAlt,
  faImage,
  faVolumeUp,
  faBookReader
} from '@fortawesome/free-solid-svg-icons';
import './ActivityCard.css';

const ActivityCard = ({ activity, onDelete }) => {
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get icon based on content type
  const getContentTypeIcon = () => {
    switch(activity.contentType?.toLowerCase()) {
      case 'reading': return faFileAlt;
      case 'image': return faImage;
      case 'voice': return faVolumeUp;
      default: return faBookReader;
    }
  };

  // Render category tags
  const renderCategoryTags = (categories) => {
    if (!categories || !Array.isArray(categories)) return null;
    
    return categories.map((category, idx) => (
      <span key={idx} className="category-tag">{category}</span>
    ));
  };

  // Determine card type based on activity status
  const getCardType = () => {
    switch(activity.status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'locked': return 'locked';
      case 'rejected': return 'rejected';
      default:
        // Default types based on activity type
        if (activity.type === 'assessment') return 'assessment';
        if (activity.type === 'practice') return 'practice';
        return 'primary';
    }
  };

  // Render status badge
  const renderStatusBadge = () => {
    switch(activity.status) {
      case 'locked':
        return (
          <div className="status-badge locked">
            <FontAwesomeIcon icon={faLock} /> Approved & Locked
          </div>
        );
      case 'pending':
        return (
          <div className="status-badge pending">
            <FontAwesomeIcon icon={faClock} /> Pending Approval
          </div>
        );
      case 'approved':
        return (
          <div className="status-badge approved">
            <FontAwesomeIcon icon={faCheckCircle} /> Approved
          </div>
        );
      case 'rejected':
        return (
          <div className="status-badge rejected">
            <FontAwesomeIcon icon={faTimesCircle} /> Rejected
          </div>
        );
      default:
        return null;
    }
  };

  // Render status message box
  const renderStatusMessage = () => {
    switch(activity.status) {
      case 'pending':
        return (
          <div className="status-message-box pending">
            <div className="status-message-icon">
              <FontAwesomeIcon icon={faHourglassHalf} />
            </div>
            <div className="status-message-content">
              <h4>Waiting for admin approval</h4>
              <p>This activity cannot be edited while pending approval</p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="status-message-box rejected">
            <div className="status-message-content">
              <h4>Admin Remarks:</h4>
              <p>{activity.adminRemarks || "No specific remarks provided."}</p>
            </div>
          </div>
        );
      case 'locked':
        return (
          <div className="status-message-box locked">
            <div className="status-message-icon">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <div className="status-message-content">
              <h4>Approved & Locked</h4>
              <p>This activity is locked and cannot be edited</p>
            </div>
          </div>
        );
      case 'approved':
        return (
          <div className="status-message-box approved">
            <div className="status-message-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="status-message-content">
              <h4>Approved</h4>
              <p>This activity is approved and ready to use</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Get levels information
  const getLevelsInfo = () => {
    if (activity.levels && Array.isArray(activity.levels) && activity.levels.length > 0) {
      return `${activity.levels.length} level${activity.levels.length > 1 ? 's' : ''}`;
    }
    return "No levels defined";
  };

  return (
    <div className={`activity-card ${getCardType()}`}>
      <div className="activity-card-header">
        <div className="activity-title-area">
          <div className="activity-icon">
            <FontAwesomeIcon icon={getContentTypeIcon()} />
          </div>
          <h3 className="activity-title">{activity.title}</h3>
        </div>
        {renderStatusBadge()}
      </div>
      
      <div className="activity-card-body">
        <div className="activity-metadata">
          <div className="metadata-row">
            <span className="metadata-label">Antas:</span>
            <span className="metadata-value">{activity.level}</span>
          </div>
          
          <div className="metadata-row">
            <span className="metadata-label">Categories:</span>
            <div className="category-tags">
              {renderCategoryTags(activity.categories)}
            </div>
          </div>
          
          <div className="metadata-row">
            <span className="metadata-label">Type:</span>
            <span className="metadata-value">
              {activity.type === 'template' && 'Activity Template'}
              {activity.type === 'assessment' && 'Pre-Assessment'}
              {activity.type === 'practice' && 'Practice Module'}
            </span>
          </div>
          
          <div className="metadata-row">
            <span className="metadata-label">Content Type:</span>
            <span className="metadata-value">{activity.contentType}</span>
          </div>
          
          <div className="metadata-row">
            <span className="metadata-label">Levels:</span>
            <span className="metadata-value">{getLevelsInfo()}</span>
          </div>
          
          <div className="metadata-row">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">{formatDate(activity.createdAt)}</span>
          </div>

          {activity.lastModified && (
            <div className="metadata-row">
              <span className="metadata-label">Last Modified:</span>
              <span className="metadata-value">{formatDate(activity.lastModified)}</span>
            </div>
          )}
          
          {activity.description && (
            <div className="description-section">
              <span className="metadata-label">Description:</span>
              <p className="description-text">{activity.description}</p>
            </div>
          )}
          
          {/* Status Message Box */}
          {renderStatusMessage()}
        </div>
        
        <div className="activity-actions">
          <Link to={`/teacher/preview-activity/${activity.id}`} className="preview-btn">
            <FontAwesomeIcon icon={faEye} /> Preview
          </Link>
          
          {activity.status !== 'pending' && activity.status !== 'locked' && (
            <Link to={`/teacher/edit-activity/${activity.id}`} className="edit-btn">
              <FontAwesomeIcon icon={faEdit} /> Edit
            </Link>
          )}
          
          {activity.status === 'rejected' && (
            <button className="delete-btn" onClick={() => onDelete(activity)}>
              <FontAwesomeIcon icon={faTrash} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
