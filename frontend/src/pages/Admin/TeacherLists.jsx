import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, ChevronDown, User, UserPlus, Filter, Plus } from 'lucide-react';
import axios from 'axios';
import './TeacherLists.css';

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

  // Fetch teachers from database
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5002/api/admin/manage/teachers');
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

  // Handler for actual deletion
  const handleDeleteTeacher = () => {
    if (teacherToDelete) {
      const updatedTeachers = teachers.filter(teacher => teacher._id !== teacherToDelete._id);
      setTeachers(updatedTeachers);
      setIsConfirmDeleteOpen(false);
      setTeacherToDelete(null);
    }
  };

  // Add new teacher handler
  const handleAddNewTeacher = (newTeacher) => {
    const teacherWithId = {
      ...newTeacher,
      _id: (teachers.length + 1).toString()
    };
    setTeachers([...teachers, teacherWithId]);
    setShowAddTeacherModal(false);
  };

  // Update existing teacher handler
  const handleUpdateTeacher = (updatedTeacher) => {
    const updatedTeachers = teachers.map(teacher => 
      teacher._id === updatedTeacher._id ? updatedTeacher : teacher
    );
    setTeachers(updatedTeachers);
    setShowAddTeacherModal(false);
    setSelectedTeacher(null);
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
              placeholder="Search..." 
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
          <button 
            className="literexia-teacher-add-btn"
            onClick={() => {
              setSelectedTeacher(null);
              setShowAddTeacherModal(true);
            }}
          >
            <Plus size={18} />
            Add New Teacher
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
                    src={selectedTeacher.profileImageUrl} 
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
      {isConfirmDeleteOpen && (
        <ConfirmDeleteModal
          teacher={teacherToDelete}
          onCancel={() => {
            setIsConfirmDeleteOpen(false);
            setTeacherToDelete(null);
          }}
          onConfirm={handleDeleteTeacher}
        />
      )}
    </div>
  );
};

// AddEditTeacherModal Component
const AddEditTeacherModal = ({ teacher, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    teacher ? 
    { ...teacher } : 
    {
      name: '',
      email: '',
      address: '',
      phone: '',
      subjects: [],
      dateJoined: new Date().toISOString().split('T')[0]
    }
  );

  const [subjectInput, setSubjectInput] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddSubject = () => {
    if (subjectInput.trim()) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subjectInput.trim()]
      });
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (indexToRemove) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>{teacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="literexia-teacher-modal-form">
          <div className="literexia-teacher-form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="literexia-teacher-input"
            />
          </div>
          
          <div className="literexia-teacher-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="literexia-teacher-input"
            />
          </div>
          
          <div className="literexia-teacher-form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="literexia-teacher-input"
            />
          </div>
          
          <div className="literexia-teacher-form-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="literexia-teacher-input"
            />
          </div>
          
          <div className="literexia-teacher-form-group">
            <label>Date Joined</label>
            <input
              type="date"
              name="dateJoined"
              value={formData.dateJoined}
              onChange={handleChange}
              required
              className="literexia-teacher-input"
            />
          </div>
          
          <div className="literexia-teacher-form-group">
            <label>Subjects</label>
            <div className="literexia-teacher-subject-input-container">
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                className="literexia-teacher-input"
                placeholder="Add a subject"
              />
              <button 
                type="button" 
                onClick={handleAddSubject}
                className="literexia-teacher-add-subject-btn"
              >
                Add
              </button>
            </div>
            
            <div className="literexia-teacher-subjects-list">
              {formData.subjects.map((subject, index) => (
                <div key={index} className="literexia-teacher-subject-tag">
                  {subject}
                  <button 
                    type="button"
                    onClick={() => handleRemoveSubject(index)}
                    className="literexia-teacher-remove-subject"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="literexia-teacher-form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="literexia-teacher-cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              className="literexia-teacher-save-btn"
            >
              {teacher ? 'Update Teacher' : 'Add Teacher'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ConfirmDeleteModal Component
const ConfirmDeleteModal = ({ teacher, onCancel, onConfirm }) => {
  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-confirm-modal">
        <div className="literexia-teacher-modal-header">
          <h2>Confirm Delete</h2>
          <button className="literexia-teacher-modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="literexia-teacher-confirm-content">
          <p>Are you sure you want to delete teacher <strong>{teacher.name}</strong>?</p>
          <p>This action cannot be undone.</p>
        </div>
        
        <div className="literexia-teacher-confirm-actions">
          <button 
            className="literexia-teacher-cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="literexia-teacher-confirm-delete-btn"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherLists;