import React, { useState, useEffect } from 'react';
import { Trash, Pencil, Filter, Search, X, Plus, Edit, Trash2, User } from 'lucide-react';
import axios from 'axios';
import './ParentsPage.css';
import Select from 'react-select';

// Success Modal
const SuccessModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Success</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-form">
        <p style={{ textAlign: 'center' }}>{message}</p>
        <div className="literexia-teacher-modal-footer-buttons" style={{ justifyContent: 'center' }}>
          <button className="literexia-teacher-save-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  </div>
);

// Credentials Modal
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
        userType: 'parent'
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
          <h2>Parent Credentials</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="literexia-teacher-modal-form">
          <p><strong>Email:</strong> {credentials.email}</p>
          <p><strong>Password:</strong> ********</p>
          <p>You can send these credentials to the parent's email.</p>
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
            <button className="literexia-teacher-submit-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirm Delete Modal
const ConfirmDeleteModal = ({ parent, onCancel, onConfirm }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Confirm Delete</h2>
        <button className="literexia-teacher-modal-close" onClick={onCancel}>×</button>
      </div>
      <div className="literexia-teacher-modal-form">
        <p>Are you sure you want to delete parent <strong>{parent.firstName} {parent.lastName}</strong>?</p>
        <p>This action cannot be undone.</p>
        <div className="literexia-teacher-modal-footer">
          <button className="literexia-teacher-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="literexia-teacher-submit-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  </div>
);

// Validation Error Modal
const ValidationErrorModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Error</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-form">
        <p>{message}</p>
        <button className="literexia-teacher-submit-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// Confirmation modal component
const ConfirmChildrenModal = ({ childrenList, onConfirm, onCancel }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Confirm Children Selection</h2>
      </div>
      <div className="literexia-teacher-modal-content">
        <p>Are you sure you want to link the following children to this parent?</p>
        <ul>
          {childrenList.length > 0 ? childrenList.map(child => (
            <li key={child.value}>{child.label}</li>
          )) : <li>No children selected.</li>}
        </ul>
        <div className="literexia-teacher-modal-footer">
          <button className="literexia-teacher-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="literexia-teacher-save-btn" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  </div>
);

