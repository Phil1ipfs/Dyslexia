// Handle view student details
const handleViewDetails = (student) => {
  navigate(`/teacher/student-details/${student.id}`, { state: { student } });
};

// Get grouped students
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

// Reading level descriptions
const readingLevelDescriptions = {
  'Antas 1': 'Nag-uumpisang Matuto',
  'Antas 2': 'Pa-unlad na Nag-aaral',
  'Antas 3': 'Sanay na Mag-aaral',
  'Antas 4': 'Maalam na Mag-aaral',
  'Antas 5': 'Mahusay na Mag-aaral'
};// src/pages/Teachers/ViewStudent.jsx
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
// Import dummy data service
import { getStudents } from '../../../services/StudentDataService';
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

// Load data from service
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

// Filter and sort students when any filter or search changes
useEffect(() => {
  filterAndSortStudents();
}, [searchQuery, readingLevelFilter, gradeFilter, classFilter, sortBy, students]);

// Function to filter and sort students
const filterAndSortStudents = () => {
  let filtered = [...students];

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.parent.toLowerCase().includes(query) ||
      student.id.toLowerCase().includes(query)
    );
  }

  // Apply reading level filter
  if (readingLevelFilter !== 'all') {
    filtered = filtered.filter(student => student.readingLevel === readingLevelFilter);
  }

  // Apply grade filter
  if (gradeFilter !== 'all') {
    filtered = filtered.filter(student => student.gradeLevel === gradeFilter);
  }

  // Apply class filter
  if (classFilter !== 'all') {
    filtered = filtered.filter(student => student.section === classFilter);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'grade':
        return a.gradeLevel.localeCompare(b.gradeLevel);
      case 'reading':
        return a.readingLevel.localeCompare(b.readingLevel);
      case 'recent':
        return new Date(b.lastActivityDate) - new Date(a.lastActivityDate);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  setFilteredStudents(filtered);
};

// Handle view student details
const handleViewDetails = (student) => {
  navigate(`/teacher/student-details/${student.id}`, { state: { student } });
};

// Get grouped students
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

// Reading level descriptions
const readingLevelDescriptions = {
  'Antas 1': 'Nag-uumpisang Matuto',
  'Antas 2': 'Pa-unlad na Nag-aaral',
  'Antas 3': 'Sanay na Mag-aaral',
  'Antas 4': 'Maalam na Mag-aaral',
  'Antas 5': 'Mahusay na Mag-aaral'
};

// Get reading level CSS class
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

// Get progress CSS class
const getProgressClass = (progress) => {
  if (progress >= 85) return 'vs-progress-excellent';
  if (progress >= 70) return 'vs-progress-good';
  if (progress >= 50) return 'vs-progress-average';
  return 'vs-progress-needs-improvement';
};

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

  const groupedStudents = getGroupedStudents();

