// src/pages/StudentList/StudentListPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen, Book, Clock, MoreHorizontal, User } from 'lucide-react';
import axios from 'axios';
import './StudentListPage.css';

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
  
  // Fetch students from database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5002/api/admin/manage/students');
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
  const deleteStudent = (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      console.log(`Delete student: ${studentId}`);
      // Delete student API call
      const updatedStudents = students.filter(student => student.id !== studentId);
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
    }
  };

  // Add new student
  const addNewStudent = () => {
    console.log('Add new student');
    // Navigate to add student page or open modal
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

        <div className="controls-container">
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
      <div className="controls-container">
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
          <button className="add-student-button" onClick={addNewStudent}>
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
                    <button className="edit-button">
                      <Edit size={16} />
                    </button>
                    <button className="delete-button">
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
              <h3>Assignment Completion</h3>
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
        <div className="students-page-modal-overlay">
          <div className="students-page-profile-modal">
            <div className="students-page-modal-header">
              <h2>Student Profile</h2>
              <button 
                className="students-page-modal-close"
                onClick={() => setShowProfileModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="students-page-profile-content">
              <div className="students-page-profile-avatar">
                {selectedStudent.profileImageUrl ? (
                  <img 
                    src={selectedStudent.profileImageUrl} 
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    className="students-page-profile-image"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>
              
              <div className="students-page-profile-details">
                <h3 className="students-page-profile-name">
                  {`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                </h3>
                
                <div className="students-page-profile-info">
                  <div className="students-page-profile-info-item">
                    <span className="students-page-profile-label">ID Number:</span>
                    <span className="students-page-profile-value">{selectedStudent.idNumber}</span>
                  </div>
                  
                  <div className="students-page-profile-info-item">
                    <span className="students-page-profile-label">Email:</span>
                    <span className="students-page-profile-value">{selectedStudent.email}</span>
                  </div>
                  
                  <div className="students-page-profile-info-item">
                    <span className="students-page-profile-label">Age:</span>
                    <span className="students-page-profile-value">{selectedStudent.age}</span>
                  </div>
                  
                  <div className="students-page-profile-info-item">
                    <span className="students-page-profile-label">Reading Level:</span>
                    <span className="students-page-profile-value">{selectedStudent.readingLevel}</span>
                  </div>
                  
                  <div className="students-page-profile-info-item">
                    <span className="students-page-profile-label">Address:</span>
                    <span className="students-page-profile-value">{selectedStudent.address}</span>
                  </div>
                  
                  <div className="students-page-profile-info-item">
                    <span className="students-page-profile-label">Section:</span>
                    <span className="students-page-profile-value">{selectedStudent.section}</span>
                  </div>
                  
                  <div className="students-page-profile-info-item">
                    <span className="students-page-profile-label">Gender:</span>
                    <span className="students-page-profile-value">{selectedStudent.gender}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="students-page-modal-footer">
              <button 
                className="students-page-close-btn"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListPage;