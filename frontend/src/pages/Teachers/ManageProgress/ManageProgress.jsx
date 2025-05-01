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
  FaAngleRight
} from 'react-icons/fa';
import '../../../css/Teachers/ManageProgress.css';
import { getStudentDetails, getPreAssessmentResults, getProgressData } from '../../../services/StudentService';

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
  const [gradeFilter, setGradeFilter] = useState('all');
  const [readingLevelFilter, setReadingLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const itemsPerPage = 6;
  
  // List of grade levels and reading levels from the student data
  const [gradeLevels, setGradeLevels] = useState([]);
  const [readingLevels, setReadingLevels] = useState([]);
 
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // In a real app, this would be a single API call to get a list of students
        // For this mockup, we'll use the student IDs from StudentService
        const studentIds = ['101', '102', '103']; // Use mock student IDs from service
        const studentDataPromises = studentIds.map(async (id) => {
          const studentDetails = await getStudentDetails(id);
          const assessmentResults = await getPreAssessmentResults(id);
          const progressData = await getProgressData(id);
          
          return {
            id: id,
            name: studentDetails?.name || '',
            gradeLevel: studentDetails?.gradeLevel || '',
            readingLevel: assessmentResults?.readingLevel || 'Not Assessed',
            preAssessmentCompleted: !!assessmentResults,
            lastAssessment: assessmentResults?.assessmentDate || '',
            activitiesCompleted: progressData?.activitiesCompleted || 0,
            totalActivities: progressData?.totalActivities || 0,
            lrn: `LRN-${100000 + parseInt(id)}`,
            section: studentDetails?.section || '',
            age: studentDetails?.age || 0,
            parent: progressData?.parent || 'Not Available',
            lastActivityDate: progressData?.recentActivities?.[0]?.date || new Date().toISOString().split('T')[0]
          };
        });
        
        const studentData = await Promise.all(studentDataPromises);
        setStudents(studentData);
        
        // Extract unique grade levels and reading levels for filters
        const uniqueGradeLevels = [...new Set(studentData.map(s => s.gradeLevel))];
        const uniqueReadingLevels = [...new Set(studentData.map(s => s.readingLevel).filter(level => level !== 'Not Assessed'))];
        setGradeLevels(uniqueGradeLevels);
        setReadingLevels(uniqueReadingLevels);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to load student data");
        setLoading(false);
        console.error("Error fetching student data:", err);
      }
    };
    
    fetchStudents();
  }, []);

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

    // Apply grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(student => student.gradeLevel === gradeFilter);
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
        case 'progress':
          return (b.activitiesCompleted / b.totalActivities) - (a.activitiesCompleted / a.totalActivities);
        case 'recent':
          return new Date(b.lastActivityDate) - new Date(a.lastActivityDate);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    setFilteredStudents(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchQuery, readingLevelFilter, gradeFilter, sortBy, students]);

  const handleViewDetails = (student) => {
    navigate(`/teacher/student-progress/${student.id}`, { state: student });
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
      case 'Antas 1': return 'mp-level-1';
      case 'Antas 2': return 'mp-level-2';
      case 'Antas 3': return 'mp-level-3';
      case 'Antas 4': return 'mp-level-4';
      case 'Antas 5': return 'mp-level-5';
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
            {/* <FaSearch className="mp-search-icon" /> */}
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
            <label className="mp-filter-label">Baitang:</label>
            <div className="mp-select-wrapper">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="mp-select"
              >
                <option value="all">Lahat ng Baitang</option>
                {gradeLevels.map((grade, index) => (
                  <option key={index} value={grade}>{grade}</option>
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
                <option value="grade">Ayon sa Baitang</option>
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
                <option value="grade">Baitang</option>
                <option value="reading">Antas ng Pagbasa</option>
                <option value="progress">Pag-unlad</option>
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
            sortBy === 'grade' ? 'Baitang' : 
            sortBy === 'reading' ? 'Antas ng Pagbasa' : 
            sortBy === 'progress' ? 'Pag-unlad' : ' Aktibidad'}</strong>
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
                <h2 className="mp-group-title">{group}</h2>
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
                            <span className="mp-detail-text">{student.gradeLevel}</span>
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
                          {/* <div className="mp-detail-item">
                            <FaCalendarAlt className="mp-detail-icon" />
                            <span className="mp-detail-text">
                              Huling aktibidad: {formatDate(student.lastActivityDate)}
                            </span>
                          </div> */}
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
                            <span className={`mp-progress-value ${getProgressClass(student.activitiesCompleted / student.totalActivities * 100)}`}>
                              {Math.round(student.activitiesCompleted / student.totalActivities * 100)}%
                            </span>
                          </div>
                          <div className="mp-progress-bar-container">
                            <div 
                              className={`mp-progress-bar ${getProgressClass(student.activitiesCompleted / student.totalActivities * 100)}`}
                              style={{width: `${(student.activitiesCompleted / student.totalActivities * 100)}%`}}
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