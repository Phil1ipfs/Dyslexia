import React, { useState } from 'react';
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
  faBookReader,
  faMicrophone,
  faFont,
  faLayerGroup,
  faInfoCircle,
  faExclamationTriangle,
  faCalendarAlt,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import './ActivityCard.css';

const ActivityCard = ({ activity, onDelete }) => {
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

  const normalize = s => (s || '').toLowerCase();


  // Get icon based on content type
  const getContentTypeIcon = () => {
    if (!activity.contentType) return faFileAlt;

    const contentType = activity.contentType.toLowerCase();
    switch (contentType) {
      case 'reading': return faBookReader;
      case 'image': return faImage;
      case 'voice':
      case 'audio': return faVolumeUp;
      case 'interactive': return faLayerGroup;
      default: return faFileAlt;
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
    switch (activity.status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'locked': return 'locked';
      case 'rejected': return 'rejected';
      default:
        // Default types based on activity type
        if (activity.type === 'assessment') return 'assessment';
        return 'primary';
    }
  };

  // Render status badge
  const renderStatusBadge = () => {
    switch (activity.status) {
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
    switch (activity.status) {
      case 'pending':
        return (
          <div className="status-message-box pending">
            <div className="status-message-icon">
              <FontAwesomeIcon icon={faHourglassHalf} />
            </div>
            <div className="status-message-content">
              <h4>Waiting for admin approval</h4>
              <p>This activity cannot be edited while pending approval</p>
              <p className="status-message-datee">
                <FontAwesomeIcon icon={faCalendarAlt} /> Submitted: {formatDate(activity.submittedAt)}
              </p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="status-message-box rejected">
            <div className="status-message-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="status-message-content">
              <h4>Admin has rejected this activity</h4>
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
                    <FontAwesomeIcon icon={faCalendarAlt} /> Rejected on: {formatDate(activity.lastModified)}
                  </p>
                  <div className="rejection-reason">
                    <h5>Rejection Reason:</h5>
                    <p>{activity.adminRemarks || "No specific remarks provided."}</p>
                  </div>
                  <div className="rejection-instructions">
                    <ul>
                      <li>Review all content for accuracy and completeness</li>
                      <li>Maintain original content structure and types</li>
                      <li>Fix identified issues and resubmit for approval</li>
                    </ul>
                  </div>
                </div>
              )}
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
              <p className="status-message-datee">
                <FontAwesomeIcon icon={faCalendarAlt} /> Approved: {formatDate(activity.lastModified)}
              </p>
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
              <p className="status-message-datee">
                <FontAwesomeIcon icon={faCalendarAlt} /> Approved: {formatDate(activity.lastModified)}
              </p>
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

  // Get question types summary
  const getQuestionTypesSummary = () => {
    if (!activity.levels || !Array.isArray(activity.levels) || activity.levels.length === 0) {
      return "No questions";
    }

    // Collect all questions from all levels
    const allQuestions = activity.levels.flatMap(level => level.questions || []);

    if (allQuestions.length === 0) return "No questions";

    // Count question types
    const typeCounts = {
      text: 0,
      image: 0,
      audio: 0,
      voice: 0
    };

    allQuestions.forEach(question => {
      const type = question.contentType?.toLowerCase() || 'text';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Create summary string
    const parts = [];

    if (typeCounts.text) parts.push(`${typeCounts.text} text`);
    if (typeCounts.image) parts.push(`${typeCounts.image} image`);
    if (typeCounts.audio || typeCounts.voice) {
      const audioCount = (typeCounts.audio || 0) + (typeCounts.voice || 0);
      parts.push(`${audioCount} audio`);
    }

    return parts.length > 0
      ? `${allQuestions.length} questions (${parts.join(', ')})`
      : `${allQuestions.length} questions`;
  };


  // Get content type breakdown
  const getContentTypeBreakdown = () => {
    if (!activity.levels) return null;

    const counts = {};
    activity.levels.forEach(level => {
      // prefer level.contentType, otherwise use activity.contentType
      const raw = level.contentType ?? activity.contentType;
      const type = normalize(raw) || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });


    const contentTypeCounts = {};

    activity.levels.forEach(level => {
      const rawType = level.contentType ?? activity.contentType;
      const contentType = normalize(rawType) || 'unknown';

      contentTypeCounts[contentType] = (contentTypeCounts[contentType] || 0) + 1;
    });

    return (
      <div className="content-type-breakdown">
        {Object.entries(contentTypeCounts).map(([type, count]) => {
          // Choose an icon per type
          let icon;
          switch (type) {
            case 'reading':
              icon = faBookReader;
              break;
            case 'image':
              icon = faImage;
              break;
            case 'voice':
            case 'audio':
              icon = faVolumeUp;
              break;
            case 'interactive':
              icon = faLayerGroup;
              break;
            default:
              icon = faFileAlt;
          }

          const label = type.charAt(0).toUpperCase() + type.slice(1);

          return (
            <div key={type} className="content-type-item">
              <FontAwesomeIcon icon={icon} />
              <span className="content-type-label">{label}</span>
              <span className="content-type-count">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render level previews
  const renderLevelPreviews = () => {
    if (!activity.levels || activity.levels.length === 0) return null;

    return (
      <div className="level-previews">
        {activity.levels.map((level, index) => {
          // 1) pick the level's own type or fall back to the activity's type
          const rawType = level.contentType ?? activity.contentType;
          const type = normalize(rawType) || 'unknown';

          // 2) choose an icon for each type
          let icon;
          switch (type) {
            case 'reading':
              icon = faBookReader;
              break;
            case 'image':
              icon = faImage;
              break;
            case 'voice':
            case 'audio':
              icon = faVolumeUp;
              break;
            case 'interactive':
              icon = faLayerGroup;
              break;
            default:
              icon = faFileAlt;
          }

          // 3) capitalize the label
          const label = type.charAt(0).toUpperCase() + type.slice(1);

          return (
            <div key={level.id || index} className="level-preview-item">
              <div className="level-preview-header">
                <span className="level-name">
                  {level.levelName || `Level ${index + 1}`}
                </span>
                <div className="level-type">
                  <FontAwesomeIcon icon={icon} />
                  <span>{`${label} Based`}</span>
                </div>
              </div>
              <div className="level-preview-content">
                {/* your existing passage + questions preview */}
                {type === 'reading' && level.passage?.text && (
                  <div className="passage-preview">
                    <span className="preview-label">Passage:</span>
                    <span className="preview-text">
                      {level.passage.text.length > 60
                        ? level.passage.text.substring(0, 60) + '…'
                        : level.passage.text}
                    </span>
                  </div>
                )}
                <div className="questions-count">
                  <span className="preview-label">Questions:</span>
                  <span className="preview-text">
                    {level.questions?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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
            <span className="metadata-valuee">{activity.level}</span>
          </div>

         

          <div className="metadata-row">
            <span className="metadata-label">Type:</span>
            <span className="metadata-valuee">
              {activity.type === 'template' && 'Activity Template'}
              {activity.type === 'assessment' && 'Pre-Assessment'}
            </span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Structure:</span>
            <span className="metadata-valuee">
              {(activity.contentType === 'Reading' || activity.hasReadingPassage)
                ? 'Reading passage with questions'
                : 'Question-based activity'}
            </span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Levels:</span>
            <span className="metadata-valuee">{getLevelsInfo()}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Questions:</span>
            <span className="metadata-valuee">{getQuestionTypesSummary()}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Created:</span>
            <span className="metadata-valuee">{formatDate(activity.createdAt)}</span>
          </div>

          {activity.lastModified && (
            <div className="metadata-row">
              <span className="metadata-label">Last Modified:</span>
              <span className="metadata-valuee">{formatDate(activity.lastModified)}</span>
            </div>
          )}

          {activity.description && (
            <div className="description-section">
              <span className="metadata-label">Description:</span>
              <p className="description-textt">
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

          {/* Content Type Breakdown */}
          {activity.levels && activity.levels.length > 0 && (
            <div className="content-types-section">
              <span className="metadata-label">Content Types:</span>
              {getContentTypeBreakdown()}
            </div>
          )}

          {/* Level Previews - Show on expansion or if rejected */}
          {(expanded || activity.status === 'rejected') &&
            renderLevelPreviews()
          }
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