// src/pages/Teachers/ViewStudent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaSortAmountDown,
  FaUserGraduate,
  FaChild,
  FaBookReader,
  FaVenusMars
} from 'react-icons/fa';
import StudentApiService from '../../../services/StudentApiService';


import '../../../css/Teachers/ViewStudent.css';



const ViewStudent = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [readingLevelFilter, setReadingLevelFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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
        student.name?.toLowerCase().includes(query) ||
        (student.parent && student.parent.toLowerCase().includes(query)) ||
        (student.id && student.id.toString().toLowerCase().includes(query))
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

  const getReadingLevelClass = (level) => {
    return StudentApiService.getReadingLevelClass(level) || 'vs-level-na';
  };

  const getReadingLevelDescription = (level) => {
    return StudentApiService.getReadingLevelDescription(level) || level;
  };

  const groupedStudents = getGroupedStudents();

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
            <FaSearch className="vs-search-icon" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vs-search-input"
            />
          </div>

          <button
            className="vs-filter-toggle"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <FaFilter /> Filters
            <FaChevronDown className={`vs-chevron ${isFiltersOpen ? 'vs-rotate' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className={`vs-filters-section ${isFiltersOpen ? 'vs-filters-open' : ''}`}>
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
              <FaChevronDown className="vs-select-icon" />
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
              <FaChevronDown className="vs-select-icon" />
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
              <FaChevronDown className="vs-select-icon" />
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
              <FaChevronDown className="vs-select-icon" />
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
              <FaChevronDown className="vs-select-icon" />
            </div>
          </div>
        </div>
      </div>

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
                <h2 className="vs-group-title">{group}</h2>
              )}

              <div className="vs-cards-grid">
                {students.map(student => (
                  <div key={student.id} className="vs-student-card">
                    <div className="vs-card-header">
                      <div className="vs-student-avatar">
                        {student.profileImageUrl ? (
                          <img
                            src={student.profileImageUrl}
                            alt={student.name}
                            className="vs-student-avatar-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          (student.name || '').split(' ').map(n => n[0] || '').join('').toUpperCase()
                        )}
                      </div>
                      <div className="vs-student-basic-info">
                        <h3 className="vs-student-name">{student.name}</h3>
                        <span className="vs-student-id">{student.id}</span>
                      </div>
                      <div className={`vs-reading-level ${getReadingLevelClass(student.readingLevel)}`}>
                        {student.readingLevel || 'Not Assessed'}
                      </div>
                    </div>

                    <div className="vs-card-details">
                      <div className="vs-detail-row">
                        <div className="vs-detail-item">
                          <FaUserGraduate className="vs-detail-icon" />
                          <span className="vs-detail-text">{student.gradeLevel || 'Grade 1'}</span>
                        </div>
                        <div className="vs-detail-item">
                          <FaChild className="vs-detail-icon" />
                          <span className="vs-detail-text">{student.age} years old</span>
                        </div>
                      </div>

                      <div className="vs-detail-row">
                        <div className="vs-detail-item">
                          <FaVenusMars className="vs-detail-icon" />
                          <span className="vs-detail-text">{student.gender || 'Not specified'}</span>
                        </div>
                        <div className="vs-detail-item">
                          <FaBookReader className="vs-detail-icon" />
                          <span className="vs-detail-text">{getReadingLevelDescription(student.readingLevel)}</span>
                        </div>
                      </div>

                      <div className="vs-parent-info">
                        <span className="vs-parent-label">Parent/Guardian:</span>
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
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewStudent;