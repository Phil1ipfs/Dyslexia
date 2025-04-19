// src/pages/Teachers/TeacherProfile.jsx
import React, { useState } from "react";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiUserCheck,
  FiBookOpen,
  FiClock,
  FiBriefcase,
  FiAward,
  FiCheckCircle,
  FiPlayCircle,
  FiCoffee,
  FiLock,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import "../../css/Teachers/TeacherProfile.css";

import { teacherProfileData } from "../../data/Teachers/teacherProfileData";

function TeacherProfile() {
  const [activeTab, setActiveTab] = useState("PersonalInfo");

  const renderTabContent = () => {
    switch (activeTab) {
      case "PersonalInfo":
        return <PersonalInfo teacher={teacherProfileData} />;
      case "TeachingHistory":
        return <TeachingHistory teacher={teacherProfileData} />;
      case "Certifications":
        return <Certifications teacher={teacherProfileData} />;
      case "Activities":
        return <ActivitiesCreated teacher={teacherProfileData} />;
      case "Availability":
        return <AvailabilitySchedule teacher={teacherProfileData} />;
      default:
        return null;
    }
  };

  return (
    <div className="teacherprofile-outer">
      <div className="teacherprofile-card">
        <h2 className="tp-page-title">Teacher Profile</h2>

        {/* Tab Buttons */}
        <div className="tp-tab-buttons">
          <button
            onClick={() => setActiveTab("PersonalInfo")}
            className={activeTab === "PersonalInfo" ? "active" : ""}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab("TeachingHistory")}
            className={activeTab === "TeachingHistory" ? "active" : ""}
          >
            Teaching History
          </button>
          <button
            onClick={() => setActiveTab("Certifications")}
            className={activeTab === "Certifications" ? "active" : ""}
          >
            Certifications
          </button>
          <button
            onClick={() => setActiveTab("Activities")}
            className={activeTab === "Activities" ? "active" : ""}
          >
            Activities Created
          </button>
          <button
            onClick={() => setActiveTab("Availability")}
            className={activeTab === "Availability" ? "active" : ""}
          >
            Availability
          </button>
        </div>

        {/* Active Tab Content */}
        <div className="tp-tab-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}

// ---------------- PERSONAL INFO COMPONENT ---------------- //
function PersonalInfo({ teacher }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ show: false, message: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({ ...teacher });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmergencyChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value },
    }));
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Validation...
      if (!formData.name.trim())
        return setErrorDialog({ show: true, message: "Full name is required." });
      // ...other validations...
      setIsEditing(false);
      setShowSaveDialog(true);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="tp-profile-card">
      {/* Error Dialog */}
      {errorDialog.show && (
        <div className="save-dialog-overlay">
          <div className="save-dialog-box error">
            <p>{errorDialog.message}</p>
            <button onClick={() => setErrorDialog({ show: false, message: "" })}>OK</button>
          </div>
        </div>
      )}

      {/* Success Save Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay">
          <div className="save-dialog-box">
            <p>Profile saved successfully!</p>
            <button onClick={() => setShowSaveDialog(false)}>OK</button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* Header Row */}
      <div className="tp-personal-header">
        <div className="tp-avatar-lg">
          {formData.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()}
        </div>
        <div className="tp-personal-info">
          <h3 className="tp-teacher-name">{formData.name}</h3>
          <p className="employee-id">
            <strong>Employee ID:</strong> {formData.employeeId}
          </p>
          <div className="tp-contact-edit-group">
            <div className="tp-input-group">
              <FiMail className="tp-input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="tp-input-group">
              <FiBriefcase className="tp-input-icon" />
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </div>
        <div className="tp-action-buttons">
          <button className="tp-edit-btn" onClick={toggleEdit}>
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
          <button
            className="tp-change-password-btn"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
        </div>
      </div>

      <hr className="tp-divider" />

      {/* Personal Information Section */}
      <h4 className="tp-subtitle">Personal Information</h4>
      <div className="tp-info-grid">
        <div className="tp-input-group">
          <FiUser className="tp-input-icon" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="tp-input-group">
          <FiPhone className="tp-input-icon" />
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="tp-input-group">
          <FiCalendar className="tp-input-icon" />
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="tp-input-group">
          <FiUser className="tp-input-icon" />
          <input
            type="text"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="tp-input-group full-width-input-group">
          <FiMapPin className="tp-input-icon" />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            readOnly={!isEditing}
            className="full-width-input"
          />
        </div>
      </div>

      <h4 className="tp-subtitle">Emergency Contact</h4>
      <div className="tp-info-grid">
        <div className="tp-input-group">
          <FiUserCheck className="tp-input-icon" />
          <input
            type="text"
            name="emergencyName"
            value={formData.emergencyContact.name}
            onChange={(e) => handleEmergencyChange("name", e.target.value)}
            readOnly={!isEditing}
          />
        </div>
        <div className="tp-input-group">
          <FiPhone className="tp-input-icon" />
          <input
            type="text"
            name="emergencyNumber"
            value={formData.emergencyContact.number}
            onChange={(e) => handleEmergencyChange("number", e.target.value)}
            readOnly={!isEditing}
          />
        </div>
      </div>

      <h4 className="tp-subtitle">Bio</h4>
      <div className="tp-bio-container">
        <div className="tp-bio-field tp-input-group">
          <FiMail className="tp-input-icon" style={{ transform: "rotate(90deg)" }} />
          <textarea
            rows={4}
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
      </div>

      <h4 className="tp-subtitle">Specialization & Experience</h4>
      <div className="tp-info-grid">
        <div className="tp-input-group">
          <FiBookOpen className="tp-input-icon" />
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="tp-input-group">
          <FiClock className="tp-input-icon" />
          <input
            type="number"
            name="yearsExp"
            value={formData.yearsExp}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------- TEACHING HISTORY COMPONENT ---------------- //
