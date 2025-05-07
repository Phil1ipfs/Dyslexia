// src/pages/Teachers/ManageProgress/ManageProgress.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaSortAmountDown,
  FaUserGraduate,
  FaChild,
  FaBookReader,
  FaCalendarAlt,
  FaAngleLeft,
  FaAngleRight,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import StudentApiService from '../../../services/StudentApiService';
import '../../../css/Teachers/ManageProgress.css';

function getPageNumbers(currentPage, totalPages) {
  const visiblePageCount = 7;
  let startPage = Math.max(currentPage - 3, 1);
  let endPage = startPage + visiblePageCount - 1;
  
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(endPage - visiblePageCount + 1, 1);
  }
  
  return Array.from({ length: endPage - startPage + 1 }, (_, i) => i + startPage);
}

const ManageProgress = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [readingLevelFilter, setReadingLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [readingLevels, setReadingLevels] = useState([]);
  const itemsPerPage = 6;
  
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        console.log('Fetching students from API...');
        
        // Using the StudentApiService to fetch students
        const data = await StudentApiService.getStudents({
          page: 1,
          limit: 50, // Get more students to ensure we have enough for filtering
          search: searchQuery,
          readingLevelFilter: readingLevelFilter !== 'all' ? readingLevelFilter : undefined
        });
        
        console.log('Students data received:', data);
        
        if (!data || !data.students || !Array.isArray(data.students)) {
          throw new Error('Invalid response format');
        }
        
        setStudents(data.students);
        
        // Get reading levels
        const readingLevelsData = await StudentApiService.getReadingLevels();
        setReadingLevels(readingLevelsData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching student data:", err);
        setError(`Failed to load student data: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [searchQuery, readingLevelFilter]);

  // Filter and sort students when any filter or search changes
  useEffect(() => {
    let filtered = [...students];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(query) ||
        (student.parent && student.parent.toLowerCase().includes(query)) ||
        student.id.toLowerCase().includes(query)
      );
    }

    // Apply reading level filter
    if (readingLevelFilter !== 'all') {
      filtered = filtered.filter(student => student.readingLevel === readingLevelFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'reading':
          // Sort by reading level priority
          const levelPriority = {
            'Low Emerging': 1,
            'High Emerging': 2,
            'Developing': 3,
            'Transitioning': 4,
            'At Grade Level': 5,
            'Not Assessed': 0
          };
          return (levelPriority[b.readingLevel] || 0) - (levelPriority[a.readingLevel] || 0);
        case 'progress':
          const progressA = a.totalActivities > 0 ? (a.activitiesCompleted / a.totalActivities) : 0;
          const progressB = b.totalActivities > 0 ? (b.activitiesCompleted / b.totalActivities) : 0;
          return progressB - progressA;
        case 'recent':
          return new Date(b.lastActivityDate) - new Date(a.lastActivityDate);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    setFilteredStudents(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchQuery, readingLevelFilter, sortBy, students]);

  const handleViewDetails = (student) => {
    navigate(`/teacher/student-progress/${student.id}`, { state: student });
  };

  // Reading level descriptions (based on CRLA DEPED)
  const readingLevelDescriptions = {
    'Low Emerging': 'Nagsisimulang Matuto',
    'High Emerging': 'Umuunlad na Matuto',
    'Developing': 'Paunlad na Pagbasa',
    'Transitioning': 'Lumalago na Pagbasa',
    'At Grade Level': 'Batay sa Antas',
    'Not Assessed': 'Hindi pa nasusuri'
  };

  // Get reading level CSS class
  const getReadingLevelClass = (level) => {
    switch (level) {
      case 'Low Emerging': return 'mp-level-1';
      case 'High Emerging': return 'mp-level-2';
      case 'Developing': return 'mp-level-3';
      case 'Transitioning': return 'mp-level-4';
      case 'At Grade Level': return 'mp-level-5';
      case 'Not Assessed': return '';
      default: return '';
    }
  };

  // Get progress CSS class
  const getProgressClass = (progress) => {
    if (progress >= 85) return 'mp-progress-excellent';
    if (progress >= 70) return 'mp-progress-good';
    if (progress >= 50) return 'mp-progress-average';
    return 'mp-progress-needs-improvement';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date available';
    try {
      if (dateString.includes('T')) {
        // ISO format date
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
      }
      // Already formatted date
      return dateString;
    } catch (error) {
      return dateString;
    }
  };
  
  // Get grouped students
  const getGroupedStudents = () => {
    if (groupBy === 'none') {
      return { 'All Students': filteredStudents };
    }

    return filteredStudents.reduce((groups, student) => {
      let key;
      
      switch (groupBy) {
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

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  const groupedStudents = getGroupedStudents();

  return (
    <div className="mp-container">
      {/* Header */}
      <div className="mp-header">
        <div className="mp-title-section">
          <h1 className="mp-title">Pamamahala ng Pag-unlad ng Mag-aaral</h1>
          <p className="mp-subtitle">Subaybayan ang pag-unlad ng bawat mag-aaral, magsagawa ng mga pre-assessment, at magtalaga ng mga inirerekomendang aktibidad</p>
        </div>
        
        <div className="mp-search-container">
          <div className="mp-search-wrapper">
            <input
              type="text"
              placeholder="Maghanap ng mag-aaral..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mp-search-input"
            />
          </div>
        </div>
      </div>
      
      {/* Filters Section - Always visible */}
      <div className="mp-filters-section mp-filters-open">
        <div className="mp-filter-row">
          <div className="mp-filter-group">
            <label className="mp-filter-label">Antas ng Pagbasa:</label>
            <div className="mp-select-wrapper">
              <select
                value={readingLevelFilter}
                onChange={(e) => setReadingLevelFilter(e.target.value)}
                className="mp-select"
              >
                <option value="all">Lahat ng Antas</option>
                {readingLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}: {readingLevelDescriptions[level] || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mp-filter-group">
            <label className="mp-filter-label">Pagkakabukod:</label>
            <div className="mp-select-wrapper">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="mp-select"
              >
                <option value="none">Walang Pagkakabukod</option>
                <option value="reading">Ayon sa Antas ng Pagbasa</option>
                <option value="section">Ayon sa Seksiyon</option>
              </select>
            </div>
          </div>
          
          <div className="mp-filter-group">
            <label className="mp-filter-label">Ayusin ayon sa:</label>
            <div className="mp-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mp-select"
              >
                <option value="name">Pangalan</option>
                <option value="reading">Antas ng Pagbasa</option>
                <option value="progress">Pag-unlad</option>
                <option value="recent">Huling Aktibidad</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="mp-results-summary">
        <span className="mp-results-count">
          Natagpuan: <strong>{filteredStudents.length}</strong> (na) mag-aaral
        </span>
        <span className="mp-results-sort">
          <FaSortAmountDown /> Nakaayos ayon sa: <strong>{sortBy === 'name' ? 'Pangalan' : 
            sortBy === 'reading' ? 'Antas ng Pagbasa' : 
            sortBy === 'progress' ? 'Pag-unlad' : 'Huling Aktibidad'}</strong>
        </span>
      </div>
      
      {/* Students Progress Cards */}
      <div className="mp-students-list">
        {loading ? (
          <div className="mp-loading">
            <div className="mp-loading-spinner"></div>
            <p>Naglo-load ng mga datos...</p>
          </div>
        ) : error ? (
          <div className="mp-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Subukang muli</button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="mp-no-results">
            <p>Walang natagpuang mag-aaral na tumutugma sa mga filter.</p>
          </div>
        ) : (
          Object.entries(groupedStudents).map(([group, students]) => (
            <div key={group} className="mp-group-section">
              {group !== 'All Students' && (
                <h2 className="mp-group-title">{group} {group !== 'All Students' && readingLevelDescriptions[group] ? `- ${readingLevelDescriptions[group]}` : ''}</h2>
              )}
              
              <div className="mp-cards-grid">
                {students
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map(student => (
                    <div key={student.id} className="mp-student-card">
                      <div className="mp-card-header">
                        <div className="mp-student-avatar">
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="mp-student-basic-info">
                          <h3 className="mp-student-name">{student.name}</h3>
                          <span className="mp-student-id">{student.id}</span>
                        </div>
                        {student.readingLevel !== 'Not Assessed' && (
                          <div className={`mp-reading-level ${getReadingLevelClass(student.readingLevel)}`}>
                            {student.readingLevel}
                          </div>
                        )}
                      </div>
                      
                      <div className="mp-card-details">
                        <div className="mp-detail-row">
                          <div className="mp-detail-item">
                            <FaUserGraduate className="mp-detail-icon" />
                            <span className="mp-detail-text">Grade 1</span>
                          </div>
                          <div className="mp-detail-item">
                            <FaChild className="mp-detail-icon" />
                            <span className="mp-detail-text">{student.age} taong gulang</span>
                          </div>
                        </div>
                        
                        <div className="mp-detail-row">
                          <div className="mp-detail-item">
                            <FaBookReader className="mp-detail-icon" />
                            <span className="mp-detail-text">
                              {student.readingLevel !== 'Not Assessed' 
                                ? readingLevelDescriptions[student.readingLevel] || student.readingLevel
                                : 'Hindi pa nasusuri'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mp-section-divider"></div>
                        
                        <div className="mp-assessment-section">
                          <div className="mp-assessment-label">Pre-Assessment Status:</div>
                          <div className="mp-assessment-status">
                            {student.preAssessmentCompleted ? (
                              <span className="mp-assessment-complete">Tapos na</span>
                            ) : (
                              <span className="mp-assessment-incomplete">Hindi pa nasusuri</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mp-section-divider"></div>
                        
                        <div className="mp-progress-section">
                          <div className="mp-progress-header">
                            <span className="mp-progress-label">Pag-unlad sa Mga Aktibidad:</span>
                            <span className={`mp-progress-value ${getProgressClass(student.activitiesCompleted / Math.max(1, student.totalActivities) * 100)}`}>
                              {Math.round(student.activitiesCompleted / Math.max(1, student.totalActivities) * 100)}%
                            </span>
                          </div>
                          <div className="mp-progress-bar-container">
                            <div 
                              className={`mp-progress-bar ${getProgressClass(student.activitiesCompleted / Math.max(1, student.totalActivities) * 100)}`}
                              style={{width: `${(student.activitiesCompleted / Math.max(1, student.totalActivities) * 100)}%`}}
                            ></div>
                          </div>
                          <div className="mp-progress-text">
                            {student.activitiesCompleted} / {student.totalActivities} na mga aktibidad
                          </div>
                        </div>
                        
                        <div className="mp-section-divider"></div>
                        
                        <div className="mp-parent-info">
                          <div className="mp-parent-label">Magulang/Tagapag-alaga:</div>
                          <div className="mp-parent-name">{student.parent}</div>
                        </div>
                        
                        <div className="mp-btn-wrapper">
                          <button 
                            className="mp-view-details-btn"
                            onClick={() => handleViewDetails(student)}
                          >
                            Tingnan ang Pag-unlad
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
        
        {/* Pagination */}
        {!loading && !error && filteredStudents.length > 0 && (
          <div className="mp-pagination">
            <div className="mp-pagination-info">
              Ipinapakita {startIndex + 1} hanggang {Math.min(startIndex + itemsPerPage, filteredStudents.length)} sa {filteredStudents.length} na mag-aaral
            </div>
            {totalPages > 1 && (
              <div className="mp-pagination-controls">
                <button 
                  className="mp-pagination-arrow" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1}
                >
                  <FaAngleLeft /> Nauna
                </button>
                
                {getPageNumbers(currentPage, totalPages).map(page => (
                  <button
                    key={page}
                    className={`mp-pagination-number ${page === currentPage ? 'mp-pagination-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page < 10 ? `0${page}` : page}
                  </button>
                ))}
                
                <button 
                  className="mp-pagination-arrow" 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                  disabled={currentPage === totalPages}
                >
                  Sunod <FaAngleRight />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProgress;