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
        <p>{message}</p>
        <button className="literexia-teacher-submit-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// Credentials Modal
const CredentialsModal = ({ credentials, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Parent Credentials</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-form">
        <p><strong>Email:</strong> {credentials.email}</p>
        <p><strong>Password:</strong> {credentials.password}</p>
        <p>Share these credentials with the parent.</p>
        <button className="literexia-teacher-submit-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

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
  const requiredFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'address', label: 'Address' },
    { key: 'civilStatus', label: 'Civil Status' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'email', label: 'Email' }
  ];
  const [validationError, setValidationErrorLocal] = useState('');
  const [students, setStudents] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  // Build a set of all linked student IDs (excluding current parent's children)
  const linkedStudentIds = new Set();
  allParents.forEach(p => {
    if (!parent || p._id !== parent._id) {
      (Array.isArray(p.children) ? p.children : []).forEach(id => linkedStudentIds.add(id));
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profileImage: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = requiredFields.filter(f => !formData[f.key] || formData[f.key].toString().trim() === '');
    if (missing.length > 0) {
      setValidationErrorLocal(`Please fill out the following fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setPendingSubmit(formData);
    setShowConfirmModal(true);
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/admin/manage/students');
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

  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>{parent ? 'Edit Parent' : 'Add New Parent'}</h2>
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
            <label>Contact</label>
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Civil Status</label>
            <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} required className="form-input">
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
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required className="form-input">
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
          <div className="form-group">
            <label>Children</label>
            <input
              type="text"
              placeholder="Search for a student..."
              value={formData.childrenSearch}
              onChange={(e) => setFormData({ ...formData, childrenSearch: e.target.value })}
              className="form-input"
            />
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
                label: students.find(student => student._id === id)?.firstName + ' ' + students.find(student => student._id === id)?.lastName
              }))}
              onChange={(selectedOptions) => {
                setFormData({
                  ...formData,
                  children: selectedOptions.map(option => option.value),
                  childrenSearch: ''
                });
              }}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Profile Image</label>
            <input type="file" name="profileImage" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="literexia-teacher-modal-footer">
            <button type="button" onClick={onClose} className="literexia-teacher-cancel-btn">Cancel</button>
            <button type="submit" className="literexia-teacher-submit-btn">{parent ? 'Update Parent' : 'Add Parent'}</button>
          </div>
        </form>
        {validationError && <ValidationErrorModal message={validationError} onClose={() => setValidationErrorLocal('')} />}
        {showConfirmModal && (
          <ConfirmChildrenModal
            childrenList={(formData.children || []).map(id => {
              const student = students.find(s => s._id === id);
              return { value: id, label: student ? `${student.firstName} ${student.lastName} - ID: ${student.idNumber}` : id };
            })}
            onConfirm={() => {
              setShowConfirmModal(false);
              onSave(pendingSubmit);
            }}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
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

  // Fetch parents data from MongoDB
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5002/api/admin/manage/parents');
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
      const response = await axios.post('http://localhost:5002/api/admin/manage/parents', data, {
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
      const response = await axios.put(`http://localhost:5002/api/admin/manage/parents/${formData._id}`, data, {
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
        const response = await axios.delete(`http://localhost:5002/api/admin/manage/parents/${parentToDelete._id}`);
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
          axios.get(`http://localhost:5002/api/admin/manage/students/${childId}`)
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