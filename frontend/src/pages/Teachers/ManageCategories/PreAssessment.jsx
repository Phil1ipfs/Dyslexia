// src/pages/Teachers/ManageCategories/PreAssessment.jsx
import React from "react";

import "../../../css/Teachers/ManageCategories/PreAssessment.css";


const PreAssessment = () => {
  return (
    <div className="pre-assessment-container">
      <div className="pre-assessment-content">
        <h2>Pre-Assessment Management</h2>
        <p>This feature will be implemented soon. You will be able to manage pre-assessment templates.</p>
        
        <div className="pre-assessment-card">
          <div className="pre-assessment-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="pre-assessment-info">
            <h3>Coming Soon</h3>
            <p>Pre-assessment management will allow you to:</p>
            <ul>
              <li>Create pre-assessment templates</li>
              <li>Assign pre-assessments to students</li>
              <li>Track pre-assessment results</li>
              <li>Automatically determine reading levels</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreAssessment;