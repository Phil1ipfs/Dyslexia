// src/pages/Admin/AssessmentResultsOverview.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, PieChart, BarChart2, 
  Book, Award, Layers, CheckCircle, AlertTriangle, Info
} from 'lucide-react';
import '../../css/Admin/AssessmentResults/AssessmentResultsOverview.css';

const AssessmentResultsOverview = () => {
  // State for students data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterReadingLevel, setFilterReadingLevel] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch students data
  useEffect(() => {
    // Simulated API call - would be replaced with actual backend call
    const fetchStudents = async () => {
      try {
        setLoading(true);
        
        // In production, this would be replaced with an actual API call
        // e.g., const response = await axios.get('/api/admin/assessment-results');
        
        // Simulated student data based on the JSON files provided
        const mockStudents = [
          {
            _id: "682d5f47def17e7b6758b3ca",
            idNumber: 202511111,
            firstName: "Rainn",
            middleName: "Pascual",
            lastName: "Aganan",
            section: "Hope",
            readingLevel: "At Grade Level",
            readingPercentage: 100,
            preAssessmentCompleted: true,
            completedAt: "2025-05-21T08:09:31.705745",
            categoryScores: {
              "alphabet_knowledge": { total: 5, correct: 5, score: 100 },
              "phonological_awareness": { total: 5, correct: 5, score: 100 },
              "decoding": { total: 5, correct: 5, score: 100 },
              "word_recognition": { total: 5, correct: 5, score: 100 },
              "reading_comprehension": { total: 5, correct: 5, score: 100 }
            },
            allCategoriesPassed: true
          },
          {
            _id: "683040fd8e4b26952e3ccb42",
            idNumber: 202522222,
            firstName: "Kit Nicholas",
            middleName: "Rish",
            lastName: "Mark",
            section: "Hope",
            readingLevel: "Low Emerging",
            readingPercentage: 8,
            preAssessmentCompleted: true,
            completedAt: "2025-05-23T17:53:54.969307",
            categoryScores: {
              "alphabet_knowledge": { total: 5, correct: 1, score: 20 },
              "phonological_awareness": { total: 5, correct: 0, score: 0 },
              "decoding": { total: 5, correct: 0, score: 0 },
              "word_recognition": { total: 5, correct: 1, score: 20 },
              "reading_comprehension": { total: 5, correct: 0, score: 0 }
            },
            allCategoriesPassed: false
          },
          {
            _id: "6830fc50c4d7024b845aa62a",
            idNumber: 202544444,
            firstName: "Kit Nicholas",
            middleName: "Percival",
            lastName: "Carammmm",
            section: "Hope",
            readingLevel: "Developing",
            readingPercentage: 60,
            preAssessmentCompleted: true,
            completedAt: "2025-05-23T22:53:04.702204",
            categoryScores: {
              "alphabet_knowledge": { total: 5, correct: 5, score: 100 },
              "phonological_awareness": { total: 5, correct: 5, score: 100 },
              "decoding": { total: 5, correct: 5, score: 100 },
              "word_recognition": { total: 5, correct: 0, score: 0 },
              "reading_comprehension": { total: 5, correct: 0, score: 0 }
            },
            allCategoriesPassed: false
          },
          {
            _id: "6835e75f0c543099e95226ec",
            idNumber: 202599999,
            firstName: "Pia",
            middleName: "Zop",
            lastName: "Rey",
            section: "Section 2",
            readingLevel: "Transitioning",
            readingPercentage: 80,
            preAssessmentCompleted: true,
            completedAt: "2025-05-28T00:25:03.247718",
            categoryScores: {
              "alphabet_knowledge": { total: 5, correct: 5, score: 100 },
              "phonological_awareness": { total: 5, correct: 5, score: 100 },
              "decoding": { total: 5, correct: 5, score: 100 },
              "word_recognition": { total: 5, correct: 5, score: 100 },
              "reading_comprehension": { total: 5, correct: 0, score: 0 }
            },
            allCategoriesPassed: true
          },
          {
            _id: "68360a08c3a79bb6c886a3ea",
            idNumber: 202588888,
            firstName: "Neo",
            middleName: "",
            lastName: "David",
            section: "Section 1",
            readingLevel: "At Grade Level",
            readingPercentage: 88,
            preAssessmentCompleted: true,
            completedAt: "2025-05-28T02:52:56.535298",
            categoryScores: {
              "alphabet_knowledge": { total: 5, correct: 5, score: 100 },
              "phonological_awareness": { total: 5, correct: 5, score: 100 },
              "decoding": { total: 5, correct: 5, score: 100 },
              "word_recognition": { total: 5, correct: 5, score: 100 },
              "reading_comprehension": { total: 5, correct: 0, score: 0 }
            },
            allCategoriesPassed: true
          }
        ];
        
        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
      } catch (error) {
        console.error("Error fetching assessment results:", error);
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
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(student => {
        const categoryScore = student.categoryScores?.[filterCategory]?.score || 0;
        return categoryScore >= 75; // Passing threshold is 75%
      });
    }
    
    // Apply reading level filter
    if (filterReadingLevel !== 'all') {
      filtered = filtered.filter(student => 
        student.readingLevel === filterReadingLevel
      );
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
    }
    
    setFilteredStudents(filtered);
  }, [students, searchTerm, filterCategory, filterReadingLevel, sortBy]);

  // Get stats
  const getTotalStudents = () => filteredStudents.length;
  
  const getPassingStudents = () => {
    return filteredStudents.filter(student => student.allCategoriesPassed).length;
  };
  
  const getAverageScore = () => {
    if (!filteredStudents.length) return 0;
    const totalScore = filteredStudents.reduce((sum, student) => sum + (student.readingPercentage || 0), 0);
    return Math.round(totalScore / filteredStudents.length);
  };
  
  const getCategoryPassingRate = (category) => {
    if (!filteredStudents.length) return 0;
    const passedCount = filteredStudents.filter(student => 
      (student.categoryScores?.[category]?.score || 0) >= 75
    ).length;
    return Math.round((passedCount / filteredStudents.length) * 100);
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
        return 'assessment-results__reading-level--emerging';
      case 'Developing':
        return 'assessment-results__reading-level--developing';
      case 'Transitioning':
        return 'assessment-results__reading-level--transitioning';
      case 'At Grade Level':
        return 'assessment-results__reading-level--grade-level';
      default:
        return 'assessment-results__reading-level--not-assessed';
    }
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get score status class
  const getScoreStatusClass = (score) => {
    if (score >= 75) return 'assessment-results__score--passed';
    if (score >= 50) return 'assessment-results__score--partial';
    return 'assessment-results__score--failed';
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className="assessment-results__container">
      {/* Header Section */}
      <div className="assessment-results__header">
        <div className="assessment-results__title-container">
          <h1>Post Assessment Results</h1>
          <p className="assessment-results__subtitle">
            View and analyze post-assessment results across all students
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="assessment-results__dashboard">
        <div className="assessment-results__stat-card">
          <div className="assessment-results__stat-icon">
            <Award size={24} />
          </div>
          <div className="assessment-results__stat-content">
            <h3>Total Students</h3>
            <p className="assessment-results__stat-value">{getTotalStudents()}</p>
            <p className="assessment-results__stat-description">
              Students completed post-assessment
            </p>
          </div>
        </div>
        
        <div className="assessment-results__stat-card">
          <div className="assessment-results__stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="assessment-results__stat-content">
            <h3>Passing Students</h3>
            <p className="assessment-results__stat-value">{getPassingStudents()}</p>
            <p className="assessment-results__stat-description">
              {getPassingStudents() > 0
                ? `${Math.round((getPassingStudents() / getTotalStudents()) * 100)}% of total students`
                : 'No students have passed all categories'}
            </p>
          </div>
        </div>
        
        <div className="assessment-results__stat-card">
          <div className="assessment-results__stat-icon">
            <PieChart size={24} />
          </div>
          <div className="assessment-results__stat-content">
            <h3>Average Score</h3>
            <p className="assessment-results__stat-value">{getAverageScore()}%</p>
            <p className="assessment-results__stat-description">
              Overall average reading score
            </p>
          </div>
        </div>
      </div>

      {/* Category Performance Overview */}
      <div className="assessment-results__category-overview">
        <h2 className="assessment-results__section-title">
          <Layers size={20} />
          Category Performance Overview
        </h2>
        
        <div className="assessment-results__category-grid">
          <div className="assessment-results__category-card">
            <div className="assessment-results__category-header">
              <h3>Alphabet Knowledge</h3>
              <span className={`assessment-results__category-percentage ${getCategoryPassingRate('alphabet_knowledge') >= 75 ? 'good' : 'needs-improvement'}`}>
                {getCategoryPassingRate('alphabet_knowledge')}%
              </span>
            </div>
            <div className="assessment-results__progress-bar">
              <div 
                className="assessment-results__progress-fill" 
                style={{ width: `${getCategoryPassingRate('alphabet_knowledge')}%` }}
              ></div>
            </div>
            <p className="assessment-results__category-description">
              Students passing this category
            </p>
          </div>
          
          <div className="assessment-results__category-card">
            <div className="assessment-results__category-header">
              <h3>Phonological Awareness</h3>
              <span className={`assessment-results__category-percentage ${getCategoryPassingRate('phonological_awareness') >= 75 ? 'good' : 'needs-improvement'}`}>
                {getCategoryPassingRate('phonological_awareness')}%
              </span>
            </div>
            <div className="assessment-results__progress-bar">
              <div 
                className="assessment-results__progress-fill" 
                style={{ width: `${getCategoryPassingRate('phonological_awareness')}%` }}
              ></div>
            </div>
            <p className="assessment-results__category-description">
              Students passing this category
            </p>
          </div>
          
          <div className="assessment-results__category-card">
            <div className="assessment-results__category-header">
              <h3>Decoding</h3>
              <span className={`assessment-results__category-percentage ${getCategoryPassingRate('decoding') >= 75 ? 'good' : 'needs-improvement'}`}>
                {getCategoryPassingRate('decoding')}%
              </span>
            </div>
            <div className="assessment-results__progress-bar">
              <div 
                className="assessment-results__progress-fill" 
                style={{ width: `${getCategoryPassingRate('decoding')}%` }}
              ></div>
            </div>
            <p className="assessment-results__category-description">
              Students passing this category
            </p>
          </div>
          
          <div className="assessment-results__category-card">
            <div className="assessment-results__category-header">
              <h3>Word Recognition</h3>
              <span className={`assessment-results__category-percentage ${getCategoryPassingRate('word_recognition') >= 75 ? 'good' : 'needs-improvement'}`}>
                {getCategoryPassingRate('word_recognition')}%
              </span>
            </div>
            <div className="assessment-results__progress-bar">
              <div 
                className="assessment-results__progress-fill" 
                style={{ width: `${getCategoryPassingRate('word_recognition')}%` }}
              ></div>
            </div>
            <p className="assessment-results__category-description">
              Students passing this category
            </p>
          </div>
          
          <div className="assessment-results__category-card">
            <div className="assessment-results__category-header">
              <h3>Reading Comprehension</h3>
              <span className={`assessment-results__category-percentage ${getCategoryPassingRate('reading_comprehension') >= 75 ? 'good' : 'needs-improvement'}`}>
                {getCategoryPassingRate('reading_comprehension')}%
              </span>
            </div>
            <div className="assessment-results__progress-bar">
              <div 
                className="assessment-results__progress-fill" 
                style={{ width: `${getCategoryPassingRate('reading_comprehension')}%` }}
              ></div>
            </div>
            <p className="assessment-results__category-description">
              Students passing this category
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="assessment-results__filters-container">
        <div className="assessment-results__search-box">
          <Search size={18} className="assessment-results__search-icon" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="assessment-results__search-input"
          />
        </div>
        
        <div className="assessment-results__filters-controls">
          <button className="assessment-results__filter-toggle" onClick={toggleFilters}>
            <Filter size={16} />
            <span>Filter</span>
            <ChevronDown size={16} />
          </button>
          
          <select 
            className="assessment-results__sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
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
        <div className="assessment-results__expanded-filters">
          <div className="assessment-results__filter-group">
            <label>Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="assessment-results__filter-select"
            >
              <option value="all">All Categories</option>
              <option value="alphabet_knowledge">Alphabet Knowledge</option>
              <option value="phonological_awareness">Phonological Awareness</option>
              <option value="decoding">Decoding</option>
              <option value="word_recognition">Word Recognition</option>
              <option value="reading_comprehension">Reading Comprehension</option>
            </select>
          </div>
          
          <div className="assessment-results__filter-group">
            <label>Reading Level</label>
            <select
              value={filterReadingLevel}
              onChange={(e) => setFilterReadingLevel(e.target.value)}
              className="assessment-results__filter-select"
            >
              <option value="all">All Levels</option>
              <option value="Low Emerging">Low Emerging</option>
              <option value="High Emerging">High Emerging</option>
              <option value="Developing">Developing</option>
              <option value="Transitioning">Transitioning</option>
              <option value="At Grade Level">At Grade Level</option>
            </select>
          </div>
          
          <button 
            className="assessment-results__clear-filters"
            onClick={() => {
              setFilterCategory('all');
              setFilterReadingLevel('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Results Table */}
      {loading ? (
        <div className="assessment-results__loading">
          <div className="assessment-results__loading-spinner"></div>
          <p>Loading assessment results...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="assessment-results__table-container">
          <table className="assessment-results__table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>ID Number</th>
                <th>Section</th>
                <th>Reading Level</th>
                <th>Overall Score</th>
                <th>Category Scores</th>
                <th>Assessment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="assessment-results__table-row">
                  <td className="assessment-results__student-name">
                    {student.firstName} {student.middleName ? student.middleName.charAt(0) + '. ' : ''}{student.lastName}
                  </td>
                  <td>{student.idNumber}</td>
                  <td>{student.section}</td>
                  <td>
                    <span className={`assessment-results__reading-level ${getReadingLevelClass(student.readingLevel)}`}>
                      {student.readingLevel}
                    </span>
                  </td>
                  <td>
                    <div className={`assessment-results__score ${student.readingPercentage >= 75 ? 'assessment-results__score--passed' : 'assessment-results__score--failed'}`}>
                      {student.readingPercentage}%
                    </div>
                  </td>
                  <td className="assessment-results__category-scores">
                    {Object.entries(student.categoryScores || {}).map(([category, data]) => (
                      <div key={category} className="assessment-results__category-score-item">
                        <span className="assessment-results__category-score-label">
                          {formatCategoryName(category)}:
                        </span>
                        <span className={`assessment-results__category-score-value ${getScoreStatusClass(data.score)}`}>
                          {data.score}%
                        </span>
                      </div>
                    ))}
                  </td>
                  <td>{formatDate(student.completedAt)}</td>
                  <td>
                    <a href={`/admin/assessment-results/${student._id}`} className="assessment-results__view-details-btn">
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="assessment-results__empty-state">
          <AlertTriangle size={48} />
          <h3>No Results Found</h3>
          <p>No assessment results match your current filters. Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Information Section */}
      <div className="assessment-results__info-section">
        <div className="assessment-results__info-card">
          <div className="assessment-results__info-icon">
            <Info size={24} />
          </div>
          <div className="assessment-results__info-content">
            <h3>About Post-Assessment Results</h3>
            <p>
              The post-assessment evaluates students across five key reading categories based on DEPED CRLA standards. 
              Students need to score at least 75% in each category to be considered proficient. 
              Overall reading level is determined by a combination of scores across all categories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResultsOverview;