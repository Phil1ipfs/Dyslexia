// src/pages/Teachers/TeacherProfile.jsx
import React, { useState } from "react";
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

  const [errorDialog, setErrorDialog] = useState({ show: false, message: "" });

  const toggleEdit = () => {
    if (isEditing) {
      // Validate inputs before saving
      if (!formData.name.trim()) return setErrorDialog({ show: true, message: "Full name is required." });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dob)) return setErrorDialog({ show: true, message: "Date of birth must be in YYYY-MM-DD format." });
      if (!/^\+?\d{10,15}$/.test(formData.contact)) return setErrorDialog({ show: true, message: "Invalid contact number format." });
      if (!/\S+@\S+\.\S+/.test(formData.email)) return setErrorDialog({ show: true, message: "Invalid email address." });
      if (!formData.address.trim()) return setErrorDialog({ show: true, message: "Address is required." });
      if (!formData.position.trim()) return setErrorDialog({ show: true, message: "Position is required." });
      if (!formData.specialization.trim()) return setErrorDialog({ show: true, message: "Specialization is required." });
      if (!formData.gender.trim()) return setErrorDialog({ show: true, message: "Gender is required." });

      // All good, simulate save
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
          <p>
            <strong>Employee ID:</strong> {formData.employeeId}
          </p>
          <div className="tp-contact-edit-group">
            <div>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label>Position</label>
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
        <button className="tp-edit-btn" onClick={toggleEdit}>
          {isEditing ? "Save Profile" : "Edit Profile"}
        </button>

      </div>

      <hr className="tp-divider" />

      {/* Personal Information Section */}
      <h4 className="tp-subtitle">Personal Information</h4>
      <div className="tp-info-grid">
        <div>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label>Contact Number</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label>Date of Birth</label>
          <input
            type="text"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label>Gender</label>
          <input
            type="text"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label>Emergency Contact Name</label>
          <input
            type="text"
            name="emergencyName"
            value={formData.emergencyContact.name}
            onChange={(e) => handleEmergencyChange("name", e.target.value)}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label>Emergency Contact Number</label>
          <input
            type="text"
            name="emergencyNumber"
            value={formData.emergencyContact.number}
            onChange={(e) => handleEmergencyChange("number", e.target.value)}
            readOnly={!isEditing}
          />
        </div>
        <div className="tp-bio-field">
          <label>Brief Bio</label>
          <textarea
            rows={4}
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
      </div>

      {/* Specialization & Experience Section */}
      <h4 className="tp-subtitle">Specialization & Experience</h4>
      <div className="tp-info-grid">
        <div>
          <label>Specialization</label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label>Years of Experience</label>
          <input
            type="number"
            name="yearsExp"
            value={formData.yearsExp}
            onChange={handleChange}
            readOnly={!isEditing}
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
  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Certifications & Achievements</h4>
      <div className="tp-tag-container">
        {teacher.certifications.map((cert, i) => (
          <span key={i} className="tp-tag">
            {cert}
          </span>
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
              <td>{activity.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- AVAILABILITY SCHEDULE COMPONENT ---------------- //
function AvailabilitySchedule({ teacher }) {
  return (
    <div className="tp-profile-card">
      <h4 className="tp-subtitle">Availability Schedule</h4>
      <div className="tp-availability-grid">
        {Object.entries(teacher.availability).map(([day, slots]) => (
          <div key={day} className="tp-day-col">
            <strong>{day}</strong>
            <div className="tp-slot-wrap">
              {slots.map((slot, idx) => (
                <span key={idx} className="tp-slot">
                  {slot}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeacherProfile;