// Add/Edit Parent Modal
const AddEditParentModal = ({ parent, onClose, onSave, allParents }) => {
  const [formData, setFormData] = useState(
    parent ? { ...parent, children: parent.children || [] } : {
      firstName: '',
      lastName: '',
      middleName: '',
      contact: '',
      address: '',
      civilStatus: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      children: [],
      profileImage: null
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
      fields: ['contact', 'dateOfBirth', 'gender', 'civilStatus']
    },
    {
      title: 'Address & Children & Profile',
      fields: ['address', 'children', 'profileImage']
    }
  ];

  // Build a set of all linked student IDs (excluding current parent's children)
  const linkedStudentIds = new Set();
  allParents.forEach(p => {
    if (!parent || p._id !== parent._id) {
      (Array.isArray(p.children) ? p.children : []).forEach(id => linkedStudentIds.add(id));
    }
  });

  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/admin/manage/students');
        if (response.data.success) {
          setStudents(response.data.data);
        } else {
          console.error("Error fetching students:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching students data:", error);
      }
    };

    fetchStudents();
  }, []);

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    const stepErrors = {};
    let isValid = true;

    const requiredFields = ['firstName', 'lastName', 'contact', 'address', 'civilStatus', 'dateOfBirth', 'gender', 'email'];

    currentFields.forEach(field => {
      if (requiredFields.includes(field) && (!formData[field] || formData[field].toString().trim() === '')) {
        stepErrors[field] = `${getFieldLabel(field)} is required`;
        isValid = false;
      }
      if (field === 'email' && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
    });

    setErrors(stepErrors);
    return isValid;
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
    const requiredFields = ['firstName', 'lastName', 'contact', 'address', 'civilStatus', 'dateOfBirth', 'gender', 'email'];

    for (let step = 1; step <= totalSteps; step++) {
      const currentFields = steps[step - 1].fields;
      currentFields.forEach(field => {
        if (requiredFields.includes(field) && (!formData[field] || formData[field].toString().trim() === '')) {
          allErrors[field] = `${getFieldLabel(field)} is required`;
          allStepsValid = false;
        }
        if (field === 'email' && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          allErrors.email = 'Please enter a valid email address';
          allStepsValid = false;
        }
      });
    }

    if (!allStepsValid) {
      setErrors(allErrors);
      for (let step = 1; step <= totalSteps; step++) {
        const currentFields = steps[step - 1].fields;
        const hasErrorInStep = currentFields.some(field => allErrors[field]);
        if (hasErrorInStep) {
          setCurrentStep(step);
          break;
        }
      }
    }

    if (allStepsValid) {
      onSave(formData);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate current step before proceeding or submitting
    if (!validateStep(currentStep)) {
      return; // Stop if validation fails
    }

    if (currentStep < totalSteps) {
      // Move to next step if not on the last step
      handleNext();
    } else {
      // On the last step, proceed with final submission
      handleFinalSubmit();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getFieldLabel = (field) => {
    switch(field) {
      case 'firstName': return 'First Name';
      case 'middleName': return 'Middle Name';
      case 'lastName': return 'Last Name';
      case 'contact': return 'Contact';
      case 'address': return 'Address';
      case 'civilStatus': return 'Civil Status';
      case 'dateOfBirth': return 'Date of Birth';
      case 'gender': return 'Gender';
      case 'email': return 'Email';
      case 'children': return 'Children';
      case 'profileImage': return 'Profile Image';
      default: return field.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const renderFormFields = () => {
    const currentFields = steps[currentStep - 1].fields;
    const requiredFields = ['firstName', 'lastName', 'contact', 'address', 'civilStatus', 'dateOfBirth', 'gender', 'email'];

    return (
      <div className="literexia-teacher-form-section">
        {currentFields.map(field => {
          const isRequired = requiredFields.includes(field);

          if (field === 'children') {
            return (
              <div key={field} className="literexia-teacher-form-group">
                <label className="literexia-teacher-optional">{getFieldLabel(field)} (Optional)</label>
                <Select
                  isMulti
                  options={students
                    .filter(student =>
                      !linkedStudentIds.has(student._id) || (formData.children || []).includes(student._id)
                    )
                    .map(student => ({
                      value: student._id,
                      label: `${student.firstName} ${student.lastName} - ID: ${student.idNumber}`
                    }))}
                  value={(formData.children || []).map(id => ({
                    value: id,
                    label: students.find(student => student._id === id)?.firstName + ' ' + (students.find(student => student._id === id)?.middleName ? students.find(student => student._id === id)?.middleName + ' ' : '') + students.find(student => student._id === id)?.lastName
                  }))}
                  onChange={(selectedOptions) => {
                    setFormData({
                      ...formData,
                      children: selectedOptions.map(option => option.value),
                      childrenSearch: ''
                    });
                  }}
                  className="literexia-teacher-input"
                  classNamePrefix="react-select"
                />
                {errors[field] && <div className="literexia-teacher-error-message">{errors[field]}</div>}
              </div>
            );
          }

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
                {errors[field] && <div className="literexia-teacher-error-message">{errors[field]}</div>}
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

          const inputType = field === 'dateOfBirth' ? 'date' : field === 'email' ? 'email' : 'text';

          return (
            <div key={field} className="literexia-teacher-form-group">
              <label className={isRequired ? "literexia-teacher-required" : "literexia-teacher-optional"}>
                {getFieldLabel(field)} {!isRequired ? '(Optional)' : ''}
              </label>
              <input
                type={inputType}
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
          <h2>{parent ? 'Edit Parent' : 'Add New Parent'}</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="literexia-teacher-modal-form">
          <div className="literexia-teacher-progress">
            <div
              className="literexia-teacher-progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

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
                  {isLoading ? 'Saving...' : currentStep < totalSteps ? 'Next' : (parent ? 'Update Parent' : 'Add Parent')}
                </button>
              </div>
            </div>
            {errors.apiError && <div className="literexia-teacher-error-message" style={{ textAlign: 'center', marginTop: '10px' }}>{errors.apiError}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

const ParentsPage = () => {
  // State variables
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [parentToDelete, setParentToDelete] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [viewModalChildren, setViewModalChildren] = useState([]);
  const [sortBy, setSortBy] = useState('name-asc');

  // Fetch parents data from MongoDB
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/admin/manage/parents');
        if (response.data.success) {
          // Normalize children to always be an array
          const normalizedParents = response.data.data.map(parent => ({
            ...parent,
            children: Array.isArray(parent.children) ? parent.children : (parent.children ? [parent.children] : [])
          }));
          setParents(normalizedParents);
          setFilteredParents(normalizedParents);
        } else {
          console.error("Error fetching parents:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching parents data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, []);

  // Filter parents based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredParents(parents);
    } else {
      const filtered = parents.filter(parent => 
        `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(filtered);
    }
  }, [searchTerm, parents]);

  // Add new parent handler
  const handleAddNewParent = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      const response = await axios.post('http://localhost:5001/api/admin/manage/parents', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setParents([...parents, response.data.data.parentProfile]);
        setShowAddParentModal(false);
        setNewCredentials(response.data.data.credentials);
        setShowCredentialsModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to add parent');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to add parent');
    } finally {
      setLoading(false);
    }
  };

  // Update parent handler
  const handleUpdateParent = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      const response = await axios.put(`http://localhost:5001/api/admin/manage/parents/${formData._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        const updatedParents = parents.map(parent =>
          parent._id === formData._id ? response.data.data.parentProfile : parent
        );
        setParents(updatedParents);
        setShowAddParentModal(false);
        setSelectedParent(null);
        setSuccessMessage('Edited Successfully');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to update parent');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to update parent');
    } finally {
      setLoading(false);
    }
  };

  // Delete parent handler
  const handleDeleteParent = async () => {
    if (parentToDelete) {
      try {
        setLoading(true);
        const response = await axios.delete(`http://localhost:5001/api/admin/manage/parents/${parentToDelete._id}`);
        if (response.data.success) {
          const updatedParents = parents.filter(parent => parent._id !== parentToDelete._id);
          setParents(updatedParents);
          setSuccessMessage('Deleted Successfully');
          setShowSuccessModal(true);
        } else {
          alert(response.data.message || 'Failed to delete parent');
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete parent');
      } finally {
        setLoading(false);
        setIsConfirmDeleteOpen(false);
        setParentToDelete(null);
      }
    }
  };

  // View parent profile
  const handleViewProfile = (parent) => {
    setSelectedParent(parent);
  };

  // Edit parent
  const handleEditParent = (parent) => {
    setSelectedParent(parent);
    setIsEditing(true);
    setShowAddParentModal(true);
  };

  // Delete parent confirmation
  const handleDeleteConfirmation = (parent) => {
    setParentToDelete(parent);
    setIsConfirmDeleteOpen(true);
  };

  // Fetch children profiles when selectedParent changes and modal is open
  useEffect(() => {
    if (selectedParent && selectedParent.children && selectedParent.children.length > 0) {
      Promise.all(
        selectedParent.children.map(childId =>
          axios.get(`http://localhost:5001/api/admin/manage/students/${childId}`)
        )
      ).then(responses => {
        setViewModalChildren(responses.map(res => res.data.data.studentProfile));
      }).catch(() => setViewModalChildren([]));
    } else {
      setViewModalChildren([]);
    }
  }, [selectedParent]);

  if (loading) {
    return (
      <div className="parents-page-container">
        {/* Header Section */}
        <div className="parents-page-header">
          <div className="parents-page-title-container">
            <h1 className="parents-page-title">Parent Lists</h1>
            <p className="parents-page-subtitle">Add, View the List of Parents and their Information</p>
          </div>
          <div className="parents-page-image">
            <div className="parents-page-placeholder"></div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="parents-page-actions">
          <div className="parents-page-search-container">
            <div className="parents-page-search">
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="parents-page-search-input"
              />
              <Search className="parents-page-search-icon" size={18} />
            </div>
            <button className="parents-page-filter-btn" disabled>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="parents-page-add-btn" disabled>
              <Plus size={18} />
              Add New Parent
            </button>
          </div>
        </div>

        <div className="parents-page-table-container" style={{ opacity: 0.6 }}>
          <table className="parents-page-table">
            <thead>
              <tr>
                <th>Parent Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>View Profile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((_, index) => (
                <tr key={index}>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-button"></div></td>
                  <td><div className="skeleton-actions"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="parents-page-container">
      {/* Header Section */}
      <div className="parents-page-header">
        <div className="parents-page-title-container">
          <h1 className="parents-page-title">Parent Lists</h1>
          <p className="parents-page-subtitle">Add, View the List of Parents and their Information</p>
        </div>
        <div className="parents-page-image">
          <div className="parents-page-placeholder"></div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="parents-page-actions">
        <div className="parents-page-search-container">
          <div className="parents-page-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="parents-page-search-input"
            />
            <Search className="parents-page-search-icon" size={18} />
          </div>
          <button className="parents-page-filter-btn">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <select 
            className="parents-page-sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="recent">Recent Activity</option>
          </select>
          <button 
            className="parents-page-add-btn"
            onClick={() => {
              setIsEditing(false);
              setSelectedParent(null);
              setShowAddParentModal(true);
            }}
          >
            <Plus size={18} />
            Add New Parent
          </button>
        </div>
      </div>

      <div className="parents-page-table-container">
        <table className="parents-page-table">
          <thead>
            <tr>
              <th>Parent Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>View Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => (
              <tr key={parent._id}>
                <td>{`${parent.firstName} ${parent.lastName}`}</td>
                <td>{parent.email}</td>
                <td>{parent.address}</td>
                <td>
                  <button 
                    className="parents-page-view-btn"
                    onClick={() => handleViewProfile(parent)}
                  >
                    View Profile
                  </button>
                </td>
                <td className="parents-page-actions-cell">
                  <div className="parents-page-crud-btns">
                    <button 
                      className="parents-page-edit-btn"
                      onClick={() => handleEditParent(parent)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="parents-page-delete-btn"
                      onClick={() => handleDeleteConfirmation(parent)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Parent Modal */}
      {showAddParentModal && (
        <AddEditParentModal
          parent={isEditing ? selectedParent : null}
          onClose={() => {
            setShowAddParentModal(false);
            setSelectedParent(null);
            setIsEditing(false);
          }}
          onSave={isEditing ? handleUpdateParent : handleAddNewParent}
          allParents={parents}
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

      {/* Confirm Delete Modal */}
      {isConfirmDeleteOpen && parentToDelete && (
        <ConfirmDeleteModal
          parent={parentToDelete}
          onCancel={() => {
            setIsConfirmDeleteOpen(false);
            setParentToDelete(null);
          }}
          onConfirm={handleDeleteParent}
        />
      )}

      {/* View Parent Profile Modal */}
      {selectedParent && !showAddParentModal && (
        <div className="parents-page-modal-overlay">
          <div className="parents-page-profile-modal">
            <div className="parents-page-modal-header">
              <h2>Parent Profile</h2>
              <button 
                className="parents-page-modal-close"
                onClick={() => setSelectedParent(null)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="parents-page-profile-content">
              <div className="parents-page-profile-avatar">
                {selectedParent.profileImageUrl ? (
                  <img 
                    src={selectedParent.profileImageUrl} 
                    alt={`${selectedParent.firstName} ${selectedParent.lastName}`}
                    className="parents-page-profile-image"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>
              
              <div className="parents-page-profile-details">
                <h3 className="parents-page-profile-name">
                  {`${selectedParent.firstName} ${selectedParent.lastName}`}
                </h3>
                
                <div className="parents-page-profile-info">
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Email:</span>
                    <span className="parents-page-profile-value">{selectedParent.email}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Contact:</span>
                    <span className="parents-page-profile-value">{selectedParent.contact}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Address:</span>
                    <span className="parents-page-profile-value">{selectedParent.address}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Civil Status:</span>
                    <span className="parents-page-profile-value">{selectedParent.civilStatus}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Gender:</span>
                    <span className="parents-page-profile-value">{selectedParent.gender}</span>
                  </div>
                </div>
                <div className="form-group" style={{marginTop: '24px'}}>
                  <label>Children</label>
                  <ul>
                    {(Array.isArray(viewModalChildren) ? viewModalChildren : []).length > 0 ? (Array.isArray(viewModalChildren) ? viewModalChildren : []).map(child => (
                      <li key={child._id}>
                        {child.firstName} {child.middleName ? child.middleName + ' ' : ''}{child.lastName} (ID: {child.idNumber || 'N/A'}, Section: {child.section || 'N/A'})
                      </li>
                    )) : <li>No children linked.</li>}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="parents-page-modal-footer">
              <button 
                className="parents-page-close-btn"
                onClick={() => setSelectedParent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {validationError && <ValidationErrorModal message={validationError} onClose={() => setValidationError('')} />}
    </div>
  );
};

export default ParentsPage;