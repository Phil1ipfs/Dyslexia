
import React, { useState } from "react";
import parent1 from "../../assets/images/Parents/parent1.png";
import student1 from "../../assets/images/Parents/student1.jpg";
import "../../css/Parents/ParentDashboard.css";
const ParentDashboard = () => {
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "Kit Nicholas",
    lastName: "Santiago",
    contactNumber: "09944521234",
    email: "kitsantiago@gmail.com",
    address: "555 MF Jhocson Street, Barangay 408, Sampaloc, Manila",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  // Toggle between edit and view mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Save changes with confirmation
  const saveChanges = () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to save these changes?"
    );

    if (userConfirmed) {
      console.log("Personal Info saved:", personalInfo);
      setIsEditing(false);
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } else {
      console.log("Changes not saved.");
    }
  };

  return (
    <div className="parent-dashboard-container">
      {/* Main content with white background and styling similar to Teacher Profile */}
      <div className="main-content">
        <h1 className="profile-title">Parent Profile</h1>
        
        {/* Profile header section with basic info */}
        <div className="profile-header-section">
          <div className="profile-avatar-container">
            <img src={parent1} alt="Parent Avatar" className="profile-avatar" />
          </div>
          
          <div className="profile-basic-info">
            <div className="info-item">
              <div className="info-label">Parent ID:</div>
              <div className="info-value">2022-12345</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Email:</div>
              <input 
                type="text" 
                className="info-input" 
                value={personalInfo.email} 
                onChange={(e) => handleChange({target: {name: 'email', value: e.target.value}})}
                readOnly={!isEditing} 
              />
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="edit-profile-btn" onClick={toggleEdit}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
            {isEditing && (
              <button className="change-password-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div>
        </div>
        
        {/* Personal Information Section */}
        <div className="information-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="info-grid">
            <div className="info-column">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={personalInfo.firstName}
                  name="firstName"
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Contact Number</label>
                <input 
                  type="text" 
                  value={personalInfo.contactNumber}
                  name="contactNumber"
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="info-column">
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={personalInfo.lastName}
                  name="lastName"
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  value={personalInfo.address}
                  name="address"
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Children Information Section */}
        <div className="information-section">
          <h3 className="section-title">Children Enrolled</h3>
          <div className="children-info">
            <div className="child-card">
              <img src={student1} alt="Student" className="child-image" />
              <div className="child-details">
                <h4>Charles Ashley P. Santiago</h4>
                <p>Student ID: 2022-54321</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-message">
          <p>Changes saved successfully!</p>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;