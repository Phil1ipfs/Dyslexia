// src/pages/Parents/ParentDashboard.jsx
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
  BookOpen,
  Lock,
  X,
  CheckCircle,
  UserCircle,
  Info,
  GraduationCap,
  School,
  ClipboardList,
  BarChart2,
  Home,
  Edit,
  Save,
  XCircle
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
  const [animated, setAnimated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    address: "",
    civilStatus: "",
    dateOfBirth: "",
    gender: "",
    profileImageUrl: ""
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  // Base URL from environment variable or default
  const BASE_URL = "http://localhost:5001"; // Hardcoded for local development

  // Validation functions
  const validateField = (name, value) => {
    const errors = {};

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value || value.trim() === '') {
          errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        } else if (!/^[a-zA-Z\s'.-]+$/.test(value)) {
          errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name can only contain letters, spaces, apostrophes, and hyphens`;
        } else if (value.length < 2) {
          errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters long`;
        } else if (value.length > 50) {
          errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be less than 50 characters`;
        }
        break;

      case 'middleName':
        if (value && !/^[a-zA-Z\s'.-]*$/.test(value)) {
          errors[name] = 'Middle name can only contain letters, spaces, apostrophes, and hyphens';
        } else if (value && value.length > 50) {
          errors[name] = 'Middle name must be less than 50 characters';
        }
        break;

      case 'contactNumber':
        if (!value || value.trim() === '') {
          errors[name] = 'Contact number is required';
        } else if (!/^(\+63|0)[0-9]{10}$/.test(value.replace(/\s+/g, ''))) {
          errors[name] = 'Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)';
        }
        break;

      case 'address':
        if (!value || value.trim() === '') {
          errors[name] = 'Address is required';
        } else if (value.length < 10) {
          errors[name] = 'Address must be at least 10 characters long';
        } else if (value.length > 200) {
          errors[name] = 'Address must be less than 200 characters';
        }
        break;

      case 'dateOfBirth':
        if (!value) {
          errors[name] = 'Date of birth is required';
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          if (birthDate > today) {
            errors[name] = 'Date of birth cannot be in the future';
          } else if (age < 18) {
            errors[name] = 'You must be at least 18 years old';
          } else if (age > 100) {
            errors[name] = 'Please enter a valid date of birth';
          }
        }
        break;

      case 'gender':
        if (!value || value.trim() === '') {
          errors[name] = 'Gender is required';
        }
        break;

      case 'civilStatus':
        if (!value || value.trim() === '') {
          errors[name] = 'Civil status is required';
        }
        break;

      default:
        break;
    }

    return errors;
  };

  // Validate all form data
  const validateForm = (formData) => {
    let allErrors = {};

    Object.keys(formData).forEach(key => {
      if (key !== 'profileImageUrl') { // Skip validation for profileImageUrl
        const fieldErrors = validateField(key, formData[key]);
        allErrors = { ...allErrors, ...fieldErrors };
      }
    });

    return allErrors;
  };

  // Fetch parent profile data when component mounts
  useEffect(() => {
    // Get data on component mount
    fetchParentData();
    
    // Set up interval to refresh data every 30 seconds (optional)
    const intervalId = setInterval(fetchParentData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Trigger animations after data loads
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setAnimated(true);
      }, 300);
    }
  }, [isLoading]);
  
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

  // Handle input changes for edit mode with real-time validation
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Real-time validation
    const fieldErrors = validateField(name, value);
    setValidationErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      // Remove or add error for this field
      if (Object.keys(fieldErrors).length === 0) {
        delete newErrors[name];
      } else {
        newErrors[name] = fieldErrors[name];
      }

      return newErrors;
    });
  };

  // Enter edit mode
  const enterEditMode = () => {
    setEditFormData({
      firstName: personalInfo.firstName || "",
      middleName: personalInfo.middleName || "",
      lastName: personalInfo.lastName || "",
      contactNumber: personalInfo.contactNumber || "",
      address: personalInfo.address || "",
      civilStatus: personalInfo.civilStatus || "",
      dateOfBirth: personalInfo.dateOfBirth || "",
      gender: personalInfo.gender || "",
      profileImageUrl: personalInfo.profileImageUrl || ""
    });
    setIsEditMode(true);
  };

  // Cancel edit mode
  const cancelEditMode = () => {
    setIsEditMode(false);
    setValidationErrors({});
    setEditFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      contactNumber: "",
      address: "",
      civilStatus: "",
      dateOfBirth: "",
      gender: "",
      profileImageUrl: ""
    });
  };

  // Save profile changes
  const saveProfileChanges = async () => {
    // Validate form before saving
    const formErrors = validateForm(editFormData);
    setValidationErrors(formErrors);

    // If there are validation errors, don't proceed with save
    if (Object.keys(formErrors).length > 0) {
      console.log('Validation errors found:', formErrors);
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      if (!token) {
        setError("No authentication token found. Please log in again.");
        return;
      }

      // Prepare data for API call - exclude email
      const updateData = {
        firstName: editFormData.firstName.trim(),
        middleName: editFormData.middleName.trim(),
        lastName: editFormData.lastName.trim(),
        contactNumber: editFormData.contactNumber.replace(/\s+/g, ''), // Remove spaces from phone number
        address: editFormData.address.trim(),
        civilStatus: editFormData.civilStatus,
        dateOfBirth: editFormData.dateOfBirth,
        gender: editFormData.gender,
        profileImageUrl: editFormData.profileImageUrl
      };

      console.log('Updating profile with data:', updateData);

      const response = await axios.put(`${BASE_URL}/api/parents/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        // Update local state with saved data
        setPersonalInfo({
          ...personalInfo,
          firstName: updateData.firstName,
          middleName: updateData.middleName,
          lastName: updateData.lastName,
          contactNumber: updateData.contactNumber,
          address: updateData.address,
          civilStatus: updateData.civilStatus,
          dateOfBirth: updateData.dateOfBirth,
          gender: updateData.gender,
          profileImageUrl: updateData.profileImageUrl
        });

        // Exit edit mode, clear validation errors, and show success message
        setIsEditMode(false);
        setValidationErrors({});
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          "Error updating profile";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // After fetching parent profile, if personalInfo.children exists and is non-empty, fetch each child's student profile
  useEffect(() => {
    if (personalInfo.children && personalInfo.children.length > 0) {
      const fetchChildren = async () => {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('authToken');
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="parent-dashboard__container">
      {/* Loading indicator */}
      {isLoading && (
        <div className="parent-dashboard__loading-overlay">
          <div className="parent-dashboard__spinner"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="parent-dashboard__error-message">
          <X className="parent-dashboard__error-icon" size={24} />
          <div className="parent-dashboard__error-content">
            <h3>Error Loading Profile</h3>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="parent-dashboard__main-content">
        {/* Header section with breadcrumb */}
        <div className="parent-dashboard__header">
          <div className="parent-dashboard__breadcrumb">
            <Home size={16} />
            <span className="parent-dashboard__breadcrumb-separator">/</span>
            <span className="parent-dashboard__breadcrumb-active">Parent Dashboard</span>
          </div>
          <h1 className="parent-dashboard__title">My Profile</h1>
          <p className="parent-dashboard__subtitle">View and manage your personal information and enrolled children</p>
        </div>
        
        {/* Profile overview section */}
        <div className={`parent-dashboard__profile-overview ${animated ? 'animate' : ''}`} style={{animationDelay: '0s'}}>
          <div className="parent-dashboard__info-banner">
            <Info className="parent-dashboard__info-icon" />
            <div className="parent-dashboard__info-content">
              <h3>Parent Dashboard</h3>
              <p>
                Welcome to your parent dashboard. Here you can view your profile information and check details about your enrolled children.
                Use the Change Password button to update your login credentials.
              </p>
            </div>
          </div>
          
          <div className="parent-dashboard__profile-header">
            <div className="parent-dashboard__profile-avatar">
              {personalInfo.profileImageUrl ? (
                <img 
                  src={personalInfo.profileImageUrl} 
                  alt={`${personalInfo.firstName} ${personalInfo.lastName}`} 
                  className="parent-dashboard__avatar-img"
                />
              ) : (
                <UserCircle className="parent-dashboard__avatar-placeholder" size={80} />
              )}
            </div>
            <div className="parent-dashboard__profile-details">
              <h2 className="parent-dashboard__profile-name">
                {`${personalInfo.firstName} ${personalInfo.middleName ? personalInfo.middleName + ' ' : ''}${personalInfo.lastName}`}
              </h2>
              <div className="parent-dashboard__contact-items">
                <div className="parent-dashboard__contact-item">
                  <Mail size={18} />
                  <span>{personalInfo.email || 'No email provided'}</span>
                </div>
                <div className="parent-dashboard__contact-item">
                  <Phone size={18} />
                  <span>{personalInfo.contactNumber || 'No contact number provided'}</span>
                </div>
              </div>
            </div>
            <div className="parent-dashboard__profile-actions">
              {!isEditMode ? (
                <>
                  <button
                    className="parent-dashboard__edit-profile-btn"
                    onClick={enterEditMode}
                  >
                    <Edit size={18} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    className="parent-dashboard__change-password-btn"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <Lock size={18} />
                    <span>Change Password</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="parent-dashboard__save-btn"
                    onClick={saveProfileChanges}
                    disabled={isSaving}
                  >
                    <Save size={18} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    className="parent-dashboard__cancel-btn"
                    onClick={cancelEditMode}
                    disabled={isSaving}
                  >
                    <XCircle size={18} />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Personal Information Cards */}
        <div className="parent-dashboard__section">
          <h3 className="parent-dashboard__section-title">
            <User className="parent-dashboard__section-icon" />
            Personal Information
          </h3>
          
          <div className="parent-dashboard__info-cards">
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.1s'}}>
              <div className="parent-dashboard__info-card-header">
                <User className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">First Name</div>
              </div>
              {isEditMode ? (
                <div>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input ${validationErrors.firstName ? 'error' : ''}`}
                    placeholder="Enter first name"
                  />
                  {validationErrors.firstName && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.firstName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.firstName || 'Not provided'}</div>
              )}
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.15s'}}>
              <div className="parent-dashboard__info-card-header">
                <User className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Last Name</div>
              </div>
              {isEditMode ? (
                <div>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input ${validationErrors.lastName ? 'error' : ''}`}
                    placeholder="Enter last name"
                  />
                  {validationErrors.lastName && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.lastName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.lastName || 'Not provided'}</div>
              )}
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.2s'}}>
              <div className="parent-dashboard__info-card-header">
                <User className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Middle Name</div>
              </div>
              {isEditMode ? (
                <div>
                  <input
                    type="text"
                    name="middleName"
                    value={editFormData.middleName}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input ${validationErrors.middleName ? 'error' : ''}`}
                    placeholder="Enter middle name (optional)"
                  />
                  {validationErrors.middleName && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.middleName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.middleName || 'Not provided'}</div>
              )}
            </div>

            {/* Contact Number */}
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.22s'}}>
              <div className="parent-dashboard__info-card-header">
                <Phone className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Contact Number</div>
              </div>
              {isEditMode ? (
                <div>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={editFormData.contactNumber}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input ${validationErrors.contactNumber ? 'error' : ''}`}
                    placeholder="Enter contact number (e.g., 09123456789)"
                  />
                  {validationErrors.contactNumber && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.contactNumber}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.contactNumber || 'Not provided'}</div>
              )}
            </div>

            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.25s'}}>
              <div className="parent-dashboard__info-card-header">
                <Calendar className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Date of Birth</div>
              </div>
              {isEditMode ? (
                <div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editFormData.dateOfBirth}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input ${validationErrors.dateOfBirth ? 'error' : ''}`}
                  />
                  {validationErrors.dateOfBirth && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.dateOfBirth}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.dateOfBirth ? formatDate(personalInfo.dateOfBirth) : 'Not provided'}</div>
              )}
            </div>

            {/* Gender */}
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.27s'}}>
              <div className="parent-dashboard__info-card-header">
                <User className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Gender</div>
              </div>
              {isEditMode ? (
                <div>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input ${validationErrors.gender ? 'error' : ''}`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {validationErrors.gender && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.gender}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.gender || 'Not provided'}</div>
              )}
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.3s'}}>
              <div className="parent-dashboard__info-card-header">
                <Heart className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Civil Status</div>
              </div>
              {isEditMode ? (
                <div>
                  <select
                    name="civilStatus"
                    value={editFormData.civilStatus}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input ${validationErrors.civilStatus ? 'error' : ''}`}
                  >
                    <option value="">Select Civil Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                  {validationErrors.civilStatus && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.civilStatus}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.civilStatus || 'Not provided'}</div>
              )}
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.35s'}}>
              <div className="parent-dashboard__info-card-header">
                <MapPin className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Address</div>
              </div>
              {isEditMode ? (
                <div>
                  <textarea
                    name="address"
                    value={editFormData.address}
                    onChange={handleEditChange}
                    className={`parent-dashboard__info-card-input parent-dashboard__info-card-textarea ${validationErrors.address ? 'error' : ''}`}
                    placeholder="Enter address"
                    rows="3"
                  />
                  {validationErrors.address && (
                    <div className="parent-dashboard__validation-error">
                      {validationErrors.address}
                    </div>
                  )}
                </div>
              ) : (
                <div className="parent-dashboard__info-card-value">{personalInfo.address || 'Not provided'}</div>
              )}
            </div>

            {/* Email - Non-editable field */}
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.37s'}}>
              <div className="parent-dashboard__info-card-header">
                <Mail className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Email Address</div>
              </div>
              <div className="parent-dashboard__info-card-value">
                {personalInfo.email || 'Not provided'}
                {isEditMode && (
                  <div className="parent-dashboard__field-note">
                    Email cannot be changed. Contact administration for assistance.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Children Section */}
        <div className="parent-dashboard__section">
          <h3 className="parent-dashboard__section-title">
            <GraduationCap className="parent-dashboard__section-icon" />
            Children Enrolled
          </h3>
          
          {children.length > 0 ? (
            <div className="parent-dashboard__children-grid">
              {children.map((child, index) => (
                <div 
                  key={child._id || index} 
                  className={`parent-dashboard__child-card ${animated ? 'animate' : ''}`} 
                  style={{animationDelay: `${0.4 + (index * 0.1)}s`}}
                >
                  <div className="parent-dashboard__child-header">
                    <div className="parent-dashboard__child-avatar">
                      {child.profileImageUrl ? (
                        <img 
                          src={child.profileImageUrl} 
                          alt={`${child.firstName || ''} ${child.lastName || ''}`} 
                          className="parent-dashboard__child-avatar-img"
                        />
                      ) : (
                        <School className="parent-dashboard__child-avatar-placeholder" />
                      )}
                    </div>
                    <div className="parent-dashboard__child-title">
                      <h4 className="parent-dashboard__child-name">
                        {`${child.firstName || ''} ${child.middleName ? child.middleName + ' ' : ''}${child.lastName || ''}`}
                      </h4>
                      <div className="parent-dashboard__child-id">
                        ID: {child.idNumber || 'Not assigned'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="parent-dashboard__child-details">
                    <div className="parent-dashboard__child-detail">
                      <ClipboardList size={16} />
                      <span className="parent-dashboard__child-detail-label">Section:</span>
                      <span className="parent-dashboard__child-detail-value">{child.section || 'Not assigned'}</span>
                    </div>
                    
                    <div className="parent-dashboard__child-detail">
                      <BarChart2 size={16} />
                      <span className="parent-dashboard__child-detail-label">Grade Level:</span>
                      <span className="parent-dashboard__child-detail-value">{child.gradeLevel || 'Not specified'}</span>
                    </div>
                    
                    <div className="parent-dashboard__child-detail">
                      <Calendar size={16} />
                      <span className="parent-dashboard__child-detail-label">Age:</span>
                      <span className="parent-dashboard__child-detail-value">{child.age || 'Not specified'}</span>
                    </div>
                    
                    <div className="parent-dashboard__child-detail">
                      <User size={16} />
                      <span className="parent-dashboard__child-detail-label">Gender:</span>
                      <span className="parent-dashboard__child-detail-value">{child.gender || 'Not specified'}</span>
                    </div>
                    
                    <div className="parent-dashboard__child-detail">
                      <BookOpen size={16} />
                      <span className="parent-dashboard__child-detail-label">Reading Level:</span>
                      <span className="parent-dashboard__child-detail-value">{child.readingLevel || 'Not assessed'}</span>
                    </div>
                  </div>
                  
                  <div className="parent-dashboard__child-footer">
                    {/* <div className={`parent-dashboard__child-status ${child.status === 'active' ? 'active' : 'inactive'}`}>
                      {child.status === 'active' ? 'Active Student' : (child.status || 'Status Unknown')}
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="parent-dashboard__empty-children">
              <Book size={48} className="parent-dashboard__empty-icon" />
              <h4>No Children Enrolled</h4>
              <p>When your children are enrolled, they will appear here.</p>
            </div>
          )}
        </div>
        
        {/* Process Note */}
        <div className="parent-dashboard__process-note">
          <Info className="parent-dashboard__process-note-icon" />
          <div className="parent-dashboard__process-note-content">
            <p>
              <strong>Note:</strong> To update your personal information or to enroll a new child, 
              please contact the school administration. They will assist you with the necessary procedures.
            </p>
          </div>
        </div>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="parent-dashboard__success-message">
          <CheckCircle size={20} />
          <span>Changes saved successfully!</span>
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