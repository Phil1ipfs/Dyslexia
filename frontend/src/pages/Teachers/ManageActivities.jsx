// src/pages/Teachers/ManageActivities.jsx
import React from "react";
import "../../css/manageActivity.css"; 

function ManageActivities() {
  return (
    <div className="teacher-dashboard-page">
      <h2 className="page-title">Manage Activities</h2>
      <p>Welcome! This is where you can manage and assign activities to students.</p>

      <div className="activity-placeholder">
        <p>🚧 Functionality coming soon! You’ll be able to:</p>
        <ul>
          <li>➕ Add new reading activities</li>
          <li>📂 Organize activities by level and category</li>
          <li>✏️ Edit or remove activities</li>
        </ul>
      </div>
    </div>
  );
}

export default ManageActivities;
