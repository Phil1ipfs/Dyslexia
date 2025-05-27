import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Heart,
  Book,
  Lock,
  X,
  CheckCircle
} from 'lucide-react';
import parent1 from "../../assets/images/Parents/parent1.png";
import student1 from "../../assets/images/Parents/student1.jpg";
import ChangePasswordModal from "../../components/ParentPage/ChangePasswordModal";
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

  const [showChangePassword, setShowChangePassword] = useState(false);
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
          <X size={18} />
          <p>{error}</p>
        </div>
      )}
      
      {/* Main content */}
      <div className="main-content">
        <h1 className="profile-title">Parent Profile</h1>
        
        {/* Profile header section */}
        <div className="profile-header-section">
          <div className="profile-avatar-container">
            <img 
              src={personalInfo.profileImageUrl || parent1} 
              alt="Parent Avatar" 
              className="profile-avatar" 
            />
          </div>
          
          <div className="profile-info">
            <div className="contact-info">
              <div className="info-group">
                <Mail size={18} />
                <span>{personalInfo.email}</span>
              </div>
              <div className="info-group">
                <Phone size={18} />
                <span>{personalInfo.contactNumber}</span>
              </div>
            </div>
            
            <button className="edit-profile-btn" onClick={() => setShowChangePassword(true)}>
              <Lock size={18} />
              Change Password
            </button>
          </div>
        </div>
        
        {/* Personal Information Section */}
        <div className="information-section">
          <h3 className="section-title">
            <User size={20} />
            Personal Information
          </h3>
          <div className="info-grid">
            <div className="info-field">
              <div className="info-field-label">
                <User size={16} />
                First Name
              </div>
              <div className="info-field-value">{personalInfo.firstName}</div>
            </div>
            
            <div className="info-field">
              <div className="info-field-label">
                <User size={16} />
                Last Name
              </div>
              <div className="info-field-value">{personalInfo.lastName}</div>
            </div>
            
            <div className="info-field">
              <div className="info-field-label">
                <User size={16} />
                Middle Name
              </div>
              <div className="info-field-value">{personalInfo.middleName || '-'}</div>
            </div>
            
            <div className="info-field">
              <div className="info-field-label">
                <Calendar size={16} />
                Date of Birth
              </div>
              <div className="info-field-value">{personalInfo.dateOfBirth || '-'}</div>
            </div>
            
            <div className="info-field">
              <div className="info-field-label">
                <Heart size={16} />
                Civil Status
              </div>
              <div className="info-field-value">{personalInfo.civilStatus || '-'}</div>
            </div>
            
            <div className="info-field">
              <div className="info-field-label">
                <MapPin size={16} />
                Address
              </div>
              <div className="info-field-value">{personalInfo.address || '-'}</div>
            </div>
          </div>
        </div>
        
        {/* Children Section */}
        <div className="information-section">
          <h3 className="section-title">
            <Book size={20} />
            Children Enrolled
          </h3>
          <div className="children-enrolled">
            {children.length > 0 ? (
              children.map((child, index) => (
                <div key={index} className="child-card">
                  <img 
                    src={child.profileImage || student1} 
                    alt={`${child.firstName || ''} ${child.lastName || ''}`} 
                    className="child-avatar"
                  />
                  <div className="child-info">
                    <div className="child-name">
                      {`${child.firstName || ''} ${child.middleName ? child.middleName + ' ' : ''}${child.lastName || ''}`}
                    </div>
                    <div className="child-details">
                      <div>Student ID: {child.idNumber || 'N/A'}</div>
                      <div>Section: {child.section || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="child-card">
                <Book size={40} style={{ opacity: 0.5 }} />
                <div className="child-info">
                  <div className="child-name">No children enrolled yet</div>
                  <div className="child-details">
                    <div>Once you enroll children, they will appear here.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-message">
          <CheckCircle size={18} />
          <p>Changes saved successfully!</p>
        </div>
      )}
      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default ParentDashboard;