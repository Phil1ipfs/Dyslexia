// src/pages/StudentList/StudentListPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen, Book, Clock, MoreHorizontal } from 'lucide-react';
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
  
  // Sample data for demonstration
  const sampleStudents = [
    {
      id: 'ST001',
      name: 'Christine Brooks',
      grade: '5',
      age: '10',
      joinDate: '2023-09-01',
      parent: 'Christine Brooks',
      parentEmail: 'christianbrooks@gmail.com',
      progress: '75%',
      status: 'active',
      lastActivity: '2025-05-03',
      booksRead: 12,
      assignmentsCompleted: 25,
      averageScore: 85
    },
    {
      id: 'ST002',
      name: 'Rosie Pearson',
      grade: '4',
      age: '9',
      joinDate: '2023-09-15',
      parent: 'Alan Cain',
      parentEmail: 'christianbrooks@gmail.com',
      progress: '68%',
      status: 'active',
      lastActivity: '2025-05-04',
      booksRead: 9,
      assignmentsCompleted: 20,
      averageScore: 78
    },
    {
      id: 'ST003',
      name: 'Darrell Caldwell',
      grade: '6',
      age: '11',
      joinDate: '2023-08-30',
      parent: 'Alan Cain',
      parentEmail: 'christianbrooks@gmail.com',
      progress: '82%',
      status: 'active',
      lastActivity: '2025-05-02',
      booksRead: 15,
      assignmentsCompleted: 30,
      averageScore: 92
    },
    {
      id: 'ST004',
      name: 'Gilbert Johnston',
      grade: '5',
      age: '10',
      joinDate: '2023-09-05',
      parent: 'Alan Cain',
      parentEmail: 'christianbrooks@gmail.com',
      progress: '63%',
      status: 'inactive',
      lastActivity: '2025-04-25',
      booksRead: 7,
      assignmentsCompleted: 18,
      averageScore: 75
    },
    {
      id: 'ST005',
      name: 'Alan Cain',
      grade: '3',
      age: '8',
      joinDate: '2023-10-10',
      parent: 'Alan Cain',
      parentEmail: 'christianbrooks@gmail.com',
      progress: '55%',
      status: 'active',
      lastActivity: '2025-05-05',
      booksRead: 6,
      assignmentsCompleted: 15,
      averageScore: 70
    },
    {
      id: 'ST006',
      name: 'Alfred Murray',
      grade: '4',
      age: '9',
      joinDate: '2023-09-20',
      parent: 'Alan Cain',
      parentEmail: 'christianbrooks@gmail.com',
      progress: '70%',
      status: 'active',
      lastActivity: '2025-05-01',
      booksRead: 10,
      assignmentsCompleted: 22,
      averageScore: 81
    },
    {
      id: 'ST007',
      name: 'Olivia Chen',
      grade: '6',
      age: '11',
      joinDate: '2023-08-25',
      parent: 'Wei Chen',
      parentEmail: 'weichen@gmail.com',
      progress: '90%',
      status: 'active',
      lastActivity: '2025-05-05',
      booksRead: 18,
      assignmentsCompleted: 32,
      averageScore: 95
    },
    {
      id: 'ST008',
      name: 'Marcus Johnson',
      grade: '5',
      age: '10',
      joinDate: '2023-09-12',
      parent: 'Denise Johnson',
      parentEmail: 'djohnson@gmail.com',
      progress: '72%',
      status: 'active',
      lastActivity: '2025-05-04',
      booksRead: 11,
      assignmentsCompleted: 24,
      averageScore: 83
    }
  ];

  // Load students data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStudents(sampleStudents);
      setFilteredStudents(sampleStudents);
      setLoading(false);
    }, 800);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let result = [...students];
    
    // Apply search term
    if (searchTerm) {
      result = result.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply grade filter
    if (selectedGrade !== 'all') {
      result = result.filter(student => student.grade === selectedGrade);
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      result = result.filter(student => student.status === selectedStatus);
    }
    
    // Apply sorting
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'grade-asc') {
      result.sort((a, b) => parseInt(a.grade) - parseInt(b.grade));
    } else if (sortBy === 'grade-desc') {
      result.sort((a, b) => parseInt(b.grade) - parseInt(a.grade));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    } else if (sortBy === 'progress') {
      result.sort((a, b) => parseInt(b.progress) - parseInt(a.progress));
    }
    
    setFilteredStudents(result);
  }, [searchTerm, students, selectedGrade, selectedStatus, sortBy]);

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
  const viewStudentProfile = (studentId) => {
    console.log(`View student profile: ${studentId}`);
    // Navigate to student profile page
    // history.push(`/admin/student-profile/${studentId}`);
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

  return (
    <div className="student-list-page">
      <div className="page-header">
        <h1>Student Lists</h1>
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
      </div>

      <div className="controls-container">
        <div className="search-filter-container">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
        </div>
        <button className="add-student-button" onClick={addNewStudent}>
          <Plus size={18} />
          <span>Add Student</span>
        </button>
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

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Parent</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length > 0 ? (
                  currentStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td className="student-name">{student.name}</td>
                      <td>Grade {student.grade}</td>
                      <td>{student.parent}</td>
                      <td>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar" 
                            style={{ width: student.progress }}
                          ></div>
                          <span className="progress-text">{student.progress}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(student.status)}`}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(student.lastActivity).toLocaleDateString()}</td>
                      <td className="action-buttons">
                        <button 
                          className="view-button" 
                          onClick={() => viewStudentProfile(student.id)}
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="edit-button" 
                          onClick={() => editStudent(student.id)}
                          title="Edit Student"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="delete-button" 
                          onClick={() => deleteStudent(student.id)}
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-results">No students found</td>
                  </tr>
                )}
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
        </>
      )}
    </div>
  );
};

export default StudentListPage;