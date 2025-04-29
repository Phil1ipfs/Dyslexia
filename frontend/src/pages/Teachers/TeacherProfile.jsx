// src/pages/Teachers/TeacherProfile.jsx
import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiUserCheck,
  FiLock,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import "../../css/Teachers/TeacherProfile.css";

// Mock service function - this would be replaced with actual API calls to MongoDB
import { fetchTeacherProfile, updateTeacherProfile, updateTeacherPassword } from "../../services/teacherService";

/**
 * TeacherProfile Component
 * 
 * A comprehensive profile management component for teachers that allows viewing
 * and editing of personal information, as well as password management.
 */
function TeacherProfile() {
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Effect to fetch profile data
  useEffect(() => {
    const getTeacherData = async () => {
      try {
        setIsLoading(true);
        // This would be replaced with an actual API call
        const data = await fetchTeacherProfile();
        setFormData(data);
        setIsLoading(false);
      } catch (error) {
        setLoadError("Failed to load profile data. Please try again later.");
        setIsLoading(false);
      }
    };
    
    getTeacherData();
  }, []);

  // States for form handling
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ show: false, message: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Initial form data state - this would normally be populated from API
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    employeeId: "",
    email: "",
    contact: "",
    gender: "",
    dob: "",
    address: "",
    emergencyContact: {
      name: "",
      number: ""
    }
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle emergency contact changes
  const handleEmergencyChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value },
    }));
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number format (simple validation for Philippine format)
  const isValidPhoneNumber = (phone) => {
    // Allow +63 format or local 09xx format
    const phoneRegex = /^(\+?63|0)[\d]{10}$/;
    // Remove spaces for validation
    const cleanPhone = phone.replace(/\s+/g, '');
    return phoneRegex.test(cleanPhone);
  };

  // Toggle edit mode with validation
  const toggleEdit = async () => {
    if (isEditing) {
      // Form validation
      if (!formData.name.trim()) {
        return setErrorDialog({ show: true, message: "Full name is required." });
      }
      
      if (!formData.email.trim()) {
        return setErrorDialog({ show: true, message: "Email is required." });
      }
      
      if (!isValidEmail(formData.email)) {
        return setErrorDialog({ show: true, message: "Please enter a valid email address." });
      }
      
      if (!formData.contact.trim()) {
        return setErrorDialog({ show: true, message: "Contact number is required." });
      }
      
      if (!isValidPhoneNumber(formData.contact)) {
        return setErrorDialog({ 
          show: true, 
          message: "Please enter a valid Philippine phone number (e.g., +63 912 345 6789 or 0912 345 6789)." 
        });
      }
      
      // Additional validations as needed
      
      try {
        // This would be an actual API call in production
        await updateTeacherProfile(formData);
        setIsEditing(false);
        setShowSaveDialog(true);
      } catch (error) {
        setErrorDialog({ 
          show: true, 
          message: "Failed to update profile. Please try again later." 
        });
      }
    } else {
      setIsEditing(true);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="teacherprofile-outer">
        <div className="teacherprofile-card loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadError) {
    return (
      <div className="teacherprofile-outer">
        <div className="teacherprofile-card error-state">
          <div className="error-icon">!</div>
          <h3>Something went wrong</h3>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacherprofile-outer">
      <div className="teacherprofile-card">
        <h2 className="tp-page-title">Teacher Profile</h2>

        <div className="tp-profile-card">
          {/* Error Dialog */}
          {errorDialog.show && (
            <div className="save-dialog-overlay">
              <div className="save-dialog-box error">
                <h4>Error</h4>
                <p>{errorDialog.message}</p>
                <button onClick={() => setErrorDialog({ show: false, message: "" })}>OK</button>
              </div>
            </div>
          )}

          {/* Success Save Dialog */}
          {showSaveDialog && (
            <div className="save-dialog-overlay">
              <div className="save-dialog-box success">
                <h4>Success</h4>
                <p>Profile information updated successfully!</p>
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
                <span className="label">Employee ID:</span> 
                <span className="value">{formData.employeeId}</span>
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
                    placeholder="Email Address"
                    aria-label="Email Address"
                  />
                </div>
                <div className="tp-input-group">
                  <FiUser className="tp-input-icon" />
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="Position"
                    aria-label="Position"
                  />
                </div>
              </div>
            </div>
            <div className="tp-action-buttons">
              <button className="tp-edit-btn" onClick={toggleEdit} aria-label={isEditing ? "Save Profile" : "Edit Profile"}>
                {isEditing ? "Save Profile" : "Edit Profile"}
              </button>
              <button
                className="tp-change-password-btn"
                onClick={() => setShowPasswordModal(true)}
                aria-label="Change Password"
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
              <label htmlFor="teacher-name">Full Name</label>
              <FiUser className="tp-input-icon" />
              <input
                id="teacher-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="Full Name"
                aria-label="Full Name"
              />
              {isEditing && !formData.name.trim() && 
                <span className="input-error-hint">Name is required</span>
              }
            </div>
            <div className="tp-input-group">
              <label htmlFor="teacher-contact">Contact Number</label>
              <FiPhone className="tp-input-icon" />
              <input
                id="teacher-contact"
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="Contact Number"
                aria-label="Contact Number"
              />
              {isEditing && formData.contact && !isValidPhoneNumber(formData.contact) && 
                <span className="input-error-hint">Enter valid Philippine number</span>
              }
            </div>
            <div className="tp-input-group">
              <label htmlFor="teacher-dob">Date of Birth</label>
              <FiCalendar className="tp-input-icon" />
              <input
                id="teacher-dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                readOnly={!isEditing}
                aria-label="Date of Birth"
              />
            </div>
            <div className="tp-input-group">
              <label htmlFor="teacher-gender">Gender</label>
              <FiUser className="tp-input-icon" />
              <select
                id="teacher-gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing}
                aria-label="Gender"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="tp-input-group full-width-input-group">
              <label htmlFor="teacher-address">Address</label>
              <FiMapPin className="tp-input-icon" />
              <input
                id="teacher-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="Complete Address"
                aria-label="Address"
                className="full-width-input"
              />
            </div>
          </div>

          <h4 className="tp-subtitle">Emergency Contact</h4>
          <div className="tp-info-grid">
            <div className="tp-input-group">
              <label htmlFor="emergency-name">Contact Person</label>
              <FiUserCheck className="tp-input-icon" />
              <input
                id="emergency-name"
                type="text"
                name="emergencyName"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyChange("name", e.target.value)}
                readOnly={!isEditing}
                placeholder="Emergency Contact Name"
                aria-label="Emergency Contact Name"
              />
            </div>
            <div className="tp-input-group">
              <label htmlFor="emergency-number">Contact Number</label>
              <FiPhone className="tp-input-icon" />
              <input
                id="emergency-number"
                type="text"
                name="emergencyNumber"
                value={formData.emergencyContact.number}
                onChange={(e) => handleEmergencyChange("number", e.target.value)}
                readOnly={!isEditing}
                placeholder="Emergency Contact Number"
                aria-label="Emergency Contact Number"
              />
              {isEditing && 
                formData.emergencyContact.number && 
                !isValidPhoneNumber(formData.emergencyContact.number) && 
                <span className="input-error-hint">Enter valid Philippine number</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ChangePasswordModal Component
 * 
 * Modal for changing teacher password with validation and security features.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the modal
 */
function ChangePasswordModal({ onClose }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "#ccc"
  });

  // Check password strength
  const checkPasswordStrength = (password) => {
    // Initial score
    let score = 0;
    let message = "Very weak";
    let color = "#ff4d4d";

    // If password is empty, return default values
    if (!password) {
      return { score: 0, message: "", color: "#ccc" };
    }

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Contains lowercase
    if (/[a-z]/.test(password)) score++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) score++;
    
    // Contains number
    if (/\d/.test(password)) score++;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Determine message and color based on score
    if (score >= 6) {
      message = "Very strong";
      color = "#4CAF50";
    } else if (score >= 4) {
      message = "Strong";
      color = "#8BC34A";
    } else if (score >= 3) {
      message = "Moderate";
      color = "#FFC107";
    } else if (score >= 2) {
      message = "Weak";
      color = "#FF9800";
    }

    return { score, message, color };
  };

  // Update password strength when new password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(newPass));
  }, [newPass]);

  const handleChangePassword = async () => {
    // Reset error state
    setError("");
    
    // Validate inputs
    if (!currentPass) {
      setError("Current password is required.");
      return;
    }
    
    if (!newPass) {
      setError("New password is required.");
      return;
    }
    
    if (newPass !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }
    
    // Password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPass)) {
      setError("Password must be at least 8 characters long and include lowercase, uppercase, number, and special character.");
      return;
    }
    
    // Prevent using the same password
    if (currentPass === newPass) {
      setError("New password must be different from current password.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // This would be an actual API call in production
      await updateTeacherPassword(currentPass, newPass);
      
      // Show success message
      setSuccess("Password updated successfully!");
      
      // Reset form fields
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      // Handle specific error cases
      if (error.message === "INCORRECT_PASSWORD") {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to update password. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="save-dialog-overlay">
      <div className="save-dialog-box password-modal">
        <h4>Change Password</h4>
        
        {/* Error message */}
        {error && <p className="password-error-message">{error}</p>}
        
        {/* Success message */}
        {success && <p className="password-success-message">{success}</p>}
        
        {/* Current password field */}
        <div className="password-input-group">
          <label htmlFor="current-password">Current Password</label>
          <FiLock className="input-icon-left" />
          <input
            id="current-password"
            type={showCurrent ? "text" : "password"}
            placeholder="Enter current password"
            value={currentPass}
            onChange={e => setCurrentPass(e.target.value)}
            disabled={isSubmitting || success}
            aria-label="Current Password"
          />
          {showCurrent
            ? <FiEyeOff className="input-icon-right" onClick={() => setShowCurrent(false)} />
            : <FiEye className="input-icon-right" onClick={() => setShowCurrent(true)} />
          }
        </div>
        
        {/* New password field */}
        <div className="password-input-group">
          <label htmlFor="new-password">New Password</label>
          <FiLock className="input-icon-left" />
          <input
            id="new-password"
            type={showNew ? "text" : "password"}
            placeholder="Enter new password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            disabled={isSubmitting || success}
            aria-label="New Password"
          />
          {showNew
            ? <FiEyeOff className="input-icon-right" onClick={() => setShowNew(false)} />
            : <FiEye className="input-icon-right" onClick={() => setShowNew(true)} />
          }
        </div>
        
        {/* Password strength indicator */}
        {newPass && (
          <div className="password-strength-indicator">
            <div className="strength-label">
              Password strength: <span style={{ color: passwordStrength.color }}>{passwordStrength.message}</span>
            </div>
            <div className="strength-bar-container">
              <div 
                className="strength-bar-fill" 
                style={{ 
                  width: `${(passwordStrength.score / 6) * 100}%`,
                  backgroundColor: passwordStrength.color
                }}
              ></div>
            </div>
            <div className="password-requirements">
              <ul>
                <li className={newPass.length >= 8 ? "met" : ""}>At least 8 characters</li>
                <li className={/[A-Z]/.test(newPass) ? "met" : ""}>Uppercase letter (A-Z)</li>
                <li className={/[a-z]/.test(newPass) ? "met" : ""}>Lowercase letter (a-z)</li>
                <li className={/\d/.test(newPass) ? "met" : ""}>Number (0-9)</li>
                <li className={/[^A-Za-z0-9]/.test(newPass) ? "met" : ""}>Special character (!@#$%^&*)</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Confirm password field */}
        <div className="password-input-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <FiLock className="input-icon-left" />
          <input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            disabled={isSubmitting || success}
            aria-label="Confirm Password"
          />
          {showConfirm
            ? <FiEyeOff className="input-icon-right" onClick={() => setShowConfirm(false)} />
            : <FiEye className="input-icon-right" onClick={() => setShowConfirm(true)} />
          }
          {newPass && confirmPass && newPass !== confirmPass && (
            <span className="input-error-hint">Passwords do not match</span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="password-buttons">
          <button 
            onClick={handleChangePassword} 
            disabled={isSubmitting || success}
            className={isSubmitting ? 'loading' : ''}
            aria-label="Update Password"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
          <button 
            onClick={onClose} 
            className="cancel-btn" 
            disabled={isSubmitting || success}
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;