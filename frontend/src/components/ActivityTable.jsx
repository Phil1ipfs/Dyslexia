import React from 'react';
import '../styles/ActivityTable.css';

const ActivityTable = ({ activities, onAddActivity, isLoading }) => {
  // Function to get initials from teacher name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('');
  };

  return (
    <div className="activity-section">
      <div className="activity-header">
        <h2>Latest Activities Approve</h2>
        <button 
          className="add-activity-btn"
          onClick={onAddActivity}
          disabled={isLoading}
        >
          <i>+</i> Add New Activity
        </button>
      </div>
      
      {activities.length > 0 ? (
        <div className="activity-table">
          <div className="table-header">
            <div className="header-cell">Teacher Name</div>
            <div className="header-cell">Topic</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Action</div>
          </div>
          
          {activities.map(activity => (
            <div key={activity.id} className="table-row">
              <div className="cell teacher-cell">
                <div 
                  className="teacher-avatar" 
                  style={{ backgroundColor: activity.avatarColor }}
                >
                  {getInitials(activity.teacherName)}
                </div>
                <span>{activity.teacherName}</span>
              </div>
              <div className="cell">{activity.topic}</div>
              <div className="cell status-cell">
                <span className={`status-badge ${activity.status.toLowerCase()}`}>
                  {activity.status}
                </span>
              </div>
              <div className="cell action-cell">
                <button className="view-details-btn">View Details</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No activities found. Add a new activity to get started.</p>
        </div>
      )}
    </div>
  );
};

export default ActivityTable;