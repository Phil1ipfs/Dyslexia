import React from "react";
import "../css/TeacherProfile.css"; // The isolated CSS so it doesn't conflict

function TeacherProfile() {
  // Mocked teacher data
  const teacher = {
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
    availability: {
      Monday: ["8:00 - 9:00", "9:00 - 10:00", "1:00 - 2:00"],
      Tuesday: ["8:00 - 9:00", "11:00 - 12:00", "1:00 - 2:00"],
      Wednesday: ["9:00 - 10:00", "10:00 - 11:00", "2:00 - 3:00"],
      Thursday: ["8:00 - 9:00", "11:00 - 12:00", "2:00 - 3:00"],
      Friday: ["10:00 - 11:00", "11:00 - 12:00", "1:00 - 2:00"],
    },
  };

  return (
    <div className="tp-wrapper">
      <h2 className="tp-page-title">Teacher Profile</h2>

      <div className="tp-profile-card">
        {/* Header with Basic Info */}
        <div className="tp-header">
          <div className="tp-initials">MJ</div>
          <div>
            <h3>{teacher.name}</h3>
            <p><strong>Position:</strong> {teacher.position}</p>
            <p><strong>Employee ID:</strong> {teacher.employeeId}</p>
            <p><strong>Email:</strong> {teacher.email}</p>
          </div>
        </div>
        
        <hr className="tp-divider" />

        {/* Personal Info Grid */}
        <div className="tp-info-grid">
          <div>
            <label>Full Name</label>
            <input type="text" value={teacher.name} readOnly />
          </div>
          <div>
            <label>Contact Number</label>
            <input type="text" value={teacher.contact} readOnly />
          </div>
          <div>
            <label>Date of Birth</label>
            <input type="text" value={teacher.dob} readOnly />
          </div>
          <div>
            <label>Gender</label>
            <input type="text" value={teacher.gender} readOnly />
          </div>
          <div>
            <label>Address</label>
            <input type="text" value={teacher.address} readOnly />
          </div>
          <div>
            <label>Emergency Contact Name</label>
            <input type="text" value={teacher.emergencyContact.name} readOnly />
          </div>
          <div>
            <label>Emergency Contact Number</label>
            <input type="text" value={teacher.emergencyContact.number} readOnly />
          </div>
          <div className="tp-bio-field">
            <label>Brief Bio</label>
            <textarea rows={4} value={teacher.bio} readOnly />
          </div>
        </div>

        {/* Qualifications */}
        <h4 className="tp-subtitle">Qualifications</h4>
        <div className="tp-info-grid">
          <div>
            <label>Specialization</label>
            <input type="text" value={teacher.specialization} readOnly />
          </div>
          <div>
            <label>Years of Experience</label>
            <input type="text" value={teacher.yearsExp} readOnly />
          </div>
        </div>

        {/* Teaching Statistics */}
        <h4 className="tp-subtitle">Teaching Statistics</h4>
        <div className="tp-stat-grid">
          <div>
            <strong>Active Students</strong>
            <p>{teacher.stats.students}</p>
          </div>
          <div>
            <strong>Classes Conducted</strong>
            <p>{teacher.stats.classes}</p>
          </div>
          <div>
            <strong>Student Progress Rate</strong>
            <p>{teacher.stats.progress}</p>
          </div>
          <div>
            <strong>Activities Created</strong>
            <p>{teacher.stats.activities}</p>
          </div>
        </div>

        {/* Certifications */}
        <h4 className="tp-subtitle">Certifications &amp; Achievements</h4>
        <div className="tp-tag-container">
          {teacher.certifications.map((cert, i) => (
            <span key={i} className="tp-tag">{cert}</span>
          ))}
        </div>

        {/* Availability */}
        <h4 className="tp-subtitle">Availability Schedule</h4>
        <div className="tp-availability-grid">
          {Object.entries(teacher.availability).map(([day, slots]) => (
            <div key={day} className="tp-day-col">
              <strong>{day}</strong>
              <div className="tp-slot-wrap">
                {slots.map((slot, idx) => (
                  <span key={idx} className="tp-slot">{slot}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default TeacherProfile;