return (
  <div className="vs-container">
    {/* Header */}
    <div className="vs-header">
      <div className="vs-title-section">
        <h1 className="vs-title">Listahan ng mga Mag-aaral</h1>
        <p className="vs-subtitle">Tingnan at pamahalaan ang mga detalye ng mag-aaral</p>
      </div>
      
      <div className="vs-search-container">
        <div className="vs-search-wrapper">
          <FaSearch className="vs-search-icon" />
          <input
            type="text"
            placeholder="Maghanap ng mag-aaral..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="vs-search-input"
          />
        </div>
        
        <button 
          className="vs-filter-toggle" 
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <FaFilter /> Mga Filter
          <FaChevronDown className={`vs-chevron ${isFiltersOpen ? 'vs-rotate' : ''}`} />
        </button>
      </div>
    </div>
    
    {/* Filters Section */}
    <div className={`vs-filters-section ${isFiltersOpen ? 'vs-filters-open' : ''}`}>
      <div className="vs-filter-row">
        <div className="vs-filter-group">
          <label className="vs-filter-label">Antas ng Pagbasa:</label>
          <div className="vs-select-wrapper">
            <select
              value={readingLevelFilter}
              onChange={(e) => setReadingLevelFilter(e.target.value)}
              className="vs-select"
            >
              <option value="all">Lahat ng Antas</option>
              <option value="Antas 1">Antas 1: Nag-uumpisang Matuto</option>
              <option value="Antas 2">Antas 2: Pa-unlad na Nag-aaral</option>
              <option value="Antas 3">Antas 3: Sanay na Mag-aaral</option>
              <option value="Antas 4">Antas 4: Maalam na Mag-aaral</option>
              <option value="Antas 5">Antas 5: Mahusay na Mag-aaral</option>
            </select>
            <FaChevronDown className="vs-select-icon" />
          </div>
        </div>
        
        <div className="vs-filter-group">
          <label className="vs-filter-label">Baitang:</label>
          <div className="vs-select-wrapper">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="vs-select"
            >
              <option value="all">Lahat ng Baitang</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
            </select>
            <FaChevronDown className="vs-select-icon" />
          </div>
        </div>
        
        <div className="vs-filter-group">
          <label className="vs-filter-label">Seksiyon:</label>
          <div className="vs-select-wrapper">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="vs-select"
            >
              <option value="all">Lahat ng Seksiyon</option>
              <option value="Sampaguita">Sampaguita</option>
              <option value="Rosal">Rosal</option>
              <option value="Lily">Lily</option>
              <option value="Orchid">Orchid</option>
            </select>
            <FaChevronDown className="vs-select-icon" />
          </div>
        </div>
        
        <div className="vs-filter-group">
          <label className="vs-filter-label">Pagkakabukod:</label>
          <div className="vs-select-wrapper">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="vs-select"
            >
              <option value="none">Walang Pagkakabukod</option>
              <option value="grade">Ayon sa Baitang</option>
              <option value="reading">Ayon sa Antas ng Pagbasa</option>
              <option value="section">Ayon sa Seksiyon</option>
            </select>
            <FaChevronDown className="vs-select-icon" />
          </div>
        </div>
        
        <div className="vs-filter-group">
          <label className="vs-filter-label">Ayusin ayon sa:</label>
          <div className="vs-select-wrapper">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="vs-select"
            >
              <option value="name">Pangalan</option>
              <option value="grade">Baitang</option>
              <option value="reading">Antas ng Pagbasa</option>
            </select>
            <FaChevronDown className="vs-select-icon" />
          </div>
        </div>
      </div>
    </div>
    
    {/* Results Summary */}
    <div className="vs-results-summary">
      <span className="vs-results-count">
        Natagpuan: <strong>{filteredStudents.length}</strong> (na) mag-aaral
      </span>
      <span className="vs-results-sort">
        <FaSortAmountDown /> Nakaayos ayon sa: <strong>{sortBy === 'name' ? 'Pangalan' : 
          sortBy === 'grade' ? 'Baitang' : 
          sortBy === 'reading' ? 'Antas ng Pagbasa' : 
          'Huling Aktibidad'}</strong>
      </span>
    </div>
    
    {/* Students List */}
    <div className="vs-students-list">
      {loading ? (
        <div className="vs-loading">
          <div className="vs-loading-spinner"></div>
          <p>Naglo-load ng mga datos...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="vs-no-results">
          <p>Walang natagpuang mag-aaral na tumutugma sa mga filter.</p>
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
                        <span className="vs-detail-text">{student.age} taong gulang</span>
                      </div>
                    </div>
                    
                    <div className="vs-detail-row">
                      <div className="vs-detail-item">
                        <FaBookReader className="vs-detail-icon" />
                        <span className="vs-detail-text">{readingLevelDescriptions[student.readingLevel]}</span>
                      </div>
                  
                    </div>
                    
                    <div className="vs-progress-section">
                      <div className="vs-progress-header">
                      
                      </div>
                     
                    </div>
                    
                    <div className="vs-parent-info">
                      <span className="vs-parent-label">Magulang/Tagapag-alaga:</span>
                      <span className="vs-parent-name">{student.parent}</span>
                    </div>
                    
                    <button 
                      className="vs-view-details-btn"
                      onClick={() => handleViewDetails(student)}
                    >
                      Tingnan ang Detalye
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