function TeachingHistory({ teacher }) {
  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Teaching History</h4>
      {teacher.teachingHistory.map((entry, idx) => (
        <div key={idx} className="tp-history-entry">
          <p>
            <strong>{entry.year}</strong> — {entry.role} @ {entry.school}
          </p>
          <p>{entry.description}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

// ---------------- CERTIFICATIONS COMPONENT ---------------- //
function Certifications({ teacher }) {
  const iconMap = {
    "Certified Dyslexia Specialist": <FiAward />,
    "Multi-Sensory Teaching Method": <FiCheckCircle />,
    "Educational Technology Integration": <FiPlayCircle />,
    "Reading Intervention Program Creator": <FiCoffee />,
  };

  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Certifications & Achievements</h4>
      <div className="tp-certifications-list">
        {teacher.certifications.map((cert, idx) => (
          <div className="tp-cert-badge" key={idx}>
            <div className="tp-cert-icon">{iconMap[cert] || <FiAward />}</div>
            <span className="tp-cert-text">{cert}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- ACTIVITIES CREATED COMPONENT ---------------- //
function ActivitiesCreated({ teacher }) {
  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Activities Created</h4>
      <table className="tp-activities-table">
        <thead>
          <tr>
            <th>Title</th><th>Type</th><th>Date Created</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {teacher.activitiesCreated.map((act, idx) => (
            <tr key={idx}>
              <td>{act.title}</td>
              <td>{act.type}</td>
              <td>{act.date}</td>
              <td>
                <span className={`status-pill ${act.status === "Active" ? "active" : "completed"}`}>
                  {act.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- AVAILABILITY SCHEDULE COMPONENT ---------------- //
function AvailabilitySchedule({ teacher }) {
  const allSlots = ["8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "1:00 - 2:00", "2:00 - 3:00"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Availability Schedule</h4>
      <div className="tp-availability-table">
        <div className="tp-availability-row header">
          {days.map((day) => <div key={day} className="tp-availability-cell day-header">{day}</div>)}
        </div>
        {allSlots.map((slot, idx) => (
          <div className="tp-availability-row" key={idx}>
            {days.map((day) => {
              const isAvailable = teacher.availability[day]?.includes(slot);
              return (
                <div key={`${day}-${slot}`} className={`tp-availability-cell ${isAvailable ? "active" : ""}`}>
                  {slot}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- CHANGE PASSWORD MODAL ---------------- //
function ChangePasswordModal({ onClose }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = () => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!currentPass || !newPass || !confirmPass) {
      setError("All fields are required."); return;
    }
    if (newPass !== confirmPass) {
      setError("New passwords do not match."); return;
    }
    if (!regex.test(newPass)) {
      setError("Password must be 8+ chars with upper, lower, digit & special."); return;
    }
    alert("✅ Password changed!");
    onClose();
  };

  return (
    <div className="save-dialog-overlay">
      <div className="save-dialog-box password-modal">
        <h4>Change Password</h4>
        {error && <p className="error-text">{error}</p>}
        {[
          { val: currentPass, set: setCurrentPass, show: showCurrent, toggle: () => setShowCurrent(!showCurrent), placeholder: "Current Password" },
          { val: newPass, set: setNewPass, show: showNew, toggle: () => setShowNew(!showNew), placeholder: "New Password" },
          { val: confirmPass, set: setConfirmPass, show: showConfirm, toggle: () => setShowConfirm(!showConfirm), placeholder: "Confirm Password" }
        ].map((fld, i) => (
          <div className="password-input-group" key={i}>
            <FiLock className="input-icon-left" />
            <input
              type={fld.show ? "text" : "password"}
              placeholder={fld.placeholder}
              value={fld.val}
              onChange={e => fld.set(e.target.value)}
            />
            {fld.show
              ? <FiEyeOff className="input-icon-right" onClick={fld.toggle} />
              : <FiEye className="input-icon-right" onClick={fld.toggle} />
            }
          </div>
        ))}
        <div className="password-buttons">
          <button onClick={handleChangePassword}>Update Password</button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
