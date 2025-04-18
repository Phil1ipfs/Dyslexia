// src/pages/Admin/TeacherListPage.jsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Filter, Search, Plus } from 'lucide-react';
import './UserListPage.css';

const TeacherListPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for teachers
  useEffect(() => {
    // In a real app, this would be an API call
    const mockTeachers = [
      {
        id: 1,
        name: 'Ms. Gabriela Santos',
        email: 'gabriela.santos@literexia.edu',
        subject: 'Filipino Language',
        grade: 'Grade 1-3',
        status: 'Active'
      },
      {
        id: 2,
        name: 'Mr. Raymond Cruz',
        email: 'raymond.cruz@literexia.edu',
        subject: 'Reading Comprehension',
        grade: 'Grade 2-3',
        status: 'Active'
      },
      {
        id: 3,
        name: 'Ms. Elena Reyes',
        email: 'elena.reyes@literexia.edu',
        subject: 'Phonics',
        grade: 'Grade 1',
        status: 'Active'
      },
      {
        id: 4,
        name: 'Mr. David Tan',
        email: 'david.tan@literexia.edu',
        subject: 'Grammar',
        grade: 'Grade 2-3',
        status: 'Inactive'
      },
      {
        id: 5,
        name: 'Ms. Isabel Mendoza',
        email: 'isabel.mendoza@literexia.edu',
        subject: 'Vocabulary Building',
        grade: 'Grade 1-3',
        status: 'Active'
      },
      {
        id: 6,
        name: 'Mr. Antonio Garcia',
        email: 'antonio.garcia@literexia.edu',
        subject: 'Reading Fluency',
        grade: 'Grade 2-3',
        status: 'Active'
      },
      {
        id: 7,
        name: 'Ms. Sofia Lim',
        email: 'sofia.lim@literexia.edu',
        subject: 'Writing Skills',
        grade: 'Grade 3',
        status: 'Pending'
      }
    ];

    setTeachers(mockTeachers);
    setFilteredTeachers(mockTeachers);
    setLoading(false);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    
    if (searchValue.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const filtered = teachers.filter(teacher => {
        if (searchBy === 'name') {
          return teacher.name.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'email') {
          return teacher.email.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'subject') {
          return teacher.subject.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'grade') {
          return teacher.grade.toLowerCase().includes(searchValue.toLowerCase());
        }
        return true;
      });
      setFilteredTeachers(filtered);
    }
  };

  // Toggle search dropdown
  const toggleSearchDropdown = (e) => {
    e.stopPropagation();
    setIsSearchDropdownOpen(!isSearchDropdownOpen);
  };

  // Set search by option
  const setSearchByOption = (option) => {
    setSearchBy(option);
    setIsSearchDropdownOpen(false);
  };

  // Get search by display text
  const getSearchByText = () => {
    switch (searchBy) {
      case 'name':
        return 'Search by Name';
      case 'email':
        return 'Search by Email';
      case 'subject':
        return 'Search by Subject';
      case 'grade':
        return 'Search by Grade';
      default:
        return 'Search by Name';
    }
  };

  // Handle add teacher
  const handleAddTeacher = () => {
    // Redirect to add account page
    window.location.href = '/admin/user-lists/add-account';
  };

  // Handle edit teacher
  const handleEditTeacher = (teacherId) => {
    console.log('Edit teacher', teacherId);
  };

  // Handle delete teacher
  const handleDeleteTeacher = (teacherId) => {
    console.log('Delete teacher', teacherId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsSearchDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="user-list-page">
      <h1 className="page-title">Teacher List</h1>
      
      {/* Enhanced Actions Bar */}
      <div className="enhanced-actions-bar">
        <div className="search-section">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="enhanced-search-input"
            />
          </div>
          
          <div className="search-dropdown">
            <button 
              className="enhanced-dropdown-toggle"
              onClick={toggleSearchDropdown}
            >
              {getSearchByText()}
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {isSearchDropdownOpen && (
              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div 
                  className={`dropdown-item ${searchBy === 'name' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('name')}
                >
                  Search by Name
                </div>
                <div 
                  className={`dropdown-item ${searchBy === 'email' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('email')}
                >
                  Search by Email
                </div>
                <div 
                  className={`dropdown-item ${searchBy === 'subject' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('subject')}
                >
                  Search by Subject
                </div>
                <div 
                  className={`dropdown-item ${searchBy === 'grade' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('grade')}
                >
                  Search by Grade
                </div>
              </div>
            )}
          </div>
          
          <button className="filter-button">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
        
        <div className="action-buttons-group">
          <button className="add-button" onClick={handleAddTeacher}>
            <Plus size={16} />
            <span>Add Teacher</span>
          </button>
          
          <button className="action-button primary-action">
            <span>Export</span>
          </button>
        </div>
      </div>
      
      <div className="user-table">
        <div className="table-header">
          <div className="th name-col">TEACHER NAME</div>
          <div className="th email-col">EMAIL</div>
          <div className="th subject-col">SUBJECT</div>
          <div className="th grade-col">GRADE LEVEL</div>
          <div className="th status-col">STATUS</div>
          <div className="th actions-col">ACTION/S</div>
        </div>
        
        <div className="table-body">
          {loading ? (
            <div className="loading">Loading teachers...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="no-results">No teachers found matching your search.</div>
          ) : (
            filteredTeachers.map(teacher => (
              <div className="table-row" key={teacher.id}>
                <div className="td name-col">{teacher.name}</div>
                <div className="td email-col">{teacher.email}</div>
                <div className="td subject-col">{teacher.subject}</div>
                <div className="td grade-col">{teacher.grade}</div>
                <div className="td status-col">
                  <span className={`status-badge ${teacher.status.toLowerCase()}`}>
                    {teacher.status}
                  </span>
                </div>
                <div className="td actions-col">
                  <div className="action-buttons-container">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditTeacher(teacher.id)}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteTeacher(teacher.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherListPage;