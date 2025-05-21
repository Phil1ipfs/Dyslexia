// src/pages/Teachers/ManageCategories/PreAssessment.jsx
import React from "react";
import "../../../css/Teachers/ManageCategories/PreAssessment.css";

const PreAssessment = () => {
  return (
    <div className="pre-assessment-container">
      <div className="pre-assessment-content">
        <h2>Pre-Assessment Management</h2>
        <p>
          Pre-assessments are used to determine a student's initial reading level.
          Unlike post-assessments, pre-assessments follow a standardized format
          that is customized for each student on a first-time basis.
        </p>
        
        <div className="pre-assessment-card">
          <div className="pre-assessment-icon">
            <i className="fas fa-clipboard-check"></i>
          </div>
          <div className="pre-assessment-info">
            <h3>About Pre-Assessment</h3>
            <p>
              Pre-assessment is a standardized process to evaluate a new student's 
              reading abilities. The system uses this data to assign an initial CRLA reading level.
            </p>
            <ul>
              <li>Evaluates all 5 CRLA reading categories</li>
              <li>Automatically assigns initial reading level</li>
              <li>Sets the baseline for future post-assessments</li>
              <li>Only administered once per student</li>
            </ul>
            <div className="pre-assessment-actions">
              <button className="pre-button">
                <i className="fas fa-eye"></i> Preview Pre-Assessment
              </button>
              <button className="pre-button primary">
                <i className="fas fa-graduation-cap"></i> View Student Assignments
              </button>
            </div>
          </div>
        </div>
        
        <div className="pre-assessment-stats">
          <div className="pre-stat-card">
            <div className="pre-stat-value">5</div>
            <div className="pre-stat-label">CRLA Categories</div>
          </div>
          <div className="pre-stat-card">
            <div className="pre-stat-value">75%</div>
            <div className="pre-stat-label">Passing Threshold</div>
          </div>
          <div className="pre-stat-card">
            <div className="pre-stat-value">20-25</div>
            <div className="pre-stat-label">Questions per Assessment</div>
          </div>
        </div>
        
        <div className="pre-process-steps">
          <h3>Pre-Assessment Process Flow</h3>
          <div className="pre-steps">
            <div className="pre-step">
              <div className="pre-step-number">1</div>
              <div className="pre-step-content">
                <h4>Student Assignment</h4>
                <p>New students are assigned the pre-assessment automatically.</p>
              </div>
            </div>
            <div className="pre-step">
              <div className="pre-step-number">2</div>
              <div className="pre-step-content">
                <h4>Assessment Completion</h4>
                <p>Students complete the assessment covering all 5 CRLA categories.</p>
              </div>
            </div>
            <div className="pre-step">
              <div className="pre-step-number">3</div>
              <div className="pre-step-content">
                <h4>Level Assignment</h4>
                <p>System automatically assigns an initial reading level.</p>
              </div>
            </div>
            <div className="pre-step">
              <div className="pre-step-number">4</div>
              <div className="pre-step-content">
                <h4>Post-Assessment Creation</h4>
                <p>Teachers create targeted post-assessments based on results.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreAssessment;