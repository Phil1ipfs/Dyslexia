// src/pages/Admin/StudentOverviewPage.jsx
import React, { useState, useEffect } from 'react';
import './StudentOverviewPage.css';
import { Edit, Trash2, Filter } from 'lucide-react';
import StudentProfileModal from '../../components/Admin/Dashboard/StudentProfileModal.jsx';

const StudentOverviewPage = () => {
  // State for students data and stats
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 8,
    totalTeachers: 4,
    totalParents: 2
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Mock data for students with enhanced details
  useEffect(() => {
    // In a real app, this would be an API call
    const mockStudents = [
      {
        id: 1,
        name: 'Christine Brooks',
        parentEmail: 'christianbrooks@gmail.com',
        parentName: 'Christine Brooks',
        gradeLevel: '9',
        teacher: 'Mr. Thompson',
        dob: '05/17/2008',
        address: '123 School Lane, Cityville',
        enrollmentDate: '09/01/2022',
        section: 'A',
        parentPhone: '(555) 123-4567',
        parentRelation: 'Mother',
        emergencyName: 'Robert Brooks',
        emergencyRelation: 'Father',
        emergencyPhone: '(555) 987-6543',
        academicPerformance: {
          gpa: '3.9',
          ranking: '3rd of 120',
          subjects: [
            { name: 'Mathematics', grade: 'A+', percentage: 98 },
            { name: 'Science', grade: 'A', percentage: 95 },
            { name: 'English', grade: 'A-', percentage: 91 },
            { name: 'History', grade: 'A', percentage: 94 }
          ]
        },
        attendance: {
          present: 87,
          absent: 2,
          late: 1,
          excused: 2,
          total: 92,
          recentAbsences: [
            { date: '2024-03-15', reason: 'Medical appointment', excused: true },
            { date: '2024-02-22', reason: 'Family emergency', excused: true }
          ]
        }
      },
      {
        id: 2,
        name: 'Rosie Pearson',
        parentEmail: 'alanc@gmail.com',
        parentName: 'Alan Cain',
        gradeLevel: '8',
        teacher: 'Ms. Johnson',
        dob: '07/22/2009',
        address: '456 Academy Blvd, Townsville',
        enrollmentDate: '09/01/2023',
        section: 'B',
        parentPhone: '(555) 234-5678',
        parentRelation: 'Father',
        emergencyName: 'Alan Cain',
        emergencyRelation: 'Father',
        emergencyPhone: '(555) 234-5678',
        academicPerformance: {
          gpa: '3.7',
          ranking: '8th of 115',
          subjects: [
            { name: 'Mathematics', grade: 'B+', percentage: 88 },
            { name: 'Science', grade: 'A', percentage: 94 },
            { name: 'English', grade: 'A-', percentage: 91 },
            { name: 'History', grade: 'A', percentage: 93 }
          ]
        },
        attendance: {
          present: 84,
          absent: 4,
          late: 2,
          excused: 3,
          total: 93,
          recentAbsences: [
            { date: '2024-04-02', reason: 'Illness', excused: true },
            { date: '2024-03-10', reason: 'Family trip', excused: false }
          ]
        }
      },
      {
        id: 3,
        name: 'Darrell Caldwell',
        parentEmail: 'alanc@gmail.com',
        parentName: 'Alan Cain',
        gradeLevel: '7',
        teacher: 'Mr. Smith',
        dob: '11/03/2010',
        address: '456 Academy Blvd, Townsville',
        enrollmentDate: '09/01/2023',
        section: 'C',
        parentPhone: '(555) 234-5678',
        parentRelation: 'Father',
        emergencyName: 'Alan Cain',
        emergencyRelation: 'Father',
        emergencyPhone: '(555) 234-5678',
        academicPerformance: {
          gpa: '3.5',
          ranking: '12th of 110',
          subjects: [
            { name: 'Mathematics', grade: 'B', percentage: 85 },
            { name: 'Science', grade: 'B+', percentage: 88 },
            { name: 'English', grade: 'A', percentage: 92 },
            { name: 'History', grade: 'A-', percentage: 90 }
          ]
        },
        attendance: {
          present: 86,
          absent: 5,
          late: 0,
          excused: 4,
          total: 95,
          recentAbsences: [
            { date: '2024-03-25', reason: 'Illness', excused: true },
            { date: '2024-03-01', reason: 'Dental appointment', excused: true }
          ]
        }
      },
      {
        id: 4,
        name: 'Gilbert Johnston',
        parentEmail: 'alanc@gmail.com',
        parentName: 'Alan Cain',
        gradeLevel: '9',
        teacher: 'Mr. Thompson',
        dob: '01/15/2008',
        address: '456 Academy Blvd, Townsville',
        enrollmentDate: '09/01/2022',
        section: 'A',
        parentPhone: '(555) 234-5678',
        parentRelation: 'Father',
        emergencyName: 'Alan Cain',
        emergencyRelation: 'Father',
        emergencyPhone: '(555) 234-5678',
        academicPerformance: {
          gpa: '3.2',
          ranking: '25th of 120',
          subjects: [
            { name: 'Mathematics', grade: 'B', percentage: 84 },
            { name: 'Science', grade: 'B-', percentage: 81 },
            { name: 'English', grade: 'B+', percentage: 87 },
            { name: 'History', grade: 'B+', percentage: 88 }
          ]
        },
        attendance: {
          present: 82,
          absent: 7,
          late: 3,
          excused: 5,
          total: 97,
          recentAbsences: [
            { date: '2024-04-05', reason: 'Illness', excused: true },
            { date: '2024-03-20', reason: 'Unknown', excused: false }
          ]
        }
      },
      {
        id: 5,
        name: 'Alan Cain',
        parentEmail: 'alanc@gmail.com',
        parentName: 'Alan Cain',
        gradeLevel: '6',
        teacher: 'Ms. Davis',
        dob: '09/10/2011',
        address: '456 Academy Blvd, Townsville',
        enrollmentDate: '09/01/2023',
        section: 'B',
        parentPhone: '(555) 234-5678',
        parentRelation: 'Father',
        emergencyName: 'Alan Cain',
        emergencyRelation: 'Father',
        emergencyPhone: '(555) 234-5678',
        academicPerformance: {
          gpa: '3.8',
          ranking: '5th of 105',
          subjects: [
            { name: 'Mathematics', grade: 'A', percentage: 94 },
            { name: 'Science', grade: 'A', percentage: 95 },
            { name: 'English', grade: 'A-', percentage: 90 },
            { name: 'History', grade: 'A', percentage: 93 }
          ]
        },
        attendance: {
          present: 90,
          absent: 2,
          late: 0,
          excused: 2,
          total: 94,
          recentAbsences: [
            { date: '2024-03-10', reason: 'Family trip', excused: false },
            { date: '2024-02-15', reason: 'Illness', excused: true }
          ]
        }
      },
      {
        id: 6,
        name: 'Alfred Murray',
        parentEmail: 'alanc@gmail.com',
        parentName: 'Alan Cain',
        gradeLevel: '8',
        teacher: 'Ms. Johnson',
        dob: '06/05/2009',
        address: '456 Academy Blvd, Townsville',
        enrollmentDate: '09/01/2022',
        section: 'B',
        parentPhone: '(555) 234-5678',
        parentRelation: 'Father',
        emergencyName: 'Alan Cain',
        emergencyRelation: 'Father',
        emergencyPhone: '(555) 234-5678',
        academicPerformance: {
          gpa: '3.4',
          ranking: '15th of 115',
          subjects: [
            { name: 'Mathematics', grade: 'B+', percentage: 87 },
            { name: 'Science', grade: 'B+', percentage: 89 },
            { name: 'English', grade: 'B', percentage: 85 },
            { name: 'History', grade: 'A-', percentage: 90 }
          ]
        },
        attendance: {
          present: 83,
          absent: 6,
          late: 2,
          excused: 4,
          total: 95,
          recentAbsences: [
            { date: '2024-04-01', reason: 'Illness', excused: true },
            { date: '2024-03-15', reason: 'Medical appointment', excused: true }
          ]
        }
      }
    ];

    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
    setLoading(false);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    
    if (searchValue.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        if (searchBy === 'name') {
          return student.name.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'email') {
          return student.parentEmail.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'parent') {
          return student.parentName.toLowerCase().includes(searchValue.toLowerCase());
        }
        return true;
      });
      setFilteredStudents(filtered);
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
      case 'parent':
        return 'Search by Parent';
      default:
        return 'Search by Name';
    }
  };

  // Handle enroll new student
  const handleEnrollStudent = () => {
    // In a real app, this would open a modal or navigate to enrollment form
    console.log('Enroll new student');
  };

  // Handle edit student
  const handleEditStudent = (studentId) => {
    console.log('Edit student', studentId);
  };

  // Handle delete student
  const handleDeleteStudent = (studentId) => {
    console.log('Delete student', studentId);
  };

  // Handle view profile
  const handleViewProfile = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setIsProfileModalOpen(true);
    }
  };

  // Close profile modal
  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedStudent(null);
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
    <div className="student-overview-page">
      <h1 className="student-page-title">Student Overview</h1>
      
      <div className="student-stats-cards">
        <div className="student-stat-card">
          <div className="student-stat-label">Total Student</div>
          <div className="student-stat-value">{stats.totalStudents}</div>
        </div>
        
        <div className="student-stat-card completed">
          <div className="student-stat-label">Total Teacher</div>
          <div className="student-stat-value">{stats.totalTeachers}</div>
        </div>
        
        <div className="student-stat-card pending">
          <div className="student-stat-label">Total Parent</div>
          <div className="student-stat-value">{stats.totalParents}</div>
        </div>
      </div>
      
      <div className="student-actions-bar">
        <div className="student-search-container">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="student-search-input"
          />
          
          <div className="student-search-dropdown">
            <button 
              className="student-search-dropdown-toggle"
              onClick={toggleSearchDropdown}
            >
              {getSearchByText()}
              <span className="student-dropdown-arrow">▼</span>
            </button>
            
            {isSearchDropdownOpen && (
              <div className="student-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div 
                  className={`student-dropdown-item ${searchBy === 'name' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('name')}
                >
                  Search by Name
                </div>
                <div 
                  className={`student-dropdown-item ${searchBy === 'email' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('email')}
                >
                  Search by Email
                </div>
                <div 
                  className={`student-dropdown-item ${searchBy === 'parent' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('parent')}
                >
                  Search by Parent
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="student-action-buttons">
          <button className="student-enroll-button" onClick={handleEnrollStudent}>
            + Enroll Student
          </button>
          
          <button className="student-filter-button">
            <Filter size={18} />
          </button>
        </div>
      </div>
      
      <div className="student-table">
        <div className="student-table-header">
          <div className="student-th student-name">STUDENT NAME</div>
          <div className="student-th parent-email">PARENT EMAIL</div>
          <div className="student-th parent-name">PARENT NAME</div>
          <div className="student-th view-profile">VIEW PROFILE</div>
          <div className="student-th actions">ACTION/S</div>
        </div>
        
        <div className="student-table-body">
          {loading ? (
            <div className="student-loading">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="student-no-results">No students found matching your search.</div>
          ) : (
            filteredStudents.map(student => (
              <div className="student-table-row" key={student.id}>
                <div className="student-td student-name">{student.name}</div>
                <div className="student-td parent-email">{student.parentEmail}</div>
                <div className="student-td parent-name">{student.parentName}</div>
                <div className="student-td view-profile">
                  <button 
                    className="student-view-profile-button"
                    onClick={() => handleViewProfile(student.id)}
                  >
                    View Profile
                  </button>
                </div>
                <div className="student-td actions">
                  <div className="student-action-buttons-container">
                    <button 
                      className="student-edit-button"
                      onClick={() => handleEditStudent(student.id)}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="student-delete-button"
                      onClick={() => handleDeleteStudent(student.id)}
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
      
      {/* Student Profile Modal */}
      {isProfileModalOpen && (
        <StudentProfileModal 
          student={selectedStudent} 
          onClose={closeProfileModal} 
        />
      )}
    </div>
  );
};

export default StudentOverviewPage;