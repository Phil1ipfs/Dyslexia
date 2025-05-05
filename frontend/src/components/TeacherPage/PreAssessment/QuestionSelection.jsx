import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faCheckCircle,
  faCheck,
  faImage,
  faFileAlt,
  faHeadphones,
  faChevronUp,
  faChevronDown,
  faFilter,
  faSearch,
  faSync
} from '@fortawesome/free-solid-svg-icons';

const QuestionSelectionPanel = ({ 
  activity, 
  onSelectQuestion, 
  isQuestionSelected,
  selectedQuestionsCount 
}) => {
  const [expandedLevels, setExpandedLevels] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toggle level expansion
  const toggleLevel = (levelId) => {
    setExpandedLevels(prev => ({
      ...prev,
      [levelId]: !prev[levelId]
    }));
  };
  
  // Initialize all levels as expanded by default
  if (activity.levels && activity.levels.length > 0) {
    activity.levels.forEach(level => {
      if (expandedLevels[level.id] === undefined) {
        expandedLevels[level.id] = true;
      }
    });
  }
  
  // Filter questions by type and search query
  const filterQuestions = (questions) => {
    return questions.filter(question => {
      // Type filter
      if (filterType !== 'all' && question.contentType !== filterType) {
        return false;
      }
      
      // Search filter
      if (searchQuery && !question.questionText.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  return (
    <div className="pre-assess-question-selection">
      <div className="pre-assess-selection-header">
        <div className="pre-assess-selection-title">
          <span className="pre-assess-title-text">Select Questions</span>
          <div className="pre-assess-selection-count">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>{selectedQuestionsCount || 0} selected</span>
          </div>
        </div>
        
        <div className="pre-assess-selection-filters">
          <div className="pre-assess-filter-row">
            <div className="pre-assess-filter-group">
              <label>Filter by Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pre-assess-filter-select"
              >
                <option value="all">All Types</option>
                <option value="text">Text Only</option>
                <option value="image">Image Based</option>
                <option value="audio">Audio Based</option>
              </select>
            </div>
            
            <div className="pre-assess-filter-group">
              <label>Search:</label>
              <div className="pre-assess-search-input">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="pre-assess-filter-input"
                />
                <FontAwesomeIcon icon={faSearch} className="pre-assess-search-icon" />
              </div>
            </div>
            
            {(filterType !== 'all' || searchQuery) && (
              <button
                type="button"
                className="pre-assess-reset-filters"
                onClick={() => {
                  setFilterType('all');
                  setSearchQuery('');
                }}
              >
                <FontAwesomeIcon icon={faSync} /> Reset
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="pre-assess-levels-selection">
        {activity.levels && activity.levels.map(level => {
          const filteredQuestions = filterQuestions(level.questions || []);
          
          // Count selected questions in this level
          const levelSelectedCount = (level.questions || []).filter(q => 
            isQuestionSelected(activity.id, level.id, q.id)
          ).length;
          
          return (
            <div key={level.id} className="pre-assess-level-selection-group">
              <div 
                className="pre-assess-level-header-selection"
                onClick={() => toggleLevel(level.id)}
              >
                <div className="pre-assess-level-info">
                  <span className="pre-assess-level-name">
                    {level.levelName || `Level ${level.id}`}
                  </span>
                  
                  <div className="pre-assess-level-meta">
                    <span className="pre-assess-level-count">
                      {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
                    </span>
                    
                    {levelSelectedCount > 0 && (
                      <span className="pre-assess-level-selected">
                        {levelSelectedCount} selected
                      </span>
                    )}
                  </div>
                </div>
                
                <FontAwesomeIcon 
                  icon={expandedLevels[level.id] ? faChevronUp : faChevronDown} 
                  className="pre-assess-level-toggle"
                />
              </div>
              
              {expandedLevels[level.id] && (
                <div className="pre-assess-question-list-selection">
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question, index) => (
                      <div 
                        key={question.id || index}
                        className={`pre-assess-question-selection-item ${
                          isQuestionSelected(activity.id, level.id, question.id) ? 
                            'pre-assess-selected' : ''
                        }`}
                        onClick={() => onSelectQuestion(activity.id, level.id, question.id)}
                      >
                        <div className="pre-assess-question-selection-main">
                          <div className="pre-assess-question-selection-content">
                            <div className="pre-assess-question-type">
                              <FontAwesomeIcon icon={
                                question.contentType === 'text' ? faFileAlt :
                                  question.contentType === 'image' ? faImage :
                                    faHeadphones
                              } />
                              <span>{question.contentType}</span>
                            </div>
                            
                            <div className="pre-assess-question-text-selection">
                              {question.questionText}
                            </div>
                          </div>
                          
                          <div className="pre-assess-question-checkbox">
                            {isQuestionSelected(activity.id, level.id, question.id) ? (
                              <div className="pre-assess-checked">
                                <FontAwesomeIcon icon={faCheck} />
                              </div>
                            ) : (
                              <div className="pre-assess-unchecked"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="pre-assess-question-preview">
                          <div className="pre-assess-options-preview">
                            <div className="pre-assess-options-count">
                              {question.options?.length || 0} options
                            </div>
                            
                            <div className="pre-assess-correct-option-preview">
                              Correct: <span>{
                                question.options && 
                                question.options[question.correctAnswer] || 'Not specified'
                              }</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pre-assess-no-questions-found">
                      <p>No questions match the current filters.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionSelectionPanel;