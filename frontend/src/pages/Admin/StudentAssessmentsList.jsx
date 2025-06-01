import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, ChevronDown, PieChart, BarChart2, 
  Book, Award, Layers, CheckCircle, AlertTriangle,
  User, UserPlus
} from 'lucide-react';
import '../../css/Admin/AssessmentResults/StudentAssessmentsList.css';

const StudentAssessmentsList = () => {
  // State for students data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch students data
  useEffect(() => {
    // Simulated API call - would be replaced with actual backend call
    const fetchStudents = async () => {
      try {
        setLoading(true);
        
        // In production, this would be replaced with an actual API call
        // e.g., const response = await axios.get('/api/admin/pre-assessments');
        
        // Simulated student data
        const mockStudents = [
          {
            _id: "682d5f47def17e7b6758b3ca",
            idNumber: 202511111,
            firstName: "Rainn",
            middleName: "Pascual",
            lastName: "Aganan",
            gradeLevel: "Grade 1",
            section: "Hope",
            readingLevel: "At Grade Level",
            readingPercentage: 100,
            preAssessmentCompleted: true,
            completedAt: "2025-05-21T08:09:31.705745",
            teacherName: "Ms. Amanda Santos"
          },
          {
            _id: "683040fd8e4b26952e3ccb42",
            idNumber: 202522222,
            firstName: "Kit Nicholas",
            middleName: "Rish",
            lastName: "Mark",
            gradeLevel: "Grade 2",
            section: "Hope",
            readingLevel: "Low Emerging",
            readingPercentage: 8,
            preAssessmentCompleted: true,
            completedAt: "2025-05-23T17:53:54.969307",
            teacherName: "Ms. Jane Smith"
          },
          {
            _id: "6830fc50c4d7024b845aa62a",
            idNumber: 202544444,
            firstName: "Kit Nicholas",
            middleName: "Percival",
            lastName: "Carammmm",
            gradeLevel: "Grade 2",
            section: "Hope",
            readingLevel: "Developing",
            readingPercentage: 60,
            preAssessmentCompleted: true,
            completedAt: "2025-05-23T22:53:04.702204",
            teacherName: "Ms. Jane Smith"
          },
          {
            _id: "6835e75f0c543099e95226ec",
            idNumber: 202599999,
            firstName: "Pia",
            middleName: "Zop",
            lastName: "Rey",
            gradeLevel: "Grade 3",
            section: "Section 2",
            readingLevel: "Transitioning",
            readingPercentage: 80,
            preAssessmentCompleted: true,
            completedAt: "2025-05-28T00:25:03.247718",
            teacherName: "Mr. Robert Davis"
          },
          {
            _id: "68360a08c3a79bb6c886a3ea",
            idNumber: 202588888,
            firstName: "Neo",
            middleName: "",
            lastName: "David",
            gradeLevel: "Grade 1",
            section: "Section 1",
            readingLevel: "At Grade Level",
            readingPercentage: 88,
            preAssessmentCompleted: true,
            completedAt: "2025-05-28T02:52:56.535298",
            teacherName: "Ms. Amanda Santos"
          },
          {
            _id: "68360a08c3a79bb6c886a3eb",
            idNumber: 202566666,
            firstName: "Emma",
            middleName: "Grace",
            lastName: "Johnson",
            gradeLevel: "Grade 3",
            section: "Section 1",
            readingLevel: "Transitioning",
            readingPercentage: 76,
            preAssessmentCompleted: true,
            completedAt: "2025-05-28T01:22:16.535298",
            teacherName: "Mr. Robert Davis"
          },
          {
            _id: "68360a08c3a79bb6c886a3ec",
            idNumber: 202577777,
            firstName: "Oliver",
            middleName: "James",
            lastName: "Smith",
            gradeLevel: "Grade 2",
            section: "Section 2",
            readingLevel: "Developing",
            readingPercentage: 54,
            preAssessmentCompleted: true,
            completedAt: "2025-05-27T14:42:11.535298",
            teacherName: "Ms. Jane Smith"
          },
          {
            _id: "68360a08c3a79bb6c886a3ed",
            idNumber: 202533333,
            firstName: "Sofia",
            middleName: "Maria",
            lastName: "Garcia",
            gradeLevel: "Grade 1",
            section: "Hope",
            readingLevel: "High Emerging",
            readingPercentage: 45,
            preAssessmentCompleted: true,
            completedAt: "2025-05-26T09:15:32.535298",
            teacherName: "Ms. Amanda Santos"
          }
        ];
        
        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
      } catch (error) {
        console.error("Error fetching pre-assessment data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search term and filters
  useEffect(() => {
    if (!students.length) return;
    
    let filtered = [...students];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.idNumber.toString().includes(searchTerm)
      );
    }
    
    // Apply grade filter
    if (filterGrade !== 'all') {
      filtered = filtered.filter(student => student.gradeLevel === filterGrade);
    }
    
    // Apply section filter
    if (filterSection !== 'all') {
      filtered = filtered.filter(student => student.section === filterSection);
    }
    
    // Apply sorting
    if (sortBy === 'name-asc') {
      filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
    } else if (sortBy === 'level-asc') {
      const levelOrder = {
        'Low Emerging': 1,
        'High Emerging': 2,
        'Developing': 3,
        'Transitioning': 4,
        'At Grade Level': 5
      };
      filtered.sort((a, b) => (levelOrder[a.readingLevel] || 0) - (levelOrder[b.readingLevel] || 0));
    } else if (sortBy === 'level-desc') {
      const levelOrder = {
        'Low Emerging': 1,
        'High Emerging': 2,
        'Developing': 3,
        'Transitioning': 4,
        'At Grade Level': 5
      };
      filtered.sort((a, b) => (levelOrder[b.readingLevel] || 0) - (levelOrder[a.readingLevel] || 0));
    } else if (sortBy === 'score-asc') {
      filtered.sort((a, b) => (a.readingPercentage || 0) - (b.readingPercentage || 0));
    } else if (sortBy === 'score-desc') {
      filtered.sort((a, b) => (b.readingPercentage || 0) - (a.readingPercentage || 0));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    } else if (sortBy === 'grade-asc') {
      filtered.sort((a, b) => a.gradeLevel.localeCompare(b.gradeLevel));
    } else if (sortBy === 'grade-desc') {
      filtered.sort((a, b) => b.gradeLevel.localeCompare(a.gradeLevel));
    }
    
    setFilteredStudents(filtered);
  }, [students, searchTerm, filterGrade, filterSection, sortBy]);

  // Get unique grade levels and sections for filters
  const getUniqueGradeLevels = () => {
    const gradeLevels = [...new Set(students.map(student => student.gradeLevel))];
    return gradeLevels.sort();
  };

  const getUniqueSections = () => {
    const sections = [...new Set(students.map(student => student.section))];
    return sections.sort();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get reading level badge class
  const getReadingLevelClass = (level) => {
    switch(level) {
      case 'Low Emerging':
      case 'High Emerging':
        return 'student-assessments__reading-level--emerging';
      case 'Developing':
        return 'student-assessments__reading-level--developing';
      case 'Transitioning':
        return 'student-assessments__reading-level--transitioning';
      case 'At Grade Level':
        return 'student-assessments__reading-level--grade-level';
      default:
        return 'student-assessments__reading-level--not-assessed';
    }
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className="student-assessments__container">
      {/* Header Section */}
      <div className="student-assessments__header">
        <div className="student-assessments__title-container">
          <h1>Pre Assessment Results</h1>
          <p className="student-assessments__subtitle">
            Overview of initial reading assessments for all students
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="student-assessments__filters-container">
        <div className="student-assessments__search-box">
          <Search size={18} className="student-assessments__search-icon" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="student-assessments__search-input"
          />
        </div>
        
        <div className="student-assessments__filters-controls">
          <button className="student-assessments__filter-toggle" onClick={toggleFilters}>
            <Filter size={16} />
            <span>Filter</span>
            <ChevronDown size={16} />
          </button>
          
          <select 
            className="student-assessments__sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="grade-asc">Grade (Low to High)</option>
            <option value="grade-desc">Grade (High to Low)</option>
            <option value="level-asc">Reading Level (Low to High)</option>
            <option value="level-desc">Reading Level (High to Low)</option>
            <option value="score-asc">Score (Low to High)</option>
            <option value="score-desc">Score (High to Low)</option>
            <option value="recent">Recently Assessed</option>
          </select>
        </div>
      </div>
      
      {/* Expanded Filters */}
      {showFilters && (
        <div className="student-assessments__expanded-filters">
          <div className="student-assessments__filter-group">
            <label>Grade Level</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="student-assessments__filter-select"
            >
              <option value="all">All Grades</option>
              {getUniqueGradeLevels().map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          <div className="student-assessments__filter-group">
            <label>Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="student-assessments__filter-select"
            >
              <option value="all">All Sections</option>
              {getUniqueSections().map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="student-assessments__clear-filters"
            onClick={() => {
              setFilterGrade('all');
              setFilterSection('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Students Cards Grid */}
      {loading ? (
        <div className="student-assessments__loading">
          <div className="student-assessments__loading-spinner"></div>
          <p>Loading pre-assessment results...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="student-assessments__grid">
          {filteredStudents.map(student => (
            <div key={student._id} className="student-assessments__card">
              <div className="student-assessments__card-header">
                <div className="student-assessments__avatar">
                  {student.profileImageUrl ? (
                    <img 
                      src={student.profileImageUrl} 
                      alt={`${student.firstName} ${student.lastName}`} 
                      className="student-assessments__avatar-img" 
                    />
                  ) : (
                    <div className="student-assessments__avatar-placeholder">
                      <User size={24} />
                    </div>
                  )}
                </div>
                
                <div className={`student-assessments__level-badge ${getReadingLevelClass(student.readingLevel)}`}>
                  {student.readingLevel}
                </div>
              </div>
              
              <div className="student-assessments__card-body">
                <h3 className="student-assessments__student-name">
                  {student.firstName} {student.lastName}
                </h3>
                
                <div className="student-assessments__student-details">
                  <div className="student-assessments__detail">
                    <span className="student-assessments__detail-label">ID:</span>
                    <span className="student-assessments__detail-value">{student.idNumber}</span>
                  </div>
                  
                  <div className="student-assessments__detail">
                    <span className="student-assessments__detail-label">Grade/Section:</span>
                    <span className="student-assessments__detail-value">{student.gradeLevel} - {student.section}</span>
                  </div>
                  
                  <div className="student-assessments__detail">
                    <span className="student-assessments__detail-label">Teacher:</span>
                    <span className="student-assessments__detail-value">{student.teacherName}</span>
                  </div>
                  
                  <div className="student-assessments__detail">
                    <span className="student-assessments__detail-label">Assessed:</span>
                    <span className="student-assessments__detail-value">{formatDate(student.completedAt)}</span>
                  </div>
                </div>
                
                <div className="student-assessments__score-container">
                  <div className="student-assessments__score-circle" style={{ background: `conic-gradient(#3B4F81 ${student.readingPercentage * 3.6}deg, #edf2f7 0deg)` }}>
                    <div className="student-assessments__score-inner">
                      <span className="student-assessments__score-value">{student.readingPercentage}%</span>
                    </div>
                  </div>
                  <span className="student-assessments__score-label">Pre Assessment Score</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="student-assessments__empty-state">
          <AlertTriangle size={48} />
          <h3>No Pre Assessment Results Found</h3>
          <p>No pre-assessment results match your current filters. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAssessmentsList; 