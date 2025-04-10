import React from 'react';
import '../styles/DashboardHeader.css';

const DashboardHeader = ({ title, notifications, onNotificationClick, currentDate }) => {
  // Generate breadcrumb based on the title
  const generateBreadcrumb = () => {
    if (title === 'Dashboard') {
      return (
        <div className="breadcrumb">
          <span>Home</span>
          <span>Dashboard</span>
        </div>
      );
    } else if (title.includes('Dashboard')) {
      return (
        <div className="breadcrumb">
          <span>Home</span>
          <span>Dashboard</span>
          <span>{title}</span>
        </div>
      );
    } else {
      return (
        <div className="breadcrumb">
          <span>Home</span>
          <span>{title}</span>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-header">
      <div>
        {generateBreadcrumb()}
        <h1>{title}</h1>
      </div>
      
      <div className="header-actions">
        <div className="date-display">
          <i>📅</i> {currentDate}
        </div>
        
        <div 
          className="notification-icon" 
          onClick={onNotificationClick}
          title="Notifications"
        >
          <i className="icon-bell">🔔</i>
          {notifications > 0 && (
            <div className="notification-badge">
              {notifications}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;