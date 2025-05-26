// src/pages/StudentList/StudentListPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen, Book, Clock, MoreHorizontal, User } from 'lucide-react';
import axios from 'axios';
import './StudentListPage.css';

const SuccessModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Success</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-content">
        <p>{message}</p>
        <button className="literexia-teacher-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const ValidationErrorModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Missing Required Fields</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-content">
        <p>{message}</p>
        <button className="literexia-teacher-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const AddEditStudentModal = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    student ? { ...student } : {
      idNumber: '2025',
      firstName: '',
      middleName: '',
      lastName: '',
      age: '',
      gender: '',
      gradeLevel: '',
      section: '',
      address: '',
      profileImage: null
    }
  );
  const [validationError, setValidationError] = useState('');

  const requiredFields = [
    { key: 'idNumber', label: 'ID Number' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'gradeLevel', label: 'Grade Level' },
    { key: 'section', label: 'Section' },
    { key: 'address', label: 'Address' }
  ];

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
      setValidationError(`Please fill out the following fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>{student ? 'Edit Student' : 'Add New Student'}</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="literexia-teacher-modal-form" onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label>ID Number</label>
            <input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Middle Name</label>
            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-input" />
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
            <label>Grade Level</label>
            <input type="text" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Section</label>
            <input type="text" name="section" value={formData.section} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label>Profile Image</label>
            <input type="file" name="profileImage" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="literexia-teacher-modal-footer">
            <button type="button" className="literexia-teacher-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="literexia-teacher-save-btn">{student ? 'Update' : 'Add'}</button>
          </div>
        </form>
        {validationError && <ValidationErrorModal message={validationError} onClose={() => setValidationError('')} />}
      </div>
    </div>
  );
};

const StudentListPage = () => {
  // State for students data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('name'); 
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Fetch students from database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/admin/manage/students');
        if (response.data.success) {
          setStudents(response.data.data);
          setFilteredStudents(response.data.data);
        } else {
          console.error("Error fetching students:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching students data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.idNumber?.toString().includes(searchTerm.toLowerCase()) ||
        student.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      default: return '';
    }
  };

  // View student profile
  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  // Edit student
  const editStudent = (studentId) => {
    console.log(`Edit student: ${studentId}`);
    // Open edit modal or navigate to edit page
  };

  // Delete student
  const deleteStudent = async (studentId) => {
    if (!studentId) return;
    try {
      setLoading(true);
              const response = await axios.delete(`http://localhost:5001/api/admin/manage/students/${studentId}`);
      if (response.data.success) {
        const updatedList = students.filter(s => s._id !== studentId);
        setStudents(updatedList);
        setFilteredStudents(updatedList);
        setShowConfirmDeleteModal(false);
        setSelectedStudent(null);
        setSuccessMessage('Student deleted successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to delete student');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  // Add new student
  const handleAddStudent = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
              const response = await axios.post('http://localhost:5001/api/admin/manage/students', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setStudents([...students, response.data.data.studentProfile]);
        setFilteredStudents([...students, response.data.data.studentProfile]);
        setShowAddStudentModal(false);
        setSuccessMessage('Student added successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to add student');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  // Edit student
  const handleEditStudent = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      const response = await axios.put(`http://localhost:5001/api/admin/manage/students/${formData._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        const updatedList = students.map(s => s._id === formData._id ? response.data.data.studentProfile : s);
        setStudents(updatedList);
        setFilteredStudents(updatedList);
        setShowEditStudentModal(false);
        setSelectedStudent(null);
        setSuccessMessage('Student updated successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to update student');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to update student');
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
      <div className="student-list-page">
        {/* Header Section */}
        <div className="page-header">
          <div className="page-title-container">
            <h1>Student Lists</h1>
            <p className="page-subtitle">Add, View the List of Students and their Information</p>
          </div>
          <div className="page-image">
            <div className="page-placeholder"></div>
          </div>
        </div>

        <div className="overview-stats">
          <div className="stat-card">
            <h3>Total Students</h3>
            <p className="stat-number">-</p>
          </div>
          <div className="stat-card">
            <h3>Active Students</h3>
            <p className="stat-number">-</p>
          </div>
          <div className="stat-card">
            <h3>Average Performance</h3>
            <p className="stat-number">-</p>
          </div>
        </div>

        <div className="controls-container" style={{ backgroundColor: '#ffffff' }}>
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search students..."
                disabled
              />
              <Search size={18} />
            </div>
            <button className="filter-button" disabled>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="add-student-button" disabled>
              <Plus size={18} />
              Add Student
            </button>
          </div>
        </div>

        <div className="students-table-container" style={{ opacity: 0.6 }}>
          <table className="students-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Grade</th>
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
    <div className="student-list-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="page-title-container">
          <h1>Student Lists</h1>
          <p className="page-subtitle">Add, View the List of Students and their Information</p>
        </div>
        <div className="page-image">
          {/* This would be replaced with an actual image in production */}
          <div className="page-placeholder"></div>
        </div>
      </div>

      <div className="overview-stats">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{students.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Students</h3>
          <p className="stat-number">{students.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Performance</h3>
          <p className="stat-number">
            {students.length > 0 
              ? `${Math.round(students.reduce((acc, student) => acc + parseInt(student.averageScore), 0) / students.length)}%` 
              : '0%'}
          </p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-container" style={{ backgroundColor: '#ffffff' }}>
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} />
          </div>
          <button className="filter-button" onClick={toggleFilters}>
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <select 
            className="sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="grade-asc">Grade (Low-High)</option>
            <option value="grade-desc">Grade (High-Low)</option>
            <option value="recent">Recent Activity</option>
            <option value="progress">Progress</option>
          </select>
          <button 
            className="add-student-button"
            onClick={() => {
              setShowAddStudentModal(true);
              setSelectedStudent(null);
            }}
          >
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Grade Level:</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="all">All Grades</option>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button 
            className="clear-filters-button"
            onClick={() => {
              setSelectedGrade('all');
              setSelectedStatus('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Student Name</th>
              <th>Grade Level</th>
              <th>Section</th>
              <th>View Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student) => (
              <tr key={student._id}>
                <td>{student.idNumber}</td>
                <td className="student-name">{`${student.firstName} ${student.lastName}`}</td>
                <td>{student.gradeLevel}</td>
                <td>{student.section}</td>
                <td>
                  <button 
                    className="students-page-view-btn"
                    onClick={() => handleViewProfile(student)}
                  >
                    View Profile
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="edit-button" onClick={() => {
                      setSelectedStudent(student);
                      setShowEditStudentModal(true);
                    }}>
                      <Edit size={16} />
                    </button>
                    <button className="delete-button" onClick={() => {
                      setSelectedStudent(student);
                      setShowConfirmDeleteModal(true);
                    }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length > studentsPerPage && (
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`page-number ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
          </div>
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      <div className="student-insights">
        <h2>Quick Insights</h2>
        <div className="insights-cards">
          <div className="insight-card">
            <div className="insight-icon">
              <BookOpen size={24} />
            </div>
            <div className="insight-content">
              <h3>Reading Progress</h3>
              <p>Average books read: {Math.round(students.reduce((acc, student) => acc + student.booksRead, 0) / students.length)}</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <Book size={24} />
            </div>
            <div className="insight-content">
              <h3>Activity Completion</h3>
              <p>Average completed: {Math.round(students.reduce((acc, student) => acc + student.assignmentsCompleted, 0) / students.length)}</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <Clock size={24} />
            </div>
            <div className="insight-content">
              <h3>Activity Status</h3>
              <p>{students.filter(s => s.status === 'active').length} active in the last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="literexia-teacher-modal-overlay">
          <div className="literexia-teacher-profile-modal">
            <div className="literexia-teacher-modal-header">
              <h2>Student Profile</h2>
              <button className="literexia-teacher-modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="literexia-teacher-profile-content">
              <div className="literexia-teacher-profile-avatar">
                {selectedStudent.profileImageUrl ? (
                  <img 
                    src={selectedStudent.profileImageUrl} 
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    className="literexia-teacher-profile-image"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>
              <div className="literexia-teacher-profile-details">
                <h3 className="literexia-teacher-profile-name">
                  {`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                </h3>
                <div className="literexia-teacher-profile-info">
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">ID Number:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.idNumber}</span>
                  </div>
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Age:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.age}</span>
                  </div>
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Section:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.section}</span>
                  </div>
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Grade Level:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.gradeLevel}</span>
                  </div>
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Gender:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.gender}</span>
                  </div>
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Address:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.address}</span>
                  </div>
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Reading Level:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.readingLevel || 'N/A'}</span>
                  </div>
                  <div className="literexia-teacher-profile-info-item">
                    <span className="literexia-teacher-profile-label">Reading %:</span>
                    <span className="literexia-teacher-profile-value">{selectedStudent.readingPercentage != null ? selectedStudent.readingPercentage + '%' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="literexia-teacher-profile-actions">
              <button className="literexia-teacher-close-profile-btn" onClick={() => setShowProfileModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddEditStudentModal
          student={null}
          onClose={() => setShowAddStudentModal(false)}
          onSave={handleAddStudent}
        />
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && selectedStudent && (
        <AddEditStudentModal
          student={selectedStudent}
          onClose={() => {
            setShowEditStudentModal(false);
            setSelectedStudent(null);
          }}
          onSave={handleEditStudent}
        />
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && selectedStudent && (
        <div className="literexia-teacher-modal-overlay">
          <div className="literexia-teacher-modal">
            <div className="literexia-teacher-modal-header">
              <h2>Confirm Delete</h2>
              <button className="literexia-teacher-modal-close" onClick={() => setShowConfirmDeleteModal(false)}>×</button>
            </div>
            <div className="literexia-teacher-modal-form">
              <p>Are you sure you want to delete this student?</p>
              <div className="literexia-teacher-modal-footer">
                <button className="literexia-teacher-cancel-btn" onClick={() => setShowConfirmDeleteModal(false)}>Cancel</button>
                <button className="literexia-teacher-confirm-delete-btn" onClick={() => { deleteStudent(selectedStudent._id); setShowConfirmDeleteModal(false); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <SuccessModal message={successMessage} onClose={() => setShowSuccessModal(false)} />
      )}
      {validationError && (
        <ValidationErrorModal message={validationError} onClose={() => setValidationError('')} />
      )}
    </div>
  );
};

export default StudentListPage;