// src/pages/Teachers/ViewStudent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaUserGraduate,
  FaChild,
  FaBookReader,
  FaVenusMars,
  FaLayerGroup,
  FaSchool,
  FaIdBadge,
  FaTags,
  FaCheck,
  FaChevronDown
} from 'react-icons/fa';
import StudentApiService from '../../../services/Teachers/StudentApiService';
import '../../../css/Teachers/ViewStudent.css';

const ViewStudent = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [readingLevelFilter, setReadingLevelFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingLevels, setReadingLevels] = useState([]);

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        // First get reading levels
        const levelsData = await StudentApiService.getReadingLevels();
        if (Array.isArray(levelsData)) {
          setReadingLevels(levelsData);
        }

        // Fetch students list
        const studentsData = await StudentApiService.getStudents();
        if (studentsData && studentsData.students) {
          setStudents(studentsData.students);
          setFilteredStudents(studentsData.students);
        } else {
          setStudents([]);
          setFilteredStudents([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter and sort students based on search query and filters
  useEffect(() => {
    filterAndSortStudents();
  }, [searchQuery, readingLevelFilter, gradeFilter, classFilter, sortBy, students]);

  const filterAndSortStudents = () => {
    let filtered = [...students];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        // Only search by student name
        student.name?.toLowerCase().includes(query)
      );
    }

    if (readingLevelFilter !== 'all') {
      filtered = filtered.filter(student => student.readingLevel === readingLevelFilter);
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter(student => student.gradeLevel === gradeFilter);
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter(student => student.section === classFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name?.localeCompare(b.name || '');
        case 'grade':
          return (a.gradeLevel || '').localeCompare(b.gradeLevel || '');
        case 'reading':
          return (a.readingLevel || '').localeCompare(b.readingLevel || '');
        default:
          return a.name?.localeCompare(b.name || '');
      }
    });

    setFilteredStudents(filtered);
  };

  const handleViewDetails = (student) => {
    navigate(`/teacher/student-details/${student.id}`, { state: { student } });
  };

  const getGroupedStudents = () => {
    if (groupBy === 'none') {
      return { 'All Students': filteredStudents };
    }

    return filteredStudents.reduce((groups, student) => {
      let key;

      switch (groupBy) {
        case 'grade':
          key = student.gradeLevel || 'Not Assigned';
          break;
        case 'reading':
          key = student.readingLevel || 'Not Assessed';
          break;
        case 'section':
          key = student.section || 'Not Assigned';
          break;
        default:
          key = 'All Students';
      }

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(student);
      return groups;
    }, {});
  };

  // Get color-coded class based on reading level
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'vs-level-na';
    
    switch(level.toLowerCase()) {
      case 'early':
        return 'vs-level-early';
      case 'developing':
        return 'vs-level-developing';
      case 'fluent':
        return 'vs-level-fluent';
      case 'advanced':
        return 'vs-level-advanced';
      default:
        return 'vs-level-na';
    }
  };

  const getReadingLevelDescription = (level) => {
    return StudentApiService.getReadingLevelDescription(level) || level;
  };

  const groupedStudents = getGroupedStudents();

  // Are any filters active?
  const hasActiveFilters = 
    readingLevelFilter !== 'all' || 
    gradeFilter !== 'all' || 
    classFilter !== 'all' || 
    groupBy !== 'none';

  return (
    <div className="vs-container">
      {/* Header */}
      <div className="vs-header">
        <div className="vs-title-section">
          <h1 className="vs-title">Student List</h1>
          <p className="vs-subtitle">View and manage student details</p>
        </div>

        <div className="vs-search-container">
          <div className="vs-search-wrapper">
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vs-search-input"
            />
          </div>
        </div>
      </div>

      {/* Filters Section - Static Version */}
      <div className="vs-filters-section">
        <div className="vs-filter-row">
          <div className="vs-filter-group">
            <label className="vs-filter-label">Reading Level:</label>
            <div className="vs-select-wrapper">
              <select
                value={readingLevelFilter}
                onChange={(e) => setReadingLevelFilter(e.target.value)}
                className="vs-select"
              >
                <option value="all">All Levels</option>
                {readingLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <FaBookReader className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Grade:</label>
            <div className="vs-select-wrapper">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="vs-select"
              >
                <option value="all">All Grades</option>
                <option value="Grade 1">Grade 1</option>
              </select>
              <FaUserGraduate className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Section:</label>
            <div className="vs-select-wrapper">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="vs-select"
              >
                <option value="all">All Sections</option>
                <option value="Sampaguita">Sampaguita</option>
                <option value="Rosal">Rosal</option>
                <option value="Rosa">Rosa</option>
                <option value="Lily">Lily</option>
                <option value="Orchid">Orchid</option>
              </select>
              <FaSchool className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Group by:</label>
            <div className="vs-select-wrapper">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="vs-select"
              >
                <option value="none">No Grouping</option>
                <option value="grade">By Grade</option>
                <option value="reading">By Reading Level</option>
                <option value="section">By Section</option>
              </select>
              <FaLayerGroup className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Sort by:</label>
            <div className="vs-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="vs-select"
              >
                <option value="name">Name</option>
                <option value="grade">Grade</option>
                <option value="reading">Reading Level</option>
              </select>
              <FaSortAmountDown className="vs-select-icon" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Filters Section (new) */}
      {hasActiveFilters && (
        <div className="vs-active-filters">
          <div className="vs-active-filters-title">
            <FaFilter /> Active Filters:
          </div>
          
          <div className="vs-active-filters-content">
            {readingLevelFilter !== 'all' && (
              <div className="vs-filter-tag">
                <FaBookReader className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Reading Level:</span>
                <span className="vs-filter-tag-value">{readingLevelFilter}</span>
              </div>
            )}
            
            {gradeFilter !== 'all' && (
              <div className="vs-filter-tag">
                <FaUserGraduate className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Grade:</span>
                <span className="vs-filter-tag-value">{gradeFilter}</span>
              </div>
            )}
            
            {classFilter !== 'all' && (
              <div className="vs-filter-tag">
                <FaSchool className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Section:</span>
                <span className="vs-filter-tag-value">{classFilter}</span>
              </div>
            )}
            
            {groupBy !== 'none' && (
              <div className="vs-filter-tag">
                <FaLayerGroup className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Grouped by:</span>
                <span className="vs-filter-tag-value">
                  {groupBy === 'grade' ? 'Grade' : 
                   groupBy === 'reading' ? 'Reading Level' : 'Section'}
                </span>
              </div>
            )}
          </div>
          
          <div className="vs-filter-divider"></div>
        </div>
      )}

      {/* Results Summary */}
      <div className="vs-results-summary">
        <span className="vs-results-count">
          Found: <strong>{filteredStudents.length}</strong> student(s)
        </span>
        <span className="vs-results-sort">
          <FaSortAmountDown /> Sorted by: <strong>{
            sortBy === 'name' ? 'Name' :
              sortBy === 'grade' ? 'Grade' :
                sortBy === 'reading' ? 'Reading Level' :
                  'Name'
          }</strong>
        </span>
      </div>

      {/* Students List */}
      <div className="vs-students-list">
        {loading ? (
          <div className="vs-loading">
            <div className="vs-loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="vs-no-results">
            <p>No students found matching your criteria.</p>
          </div>
        ) : (
          Object.entries(groupedStudents).map(([group, students]) => (
            <div key={group} className="vs-group-section">
              {group !== 'All Students' && (
                <h2 className="vs-group-title">
                  {groupBy === 'reading' && <FaBookReader className="vs-group-icon" />}
                  {groupBy === 'grade' && <FaUserGraduate className="vs-group-icon" />}
                  {groupBy === 'section' && <FaSchool className="vs-group-icon" />}
                  {group}
                </h2>
              )}

              <div className="vs-cards-grid">
                {students.map(student => {
                  const levelClass = getReadingLevelClass(student.readingLevel);
                  
                  return (
                    <div key={student.id} className="vs-student-card">
                      <div className="vs-card-header">
                        <div className="vs-student-avatar">
                          {student.profileImageUrl ? (
                            <img
                              src={student.profileImageUrl}
                              alt={student.name}
                              className="vs-student-avatar-img"
                            />
                          ) : (
                            (student.name || '').split(' ').map(n => n[0] || '').join('').toUpperCase()
                          )}
                        </div>
                        <div className="vs-student-basic-info">
                          <h3 className="vs-student-name">{student.name}</h3>
                          <span className="vs-student-id">
  <strong>Student ID:</strong>{' '}
  <FaIdBadge style={{ margin: '0 4px', color: '#3B4F81' }} />
  {student.id}
</span>


                        </div>
                        <div className={`vs-reading-badge ${levelClass}`}>
                          {student.readingLevel || 'Not Assessed'}
                        </div>
                      </div>

                      <div className="vs-card-details">
                        <div className="vs-student-info-row">
                          <div className="vs-info-icon">
                            <FaUserGraduate />
                          </div>
                          <span className="vs-info-text">Grade {student.gradeLevel?.replace('Grade ', '') || '1'}</span>
                        
                          <div className="vs-info-icon" style={{marginLeft: 'auto'}}>
                            <FaChild />
                          </div>
                          <span className="vs-info-text">{student.age} years old</span>
                        </div>

                        <div className="vs-student-info-row">
                          <div className="vs-info-icon">
                            <FaVenusMars />
                          </div>
                          <span className="vs-info-text">{student.gender || 'Not specified'}</span>
                          
                          <div className={`vs-reading-level-indicator ${levelClass}`}>
                            <FaBookReader />
                            <span>{student.readingLevel || 'Not Assessed'}</span>
                          </div>
                        </div>

                        <div className="vs-parent-guardian">
                          <span className="vs-parent-label">Parent/Guardian: </span>
                          <span className="vs-parent-name">
                            {typeof student.parent === 'string'
                              ? student.parent
                              : student.parent && student.parent.name
                                ? student.parent.name
                                : 'Not registered'}
                          </span>
                        </div>

                        <button
                          className="vs-view-details-btn"
                          onClick={() => handleViewDetails(student)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewStudent;