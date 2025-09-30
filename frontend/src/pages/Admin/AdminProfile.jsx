import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Camera, Eye, EyeOff, Save, Settings, UserCheck, Shield } from 'lucide-react';
import authService from '../../services/authService';
import adminValidation from '../../utils/adminValidation';
import './AdminProfile.css';

const AdminProfile = () => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    contact: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    civilStatus: '',
    profileImageUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      const token = currentUser?.token || localStorage.getItem('authToken');

      const response = await fetch('https://api.literexia.com/api/admin/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        setProfileData({
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          middleName: data.data.middleName || '',
          email: data.data.email || '',
          contact: data.data.contact || '',
          address: data.data.address || '',
          dateOfBirth: data.data.dateOfBirth || data.data.dateOfbirth || '',
          gender: data.data.gender || '',
          civilStatus: data.data.civilStatus || '',
          profileImageUrl: data.data.profileImageUrl || ''
        });

        // Store original email for change detection
        setOriginalEmail(data.data.email || '');

        // Clear any previous error messages on successful load
        setMessage({ type: '', text: '' });
      } else {
        // Handle authentication or permission errors gracefully
        if (response.status === 401 || response.status === 403) {
          setMessage({ type: 'error', text: 'Session expired. Please refresh the page and try again.' });
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to load profile data' });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Handle network errors or server issues
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
      } else {
        setMessage({ type: 'error', text: 'Error loading profile. Please refresh the page and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Alias for consistency with other calls
  const fetchProfile = fetchAdminProfile;

  const validateForm = () => {
    const errors = {};

    // Validate first name
    const firstNameResult = adminValidation.validateName(profileData.firstName, 'First Name');
    if (!firstNameResult.isValid) errors.firstName = firstNameResult.errors;

    // Validate last name
    const lastNameResult = adminValidation.validateName(profileData.lastName, 'Last Name');
    if (!lastNameResult.isValid) errors.lastName = lastNameResult.errors;

    // Validate middle name (optional)
    if (profileData.middleName && profileData.middleName.trim()) {
      const middleNameResult = adminValidation.validateName(profileData.middleName, 'Middle Name', true);
      if (!middleNameResult.isValid) errors.middleName = middleNameResult.errors;
    }

    // Validate email
    const emailResult = adminValidation.validateEmail(profileData.email);
    if (!emailResult.isValid) {
      errors.email = emailResult.errors;
    } else if (emailResult.warning) {
      errors.email = [emailResult.warning];
    }

    // Validate contact
    if (profileData.contact) {
      const contactResult = adminValidation.validateContactNumber(profileData.contact);
      if (!contactResult.isValid) errors.contact = contactResult.errors;
    }

    // Validate date of birth (18+ age requirement for admin)
    if (profileData.dateOfBirth) {
      const birthdateResult = adminValidation.validateBirthdate(profileData.dateOfBirth, 'admin');
      if (!birthdateResult.isValid) errors.dateOfBirth = birthdateResult.errors;
    }

    // Validate address
    if (profileData.address) {
      const addressResult = adminValidation.validateText(profileData.address, 'Address', false, 200);
      if (!addressResult.isValid) errors.address = addressResult.errors;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    const updatedData = {
      ...profileData,
      [field]: value
    };

    setProfileData(updatedData);

    // Real-time validation for the specific field
    const errors = {};

    // Validate the specific field that changed
    if (field === 'firstName') {
      const result = adminValidation.validateName(value, 'First Name');
      if (!result.isValid) errors.firstName = result.errors;
    } else if (field === 'lastName') {
      const result = adminValidation.validateName(value, 'Last Name');
      if (!result.isValid) errors.lastName = result.errors;
    } else if (field === 'middleName' && value && value.trim()) {
      const result = adminValidation.validateName(value, 'Middle Name', true);
      if (!result.isValid) errors.middleName = result.errors;
    } else if (field === 'email') {
      const result = adminValidation.validateEmail(value);
      if (!result.isValid) {
        errors.email = result.errors;
      } else if (result.warning) {
        errors.email = [result.warning];
      }
    } else if (field === 'contact' && value) {
      const result = adminValidation.validateContactNumber(value);
      if (!result.isValid) errors.contact = result.errors;
    } else if (field === 'address' && value) {
      const result = adminValidation.validateText(value, 'Address', false, 200);
      if (!result.isValid) errors.address = result.errors;
    } else if (field === 'dateOfBirth' && value) {
      const result = adminValidation.validateBirthdate(value, 'admin');
      if (!result.isValid) errors.dateOfBirth = result.errors;
    }

    // Update validation errors for the specific field
    setValidationErrors(prev => ({
      ...prev,
      [field]: errors[field] || null
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handlePasswordSectionToggle = (checked) => {
    setShowPasswordSection(checked);
    // Clear password data when hiding the section
    if (!checked) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setValidationErrors(prev => ({
        ...prev,
        currentPassword: null,
        newPassword: null,
        confirmPassword: null
      }));
    }
  };

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    // Clear validation errors when entering edit mode
    if (!isEditMode) {
      setValidationErrors({});
    }
  };

  const validatePassword = () => {
    const errors = {};

    // Current password validation
    if (!passwordData.currentPassword) {
      errors.currentPassword = ['Current password is required'];
    }

    // New password validation - COMPREHENSIVE
    if (!passwordData.newPassword) {
      errors.newPassword = ['New password is required'];
    } else {
      const password = passwordData.newPassword;
      const passwordErrors = [];

      // Length requirement
      if (password.length < 8) {
        passwordErrors.push('Password must be at least 8 characters long');
      }

      // Uppercase letter requirement
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('Password must contain at least one uppercase letter (A-Z)');
      }

      // Lowercase letter requirement
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('Password must contain at least one lowercase letter (a-z)');
      }

      // Number requirement
      if (!/\d/.test(password)) {
        passwordErrors.push('Password must contain at least one number (0-9)');
      }

      // Special character requirement (optional but recommended)
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        passwordErrors.push('Password should contain at least one special character (!@#$%^&*)');
      }

      // Common password check
      const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password123'];
      if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        passwordErrors.push('Password is too common - please choose a more secure password');
      }

      // Sequential characters check
      if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
        passwordErrors.push('Password should not contain sequential characters (e.g., 123, abc)');
      }

      // Repeated characters check
      if (/(.)\1{2,}/.test(password)) {
        passwordErrors.push('Password should not contain repeated characters (e.g., aaa, 111)');
      }

      if (passwordErrors.length > 0) {
        errors.newPassword = passwordErrors;
      }
    }

    // Confirm password validation
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = ['Please confirm your new password'];
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match'];
    }

    return errors;
  };

  const handlePasswordSave = async () => {
    const passwordErrors = validatePassword();
    if (Object.keys(passwordErrors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...passwordErrors }));
      setMessage({ type: 'error', text: 'Please fix password validation errors' });
      return;
    }

    setSaving(true);
    try {
      const currentUser = authService.getCurrentUser();
      const token = currentUser?.token || localStorage.getItem('authToken');

      const response = await fetch('https://api.literexia.com/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Clear password validation errors
        const newErrors = { ...validationErrors };
        delete newErrors.currentPassword;
        delete newErrors.newPassword;
        delete newErrors.confirmPassword;
        setValidationErrors(newErrors);

        // Clear all authentication data and redirect to custom dialog page
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');

        // Redirect to role selection page with custom dialog
        setTimeout(() => {
          window.location.href = '/choose-account?redirect=password_changed';
        }, 1000); // Give user time to see success message
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('profileImage', imageFile);

    try {
      const currentUser = authService.getCurrentUser();
      const token = currentUser?.token || localStorage.getItem('authToken');

      const response = await fetch('https://api.literexia.com/api/admin/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        return data.imageUrl;
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix validation errors before saving' });
      return;
    }

    setSaving(true);
    try {
      const currentUser = authService.getCurrentUser();
      const token = currentUser?.token || localStorage.getItem('authToken');

      // Upload image first if a new image is selected
      let imageUrl = profileData.profileImageUrl;
      if (imageFile) {
        try {
          imageUrl = await uploadImage();
          setProfileData(prev => ({ ...prev, profileImageUrl: imageUrl }));
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
          setSaving(false);
          return;
        }
      }

      // Prepare data for admin profile update
      const profileUpdateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        middleName: profileData.middleName,
        email: profileData.email,
        contact: profileData.contact,
        address: profileData.address,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        civilStatus: profileData.civilStatus,
        profileImageUrl: imageUrl,
      };

      // Update admin profile in database
      const response = await fetch('https://api.literexia.com/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileUpdateData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });

        // Clear image preview and file after successful save
        setImageFile(null);
        setImagePreview(null);

        // Update the auth service with new email if changed
        if (currentUser && currentUser.user) {
          currentUser.user.email = profileData.email;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }

        // If email changed, redirect to custom dialog page
        if (originalEmail !== profileData.email) {
          // Clear all authentication data immediately
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          localStorage.removeItem('user');

          // Redirect to role selection page with custom dialog
          setTimeout(() => {
            window.location.href = '/choose-account?redirect=email_changed';
          }, 1000); // Give user time to see success message

          return; // Don't continue with normal flow
        }

        // For non-email changes, refresh profile data normally
        await fetchProfile();

        // Dispatch custom event to notify other components (like NavigationBar)
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: {
            action: 'profile_update',
            updatedData: data.data
          }
        }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const renderValidationErrors = (field) => {
    if (!validationErrors[field]) return null;
    return (
      <div className="admin-profile__validation-errors">
        {validationErrors[field].map((error, index) => (
          <span key={index} className="admin-profile__error-message">
            {error}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-profile__loading">
        <div className="admin-profile__spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="admin-profile">
      <div className="admin-profile__header">
        <div className="admin-profile__title-container">
          <h1>
            <User className="admin-profile__header-icon" />
            Admin Profile
          </h1>
          <p className="admin-profile__page-subtitle">Manage your account information and email settings</p>
        </div>
        <div className="admin-profile__header-actions">
          <button
            onClick={handleEditModeToggle}
            className={`admin-profile__edit-btn ${isEditMode ? 'admin-profile__edit-btn--active' : ''}`}
          >
            {isEditMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`admin-profile__message admin-profile__message--${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-profile__content">
        {/* Profile Image Section */}
        <div className="admin-profile__image-section">
          <div className="admin-profile__avatar">
            {imagePreview || profileData.profileImageUrl ? (
              <img src={imagePreview || profileData.profileImageUrl} alt="Profile" />
            ) : (
              <div className="admin-profile__avatar-placeholder">
                <User size={40} />
              </div>
            )}
          </div>
          <input
            type="file"
            id="profile-image-input"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          {isEditMode && (
            <button
              className="admin-profile__image-upload-btn"
              onClick={() => document.getElementById('profile-image-input').click()}
              type="button"
            >
              <Camera size={16} />
              Change Photo
            </button>
          )}
        </div>

        {/* Personal Information */}
        <div className="admin-profile__section">
          <h2>
            <UserCheck className="admin-profile__section-icon" />
            Personal Information
          </h2>

          <div className="admin-profile__form-grid">
            <div className="admin-profile__form-group">
              <label>
                First Name 
                <span className="admin-profile__required-asterisk">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={validationErrors.firstName ? 'admin-profile__input--error' : ''}
                />
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.firstName || 'Not provided'}
                </div>
              )}
              {isEditMode && renderValidationErrors('firstName')}
            </div>

            <div className="admin-profile__form-group">
              <label>
                Last Name 
                <span className="admin-profile__required-asterisk">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className={validationErrors.lastName ? 'admin-profile__input--error' : ''}
                />
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.lastName || 'Not provided'}
                </div>
              )}
              {isEditMode && renderValidationErrors('lastName')}
            </div>

            <div className="admin-profile__form-group">
              <label>Middle Name (Optional)</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={profileData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  placeholder="Enter middle name (e.g., T or T.)"
                  className={validationErrors.middleName ? 'admin-profile__input--error' : ''}
                />
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.middleName || 'Not provided'}
                </div>
              )}
              {isEditMode && renderValidationErrors('middleName')}
            </div>

            <div className="admin-profile__form-group">
              <label>Gender</label>
              {isEditMode ? (
                <select
                  value={profileData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.gender || 'Not provided'}
                </div>
              )}
            </div>

            <div className="admin-profile__form-group">
              <label>
                Date of Birth
                <span className="admin-profile__required-asterisk">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={validationErrors.dateOfBirth ? 'admin-profile__input--error' : ''}
                />
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </div>
              )}
              {isEditMode && renderValidationErrors('dateOfBirth')}
            </div>

            <div className="admin-profile__form-group">
              <label>Civil Status</label>
              {isEditMode ? (
                <select
                  value={profileData.civilStatus}
                  onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.civilStatus || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="admin-profile__section">
          <h2>
            <Mail className="admin-profile__section-icon" />
            Contact Information
          </h2>

          <div className="admin-profile__form-grid">
            <div className="admin-profile__form-group">
              <label>
                Email Address 
                <span className="admin-profile__required-asterisk">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={validationErrors.email ? 'admin-profile__input--error' : ''}
                />
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.email || 'Not provided'}
                </div>
              )}
              {isEditMode && renderValidationErrors('email')}
            </div>

            <div className="admin-profile__form-group">
              <label>Contact Number</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={profileData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  placeholder="Enter contact number"
                  className={validationErrors.contact ? 'admin-profile__input--error' : ''}
                />
              ) : (
                <div className="admin-profile__readonly-field">
                  {profileData.contact || 'Not provided'}
                </div>
              )}
              {isEditMode && renderValidationErrors('contact')}
            </div>

            <div className="admin-profile__form-group admin-profile__form-group--full">
              <label>Address</label>
              {isEditMode ? (
                <textarea
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  rows="3"
                  className={validationErrors.address ? 'admin-profile__input--error' : ''}
                />
              ) : (
                <div className="admin-profile__readonly-field admin-profile__readonly-field--multiline">
                  {profileData.address || 'Not provided'}
                </div>
              )}
              {isEditMode && renderValidationErrors('address')}
            </div>
          </div>
        </div>



        {/* Change Password */}
        <div className="admin-profile__section admin-profile__section--password">
          <h2>
            <Shield className="admin-profile__section-icon" />
            Change Password
          </h2>
          <p className="admin-profile__section-description">
            Update your account password for security purposes.
          </p>

          <div className="admin-profile__form-group">
            <label className="admin-profile__checkbox-label">
              <input
                type="checkbox"
                checked={showPasswordSection}
                onChange={(e) => handlePasswordSectionToggle(e.target.checked)}
              />
              I want to change my password
            </label>
          </div>

          {showPasswordSection && (
            <div className="admin-profile__password-config">
          <div className="admin-profile__form-grid">
            <div className="admin-profile__password-field">
              <label>Current Password *</label>
              <div className="admin-profile__password-input">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  className={validationErrors.currentPassword ? 'admin-profile__input--error' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="admin-profile__password-toggle"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {renderValidationErrors('currentPassword')}
            </div>

            <div className="admin-profile__password-field">
              <label>New Password *</label>
              <div className="admin-profile__password-input">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  className={validationErrors.newPassword ? 'admin-profile__input--error' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="admin-profile__password-toggle"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {renderValidationErrors('newPassword')}
            </div>

            <div className="admin-profile__password-field">
              <label>Confirm New Password *</label>
              <div className="admin-profile__password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  className={validationErrors.confirmPassword ? 'admin-profile__input--error' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="admin-profile__password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {renderValidationErrors('confirmPassword')}
            </div>
          </div>

          <div className="admin-profile__password-requirements">
            <strong>Password Requirements:</strong>
            <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
              <li>At least 8 characters long</li>
              <li>Contains at least one uppercase letter</li>
              <li>Contains at least one lowercase letter</li>
              <li>Contains at least one number</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handlePasswordSave}
              disabled={saving}
              className="admin-profile__save-btn"
              style={{ backgroundColor: '#dc2626', minWidth: '160px' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              <Save size={16} />
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
            </div>
          )}
        </div>

        {/* Save Button - Only show in edit mode */}
        {isEditMode && (
          <div className="admin-profile__actions">
            <button
              onClick={handleSave}
              disabled={saving}
              className="admin-profile__save-btn"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;