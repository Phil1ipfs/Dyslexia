import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, ChevronDown, User, UserPlus } from 'lucide-react';
import './TeacherLists.css';


// Mock database structure - this would connect to MongoDB in production
const initialTeachers = [
  { 
    id: '1', 
    name: 'Christine Brooks', 
    email: 'christianbrooks@gmail.com', 
    address: 'Sampaloc Manila',
    subjects: ['Math', 'Science'],
    phone: '123-456-7890',
    dateJoined: '2023-01-15'
  },
  { 
    id: '2', 
    name: 'Rosie Pearson', 
    email: 'christianbrooks@gmail.com', 
    address: 'Sampaloc Manila',
    subjects: ['English', 'History'],
    phone: '123-456-7891',
    dateJoined: '2023-02-10'
  },
  { 
    id: '3', 
    name: 'Darrell Caldwell', 
    email: 'christianbrooks@gmail.com', 
    address: 'Sampaloc Manila',
    subjects: ['Physical Education', 'Health'],
    phone: '123-456-7892',
    dateJoined: '2023-03-05'
  },
  { 
    id: '4', 
    name: 'Gilbert Johnston', 
    email: 'christianbrooks@gmail.com', 
    address: 'Sampaloc Manila',
    subjects: ['Arts', 'Music'],
    phone: '123-456-7893',
    dateJoined: '2023-04-20'
  },
  { 
    id: '5', 
    name: 'Alan Cain', 
    email: 'christianbrooks@gmail.com', 
    address: 'Sampaloc Manila',
    subjects: ['Computer Science', 'Physics'],
    phone: '123-456-7894',
    dateJoined: '2023-05-12'
  },
  { 
    id: '6', 
    name: 'Alfred Murray', 
    email: 'christianbrooks@gmail.com', 
    address: 'Sampaloc Manila',
    subjects: ['Chemistry', 'Biology'],
    phone: '123-456-7895',
    dateJoined: '2023-06-08'
  }
];

