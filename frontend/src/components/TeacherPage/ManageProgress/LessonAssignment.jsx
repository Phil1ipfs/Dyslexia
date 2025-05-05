import React, { useState, useEffect } from 'react';
import { 
  FaBook, 
  FaClipboardCheck, 
  FaInfoCircle, 
  FaCheck, 
  FaSearch,
  FaClock, 
  FaTag, 
  FaChartLine, 
  FaLock,
  FaStar
} from 'react-icons/fa';
import '../ManageProgress/css/LessonAssignment.css'; 

const LessonAssignment = ({ 
  lessons, 
  selectedLessons, 
  onLessonSelect, 
  onAssign, 
  assignmentSuccess 
}) => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [lessonsByLevel, setLessonsByLevel] = useState({});
  
  // Extract unique categories and levels for filter dropdowns
  const categories = ['all', ...new Set(lessons.map(lesson => lesson.category))];
  const levels = ['all', ...new Set(lessons.map(lesson => lesson.level))];

  // Apply filters whenever filter values change
  useEffect(() => {
    // Filter lessons based on search query and selected filters
    const filtered = lessons.filter(lesson => {
      const matchesSearch = 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || lesson.category === categoryFilter;
      const matchesLevel = levelFilter === 'all' || lesson.level === levelFilter;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
    
    setFilteredLessons(filtered);
    
    // Group filtered lessons by level
    const groupedLessons = {};
    filtered.forEach(lesson => {
      const level = lesson.level || 'Other';
      if (!groupedLessons[level]) {
        groupedLessons[level] = [];
      }
      groupedLessons[level].push(lesson);
    });
    
    setLessonsByLevel(groupedLessons);
  }, [searchQuery, categoryFilter, levelFilter, lessons]);

  // Check if a lesson is selected
  const isLessonSelected = (lessonId) => {
    return selectedLessons.some(l => l.id === lessonId);
  };

  // Helper functions for displaying labels and classes
  const getLevelLabel = (level) => {
    switch(level) {
      case 'Antas 1': return 'Antas 1: Nag-uumpisang Matuto';
      case 'Antas 2': return 'Antas 2: Pa-unlad na Nag-aaral';
      case 'Antas 3': return 'Antas 3: Sanay na Mag-aaral';
      case 'Antas 4': return 'Antas 4: Maalam na Mag-aaral';
      case 'Antas 5': return 'Antas 5: Mahusay na Mag-aaral';
      default: return level;
    }
  };

  const getCategoryClass = (category) => {
    switch(category) {
      case 'Patinig': return 'literexia-patinig';
      case 'Pantig': return 'literexia-pantig';
      case 'Pagkilala ng Salita': return 'literexia-salita';
      case 'Pag-unawa sa Binasa': return 'literexia-pag-unawa';
      default: return '';
    }
  };

  // Generate difficulty badge based on lesson difficulty
  const getDifficultyBadge = (difficulty) => {
    if (!difficulty) return null;
    
    const difficultyClass = 
      difficulty === 'Madali' ? 'literexia-easy' :
      difficulty === 'Katamtaman' ? 'literexia-medium' :
      'literexia-hard';
    
    return (
      <span className={`literexia-difficulty-badge ${difficultyClass}`}>
        {difficulty}
      </span>
    );
  };

  // Empty state if there are no lessons available
  if (lessons.length === 0) {
    return (
      <div className="literexia-empty-state">
        <FaInfoCircle className="literexia-empty-icon" />
        <h3>Walang Available na Aralin</h3>
        <p>Walang available na aralin para sa mag-aaral na ito sa ngayon.</p>
      </div>
    );
  }

  return (
    <div className="literexia-lesson-container">
      {/* Success notification */}
      {assignmentSuccess && (
        <div className="literexia-success-alert">
          <FaCheck /> 
          Matagumpay na naitalaga ang mga napiling aralin para sa mag-aaral!
        </div>
      )}

      {/* Filters section */}
      <div className="literexia-lesson-filters">
      <div className="literexia-search-container">

        <div className="literexia-search-wrapper">
          <FaSearch className="literexia-search-icon" />
          <input
            type="text"
            className="literexia-search-input"
            placeholder="Maghanap ng aralin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        </div>
        <div className="literexia-filter-controls">
          <div className="literexia-filter-group">
            <label htmlFor="category-filter">Kategorya:</label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="literexia-filter-select"
            >
              <option value="all">Lahat ng Kategorya</option>
              {categories.filter(cat => cat !== 'all').map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="literexia-filter-group">
            <label htmlFor="level-filter">Antas:</label>
            <select
              id="level-filter"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="literexia-filter-select"
            >
              <option value="all">Lahat ng Antas</option>
              {levels.filter(lvl => lvl !== 'all').map((level, index) => (
                <option key={index} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected lessons summary */}
      <div className="literexia-selected-summary">
        <div className="literexia-selected-count">
          <strong>{selectedLessons.length}</strong> (na) aralin ang napili
        </div>
        <button
          className="literexia-assign-btn"
          onClick={onAssign}
          disabled={selectedLessons.length === 0}
        >
          <FaClipboardCheck /> Italaga ang mga Napiling Aralin
        </button>
      </div>

      {/* Lessons display by level */}
      {Object.keys(lessonsByLevel).length === 0 ? (
        <div className="literexia-empty-results">
          <FaInfoCircle className="literexia-empty-icon" />
          <p>Walang aralin na nahanap na tumutugma sa iyong paghahanap. Subukang ayusin ang mga filter.</p>
        </div>
      ) : (
        Object.keys(lessonsByLevel).sort().map(level => (
          <div key={level} className="literexia-level-section">
            <h3 className="literexia-level-title">{getLevelLabel(level)}</h3>
            <div className="literexia-lessons-grid">
              {lessonsByLevel[level].map(lesson => (
                <div
                  key={lesson.id}
                  className={`literexia-lesson-card ${isLessonSelected(lesson.id) ? 'literexia-selected' : ''} ${lesson.assigned ? 'literexia-assigned' : ''}`}
                  onClick={() => !lesson.assigned && onLessonSelect(lesson)}
                >
                  {/* Recommended badge */}
                  {lesson.isRecommended && (
                    <div className="literexia-recommended-badge">
                      <FaStar style={{ marginRight: '4px' }} /> Inirerekomenda
                    </div>
                  )}
                  
                  {/* Selection indicator */}
                  <div className="literexia-selection-indicator">
                    {isLessonSelected(lesson.id) ? <FaCheck /> : <span className="literexia-empty-check"></span>}
                  </div>
                  
                  {/* Lesson header */}
                  <div className="literexia-lesson-header">
                    <h4 className="literexia-lesson-title">{lesson.title}</h4>
                    <div className={`literexia-category-badge ${getCategoryClass(lesson.category)}`}>
                      {lesson.category}
                    </div>
                  </div>
                  
                  {/* Lesson metadata */}
                  <div className="literexia-lesson-meta">
                    <div className="literexia-meta-item">
                      <FaChartLine className="literexia-meta-icon" />
                      <span className="literexia-meta-text">{lesson.level}</span>
                    </div>
                    {lesson.duration && (
                      <div className="literexia-meta-item">
                        <FaClock className="literexia-meta-icon" />
                        <span className="literexia-meta-text">{lesson.duration} min</span>
                      </div>
                    )}
                    {lesson.difficulty && (
                      <div className="literexia-meta-item">
                        {getDifficultyBadge(lesson.difficulty)}
                      </div>
                    )}
                  </div>
                  
                  {/* Lesson description */}
                  <div className="literexia-lesson-description">
                    <p>{lesson.description}</p>
                  </div>
                  
                  {/* Assigned badge */}
                  {lesson.assigned && (
                    <div className="literexia-assigned-badge">
                      <FaLock /> Nakatalaga Na
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default LessonAssignment;