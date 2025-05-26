import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, ChevronDown, User, UserPlus, Filter, Plus } from 'lucide-react';
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
        <div className="literexia-teacher-modal-overlay">
          <div className="literexia-teacher-profile-modal">
            <div className="literexia-teacher-modal-header">
              <h2>Teacher Profile</h2>
              <button className="literexia-teacher-modal-close" onClick={() => setShowTeacherProfileModal(false)}>×</button>
            </div>
            
            <div className="literexia-teacher-profile-content">
              <div className="literexia-teacher-profile-avatar">
                {selectedTeacher.profileImageUrl ? (
                  <img 
                    src={selectedTeacher.profileImageUrl + '?t=' + Date.now()} 
                    alt={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
                    className="literexia-teacher-profile-image"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>
              
              <div className="literexia-teacher-profile-details">
                <h3 className="literexia-teacher-profile-name">
                  {`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
                </h3>
                
                <div className="literexia-teacher-profile-info">
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Email:</span>
                    <span className="literexia-teacher-profile-value">{selectedTeacher.email}</span>
                  </div>
                  
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Position:</span>
                    <span className="literexia-teacher-profile-value">{selectedTeacher.position}</span>
                  </div>
                  
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Contact:</span>
                    <span className="literexia-teacher-profile-value">{selectedTeacher.contact}</span>
                  </div>
                  
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Civil Status:</span>
                    <span className="literexia-teacher-profile-value">{selectedTeacher.civilStatus}</span>
                  </div>
                  
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Gender:</span>
                    <span className="literexia-teacher-profile-value">{selectedTeacher.gender}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="literexia-teacher-profile-actions">
              <button 
                className="literexia-teacher-close-profile-btn"
                onClick={() => setShowTeacherProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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

  const requiredFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'position', label: 'Position' },
    { key: 'contact', label: 'Contact' },
    { key: 'address', label: 'Address' },
    { key: 'civilStatus', label: 'Civil Status' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'email', label: 'Email' }
  ];

  const [validationErrorLocal, setValidationErrorLocal] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profileImage: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation: check all required fields
    const missing = requiredFields.filter(f => !formData[f.key] || formData[f.key].toString().trim() === '');
    if (missing.length > 0) {
      setValidationErrorLocal(`Please fill out the following fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>{teacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="literexia-teacher-modal-form" onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Middle Name</label>
            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Position</label>
            <input type="text" name="position" value={formData.position} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Contact</label>
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Profile Image</label>
            <input type="file" name="profileImage" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Civil Status</label>
            <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} className="form-input">
              <option value="">Select Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
              <option value="Divorced">Divorced</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="form-input">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
          </div>
          <div className="literexia-teacher-form-actions">
            <button type="button" onClick={onClose} className="literexia-teacher-cancel-btn">Cancel</button>
            <button type="submit" className="literexia-teacher-save-btn">{teacher ? 'Update Teacher' : 'Add Teacher'}</button>
          </div>
        </form>
        {validationErrorLocal && <ValidationErrorModal message={validationErrorLocal} onClose={() => setValidationErrorLocal('')} />}
      </div>
    </div>
  );
};

// Add a custom confirmation modal
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

export default TeacherLists;