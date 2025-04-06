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
  FiCoffee
} from "react-icons/fi";
import "../../css/TeacherProfile.css";

function TeacherProfile() {
  const teacherData = {
    name: "Madam Jaja",
    position: "Elementary Reading Specialist",
    employeeId: "TCR-2023-0104",
    email: "jaja@literexia.edu.ph",
    contact: "+63 912 345 6789",
    gender: "Female",
    dob: "1985-09-15",
    address: "123 Maharlika St., Los Baños, Laguna",
    emergencyContact: {
      name: "Roberto Jaja",
      number: "+63 943 210 9876",
    },
    bio: "I am a dedicated reading specialist with over 10 years of experience working with children who have dyslexia...",
    specialization: "Reading Comprehension",
    yearsExp: 10,
    stats: {
      students: 24,
      classes: 128,
      progress: "87%",
      activities: 75,
    },
    certifications: [
      "Certified Dyslexia Specialist",
      "Multi-Sensory Teaching Method",
      "Educational Technology Integration",
      "Reading Intervention Program Creator",
    ],
    teachingHistory: [
      {
        year: "2018–Present",
        school: "Literexia Elementary",
        role: "Reading Specialist",
        description:
          "Led the reading intervention program, improving average reading scores by 20%. Mentored new teachers in dyslexia-focused instruction.",
      },
      {
        year: "2013–2018",
        school: "Maharlika Grade School",
        role: "English Teacher",
        description:
          "Conducted daily reading labs and established after-school tutoring for struggling readers. Increased parent engagement through monthly workshops.",
      },
    ],
    activitiesCreated: [
      { title: "Phonics Mastery Vol.1", type: "Reading Module", date: "2023-01-15", status: "Active" },
      { title: "Synonym & Antonym Fun", type: "Vocabulary Activity", date: "2022-11-02", status: "Completed" },
      { title: "Dyslexia Screening Checklist", type: "Assessment Tool", date: "2022-09-10", status: "Active" },
    ],
    availability: {
      Monday: ["8:00 - 9:00", "9:00 - 10:00", "1:00 - 2:00"],
      Tuesday: ["8:00 - 9:00", "11:00 - 12:00", "1:00 - 2:00"],
      Wednesday: ["9:00 - 10:00", "10:00 - 11:00", "2:00 - 3:00"],
      Thursday: ["8:00 - 9:00", "11:00 - 12:00", "2:00 - 3:00"],
      Friday: ["10:00 - 11:00", "11:00 - 12:00", "1:00 - 2:00"],
    },
  };

  const [activeTab, setActiveTab] = useState("PersonalInfo");

  const renderTabContent = () => {
    switch (activeTab) {
      case "PersonalInfo":
        return <PersonalInfo teacher={teacherData} />;
      case "TeachingHistory":
        return <TeachingHistory teacher={teacherData} />;
      case "Certifications":
        return <Certifications teacher={teacherData} />;
      case "Activities":
        return <ActivitiesCreated teacher={teacherData} />;
      case "Availability":
        return <AvailabilitySchedule teacher={teacherData} />;
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
      // Validate inputs
      if (!formData.name.trim())
        return setErrorDialog({ show: true, message: "Full name is required." });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dob))
        return setErrorDialog({ show: true, message: "Date of birth must be in YYYY-MM-DD format." });
      if (!/^\+?\d{10,15}$/.test(formData.contact))
        return setErrorDialog({ show: true, message: "Invalid contact number format." });
      if (!/\S+@\S+\.\S+/.test(formData.email))
        return setErrorDialog({ show: true, message: "Invalid email address." });
      if (!formData.address.trim())
        return setErrorDialog({ show: true, message: "Address is required." });
      if (!formData.position.trim())
        return setErrorDialog({ show: true, message: "Position is required." });
      if (!formData.specialization.trim())
        return setErrorDialog({ show: true, message: "Specialization is required." });
      if (!formData.gender.trim())
        return setErrorDialog({ show: true, message: "Gender is required." });

      // Simulate saving
      setIsEditing(false);
      setShowSaveDialog(true);
      // (Call backend API here if needed)
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

      {/* Header Row with Avatar & Basic Info */}
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
                placeholder="Enter email"
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
                placeholder="Enter position"
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
            placeholder="Full Name"
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
            placeholder="Contact Number"
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
            placeholder="Gender"
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
            placeholder="Address"
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
            placeholder="Emergency Contact Name"
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
            placeholder="Emergency Contact Number"
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
            placeholder="Brief Bio"
          />
        </div>
      </div>

      {/* Specialization & Experience Section */}
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
            placeholder="Specialization"
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
            placeholder="Years of Experience"
          />
        </div>
      </div>

      {/* Teaching Statistics */}
      <h4 className="tp-subtitle">Teaching Statistics</h4>
      <div className="tp-stats-card-grid">
        <div className="tp-stat-card">
          <h5>Active Students</h5>
          <p>{formData.stats.students}</p>
        </div>
        <div className="tp-stat-card">
          <h5>Classes Conducted</h5>
          <p>{formData.stats.classes}</p>
        </div>
        <div className="tp-stat-card">
          <h5>Progress</h5>
          <p>{formData.stats.progress}</p>
        </div>
        <div className="tp-stat-card">
          <h5>Activities Created</h5>
          <p>{formData.stats.activities}</p>
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
      {teacher.teachingHistory.map((entry, index) => (
        <div key={index} className="tp-history-entry">
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
  // Icon mapping (customizable per title)
  const iconMap = {
    "Certified Dyslexia Specialist": <FiAward />,
    "Multi-Sensory Teaching Method": <FiCheckCircle />,
    "Educational Technology Integration": <FiPlayCircle />,
    "Reading Intervention Program Creator": <FiCoffee />,
  };

  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Teaching Certifications & Achievements</h4>
      <div className="tp-certifications-list">
        {teacher.certifications.map((cert, index) => (
          <div className="tp-cert-badge" key={index}>
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
            <th>Title</th>
            <th>Type</th>
            <th>Date Created</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {teacher.activitiesCreated.map((activity, idx) => (
            <tr key={idx}>
              <td>{activity.title}</td>
              <td>{activity.type}</td>
              <td>{activity.date}</td>
              <td>
                <span
                  className={`status-pill ${
                    activity.status === "Active" ? "active" : "completed"
                  }`}
                >
                  {activity.status}
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
  const allSlots = [
    "8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00",
    "11:00 - 12:00", "1:00 - 2:00", "2:00 - 3:00"
  ];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Availability Schedule</h4>
      <div className="tp-availability-table">
        <div className="tp-availability-row header">
          {days.map((day) => (
            <div key={day} className="tp-availability-cell day-header">{day}</div>
          ))}
        </div>
        {allSlots.map((slot, index) => (
          <div className="tp-availability-row" key={index}>
            {days.map((day) => {
              const isAvailable = teacher.availability[day]?.includes(slot);
              return (
                <div
                  key={`${day}-${slot}`}
                  className={`tp-availability-cell ${isAvailable ? "active" : ""}`}
                >
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

import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";


function ChangePasswordModal({ onClose }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = () => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  
    if (!currentPass || !newPass || !confirmPass) {
      setError("All password fields are required.");
      return;
    }
  
    if (newPass !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }
  
    if (!passwordRegex.test(newPass)) {
      setError(
        "Password must be at least 8 characters long, with uppercase, lowercase, number, and special character."
      );
      return;
    }
  
    // All checks passed
    alert("✅ Password changed successfully!");
    onClose();
  };
  

  return (
    <div className="save-dialog-overlay">
      <div className="save-dialog-box password-modal">
        <h4>Change Password</h4>
        {error && <p className="error-text">{error}</p>}

        <div className="password-fields">
          {/* Current Password */}
          <div className="password-input-group">
            <FiLock className="input-icon-left" />
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Current Password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
            />
            {showCurrent ? (
              <FiEyeOff className="input-icon-right" onClick={() => setShowCurrent(false)} />
            ) : (
              <FiEye className="input-icon-right" onClick={() => setShowCurrent(true)} />
            )}
          </div>

          {/* New Password */}
          <div className="password-input-group">
            <FiLock className="input-icon-left" />
            <input
              type={showNew ? "text" : "password"}
              placeholder="New Password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            {showNew ? (
              <FiEyeOff className="input-icon-right" onClick={() => setShowNew(false)} />
            ) : (
              <FiEye className="input-icon-right" onClick={() => setShowNew(true)} />
            )}
          </div>

          {/* Confirm Password */}
          <div className="password-input-group">
            <FiLock className="input-icon-left" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
            {showConfirm ? (
              <FiEyeOff className="input-icon-right" onClick={() => setShowConfirm(false)} />
            ) : (
              <FiEye className="input-icon-right" onClick={() => setShowConfirm(true)} />
            )}
          </div>
        </div>

        <div className="password-buttons">
          <button onClick={handleChangePassword}>Update Password</button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