// Main TeacherLists component
const TeacherLists = () => {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showTeacherProfileModal, setShowTeacherProfileModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Search functionality
  const filteredTeachers = teachers.filter(teacher => {
    const searchValue = teacher[searchBy].toLowerCase();
    return searchValue.includes(searchTerm.toLowerCase());
  });

  // Handler for viewing teacher profile
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
      const updatedTeachers = teachers.filter(teacher => teacher.id !== teacherToDelete.id);
      setTeachers(updatedTeachers);
      setIsConfirmDeleteOpen(false);
      setTeacherToDelete(null);
    }
  };

  // Add new teacher handler
  const handleAddNewTeacher = (newTeacher) => {
    const teacherWithId = {
      ...newTeacher,
      id: (teachers.length + 1).toString()
    };
    setTeachers([...teachers, teacherWithId]);
    setShowAddTeacherModal(false);
  };

  // Update existing teacher handler
  const handleUpdateTeacher = (updatedTeacher) => {
    const updatedTeachers = teachers.map(teacher => 
      teacher.id === updatedTeacher.id ? updatedTeacher : teacher
    );
    setTeachers(updatedTeachers);
    setShowAddTeacherModal(false);
    setSelectedTeacher(null);
  };

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

      {/* Search and Filter Section */}
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
          
          <div className="literexia-teacher-filter">
            <button 
              className="literexia-teacher-dropdown-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Search by {searchBy.charAt(0).toUpperCase() + searchBy.slice(1)}
              <ChevronDown size={18} />
            </button>
            
            {isDropdownOpen && (
              <div className="literexia-teacher-dropdown-content">
                <div 
                  className="literexia-teacher-dropdown-item"
                  onClick={() => {
                    setSearchBy('name');
                    setIsDropdownOpen(false);
                  }}
                >
                  Name
                </div>
                <div 
                  className="literexia-teacher-dropdown-item"
                  onClick={() => {
                    setSearchBy('email');
                    setIsDropdownOpen(false);
                  }}
                >
                  Email
                </div>
                <div 
                  className="literexia-teacher-dropdown-item"
                  onClick={() => {
                    setSearchBy('address');
                    setIsDropdownOpen(false);
                  }}
                >
                  Address
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="literexia-teacher-add-btn"
            onClick={() => {
              setSelectedTeacher(null);
              setShowAddTeacherModal(true);
            }}
          >
            <UserPlus size={18} />
            Add New Teacher
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="literexia-teacher-table-container">
        <table className="literexia-teacher-table">
          <thead>
            <tr>
              <th className="literexia-teacher-th">TEACHER NAME</th>
              <th className="literexia-teacher-th">TEACHER EMAIL</th>
              <th className="literexia-teacher-th">ADDRESS</th>
              <th className="literexia-teacher-th">VIEW PROFILE</th>
              <th className="literexia-teacher-th">ACTION/S</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id} className="literexia-teacher-tr">
                <td className="literexia-teacher-td">{teacher.name}</td>
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
                    <Edit size={18} />
                  </button>
                  <button 
                    className="literexia-teacher-delete-btn"
                    onClick={() => handleDeleteConfirmation(teacher)}
                  >
                    <Trash2 size={18} />
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
        <TeacherProfileModal
          teacher={selectedTeacher}
          onClose={() => {
            setShowTeacherProfileModal(false);
            setSelectedTeacher(null);
          }}
        />
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

// TeacherProfileModal Component
const TeacherProfileModal = ({ teacher, onClose }) => {
  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-profile-modal">
        <div className="literexia-teacher-modal-header">
          <h2>Teacher Profile</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="literexia-teacher-profile-content">
          <div className="literexia-teacher-profile-avatar">
            <User size={64} />
          </div>
          
          <div className="literexia-teacher-profile-details">
            <h3 className="literexia-teacher-profile-name">{teacher.name}</h3>
            
            <div className="literexia-teacher-profile-info">
              <div className="literexia-teacher-profile-info-item">
                <span className="literexia-teacher-profile-label">Email:</span>
                <span className="literexia-teacher-profile-value">{teacher.email}</span>
              </div>
              
              <div className="literexia-teacher-profile-info-item">
                <span className="literexia-teacher-profile-label">Address:</span>
                <span className="literexia-teacher-profile-value">{teacher.address}</span>
              </div>
              
              <div className="literexia-teacher-profile-info-item">
                <span className="literexia-teacher-profile-label">Phone:</span>
                <span className="literexia-teacher-profile-value">{teacher.phone}</span>
              </div>
              
              <div className="literexia-teacher-profile-info-item">
                <span className="literexia-teacher-profile-label">Date Joined:</span>
                <span className="literexia-teacher-profile-value">
                  {new Date(teacher.dateJoined).toLocaleDateString()}
                </span>
              </div>
              
              <div className="literexia-teacher-profile-info-item">
                <span className="literexia-teacher-profile-label">Subjects:</span>
                <div className="literexia-teacher-profile-subjects">
                  {teacher.subjects.map((subject, index) => (
                    <span key={index} className="literexia-teacher-profile-subject-tag">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="literexia-teacher-profile-actions">
          <button 
            className="literexia-teacher-close-profile-btn"
            onClick={onClose}
          >
            Close
          </button>
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

// MongoDB Schema - This would be in a separate file in production
/*
// teacher.model.js
import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  dateJoined: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the 'updatedAt' field on save
teacherSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
*/

// API Service - This would be in a separate file in production
/*
// teacherService.js
import axios from 'axios';

const API_URL = '/api/teachers';

export const getTeachers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
};

export const getTeacherById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching teacher with id ${id}:`, error);
    throw error;
  }
};

export const createTeacher = async (teacherData) => {
  try {
    const response = await axios.post(API_URL, teacherData);
    return response.data;
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
};

export const updateTeacher = async (id, teacherData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, teacherData);
    return response.data;
  } catch (error) {
    console.error(`Error updating teacher with id ${id}:`, error);
    throw error;
  }
};

export const deleteTeacher = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting teacher with id ${id}:`, error);
    throw error;
  }
};
*/

export default TeacherLists;