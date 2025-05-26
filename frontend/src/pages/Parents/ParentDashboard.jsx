import React, { useState, useEffect } from "react";
import axios from "axios";
import parent1 from "../../assets/images/Parents/parent1.png";
import student1 from "../../assets/images/Parents/student1.jpg";
import "../../css/Parents/ParentDashboard.css";

const ParentDashboard = () => {
  // State will be populated from database
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    email: "",
    address: "",
    civilStatus: "",
    dateOfBirth: "",
    gender: "",
    profileImageUrl: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState([]);
  
  // Base URL from environment variable or default
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  // Fetch parent profile data when component mounts
  useEffect(() => {
    // Get data on component mount
    fetchParentData();
    
    // Set up interval to refresh data every 30 seconds (optional)
    const intervalId = setInterval(fetchParentData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to fetch parent profile from database
  const fetchParentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get auth token from localStorage - try both formats
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      console.log('Attempting to fetch parent profile with:', {
        token: token ? 'Token exists' : 'No token',
        userId: userId || 'No userId'
      });
      
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setIsLoading(false);
        return;
      }
      
      // Make API request to get parent profile
      console.log('Making request to:', `${BASE_URL}/api/parents/profile`);
      const profileResponse = await axios.get(`${BASE_URL}/api/parents/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile response:', profileResponse.data);
      
      // If successful, update state with data from database
      if (profileResponse.data) {
        setPersonalInfo({
          firstName: profileResponse.data.firstName || "",
          middleName: profileResponse.data.middleName || "",
          lastName: profileResponse.data.lastName || "",
          contactNumber: profileResponse.data.contact || profileResponse.data.contactNumber || "",
          email: profileResponse.data.email || "",
          address: profileResponse.data.address || "",
          civilStatus: profileResponse.data.civilStatus || "",
          dateOfBirth: profileResponse.data.dateOfBirth || "",
          gender: profileResponse.data.gender || "",
          profileImageUrl: profileResponse.data.profileImageUrl || ""
        });
        
        console.log("Profile data loaded from database:", profileResponse.data);
      } else {
        setError("No profile data received from server");
      }
      
      // Fetch children data
      try {
        console.log('Fetching children data...');
        const childrenResponse = await axios.get(`${BASE_URL}/api/parents/children`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Children response:', childrenResponse.data);
        
        if (childrenResponse.data && Array.isArray(childrenResponse.data)) {
          setChildren(childrenResponse.data);
          console.log("Children data loaded from database:", childrenResponse.data);
        }
      } catch (childrenError) {
        console.error("Error fetching children:", childrenError);
        // Don't set error for children fetch failure
      }
      
    } catch (error) {
      console.error("Error fetching parent data:", error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Error loading profile data";
      console.error("Full error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
    if (isEditing) {
      // If canceling edit, refresh data from database
      fetchParentData();
    }
    setIsEditing(!isEditing);
  };

  // Save changes to database
  const saveChanges = async () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to save these changes?"
    );

    if (userConfirmed) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (!token) {
          setError("No authentication token found");
          setIsLoading(false);
          return;
        }
        
        // Format data for API
        const updateData = {
          firstName: personalInfo.firstName,
          middleName: personalInfo.middleName,
          lastName: personalInfo.lastName,
          contactNumber: personalInfo.contactNumber,
          address: personalInfo.address,
          civilStatus: personalInfo.civilStatus,
          dateOfBirth: personalInfo.dateOfBirth,
          gender: personalInfo.gender
        };
        
        // Make API request to update profile
        const response = await axios.put(`${BASE_URL}/api/parents/profile`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Profile updated successfully:", response.data);
        
        // Refresh data from database to ensure we display the latest data
        await fetchParentData();
        
        setIsEditing(false);
        setShowSuccessMessage(true);

        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } catch (error) {
        console.error("Error updating profile:", error);
        setError(error.response?.data?.message || "Failed to update profile");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // After fetching parent profile, if personalInfo.children exists and is non-empty, fetch each child's student profile from the backend and display them in the Children Enrolled section.
  useEffect(() => {
    if (personalInfo.children && personalInfo.children.length > 0) {
      const fetchChildren = async () => {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('authToken');
          const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
          const responses = await Promise.all(
            personalInfo.children.map(childId =>
              axios.get(`${BASE_URL}/api/admin/manage/students/${childId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
            )
          );
          setChildren(responses.map(res => res.data.data.studentProfile));
        } catch (error) {
          setChildren([]);
        }
      };
      fetchChildren();
    } else {
      setChildren([]);
    }
  }, [personalInfo.children]);

  return (
    <div className="parent-dashboard-container">
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* Main content with white background and styling similar to Teacher Profile */}
      <div className="main-content">
        <h1 className="profile-title">Parent Profile</h1>
        
        {/* Profile header section with basic info */}
        <div className="profile-header-section">
          <div className="profile-avatar-container">
            <img 
              src={personalInfo.profileImageUrl || parent1} 
              alt="Parent Avatar" 
              className="profile-avatar" 
            />
          </div>
          
          <div className="profile-basic-info">
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
                <label>Middle Name</label>
                <input 
                  type="text" 
                  value={personalInfo.middleName}
                  name="middleName"
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
              
              <div className="form-group">
                <label>Civil Status</label>
                <input 
                  type="text" 
                  value={personalInfo.civilStatus}
                  name="civilStatus"
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
                <label>Date of Birth</label>
                <input 
                  type={isEditing ? "date" : "text"}
                  value={personalInfo.dateOfBirth}
                  name="dateOfBirth"
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Gender</label>
                {isEditing ? (
                  <select
                    value={personalInfo.gender}
                    name="gender"
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={personalInfo.gender}
                    readOnly
                    className="form-input"
                  />
                )}
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
        
        {/* Children Information Section - Dynamically loaded from database */}
        <div className="information-section">
          <h3 className="section-title">Children Enrolled</h3>
          <div className="children-info" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {children.length > 0 ? (
              children.map((child, index) => (
                <div key={index} className="child-card" style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '12px 20px', minWidth: '280px', maxWidth: '350px', width: '100%', gap: '16px' }}>
                  <img 
                    src={child.profileImage || student1} 
                    alt={`${child.firstName || ''} ${child.lastName || ''}`} 
                    className="child-image"
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px', border: '2px solid #e5e7eb' }}
                  />
                  <div className="child-details" style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{`${child.firstName || ''} ${child.middleName ? child.middleName + ' ' : ''}${child.lastName || ''}`}</h4>
                    <div style={{ fontSize: '0.97rem', color: '#444', marginTop: 2 }}>Student ID: <span style={{ fontWeight: 500 }}>{child.idNumber || 'N/A'}</span></div>
                    <div style={{ fontSize: '0.97rem', color: '#444', marginTop: 2 }}>Section: <span style={{ fontWeight: 500 }}>{child.section || 'N/A'}</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-children-message">
                <p>No children enrolled yet.</p>
              </div>
            )}
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