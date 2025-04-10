import React, { useState } from "react";
import "../../css/Parents/ParentDashboard.css";
import parent1 from "../../assets/images/Parents/parent1.png";
import student1 from "../../assets/images/Parents/student1.jpg";

const ParentDashboard = () => {
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "Kit Nicholas",
    lastName: "Santiago",
    contactNumber: "09944521234",
    email: "kitsantiago@gmail.com",
    address: "555 MF Jhocson Street, Barangay 408, Sampaloc, Manila",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // State to show success message

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
      // If confirmed, save the changes
      console.log("Personal Info saved:", personalInfo);
      setIsEditing(false); // Switch back to view mode after saving

      // Show success message
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } else {
      console.log("Changes not saved.");
    }
  };

  return (
    <div className="parent-dashboard-container">
      <div className="profile-header-container">
        {/* Profile Header */}
        <h1 className="profile-header">Profile</h1>
        <div className="profile-header-info">
          <div className="profile-icon-container">
            <img
              src={parent1}
              alt="Parent Avatar"
              className="profile-circle-icon"
            />
          </div>
          <div className="cradle-of-learners">
            <p>Cradle of Learners Inc.</p>
          </div>
        </div>
      </div>

      <div className="parent-profile">
        {/* Split the profile content into two columns */}
        <div className="profile-left">
          <div className="profile-header">
            <img
              src={parent1}
              alt="Parent Avatar"
              className="parent-avatar"
            />
            <div className="profile-info">
              <h2>Santiago, Kit Nicholas</h2>
              <p>Parent ID: 2022-12345</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-item">
              <label>First Name:</label>
              <input
                type="text"
                name="firstName"
                value={personalInfo.firstName}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="profile-item">
              <label>Last Name:</label>
              <input
                type="text"
                name="lastName"
                value={personalInfo.lastName}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="profile-item">
              <label>Contact Number:</label>
              <input
                type="text"
                name="contactNumber"
                value={personalInfo.contactNumber}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="profile-item">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={personalInfo.email}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="profile-item">
              <label>Address:</label>
              <input
                type="text"
                name="address"
                value={personalInfo.address}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </div>

        <div className="profile-right">
          <div className="children-enrolled">
            <h4>Children Enrolled:</h4>
            <div className="child-info">
              <img
                src={student1}
                alt="Child Avatar"
                className="child-avatar"
              />
              <div className="child-details">
                <p>Charles Ashley P. Santiago</p>
                <p>Student ID: 2022-54321</p>
              </div>
            </div>
          </div>

          {/* Edit and Save Button */}
          <div className="profile-actions">
            {isEditing ? (
              <button onClick={saveChanges}>Save</button> // Save changes
            ) : (
              <button onClick={toggleEdit}>Edit Information</button> // Switch to edit mode
            )}
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="success-message">
              <p>Changes saved successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;