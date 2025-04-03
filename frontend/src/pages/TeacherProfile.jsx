import React from "react";
import "../css/TeacherProfilePage.css";
import avatar from "../assets/icons/avatar.png";

function TeacherProfile() {
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
    bio: `I am a dedicated reading specialist with over 10 years of experience working with children who have dyslexia and other reading difficulties.`,
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
    <div className="tp-container">
      <div className="tp-header">
        <h2>Teacher Profile</h2>
      </div>

      <div className="tp-card">
        <div className="tp-card-header">
          <img src={avatar} alt="Avatar" className="tp-avatar" />
          <div className="tp-basic-info">
            <h3>{teacher.name}</h3>
            <p><strong>Position:</strong> {teacher.position}</p>
            <p><strong>Employee ID:</strong> {teacher.employeeId}</p>
            <p><strong>Email:</strong> {teacher.email}</p>
          </div>
        </div>

        <hr className="tp-divider" />

        <div className="tp-info-grid">
          <div>
            <label>Full Name</label>
            <input value={teacher.name} disabled />
          </div>
          <div>
            <label>Contact Number</label>
            <input value={teacher.contact} disabled />
          </div>
          <div>
            <label>Date of Birth</label>
            <input value={teacher.dob} disabled />
          </div>
          <div>
            <label>Gender</label>
            <input value={teacher.gender} disabled />
          </div>
          <div>
            <label>Address</label>
            <input value={teacher.address} disabled />
          </div>
          <div>
            <label>Emergency Contact Name</label>
            <input value={teacher.emergencyContact.name} disabled />
          </div>
          <div>
            <label>Emergency Contact Number</label>
            <input value={teacher.emergencyContact.number} disabled />
          </div>
          <div>
            <label>Brief Bio</label>
            <textarea rows={4} value={teacher.bio} disabled />
          </div>
        </div>

        <h4 className="tp-section-title">Qualifications</h4>
        <div className="tp-info-grid">
          <div>
            <label>Specialization</label>
            <input value={teacher.specialization} disabled />
          </div>
          <div>
            <label>Years of Experience</label>
            <input value={teacher.yearsExp} disabled />
          </div>
        </div>

        <h4 className="tp-section-title">Teaching Statistics</h4>
        <div className="tp-stat-grid">
          <div><strong>Active Students</strong><p>{teacher.stats.students}</p></div>
          <div><strong>Classes Conducted</strong><p>{teacher.stats.classes}</p></div>
          <div><strong>Student Progress Rate</strong><p>{teacher.stats.progress}</p></div>
          <div><strong>Activities Created</strong><p>{teacher.stats.activities}</p></div>
        </div>

        <h4 className="tp-section-title">Certifications & Achievements</h4>
        <div className="tp-badge-container">
          {teacher.certifications.map((item, idx) => (
            <span key={idx} className="tp-badge">{item}</span>
          ))}
        </div>

        <h4 className="tp-section-title">Availability Schedule</h4>
        <div className="tp-availability">
          {Object.entries(teacher.availability).map(([day, slots]) => (
            <div key={day}>
              <strong>{day}</strong>
              <div className="tp-slot-group">
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
