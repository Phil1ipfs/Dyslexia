import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, ChevronDown, User, UserPlus, Filter, Plus, X } from 'lucide-react';
import axios from 'axios';
import './TeacherLists.css';

const CredentialsModal = ({ credentials, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const handleSendCredentials = async () => {
    try {
      setIsSending(true);
      setSendStatus(null);
      const response = await axios.post('http://localhost:5001/api/admin/send-credentials', {
        email: credentials.email,
        password: credentials.password,
        userType: 'teacher'
      });
      
      if (response.data.success) {
        setSendStatus({ type: 'success', message: 'Credentials sent successfully!' });
      } else {
        setSendStatus({ type: 'error', message: 'Failed to send credentials.' });
      }
    } catch (error) {
      setSendStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send credentials.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>Teacher Credentials</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="literexia-teacher-modal-form">
          <p><strong>Email:</strong> {credentials.email}</p>
          <p><strong>Password:</strong> ********</p>
          <p>You can send these credentials to the teacher's email.</p>
          {sendStatus && (
            <p className={`send-status ${sendStatus.type}`}>
              {sendStatus.message}
            </p>
          )}
          <div className="literexia-teacher-modal-actions">
            <button 
              className="literexia-teacher-send-btn" 
              onClick={handleSendCredentials}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Login Credentials'}
            </button>
            <button className="literexia-teacher-save-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuccessModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Success</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-form">
        <p>{message}</p>
        <button className="literexia-teacher-save-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const ValidationErrorModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Error</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-form">
        <p>{message}</p>
        <button className="literexia-teacher-save-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const TeacherLists = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showTeacherProfileModal, setShowTeacherProfileModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  // Fetch teachers from database
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/admin/manage/teachers');
        if (response.data.success) {
          setTeachers(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch teachers');
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => {
    const searchValue = searchBy === 'name' 
      ? `${teacher.firstName} ${teacher.lastName}`.toLowerCase()
      : (teacher[searchBy] || '').toLowerCase();
    return searchValue.includes(searchTerm.toLowerCase());
  });

  // View teacher profile
  const handleViewProfile = (teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherProfileModal(true);
  };

  // Handler for editing teacher
  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowAddTeacherModal(true);
  };

  // Handler for delete confirmation
  const handleDeleteConfirmation = (teacher) => {
    setTeacherToDelete(teacher);
    setIsConfirmDeleteOpen(true);
  };

  // Handler for actual deletion (calls backend)
  const handleDeleteTeacher = async () => {
    if (teacherToDelete) {
      try {
        setLoading(true);
        const response = await axios.delete(`http://localhost:5001/api/admin/manage/teachers/${teacherToDelete._id}`);
        if (response.data.success) {
          const updatedTeachers = teachers.filter(teacher => teacher._id !== teacherToDelete._id);
          setTeachers(updatedTeachers);
          setSuccessMessage('Teacher deleted successfully');
          setShowSuccessModal(true);
        } else {
          alert(response.data.message || 'Failed to delete teacher');
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete teacher');
      } finally {
        setLoading(false);
        setIsConfirmDeleteOpen(false);
        setTeacherToDelete(null);
      }
    }
  };

  // Add new teacher handler (calls backend)
  const handleAddNewTeacher = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      const response = await axios.post('http://localhost:5001/api/admin/manage/teachers', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setTeachers([...teachers, response.data.data.teacherProfile]);
        setShowAddTeacherModal(false);
        setNewCredentials(response.data.data.credentials);
        setShowCredentialsModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to add teacher');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to add teacher');
    } finally {
      setLoading(false);
    }
  };

  // Update existing teacher handler (calls backend)
  const handleUpdateTeacher = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      const response = await axios.put(`http://localhost:5001/api/admin/manage/teachers/${formData._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        // Refetch teachers from backend to get latest profile image
        const refreshed = await axios.get('http://localhost:5001/api/admin/manage/teachers');
        if (refreshed.data.success) {
          setTeachers(refreshed.data.data);
        }
        setShowAddTeacherModal(false);
        setSelectedTeacher(null);
        setSuccessMessage('Edited Successfully');
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

  if (loading) {
    return (
      <div className="literexia-teacher-lists-container">
        {/* Header Section */}
        <div className="literexia-teacher-header">
          <div className="literexia-teacher-title-container">
            <h1 className="literexia-teacher-title">Teacher Lists</h1>
            <p className="literexia-teacher-subtitle">Add, View the List of Teachers and their Information</p>
          </div>
          <div className="literexia-teacher-image">
            <div className="literexia-teacher-placeholder"></div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="literexia-teacher-controls">
          <div className="literexia-teacher-search-container">
            <div className="literexia-teacher-search">
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="literexia-teacher-search-input"
              />
              <Search className="literexia-teacher-search-icon" size={18} />
            </div>
            <button className="literexia-teacher-filter-btn" disabled>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="literexia-teacher-add-btn" disabled>
              <Plus size={18} />
              Add New Teacher
            </button>
          </div>
        </div>

        <div className="literexia-teacher-table-container" style={{ opacity: 0.6 }}>
          <table className="literexia-teacher-table">
            <thead>
              <tr>
                <th className="literexia-teacher-th">Teacher Name</th>
                <th className="literexia-teacher-th">Email</th>
                <th className="literexia-teacher-th">Address</th>
                <th className="literexia-teacher-th">View Profile</th>
                <th className="literexia-teacher-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((_, index) => (
                <tr key={index} className="literexia-teacher-tr">
                  <td className="literexia-teacher-td"><div className="skeleton-text"></div></td>
                  <td className="literexia-teacher-td"><div className="skeleton-text"></div></td>
                  <td className="literexia-teacher-td"><div className="skeleton-text"></div></td>
                  <td className="literexia-teacher-td"><div className="skeleton-button"></div></td>
                  <td className="literexia-teacher-td"><div className="skeleton-actions"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="literexia-teacher-lists-container">
      {/* Header Section */}
      <div className="literexia-teacher-header">
        <div className="literexia-teacher-title-container">
          <h1 className="literexia-teacher-title">Teacher Lists</h1>
          <p className="literexia-teacher-subtitle">Add, View the List of Teachers and their Information</p>
        </div>
        <div className="literexia-teacher-image">
          {/* This would be replaced with an actual image in production */}
          <div className="literexia-teacher-placeholder"></div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="literexia-teacher-controls">
        <div className="literexia-teacher-search-container">
          <div className="literexia-teacher-search">
            <input 
              type="text" 
              placeholder="Search teachers..." 
              className="literexia-teacher-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="literexia-teacher-search-icon" size={18} />
          </div>
          <button className="literexia-teacher-filter-btn">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <select 
            className="literexia-teacher-sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="recent">Recent Activity</option>
            <option value="progress">Progress</option>
          </select>
          <button 
            className="literexia-teacher-add-btn"
            onClick={() => {
              setSelectedTeacher(null);
              setShowAddTeacherModal(true);
            }}
          >
            <Plus size={18} />
            <span>Add New Teacher</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="literexia-teacher-table-container">
        <table className="literexia-teacher-table">
          <thead>
            <tr>
              <th className="literexia-teacher-th">Teacher Name</th>
              <th className="literexia-teacher-th">Email</th>
              <th className="literexia-teacher-th">Address</th>
              <th className="literexia-teacher-th">View Profile</th>
              <th className="literexia-teacher-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => (
              <tr key={teacher._id} className="literexia-teacher-tr">
                <td className="literexia-teacher-td">{`${teacher.firstName} ${teacher.lastName}`}</td>
                <td className="literexia-teacher-td">{teacher.email}</td>
                <td className="literexia-teacher-td">{teacher.address}</td>
                <td className="literexia-teacher-td">
                  <button 
                    className="literexia-teacher-view-btn"
                    onClick={() => handleViewProfile(teacher)}
                  >
                    View Profile
                  </button>
                </td>
                <td className="literexia-teacher-td literexia-teacher-actions">
                  <button 
                    className="literexia-teacher-edit-btn"
                    onClick={() => handleEditTeacher(teacher)}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="literexia-teacher-delete-btn"
                    onClick={() => handleDeleteConfirmation(teacher)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Teacher Modal */}
      {showAddTeacherModal && (
        <AddEditTeacherModal 
          teacher={selectedTeacher}
          onClose={() => {
            setShowAddTeacherModal(false);
            setSelectedTeacher(null);
          }}
          onSave={selectedTeacher ? handleUpdateTeacher : handleAddNewTeacher}
        />
      )}

      {/* Teacher Profile Modal */}
      {showTeacherProfileModal && selectedTeacher && (
        <ViewTeacherProfileModal 
          teacher={selectedTeacher}
          onClose={() => setShowTeacherProfileModal(false)}
        />
      )}

      {/* Confirm Delete Modal */}
      {isConfirmDeleteOpen && teacherToDelete && (
        <ConfirmDeleteModal
          teacher={teacherToDelete}
          onCancel={() => {
            setIsConfirmDeleteOpen(false);
            setTeacherToDelete(null);
          }}
          onConfirm={handleDeleteTeacher}
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

      {/* Validation Error Modal */}
      {validationError && (
        <ValidationErrorModal message={validationError} onClose={() => setValidationError('')} />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal 
          message={successMessage} 
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

// Refactor AddEditTeacherModal
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
  const [isLoading, setIsLoading] = useState(false);
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

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    const stepErrors = {};
    let isValid = true;

    currentFields.forEach(field => {
      if (!formData[field] && field !== 'middleName' && field !== 'profileImage') {
        stepErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        isValid = false;
      }
    });

    setErrors(stepErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate current step
    if (!validateStep(currentStep)) {
      return; // Stop if validation fails
    }

    if (currentStep < totalSteps) {
      // Move to next step
      setCurrentStep(prev => prev + 1);
      setErrors({}); // Clear errors when moving to next step
    } else {
      // Final step - submit the form
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    // Validate all steps before final submission
    let allStepsValid = true;
    let allErrors = {};

    for (let step = 1; step <= totalSteps; step++) {
      const currentFields = steps[step - 1].fields;
      currentFields.forEach(field => {
        if (!formData[field] && field !== 'middleName' && field !== 'profileImage') {
          allErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
          allStepsValid = false;
        }
      });
    }

    if (!allStepsValid) {
      setErrors(allErrors);
      // Go back to the first step with errors
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
    } finally {
      setIsLoading(false);
    }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

  const renderFormFields = () => {
    const currentFields = steps[currentStep - 1].fields;

    return (
      <div className="literexia-teacher-form-section">
        {currentFields.map(field => {
          if (field === 'profileImage') {
            return (
              <div key={field} className="literexia-teacher-form-group full-width">
                <label className="literexia-teacher-optional">Profile Image (Optional)</label>
                <div className="literexia-teacher-file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="literexia-teacher-file-input"
                  />
                  <div className="literexia-teacher-file-input-content">
                    <div className="literexia-teacher-file-input-icon">📁</div>
                    <div className="literexia-teacher-file-input-text">
                      {formData.profileImage ? 'Change Image' : 'Upload Image'}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (field === 'gender') {
            return (
              <div key={field} className="literexia-teacher-form-group">
                <label className="literexia-teacher-required">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`literexia-teacher-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <div className="literexia-teacher-error-message">{errors.gender}</div>}
              </div>
            );
          }

          if (field === 'civilStatus') {
            return (
              <div key={field} className="literexia-teacher-form-group">
                <label className="literexia-teacher-required">Civil Status</label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus}
                  onChange={handleChange}
                  className={`literexia-teacher-input ${errors.civilStatus ? 'error' : ''}`}
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Divorced">Divorced</option>
                </select>
                {errors.civilStatus && <div className="literexia-teacher-error-message">{errors.civilStatus}</div>}
              </div>
            );
          }

          if (field === 'position') {
            return (
              <div key={field} className="literexia-teacher-form-group">
                <label className="literexia-teacher-required">Position</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`literexia-teacher-input ${errors.position ? 'error' : ''}`}
                >
                  <option value="">Select Position</option>
                  <option value="Grade 1 Teacher">Grade 1 Teacher</option>
                </select>
                {errors.position && <div className="literexia-teacher-error-message">{errors.position}</div>}
              </div>
            );
          }

          const getFieldLabel = (field) => {
            switch(field) {
              case 'firstName': return 'First Name';
              case 'middleName': return 'Middle Name';
              case 'lastName': return 'Last Name';
              case 'email': return 'Email';
              case 'contact': return 'Contact';
              case 'position': return 'Position';
              case 'address': return 'Address';
              case 'dob': return 'Date of Birth';
              default: return field.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
          };

          const isRequired = field !== 'middleName' && field !== 'profileImage';

          return (
            <div key={field} className="literexia-teacher-form-group">
              <label className={isRequired ? "literexia-teacher-required" : "literexia-teacher-optional"}>
                {getFieldLabel(field)} {!isRequired ? '(Optional)' : ''}
              </label>
              <input
                type={field === 'dob' ? 'date' : field === 'email' ? 'email' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className={`literexia-teacher-input ${errors[field] ? 'error' : ''}`}
                placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
              />
              {errors[field] && <div className="literexia-teacher-error-message">{errors[field]}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>{teacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="literexia-teacher-modal-form">
          {/* Progress bar */}
          <div className="literexia-teacher-progress">
            <div 
              className="literexia-teacher-progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Steps indicator */}
          <div className="literexia-teacher-form-steps">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`literexia-teacher-step ${
                  currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''
                }`}
              >
                <div className="literexia-teacher-step-circle">
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <div className="literexia-teacher-step-label">{step.title}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {renderFormFields()}

            <div className="literexia-teacher-modal-footer">
              <div className="literexia-teacher-modal-footer-buttons">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="literexia-teacher-btn literexia-teacher-btn-secondary"
                    disabled={isLoading}
                  >
                    Previous
                  </button>
                )}
                <button
                  type="submit"
                  className={`literexia-teacher-btn literexia-teacher-btn-primary ${isLoading ? 'literexia-teacher-loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : currentStep < totalSteps ? 'Next' : (teacher ? 'Update Teacher' : 'Add Teacher')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Update the ConfirmDeleteModal component
const ConfirmDeleteModal = ({ teacher, onCancel, onConfirm }) => {
  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-confirm-modal">
        <div className="literexia-teacher-modal-header">
          <h2>Confirm Delete</h2>
          <button className="literexia-teacher-modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="literexia-teacher-confirm-content">
          <p>Are you sure you want to delete teacher <strong>{teacher.firstName} {teacher.lastName}</strong>?</p>
          <p>This action cannot be undone.</p>
        </div>
        <div className="literexia-teacher-confirm-actions">
          <button className="literexia-teacher-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="literexia-teacher-confirm-delete-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const ViewTeacherProfileModal = ({ teacher, onClose }) => {
  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>Teacher Profile</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="literexia-teacher-modal-form">
          <div className="profile-content">
            <div className="profile-image-container">
              <img 
                src={teacher.profileImage || '/images/default-avatar.png'} 
                alt={`${teacher.firstName} ${teacher.lastName}`} 
                className="profile-image"
              />
            </div>
            <h2 className="profile-name">{teacher.firstName} {teacher.middleName} {teacher.lastName}</h2>

            <div className="profile-details">
              <div className="detail-item">
                <span className="label">Email:</span>
                <span className="value">{teacher.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Contact:</span>
                <span className="value">{teacher.contactNumber}</span>
              </div>
              <div className="detail-item">
                <span className="label">Address:</span>
                <span className="value">{teacher.address}</span>
              </div>
              <div className="detail-item">
                <span className="label">Civil Status:</span>
                <span className="value">{teacher.civilStatus}</span>
              </div>
              <div className="detail-item">
                <span className="label">Gender:</span>
                <span className="value">{teacher.gender}</span>
              </div>
            </div>
          </div>
          <div className="literexia-teacher-modal-footer">
            <button className="literexia-teacher-save-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLists;