import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faEdit,
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faFileAlt,
  faImage,
  faVolumeUp,
  faBookOpen,
  faFont,
  faQuestionCircle,
  faLayerGroup,
  faCalendarAlt,
  faChevronDown,
  faChevronUp,
  faList,
  faLanguage,
  faSpellCheck
} from '@fortawesome/free-solid-svg-icons';
import './ActivityCard.css';

// Component to display activity cards in the ManageActivities view
const ActivityCard = ({ activity, templateType, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [showRejectionDetails, setShowRejectionDetails] = useState(false);

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get icon based on template type
  const getTemplateTypeIcon = () => {
    switch(templateType) {
      case 'template':
        return faLayerGroup;
      case 'question':
        return faQuestionCircle;
      case 'choice':
        return faList;
      case 'sentence':
        return faBookOpen;
      default:
        return faFileAlt;
    }
  };

  // Get icon based on content type/question type
  const getContentTypeIcon = () => {
    if (!activity) return faFileAlt;

    // For Question Templates
    if (templateType === 'question') {
      switch(activity.questionType) {
        case 'patinig': 
        case 'katinig': 
          return faFont;
        case 'malapantig': 
          return faLanguage;
        case 'word': 
          return faSpellCheck;
        default: 
          return faQuestionCircle;
      }
    }
    
    // For Choice Templates
    if (templateType === 'choice') {
      if (activity.choiceType?.includes('Sound')) return faVolumeUp;
      if (activity.hasImage) return faImage;
      return faList;
    }
    
    // For Sentence Templates (Reading Passages)
    if (templateType === 'sentence') {
      return faBookOpen;
    }
    
    // For Assessment Templates
    if (templateType === 'template') {
      switch(activity.category) {
        case 'Reading Comprehension':
          return faBookOpen;
        case 'Alphabet Knowledge':
          return faFont;
        case 'Word Recognition':
          return faSpellCheck;
        default:
          return faLayerGroup;
      }
    }

    return faFileAlt;
  };

  // Render status badge
  const renderStatusBadge = () => {
    switch (activity.status) {
      case 'pending':
        return (
          <div className="status-badge pending">
            <FontAwesomeIcon icon={faHourglassHalf} /> Pending Approval
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
    switch (activity.status) {
      case 'pending':
        return (
          <div className="status-message-box pending">
            <div className="status-message-icon">
              <FontAwesomeIcon icon={faHourglassHalf} />
            </div>
            <div className="status-message-content">
              <h4>Waiting for admin approval</h4>
              <p>This template cannot be edited while pending approval</p>
              <p className="status-message-date">
                <FontAwesomeIcon icon={faCalendarAlt} /> Submitted: {formatDate(activity.submittedAt || activity.createdAt)}
              </p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="status-message-box rejected">
            <div className="status-message-icon">
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <div className="status-message-content">
              <h4>Admin has rejected this template</h4>
              <p>Review feedback and make necessary changes before resubmitting</p>
              <button
                className="toggle-details-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRejectionDetails(!showRejectionDetails);
                }}
              >
                {showRejectionDetails ? 'Hide Details' : 'Show Details'}
              </button>

              {showRejectionDetails && (
                <div className="rejection-details">
                  <p className="rejection-date">
                    <FontAwesomeIcon icon={faCalendarAlt} /> Rejected on: {formatDate(activity.lastModified || activity.createdAt)}
                  </p>
                  <div className="rejection-reason">
                    <h5>Rejection Reason:</h5>
                    <p>{activity.adminRemarks || "No specific remarks provided."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Get template type specific details
  const getTemplateSpecificDetails = () => {
    if (templateType === 'question') {
      return (
        <>
          <div className="metadata-row">
            <span className="metadata-label">Question Type:</span>
            <span className="metadata-value">{activity.questionType || 'Not specified'}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Applies To:</span>
            <span className="metadata-value">{activity.applicableChoiceTypes?.join(', ') || 'Not specified'}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Correct Type:</span>
            <span className="metadata-value">{activity.correctChoiceType || 'Not specified'}</span>
          </div>
        </>
      );
    }
    
    if (templateType === 'choice') {
      return (
        <>
          <div className="metadata-row">
            <span className="metadata-label">Choice Type:</span>
            <span className="metadata-value">{activity.choiceType || 'Not specified'}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Value:</span>
            <span className="metadata-value">{activity.choiceValue || 'Not specified'}</span>
          </div>
          {activity.soundText && (
            <div className="metadata-row">
              <span className="metadata-label">Sound Text:</span>
              <span className="metadata-value">{activity.soundText}</span>
            </div>
          )}
          <div className="metadata-row">
            <span className="metadata-label">Has Image:</span>
            <span className="metadata-value">{activity.hasImage ? 'Yes' : 'No'}</span>
          </div>
        </>
      );
    }
    
    if (templateType === 'sentence') {
      return (
        <>
          <div className="metadata-row">
            <span className="metadata-label">Pages:</span>
            <span className="metadata-value">{activity.pages || 'Not specified'}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Questions:</span>
            <span className="metadata-value">{activity.questions || 'Not specified'}</span>
          </div>
        </>
      );
    }
    
    if (templateType === 'template') {
      return (
        <>
          <div className="metadata-row">
            <span className="metadata-label">Questions:</span>
            <span className="metadata-value">{activity.questionCount || 'Not specified'}</span>
          </div>
        </>
      );
    }
    
    return null;
  };

  // Get card type based on activity status
  const getCardType = () => {
    switch (activity.status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'rejected';
      default: return 'primary';
    }
  };

  return (
    <div className={`activity-card ${getCardType()}`}>
      <div className="activity-card-header">
        <div className="activity-title-area">
          <div className="activity-icon">
            <FontAwesomeIcon icon={getTemplateTypeIcon()} className="template-type-icon" />
            <FontAwesomeIcon icon={getContentTypeIcon()} className="content-type-icon" />
          </div>
          <h3 className="activity-title">{activity.title}</h3>
        </div>
        {renderStatusBadge()}
      </div>

      <div className="activity-card-body">
        <div className="activity-metadata">
          <div className="metadata-row">
            <span className="metadata-label">Category:</span>
            <span className="metadata-value">{activity.category || 'Not categorized'}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Reading Level:</span>
            <span className="metadata-value">{activity.level || activity.readingLevel || 'Not specified'}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Template Type:</span>
            <span className="metadata-value">{
              templateType === 'template' ? 'Assessment Template' :
              templateType === 'question' ? 'Question Template' :
              templateType === 'choice' ? 'Choice Template' :
              templateType === 'sentence' ? 'Reading Passage' : 'Unknown'
            }</span>
          </div>

          {/* Template type specific details */}
          {getTemplateSpecificDetails()}

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
              <p className="description-text">
                {expanded || activity.description.length <= 120
                  ? activity.description
                  : `${activity.description.substring(0, 120)}...`}
              </p>
              {activity.description.length > 120 && (
                <button
                  className="expand-btn"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Show Less' : 'Show More'}
                  <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
                </button>
              )}
            </div>
          )}

          {/* Status Message Box */}
          {renderStatusMessage()}
        </div>

        <div className="activity-actions">
          <Link to={`/teacher/preview-${templateType}/${activity.id}`} className="preview-btn">
            <FontAwesomeIcon icon={faEye} /> Preview
          </Link>

          {activity.status !== 'pending' && (
            <Link to={`/teacher/edit-${templateType}/${activity.id}`} className="edit-btn">
              <FontAwesomeIcon icon={faEdit} /> Edit
            </Link>
          )}

          <button className="delete-btn" onClick={() => onDelete(activity)}>
            <FontAwesomeIcon icon={faTrash} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;