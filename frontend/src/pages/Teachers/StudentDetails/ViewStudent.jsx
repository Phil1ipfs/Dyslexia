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
  FaCalendarAlt
} from 'react-icons/fa';
import { getStudents, getReadingLevelDescription } from '../../../services/StudentService';
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

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
        setFilteredStudents(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [searchQuery, readingLevelFilter, gradeFilter, classFilter, sortBy, students]);

  const filterAndSortStudents = () => {
    let filtered = [...students];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.parent.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query)
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
          return a.name.localeCompare(b.name);
        case 'grade':
          return a.gradeLevel.localeCompare(b.gradeLevel);
        case 'reading':
          return a.readingLevel.localeCompare(b.readingLevel);
        default:
          return a.name.localeCompare(b.name);
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
          key = student.gradeLevel;
          break;
        case 'reading':
          key = student.readingLevel;
          break;
        case 'section':
          key = student.section;
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
    switch (level) {
      case 'Antas 1': return 'vs-level-1';
      case 'Antas 2': return 'vs-level-2';
      case 'Antas 3': return 'vs-level-3';
      case 'Antas 4': return 'vs-level-4';
      case 'Antas 5': return 'vs-level-5';
      default: return '';
    }
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
                <option value="Antas 1">Antas 1: Starting to Learn</option>
                <option value="Antas 2">Antas 2: Progressive Learner</option>
                <option value="Antas 3">Antas 3: Competent Reader</option>
                <option value="Antas 4">Antas 4: Proficient Reader</option>
                <option value="Antas 5">Antas 5: Advanced Reader</option>
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
                <option value="Kindergarten">Kindergarten</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
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
                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="vs-student-basic-info">
                        <h3 className="vs-student-name">{student.name}</h3>
                        <span className="vs-student-id">{student.id}</span>
                      </div>
                      <div className={`vs-reading-level ${getReadingLevelClass(student.readingLevel)}`}>
                        {student.readingLevel}
                      </div>
                    </div>
                    
                    <div className="vs-card-details">
                      <div className="vs-detail-row">
                        <div className="vs-detail-item">
                          <FaUserGraduate className="vs-detail-icon" />
                          <span className="vs-detail-text">{student.gradeLevel}</span>
                        </div>
                        <div className="vs-detail-item">
                          <FaChild className="vs-detail-icon" />
                          <span className="vs-detail-text">{student.age} years old</span>
                        </div>
                      </div>
                      
                      <div className="vs-detail-row">
                        <div className="vs-detail-item">
                          <FaBookReader className="vs-detail-icon" />
                          <span className="vs-detail-text">{getReadingLevelDescription(student.readingLevel)}</span>
                        </div>
                      </div>
                      
                      <div className="vs-parent-info">
                        <span className="vs-parent-label">Parent/Guardian:</span>
                        <span className="vs-parent-name">{student.parent}</span>
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