// src/pages/Admin/TeacherLists.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen, Book, Clock, MoreHorizontal, User, X } from 'lucide-react';
import axios from 'axios';
import adminValidation from '../../utils/adminValidation';
import { InlineValidation, FormValidationSummary } from '../../components/Admin/ValidationErrorDisplay';
import authService from '../../services/authService';
import { API_BASE_URL } from '../../config/apiConfig';
import './TeacherLists.css';

// Success Modal Component
const SuccessModal = ({ message, onClose }) => (
  <div className="admin-teacher-modal-overlay">
    <div className="admin-teacher-modal">
      <div className="admin-teacher-modal-header">
        <h2>Success</h2>
        <button className="admin-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="admin-teacher-modal-form" style={{ textAlign: 'center', padding: '20px' }}>
        <p>{message}</p>
        <div className="admin-teacher-modal-footer-buttons" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <button className="admin-teacher-save-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  </div>
);

// Validation Error Modal Component
const ValidationErrorModal = ({ message, onClose }) => (
  <div className="admin-teacher-modal-overlay">
    <div className="admin-teacher-modal">
      <div className="admin-teacher-modal-header">
        <h2>Missing Required Fields</h2>
        <button className="admin-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="admin-teacher-modal-content">
        <p>{message}</p>
        <button className="admin-teacher-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// Credentials Modal Component
const CredentialsModal = ({ credentials, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const handleSendCredentials = async () => {
    try {
      setIsSending(true);
      setSendStatus(null);

      // Get current admin user from authService
      const currentUser = authService.getCurrentUser();

      // Extract admin information from auth service
      const adminEmail = currentUser?.user?.email || currentUser?.email || 'admin@literexia.com';
      const adminName = currentUser?.user?.name ||
                       (currentUser?.user?.firstName && currentUser?.user?.lastName ?
                        `${currentUser.user.firstName} ${currentUser.user.lastName}` :
                        'Literexia Admin');

      console.log('Sending teacher credentials with admin info:', {
        adminEmail,
        adminName,
        recipientEmail: credentials.email
      });

      const response = await axios.post('https://api.literexia.com/api/admin/send-credentials', {
        email: credentials.email,
        password: credentials.password,
        userType: 'teacher',
        adminEmail: adminEmail,
        adminName: adminName
      });

      if (response.data.success) {
        setSendStatus({ type: 'success', message: 'Credentials sent successfully!' });
      } else {
        setSendStatus({ type: 'error', message: 'Failed to send credentials.' });
      }
    } catch (error) {
      console.error('Error sending teacher credentials:', error);
      setSendStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send credentials.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-teacher-modal-overlay">
      <div className="admin-teacher-modal">
        <div className="admin-teacher-modal-header">
          <h2>Teacher Credentials</h2>
          <button className="admin-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-teacher-credentials-modal-content">
          <p><strong>Email:</strong> {credentials.email}</p>
          <p><strong>Password:</strong> ********</p>
          <p>You can send these credentials to the teacher's email.</p>
          {sendStatus && (
            <p className={`admin-teacher-send-status ${sendStatus.type}`}>
              {sendStatus.message}
            </p>
          )}
          <div className="admin-teacher-modal-actions">
            <button 
              className="admin-teacher-send-btn" 
              onClick={handleSendCredentials}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Login Credentials'}
            </button>
            <button className="admin-teacher-save-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add/Edit Teacher Modal Component
const AddEditTeacherModal = ({ teacher, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    teacher ? { ...teacher } : {
      firstName: '',
      lastName: '',
      middleName: '',
      position: '',
      contact: '',
      profileImage: null,
      address: '',
      civilStatus: '',
      dob: '',
      gender: '',
      email: ''
    }
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [validationResults, setValidationResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 3;

  const steps = [
    {
      title: 'Basic Info',
      fields: ['firstName', 'middleName', 'lastName', 'email']
    },
    {
      title: 'Personal Details',
      fields: ['gender', 'dob', 'civilStatus', 'contact']
    },
    {
      title: 'Work Info',
      fields: ['position', 'address', 'profileImage']
    }
  ];

  // Real-time validation function
  const validateField = (fieldName, value) => {
    console.log(`🔍 [TEACHER FORM] Validating field: ${fieldName}, value: ${value}`);

    switch (fieldName) {
      case 'firstName':
        return adminValidation.validateName(value, 'First Name');
      case 'lastName':
        return adminValidation.validateName(value, 'Last Name');
      case 'middleName':
        return adminValidation.validateName(value, 'Middle Name', true);
      case 'email':
        return adminValidation.validateEmail(value);
      case 'contact':
        return adminValidation.validateContactNumber(value);
      case 'address':
        return adminValidation.validateText(value, 'Address', false, 200);
      case 'position':
        return adminValidation.validateText(value, 'Position', true, 50);
      case 'dob':
        return adminValidation.validateBirthdate(value, 'teacher', 'Date of Birth');
      default:
        return { isValid: true, errors: [] };
    }
  };

  // Comprehensive form validation
  const validateAllFields = () => {
    console.log('🔍 [TEACHER FORM] Validating all fields...');

    const newValidationResults = {};
    let hasErrors = false;

    // Validate all required fields
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'gender', 'dob', 'civilStatus', 'contact', 'position', 'address'];

    fieldsToValidate.forEach(fieldName => {
      const result = validateField(fieldName, formData[fieldName]);
      newValidationResults[fieldName] = result;
      if (!result.isValid) {
        hasErrors = true;
      }
    });

    // Handle optional middle name separately
    if (formData.middleName && formData.middleName.trim()) {
      const middleNameResult = validateField('middleName', formData.middleName);
      newValidationResults.middleName = middleNameResult;
      if (!middleNameResult.isValid) {
        hasErrors = true;
      }
    } else {
      // Middle name is empty and optional - that's valid
      newValidationResults.middleName = { isValid: true, errors: [] };
    }

    // Validate gender separately
    if (!formData.gender || !formData.gender.trim()) {
      newValidationResults.gender = { isValid: false, errors: ['Gender is required'] };
      hasErrors = true;
    } else {
      const validGenders = ['Male', 'Female', 'Other'];
      if (!validGenders.includes(formData.gender.trim())) {
        newValidationResults.gender = { isValid: false, errors: ['Gender must be Male, Female, or Other'] };
        hasErrors = true;
      } else {
        newValidationResults.gender = { isValid: true, errors: [] };
      }
    }

    // Validate civil status separately
    if (!formData.civilStatus || !formData.civilStatus.trim()) {
      newValidationResults.civilStatus = { isValid: false, errors: ['Civil Status is required'] };
      hasErrors = true;
    } else {
      const validCivilStatuses = ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'];
      if (!validCivilStatuses.includes(formData.civilStatus.trim())) {
        newValidationResults.civilStatus = { isValid: false, errors: ['Please select a valid civil status'] };
        hasErrors = true;
      } else {
        newValidationResults.civilStatus = { isValid: true, errors: [] };
      }
    }

    setValidationResults(newValidationResults);

    console.log('🔍 [TEACHER FORM] Validation results:', { hasErrors, results: newValidationResults });

    return !hasErrors;
  };

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    const stepValidationResults = {};
    let isValid = true;

    currentFields.forEach(field => {
      if (field === 'profileImage') return; // Skip file upload validation for now

      // Handle optional fields
      if (field === 'middleName') {
        // Only validate middle name if it has content
        if (formData[field] && formData[field].trim()) {
          const result = validateField(field, formData[field]);
          stepValidationResults[field] = result;
          if (!result.isValid) {
            isValid = false;
          }
        } else {
          // Middle name is empty and optional - that's valid
          stepValidationResults[field] = { isValid: true, errors: [] };
        }
        return;
      }

      const result = validateField(field, formData[field]);
      stepValidationResults[field] = result;

      if (!result.isValid) {
        isValid = false;
      }
    });

    // Update validation results for current step
    setValidationResults(prev => ({
      ...prev,
      ...stepValidationResults
    }));

    return isValid;
  };

  // Simple email validation
  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setErrors({}); // Clear errors when moving to next step
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({}); // Clear errors when moving to previous step
  };

  const handleFinalSubmit = async () => {
    // Validate all steps before final submission
    let allStepsValid = true;
    let allErrors = {};
    const requiredFields = ['firstName', 'lastName', 'email', 'gender', 'dob', 'civilStatus', 'contact', 'position', 'address'];

    for (let step = 1; step <= totalSteps; step++) {
      const currentFields = steps[step - 1].fields;
      currentFields.forEach(field => {
        if (requiredFields.includes(field) && (!formData[field] || formData[field].toString().trim() === '')) {
          allErrors[field] = `${getFieldLabel(field)} is required`;
          allStepsValid = false;
        }
        if (field === 'email' && formData.email && !validateEmail(formData.email)) {
          allErrors[field] = `Please enter a valid email address`;
          allStepsValid = false;
        }
      });
    }

    if (!allStepsValid) {
      setErrors(allErrors);
      // Optionally, go back to the first step with errors
      for (let step = 1; step <= totalSteps; step++) {
        const currentFields = steps[step - 1].fields;
        const hasErrorInStep = currentFields.some(field => allErrors[field]);
        if (hasErrorInStep) {
          setCurrentStep(step);
          break;
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving teacher:', error);
      // Handle specific errors if needed, e.g., show a message to the user
      setErrors(prev => ({ ...prev, apiError: error.response?.data?.message || 'Failed to save teacher' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      handleNext();
    } else {
      handleFinalSubmit();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    const validationResult = validateField(name, value);
    setValidationResults(prev => ({
      ...prev,
      [name]: validationResult
    }));

    // Clear old-style errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    console.log(`🔍 [TEACHER FORM] Real-time validation for ${name}:`, validationResult);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    }
  };

  const getFieldLabel = (field) => {
    switch(field) {
      case 'firstName': return 'First Name';
      case 'middleName': return 'Middle Name';
      case 'lastName': return 'Last Name';
      case 'email': return 'Email';
      case 'contact': return 'Contact Number';
      case 'dob': return 'Date of Birth';
      case 'civilStatus': return 'Civil Status';
      case 'gender': return 'Gender';
      case 'position': return 'Position';
      case 'address': return 'Address';
      case 'profileImage': return 'Profile Image';
      default: return field.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const renderFormFields = () => {
    const currentFields = steps[currentStep - 1].fields;
    const requiredFields = ['firstName', 'lastName', 'email', 'gender', 'dob', 'civilStatus', 'contact', 'position', 'address'];

    return (
      <div className="admin-teacher-form-section">
        {currentFields.map(field => {
          const isRequired = requiredFields.includes(field);
          const validationResult = validationResults[field];
          const hasValidationError = validationResult && !validationResult.isValid;

          if (field === 'profileImage') {
            return (
              <div key={field} className="admin-teacher-form-group full-width">
                <label className="admin-teacher-optional">Profile Image (Optional)</label>
                
                {/* Show image preview - either current image or new image preview */}
                {(formData.profileImageUrl || (formData.profileImage && typeof formData.profileImage === 'string') || (formData.profileImage && typeof formData.profileImage === 'object')) && (
                  <div className="admin-teacher-current-image">
                    <img 
                      src={
                        formData.profileImage && typeof formData.profileImage === 'object' 
                          ? URL.createObjectURL(formData.profileImage)
                          : (formData.profileImageUrl || formData.profileImage)
                      } 
                      alt="Profile preview"
                      className="admin-teacher-profile-preview"
                    />
                    <p className="admin-teacher-image-label">
                      {formData.profileImage && typeof formData.profileImage === 'object' 
                        ? 'New Image Preview' 
                        : 'Current Image'
                      }
                    </p>
                  </div>
                )}

                <div className="admin-teacher-file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="admin-teacher-file-input"
                  />
                  <div className="admin-teacher-file-input-content">
                    <div className="admin-teacher-file-input-icon">📁</div>
                    <div className="admin-teacher-file-input-text">
                      {formData.profileImage ? 'Change Image' : 'Upload Image'}
                    </div>
                  </div>
                </div>
                {errors[field] && <div className="admin-teacher-error-message">{errors[field]}</div>}
              </div>
            );
          }

          if (field === 'gender') {
            return (
              <div key={field} className={`admin-teacher-form-group ${hasValidationError ? 'has-error' : ''}`}>
                <label className="admin-teacher-required">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className={`admin-teacher-input ${errors.gender || hasValidationError ? 'error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {/* Show validation errors first, then old error format */}
                <InlineValidation
                  validationResult={validationResult}
                  fieldName="Gender"
                />
                {!hasValidationError && errors.gender && <div className="admin-teacher-error-message">{errors.gender}</div>}
              </div>
            );
          }

          if (field === 'civilStatus') {
            return (
              <div key={field} className={`admin-teacher-form-group ${hasValidationError ? 'has-error' : ''}`}>
                <label className="admin-teacher-required">Civil Status</label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus || ''}
                  onChange={handleChange}
                  className={`admin-teacher-input ${errors.civilStatus || hasValidationError ? 'error' : ''}`}
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Divorced">Divorced</option>
                </select>
                {/* Show validation errors first, then old error format */}
                <InlineValidation
                  validationResult={validationResult}
                  fieldName="Civil Status"
                />
                {!hasValidationError && errors.civilStatus && <div className="admin-teacher-error-message">{errors.civilStatus}</div>}
              </div>
            );
          }

          if (field === 'position') {
            return (
              <div key={field} className={`admin-teacher-form-group ${hasValidationError ? 'has-error' : ''}`}>
                <label className="admin-teacher-required">Position</label>
                <select
                  name="position"
                  value={formData.position || ''}
                  onChange={handleChange}
                  className={`admin-teacher-input ${errors.position || hasValidationError ? 'error' : ''}`}
                >
                  <option value="">Select Position</option>
                  <option value="Grade 1 Teacher">Grade 1 Teacher</option>
                  <option value="Grade 2 Teacher">Grade 2 Teacher</option>
                  <option value="Grade 3 Teacher">Grade 3 Teacher</option>
                  <option value="Grade 4 Teacher">Grade 4 Teacher</option>
                  <option value="Grade 5 Teacher">Grade 5 Teacher</option>
                  <option value="Grade 6 Teacher">Grade 6 Teacher</option>
                </select>
                {/* Show validation errors first, then old error format */}
                <InlineValidation
                  validationResult={validationResult}
                  fieldName="Position"
                />
                {!hasValidationError && errors.position && <div className="admin-teacher-error-message">{errors.position}</div>}
              </div>
            );
          }

          // Add specific input types for each field
          const inputType = field === 'dob' ? 'date' : field === 'email' ? 'email' : field === 'contact' ? 'tel' : 'text';

          return (
            <div key={field} className={`admin-teacher-form-group ${field === 'address' ? 'full-width' : ''} ${hasValidationError ? 'has-error' : ''}`}>
              <label className={isRequired ? "admin-teacher-required" : "admin-teacher-optional"}>
                {getFieldLabel(field)} {!isRequired ? '(Optional)' : ''}
              </label>
              <input
                type={inputType}
                name={field}
                value={formData[field] || ''}
                onChange={handleChange}
                className={`admin-teacher-input ${errors[field] || hasValidationError ? 'error' : ''}`}
                placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
              />
              {/* Show validation errors first, then old error format */}
              <InlineValidation
                validationResult={validationResult}
                fieldName={getFieldLabel(field)}
              />
              {!hasValidationError && errors[field] && <div className="admin-teacher-error-message">{errors[field]}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-teacher-modal-overlay">
    <div className="admin-teacher-modal">
      <div className="admin-teacher-modal-header">
        <h2>{teacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
        <button className="admin-teacher-modal-close" onClick={onClose}>×</button>
      </div>

      <div className="admin-teacher-modal-form">
        {/* Progress bar */}
        <div className="admin-teacher-progress">
          <div 
            className="admin-teacher-progress-bar"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Steps indicator */}
        <div className="admin-teacher-form-steps">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`admin-teacher-step ${
                currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''
              }`}
            >
              <div className="admin-teacher-step-circle">
                {currentStep > index + 1 ? '✓' : index + 1}
              </div>
              <div className="admin-teacher-step-label">{step.title}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {renderFormFields()}

          {/* Form Validation Summary - Shows on final step */}
          {currentStep === totalSteps && (
            <FormValidationSummary
              validationResult={{
                isValid: Object.keys(validationResults).length === 0 || Object.values(validationResults).every(result => result.isValid),
                errors: Object.fromEntries(
                  Object.entries(validationResults)
                    .filter(([_, result]) => !result.isValid)
                    .map(([field, result]) => [field, result.errors])
                ),
                hasWarnings: false
              }}
              isSubmitting={isSubmitting}
              onSubmit={handleFinalSubmit}
              submitButtonText={teacher ? 'Update Teacher' : 'Add Teacher'}
              className="teacher-form-validation-summary"
            />
          )}

          <div className="admin-teacher-modal-footer">
            <div className="admin-teacher-modal-footer-buttons">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="admin-teacher-btn admin-teacher-btn-secondary"
                  disabled={isLoading}
                >
                  Previous
                </button>
              )}
              {/* Only show Next/Submit button if not on final step or if using validation summary */}
              {currentStep < totalSteps && (
                <button
                  type="submit"
                  className={`admin-teacher-btn admin-teacher-btn-primary ${isLoading ? 'admin-teacher-loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Next'}
                </button>
              )}
            </div>
          </div>
          {errors.apiError && <div className="admin-teacher-error-message" style={{ textAlign: 'center', marginTop: '10px' }}>{errors.apiError}</div>}
        </form>
      </div>
    </div>
  </div>
);
};

// View Teacher Profile Modal Component
const ViewTeacherProfileModal = ({ teacher, onClose }) => {
return (
  <div className="admin-teacher-modal-overlay">
    <div className="admin-teacher-profile-modal">
      <div className="admin-teacher-modal-header">
        <h2>Teacher Profile</h2>
        <button className="admin-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="admin-teacher-profile-content">
        <div className="admin-teacher-profile-avatar">
          {teacher.profileImageUrl ? (
            <img 
              src={teacher.profileImageUrl} 
              alt={`${teacher.firstName} ${teacher.lastName}`}
              className="admin-teacher-profile-image"
            />
          ) : (
            <User size={64} />
          )}
        </div>
        <h3 className="admin-teacher-profile-name">
          {`${teacher.firstName} ${teacher.middleName || ''} ${teacher.lastName}`}
        </h3>
        <div className="admin-teacher-profile-details">
          <div className="admin-teacher-profile-info">
            <div className="admin-teacher-profile-info-item">
              <span className="admin-teacher-profile-label">Position</span>
              <span className="admin-teacher-profile-value">{teacher.position || 'N/A'}</span>
            </div>
            <div className="admin-teacher-profile-info-item">
              <span className="admin-teacher-profile-label">Email</span>
              <span className="admin-teacher-profile-value">{teacher.email}</span>
            </div>
            <div className="admin-teacher-profile-info-item">
              <span className="admin-teacher-profile-label">Contact</span>
              <span className="admin-teacher-profile-value">{teacher.contact || 'N/A'}</span>
            </div>
            <div className="admin-teacher-profile-info-item">
              <span className="admin-teacher-profile-label">Gender</span>
              <span className="admin-teacher-profile-value">{teacher.gender || 'N/A'}</span>
            </div>
            <div className="admin-teacher-profile-info-item">
              <span className="admin-teacher-profile-label">Date of Birth</span>
              <span className="admin-teacher-profile-value">{teacher.dob ? new Date(teacher.dob).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="admin-teacher-profile-info-item">
              <span className="admin-teacher-profile-label">Civil Status</span>
              <span className="admin-teacher-profile-value">{teacher.civilStatus || 'N/A'}</span>
            </div>
            <div className="admin-teacher-profile-info-item">
              <span className="admin-teacher-profile-label">Address</span>
              <span className="admin-teacher-profile-value">{teacher.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="admin-teacher-profile-actions">
        <button 
          className="admin-teacher-close-profile-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);
};

// Confirm Delete Modal Component
const ConfirmDeleteModal = ({ teacher, onCancel, onConfirm }) => {
return (
  <div className="admin-teacher-modal-overlay">
    <div className="admin-teacher-modal">
      <div className="admin-teacher-modal-header">
        <h2>Confirm Delete</h2>
        <button className="admin-teacher-modal-close" onClick={onCancel}>×</button>
      </div>
      <div className="admin-teacher-confirm-modal-content">
        <p>Are you sure you want to delete this teacher?</p>
        <p><strong>{teacher.firstName} {teacher.lastName}</strong></p>
        <p>This action cannot be undone.</p>
        <div className="admin-teacher-confirm-buttons">
          <button className="admin-teacher-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="admin-teacher-confirm-delete-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  </div>
);
};

// Main TeacherListPage Component
const TeacherListPage = () => {
// State for teachers data
const [teachers, setTeachers] = useState([]);
const [filteredTeachers, setFilteredTeachers] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [filterBy, setFilterBy] = useState('name');
const [sortBy, setSortBy] = useState('name-asc');
const [currentPage, setCurrentPage] = useState(1);
const [teachersPerPage] = useState(10);
const [showFilters, setShowFilters] = useState(false);
const [selectedPosition, setSelectedPosition] = useState('all');
const [selectedStatus, setSelectedStatus] = useState('all');
const [showProfileModal, setShowProfileModal] = useState(false);
const [selectedTeacher, setSelectedTeacher] = useState(null);
const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [successMessage, setSuccessMessage] = useState('');
const [validationError, setValidationError] = useState('');
const [showCredentialsModal, setShowCredentialsModal] = useState(false);
const [newCredentials, setNewCredentials] = useState(null);
const [error, setError] = useState(null);

// Fetch teachers from database
useEffect(() => {
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/manage/teachers`);
      if (response.data.success) {
        setTeachers(response.data.data);
        setFilteredTeachers(response.data.data);
      } else {
        console.error("Error fetching teachers:", response.data.message);
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching teachers data:", error);
      setError(error.message || "Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  fetchTeachers();
}, []);

// Filter and search functionality
useEffect(() => {
  if (searchTerm === '') {
    setFilteredTeachers(teachers);
  } else {
    const filtered = teachers.filter(teacher => 
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }
}, [searchTerm, teachers]);

// Pagination
const indexOfLastTeacher = currentPage * teachersPerPage;
const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);

// Change page
const paginate = (pageNumber) => setCurrentPage(pageNumber);

// View teacher profile
const handleViewProfile = (teacher) => {
  setSelectedTeacher(teacher);
  setShowProfileModal(true);
};

// Edit teacher
const handleEditTeacher = (teacher) => {
  setSelectedTeacher(teacher);
  setShowEditTeacherModal(true);
};

// Delete teacher confirmation
const handleDeleteConfirmation = (teacher) => {
  setSelectedTeacher(teacher);
  setShowConfirmDeleteModal(true);
};

// Delete teacher
const deleteTeacher = async () => {
  if (!selectedTeacher) return;
  try {
    setLoading(true);
    const response = await axios.delete(`${API_BASE_URL}/admin/manage/teachers/${selectedTeacher._id}`);
    if (response.data.success) {
      const updatedList = teachers.filter(t => t._id !== selectedTeacher._id);
      setTeachers(updatedList);
      setFilteredTeachers(updatedList);
      setShowConfirmDeleteModal(false);
      setSelectedTeacher(null);
      setSuccessMessage('Teacher deleted successfully!');
      setShowSuccessModal(true);
    } else {
      setValidationError(response.data.message || 'Failed to delete teacher');
    }
  } catch (error) {
    setValidationError(error.response?.data?.message || 'Failed to delete teacher');
  } finally {
    setLoading(false);
  }
};

// Add new teacher
const handleAddTeacher = async (formData) => {
  try {
    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) data.append(key, value);
    });
    const response = await axios.post(`${API_BASE_URL}/admin/manage/teachers`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.data.success) {
      setTeachers([...teachers, response.data.data.teacherProfile]);
      setFilteredTeachers([...teachers, response.data.data.teacherProfile]);
      setShowAddTeacherModal(false);
      
      // Show credentials if they exist
      if (response.data.data.credentials) {
        setNewCredentials(response.data.data.credentials);
        setShowCredentialsModal(true);
      } else {
        setSuccessMessage('Teacher added successfully!');
        setShowSuccessModal(true);
      }
    } else {
      setValidationError(response.data.message || 'Failed to add teacher');
    }
  } catch (error) {
    setValidationError(error.response?.data?.message || 'Failed to add teacher');
  } finally {
    setLoading(false);
  }
};

// Edit teacher submission handler
const handleEditTeacherSubmit = async (formData) => {
  try {
    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) data.append(key, value);
    });
    const response = await axios.put(`${API_BASE_URL}/admin/manage/teachers/${formData._id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.data.success) {
      const updatedList = teachers.map(t => t._id === formData._id ? response.data.data.teacherProfile : t);
      setTeachers(updatedList);
      setFilteredTeachers(updatedList);
      setShowEditTeacherModal(false);
      setSelectedTeacher(null);
      setSuccessMessage('Teacher updated successfully!');
      setShowSuccessModal(true);
    } else {
      setValidationError(response.data.message || 'Failed to update teacher');
    }
  } catch (error) {
    setValidationError(error.response?.data?.message || 'Failed to update teacher');
  } finally {
    setLoading(false);
  }
};

// Toggle filters visibility
const toggleFilters = () => {
  setShowFilters(!showFilters);
};

if (loading) {
  return (
    <div className="admin-teacher-list-page">
      {/* Header Section */}
      <div className="admin-teacher-page-header">
        <div className="admin-teacher-title-container">
          <h1>Teacher Lists</h1>
          <p className="admin-teacher-page-subtitle">Add, View the List of Teachers and their Information</p>
        </div>
        <div className="admin-teacher-page-image">
          <div className="admin-teacher-page-placeholder"></div>
        </div>
      </div>

      <div className="admin-teacher-overview-stats">
        <div className="admin-teacher-stat-card">
          <h3>Total Teachers</h3>
          <p className="admin-teacher-stat-number">-</p>
        </div>
        <div className="admin-teacher-stat-card">
          <h3>Active Teachers</h3>
          <p className="admin-teacher-stat-number">-</p>
        </div>
        <div className="admin-teacher-stat-card">
          <h3>Average Performance</h3>
          <p className="admin-teacher-stat-number">-</p>
        </div>
      </div>

      <div className="admin-teacher-controls-container" style={{ backgroundColor: '#ffffff' }}>
        <div className="admin-teacher-search-filter-container">
          <div className="admin-teacher-search-box">
            <input
              type="text"
              placeholder="Search teachers..."
              disabled
            />
            <Search size={18} />
          </div>
          <button className="admin-teacher-filter-button" disabled>
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button className="admin-teacher-add-button" disabled>
            <Plus size={18} />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="admin-teacher-table-container" style={{ opacity: 0.6 }}>
        <table className="admin-teacher-table">
          <thead>
            <tr>
              <th>Teacher Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>View Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((_, index) => (
              <tr key={index}>
                <td><div className="admin-teacher-skeleton-text"></div></td>
                <td><div className="admin-teacher-skeleton-text"></div></td>
                <td><div className="admin-teacher-skeleton-text"></div></td>
                <td><div className="admin-teacher-skeleton-button"></div></td>
                <td><div className="admin-teacher-skeleton-actions"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="admin-teacher-error-message">
      <div className="admin-teacher-error-icon">⚠️</div>
      <p>Error: {error}</p>
      <button className="admin-teacher-btn admin-teacher-btn-primary" onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );
}

return (
  <div className="admin-teacher-list-page">
    {/* Header Section */}
    <div className="admin-teacher-page-header">
      <div className="admin-teacher-title-container">
        <h1>Teacher Lists</h1>
        <p className="admin-teacher-page-subtitle">Add, View the List of Teachers and their Information</p>
      </div>
      <div className="admin-teacher-page-image">
        {/* This would be replaced with an actual image in production */}
        <div className="admin-teacher-page-placeholder"></div>
      </div>
    </div>

    <div className="admin-teacher-overview-stats">
      <div className="admin-teacher-stat-card">
        <h3>Total Teachers</h3>
        <p className="admin-teacher-stat-number">{teachers.length}</p>
      </div>
    </div>

    {/* Controls Section */}
    <div className="admin-teacher-controls-container" style={{ backgroundColor: '#ffffff' }}>
      <div className="admin-teacher-search-filter-container">
        <div className="admin-teacher-search-box">
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} />
        </div>
        <button 
          className="admin-teacher-add-button"
          onClick={() => {
            setShowAddTeacherModal(true);
            setSelectedTeacher(null);
          }}
        >
          <Plus size={18} />
          <span>Add Teacher</span>
        </button>
      </div>
    </div>


    <div className="admin-teacher-table-container">
      <table className="admin-teacher-table">
        <thead>
          <tr>
            <th>Teacher Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>View Profile</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentTeachers.map((teacher) => (
            <tr key={teacher._id}>
              <td className="admin-teacher-name">{`${teacher.firstName} ${teacher.lastName}`}</td>
              <td>{teacher.email}</td>
              <td>{teacher.position || 'N/A'}</td>
              <td>
                <button 
                  className="admin-teacher-view-btn"
                  onClick={() => handleViewProfile(teacher)}
                >
                  View Profile
                </button>
              </td>
              <td>
                <div className="admin-teacher-action-buttons">
                  <button className="admin-teacher-action-btn edit" onClick={() => handleEditTeacher(teacher)}>
                    <Edit size={16} />
                  </button>
                  <button className="admin-teacher-action-btn delete" onClick={() => handleDeleteConfirmation(teacher)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {filteredTeachers.length > teachersPerPage && (
      <div className="admin-teacher-pagination">
        <button 
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="admin-teacher-pagination-button"
        >
          Previous
        </button>
        <div className="admin-teacher-page-numbers">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`admin-teacher-page-number ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}
        </div>
        <button 
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="admin-teacher-pagination-button"
        >
          Next
        </button>
      </div>
    )}

    {/* Add Teacher Modal */}
    {showAddTeacherModal && (
      <AddEditTeacherModal
        teacher={null}
        onClose={() => setShowAddTeacherModal(false)}
        onSave={handleAddTeacher}
      />
    )}

    {/* Edit Teacher Modal */}
    {showEditTeacherModal && selectedTeacher && (
      <AddEditTeacherModal
        teacher={selectedTeacher}
        onClose={() => {
          setShowEditTeacherModal(false);
          setSelectedTeacher(null);
        }}
        onSave={handleEditTeacherSubmit}
      />
    )}

    {/* Profile Modal */}
    {showProfileModal && selectedTeacher && (
      <ViewTeacherProfileModal
        teacher={selectedTeacher}
        onClose={() => setShowProfileModal(false)}
      />
    )}

    {/* Confirm Delete Modal */}
    {showConfirmDeleteModal && selectedTeacher && (
      <ConfirmDeleteModal
        teacher={selectedTeacher}
        onCancel={() => setShowConfirmDeleteModal(false)}
        onConfirm={deleteTeacher}
      />
    )}

    {/* Credentials Modal */}
    {showCredentialsModal && newCredentials && (
      <CredentialsModal
        credentials={newCredentials}
        onClose={() => {
          setShowCredentialsModal(false);
          setNewCredentials(null);
        }}
      />
    )}

    {/* Success Modal */}
    {showSuccessModal && (
      <SuccessModal
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    )}

    {/* Validation Error Modal */}
    {validationError && (
      <ValidationErrorModal
        message={validationError}
        onClose={() => setValidationError('')}
      />
    )}
  </div>
);
};

export default TeacherListPage;