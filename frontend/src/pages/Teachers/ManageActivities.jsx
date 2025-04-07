import React, { useState } from "react";
import "../../css/Teachers/manageActivity.css";

import ponetikoIcon from "../../assets/icons/Teachers/admin.png";
import salitaIcon from "../../assets/icons/Teachers/admin.png";
import pantigIcon from "../../assets/icons/Teachers/admin.png";

const readingLevels = [
  "Antas Una",
  "Antas Pangalawa",
  "Antas Pangatlo",
  "Antas Apat",
  "Antas Lima"
];

const activityStructure = {
  ponetiko: {
    title: "Ehersisyong Ponetiko",
    icon: ponetikoIcon,
    categories: [
      "Pagtukoy ng Tunog",
      "Pag-uugnay ng Tunog at Letra",
      "Pagbasa ng Pantig"
    ]
  },
  salita: {
    title: "Pagkilala sa mga Salita",
    icon: salitaIcon,
    categories: [
      "Pagbasa ng Salita",
      "Pag-unawa sa Salita",
      "Pagpili ng Tamang Salita"
    ]
  },
  pantig: {
    title: "Estruktura ng Pantig",
    icon: pantigIcon,
    categories: [
      "Pagbuo ng Pantig",
      "Paghahati ng Pantig",
      "Pagsusuri ng Pantig"
    ]
  }
};

function ManageActivities() {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [expandedLevel, setExpandedLevel] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleLevel = (level) => {
    setExpandedLevel(expandedLevel === level ? "" : level);
  };

  return (
    <div className="prefed-activities-container">
      <div className="prefed-activities-card">
        <h1 className="main-title">Manage Activities</h1>
        <p className="sub-title">Add, Edit in the Pre-fed and Modified Activities</p>

        {!selectedActivity && (
          <div className="activity-option-screen">
            <h2 className="select-title">Select Activity Option :</h2>
            <div className="activity-option-list">
              {Object.entries(activityStructure).map(([key, { title, icon }]) => (
                <div key={key} className="activity-option-card" onClick={() => setSelectedActivity(key)}>
                  <img src={icon} alt={title} className="option-icon" />
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedActivity && (
          <>
            <button className="back-to-options" onClick={() => setSelectedActivity(null)}>
              ⬅ Balik sa Mga Aktibidad
            </button>

            <div className="activity-title-header">
              <img src={activityStructure[selectedActivity].icon} alt="" />
              <h2>{activityStructure[selectedActivity].title}</h2>
            </div>

            <div className="activity-table">
              <div className="table-header">
                <div className="col-reading-level">READING ASSESSMENT LEVEL</div>
                <div className="col-details">VIEW DETAILS</div>
                <div className="col-action">ACTION</div>
              </div>

              {readingLevels.map((level) => (
                <div key={level} className="level-section">
                  <div className="level-header" onClick={() => toggleLevel(level)}>
                    <div className="level-name">{level}</div>
                    <i className={`fas fa-chevron-${expandedLevel === level ? "up" : "down"}`}></i>
                  </div>

                  {expandedLevel === level && (
                    <div className="level-content-v2">
                      <div className="level-actions-row">
                        <button className="view-details-btn">View Details</button>
                        <button className="add-more-activity-btn" onClick={() => setShowAddModal(true)}>
                          <i className="fas fa-plus"></i> Add More Activity
                        </button>
                      </div>

                      {activityStructure[selectedActivity].categories.map((category, index) => (
                        <div key={index} className="activity-row">
                          <div className="activity-left">
                            <i className="fas fa-grip-vertical grip-icon" />
                            <span className="activity-titlee">{category}</span>
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
          </>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="add-activity-modal">
            <div className="modal-header">
              <h2>Add Activity</h2>
              <p style={{ color: "#ccc" }}>
                Placeholder modal. Add activity form here.
              </p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="add-activity-btn">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageActivities;
