// src/pages/Teachers/ManageActivities.jsx
import React, { useState } from "react";
import "../../css/Teachers/manageActivity.css";

function ManageActivities() {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activeLevel, setActiveLevel] = useState("Antas Una");
  const [showPonetiko, setShowPonetiko] = useState(true); // State to control the dropdown

  const readingLevels = [
    {
      level: "Antas Una",
      activities: [
        { title: "Unang Tanong", type: "tanong" },
        { title: "Pangalawang Tanong", type: "tanong" },
        { title: "Pangatlong Tanong", type: "tanong" }
      ]
    },
    {
      level: "Antas Pangalawa",
      activities: [
        { title: "Unang Tanong", type: "tanong" },
        { title: "Pangalawang Tanong", type: "tanong" },
        { title: "Pangatlong Tanong", type: "tanong" }
      ]
    },
    {
      level: "Antas Pangatlo",
      activities: [
        { title: "Unang Tanong", type: "tanong" },
        { title: "Pangalawang Tanong", type: "tanong" },
        { title: "Pangatlong Tanong", type: "tanong" }
      ]
    }
  ];

  const handleAddActivity = () => {
    setShowAddActivity(true);
  };

  const handleCancel = () => {
    setShowAddActivity(false);
  };

  const handleLevelSelect = (level) => {
    setActiveLevel(level);
  };

  const togglePonetiko = () => {
    setShowPonetiko(!showPonetiko);
  };

  return (
    <div className="prefed-activities-container">
      <div className="prefed-activities-card">
        <div className="header-section">
          <h1 className="main-title">Manage Activities</h1>
          <p className="sub-title">Add, Edit and Modify Activities</p>
          <div className="header-illustration">
            <img src="/path/to/your/illustration.png" alt="" className="illustration-img" />
          </div>
        </div>

        {/* Ehersisyong Ponetiko Container with Dropdown */}
        <div className="ponetiko-container">
          <div className="ponetiko-header" onClick={togglePonetiko}>
            <div className="activity-icon-container">
              <img src="/path/to/book-icon.png" alt="" className="book-icon" />
            </div>
            <h2 className="ponetiko-title">Ehersisyong Ponetiko</h2>
            <div className="ponetiko-dropdown-icon">
              <i className={`fas fa-chevron-${showPonetiko ? 'up' : 'down'}`}></i>
            </div>
          </div>

          {showPonetiko && (
            <div className="activity-content">
              <div className="table-header">
                <div className="col-reading-level">READING ASSESSMENT LEVEL</div>
                <div className="col-details">VIEW DETAILS</div>
                <div className="col-action">ACTION</div>
              </div>

              {readingLevels.map((level, index) => (
                <div className="level-section">
                  <div className="level-header" onClick={() => handleLevelSelect(level.level)}>
                    <div className="level-name">{level.level}</div>
                    <div className="dropdown-icon">
                      <i className={`fas fa-chevron-${activeLevel === level.level ? 'up' : 'down'}`}></i>
                    </div>
                  </div>

                  {activeLevel === level.level && (
                    <div className="level-content-v2">
                      <div className="level-actions-row">
                        <button className="view-details-btn">View Details</button>
                        <button className="add-more-activity-btn" onClick={handleAddActivity}>
                          <i className="fas fa-plus"></i> Add More Activity
                        </button>
                      </div>

                      {level.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="activity-row">
                          <div className="activity-left">
                            <i className="fas fa-grip-vertical grip-icon" />
                            <span className="activity-titlee">{activity.title}</span>
                          </div>
                          <div className="activity-right">
                            <button className="modify-btn">
                              <i className="fas fa-pen"></i> Modify
                            </button>
                            <button className="delete-btn">
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}


                </div>

              ))}
            </div>
          )}
        </div>
      </div>

      {showAddActivity && (
        <div className="modal-overlay">
          <div className="add-activity-modal">
            <div className="modal-header">
              <h2>Antas Una</h2>
              <h3>Ehersisyong Ponetiko</h3>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "100%" }}></div>
              <div className="progress-text">4/4</div>
            </div>

            <div className="activity-form">
              <div className="form-row">
                <label>Ang Tanong</label>
                <input type="text" placeholder="***************" />
              </div>

              <div className="form-row">
                <label>GIF/ Imahe sa Tanong</label>
                <div className="file-upload">
                  <button className="browse-btn">Browse File</button>
                  <span className="file-status">No file selected</span>
                </div>
              </div>

              <div className="options-section">
                <div className="option-item">
                  <div className="option-label">
                    <span className="option-number">1</span>
                    <span>Unang Pagpipilian</span>
                  </div>
                  <div className="file-upload">
                    <button className="browse-btn">Browse File</button>
                    <span className="file-status">No file selected</span>
                  </div>
                </div>

                <div className="option-item">
                  <div className="option-label">
                    <span className="option-number">2</span>
                    <span>Pangalawang Pagpipilian</span>
                  </div>
                  <div className="file-upload">
                    <button className="browse-btn">Browse File</button>
                    <span className="file-status">No file selected</span>
                  </div>
                </div>

                <div className="option-item">
                  <div className="option-label">
                    <span className="option-number">3</span>
                    <span>Pangatlong na Pagpipilian</span>
                  </div>
                  <div className="file-upload">
                    <button className="browse-btn">Browse File</button>
                    <span className="file-status">No file selected</span>
                  </div>
                </div>
              </div>

              <div className="options-actions">
                <button className="remove-option-btn">-Magbawas ng Pagpipilian</button>
                <button className="add-option-btn">+ Magdagdag pa ng Pagpipilian</button>
              </div>

              <div className="hints-section">
                <div className="hints-dropdown">
                  <div className="dropdown-header">
                    <span>Hints Explanations</span>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                  <textarea placeholder="Hint Explanation"></textarea>
                </div>

                <div className="correct-answer-section">
                  <div className="dropdown-header correct-answer">
                    <span>Ang Tamang Sagot</span>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                  <div className="correct-options">
                    <div className="correct-option">
                      <input type="radio" name="correctAnswer" id="opt1" />
                      <label htmlFor="opt1">Unang Pagpipilian</label>
                    </div>
                    <div className="correct-option">
                      <input type="radio" name="correctAnswer" id="opt2" />
                      <label htmlFor="opt2">Pangalawa Pagpipilian</label>
                    </div>
                    <div className="correct-option">
                      <input type="radio" name="correctAnswer" id="opt3" />
                      <label htmlFor="opt3">Pangatlo Pagpipilian</label>
                    </div>
                  </div>
                  <button className="preview-btn">View Sample Preview</button>
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                <button className="add-activity-btn">Add Activity</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageActivities;