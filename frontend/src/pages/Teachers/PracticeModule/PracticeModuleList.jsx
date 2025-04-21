import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faFilter,
  faLayerGroup,
  faChartLine,
  faUserGraduate,
  faCalendarAlt,
  faEye,
  faEdit,
  faTrash,
  faExclamationTriangle,
  faCheck,
  faBook,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import './PracticeModuleList.css';

const PracticeModuleList = () => {
  // State
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  
  // Reading levels and categories for filters
  const readingLevels = [
    'All',
    'Antas Una',
    'Antas Dalawa',
    'Antas Tatlo',
    'Antas Apat',
    'Antas Lima'
  ];
  
  const categories = [
    'All',
    'Pagtukoy ng Tunog',
    'Pag-uugnay ng Tunog at Letra',
    'Pagbasa ng Pantig',
    'Pagbasa ng Salita',
    'Pag-unawa sa Salita',
    'Ponetiko',
    'Pagpili ng Tamang Salita',
    'Pantig',
    'Pagsusuri ng Pantig',
    'Pangungusap',
    'Talasalitaan'
  ];
  
  // Load practice modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        
        // Get modules from localStorage (for demo)
        const storedModules = JSON.parse(localStorage.getItem('practiceModules') || '[]');
        
        // If no stored modules, create mock data
        if (storedModules.length === 0) {
          const mockModules = [
            {
              id: 1,
              title: 'Practice: Pagbasa ng Mga Hayop',
              description: 'Practice module for students struggling with animal names',
              targetLevel: 'Antas Dalawa',
              targetCategory: 'Pagbasa ng Salita',
              originalActivityId: 3,
              createdAt: '2025-04-15T10:30:00Z',
              status: 'active',
              createdBy: {
                id: 1,
                name: 'Teacher Maria'
              },
              assignments: [
                {
                  id: 1,
                  studentId: 101,
                  studentName: 'Juan Dela Cruz',
                  status: 'completed',
                  score: 8,
                  totalQuestions: 10,
                  completedAt: '2025-04-16T14:20:00Z'
                },
                {
                  id: 2,
                  studentId: 102,
                  studentName: 'Maria Santos',
                  status: 'in-progress',
                  score: null,
                  totalQuestions: 10,
                  completedAt: null
                }
              ],
              levels: [
                {
                  id: 1,
                  levelName: 'Practice Level 1',
                  contentType: 'image',
                  questions: [
                    {
                      id: 1,
                      questionText: 'Ano ang hayop na ito?',
                      contentType: 'image',
                      options: ['Aso', 'Pusa', 'Ibon', 'Daga'],
                      correctAnswer: 0
                    }
                  ]
                }
              ]
            },
            {
              id: 2,
              title: 'Practice: Pagkilala sa mga Tunog',
              description: 'Practice for students struggling with sound recognition',
              targetLevel: 'Antas Una',
              targetCategory: 'Pagtukoy ng Tunog',
              originalActivityId: 2,
              createdAt: '2025-04-10T09:15:00Z',
              status: 'active',
              createdBy: {
                id: 1,
                name: 'Teacher Maria'
              },
              assignments: [
                {
                  id: 3,
                  studentId: 103,
                  studentName: 'Pedro Reyes',
                  status: 'assigned',
                  score: null,
                  totalQuestions: 8,
                  completedAt: null
                }
              ],
              levels: [
                {
                  id: 1,
                  levelName: 'Practice Level 1',
                  contentType: 'audio',
                  questions: [
                    {
                      id: 1,
                      questionText: 'Anong tunog ito?',
                      contentType: 'audio',
                      options: ['A', 'E', 'I', 'O'],
                      correctAnswer: 0
                    }
                  ]
                }
              ]
            }
          ];
          
          localStorage.setItem('practiceModules', JSON.stringify(mockModules));
          setModules(mockModules);
        } else {
          setModules(storedModules);
        }
      } catch (error) {
        console.error('Error loading practice modules:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModules();
  }, []);
  
  // Filter modules based on search and filters
  const filteredModules = modules.filter(module => {
    // Search query filter
    if (searchQuery && !module.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Level filter
    if (levelFilter !== 'All' && module.targetLevel !== levelFilter) {
      return false;
    }
    
    // Category filter
    if (categoryFilter !== 'All' && module.targetCategory !== categoryFilter) {
      return false;
    }
    
    return true;
  });
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentModules = filteredModules.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (module) => {
    setModuleToDelete(module);
    setDeleteModalOpen(true);
  };
  
  // Delete practice module
  const handleDeleteModule = () => {
    if (!moduleToDelete) return;
    
    const updatedModules = modules.filter(module => module.id !== moduleToDelete.id);
    setModules(updatedModules);
    localStorage.setItem('practiceModules', JSON.stringify(updatedModules));
    
    setDeleteModalOpen(false);
    setModuleToDelete(null);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setLevelFilter('All');
    setCategoryFilter('All');
    setCurrentPage(1);
  };
  
  // Toggle mobile filters display
  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };
  
  return (
    <div className="practice-modules-page">
      <header className="practice-modules-header">
        <div className="header-left">
          <h1>
            <FontAwesomeIcon icon={faBook} className="header-icon" />
            Practice Modules
          </h1>
          <p className="page-subtitle">Create and manage targeted practice for struggling students</p>
        </div>
        <Link to="/teacher/create-practice-module" className="add-module-btn">
          <FontAwesomeIcon icon={faPlus} /> New Practice Module
        </Link>
      </header>
      
      <div className="practice-modules-container">
        {/* Mobile filter toggle button */}
        <button 
          className="mobile-filters-toggle" 
          onClick={toggleMobileFilters}
        >
          <FontAwesomeIcon icon={faFilter} /> Filter Modules
        </button>
        
        {/* Filters Panel */}
        <div className={`filters-panel ${showMobileFilters ? 'mobile-visible' : ''}`}>
          <div className="filters-header">
            <h3>
              <FontAwesomeIcon icon={faFilter} /> Filters
            </h3>
            <button 
              className="close-mobile-btn"
              onClick={() => setShowMobileFilters(false)}
            >
              &times;
            </button>
          </div>
          
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search practice modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Antas (Level)</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              {readingLevels.map((level, index) => (
                <option key={index} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear All Filters
          </button>
        </div>
        
        {/* Main Content */}
        <div className="content-area">
          {/* Loading State */}
          {loading ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
              <p>Loading practice modules...</p>
            </div>
          ) : currentModules.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faBook} size="3x" className="empty-icon" />
              <h3>No Practice Modules Found</h3>
              <p>
                {searchQuery || levelFilter !== 'All' || categoryFilter !== 'All'
                  ? 'No practice modules match your current filters.'
                  : 'You haven\'t created any practice modules yet.'}
              </p>
              {(searchQuery || levelFilter !== 'All' || categoryFilter !== 'All') && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
              <Link to="/teacher/create-practice-module" className="create-new-btn">
                Create New Practice Module
              </Link>
            </div>
          ) : (
            <>
              <div className="modules-count">
                Showing {currentModules.length} of {filteredModules.length} practice modules
              </div>
              
              <div className="modules-grid">
                {currentModules.map(module => (
                  <div key={module.id} className="practice-module-card">
                    <div className="module-header">
                      <h3 className="module-title">{module.title}</h3>
                      <div className="module-meta">
                        <span className="module-level">
                          <FontAwesomeIcon icon={faLayerGroup} /> {module.targetLevel}
                        </span>
                        <span className="module-category">
                          <FontAwesomeIcon icon={faBook} /> {module.targetCategory}
                        </span>
                      </div>
                    </div>
                    
                    <div className="module-body">
                      <p className="module-description">{module.description}</p>
                      
                      <div className="module-stats">
                        <div className="stat-item">
                          <div className="stat-icon">
                            <FontAwesomeIcon icon={faUserGraduate} />
                          </div>
                          <div className="stat-details">
                            <div className="stat-label">Assigned To</div>
                            <div className="stat-value">{module.assignments?.length || 0} students</div>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon">
                            <FontAwesomeIcon icon={faChartLine} />
                          </div>
                          <div className="stat-details">
                            <div className="stat-label">Completion</div>
                            <div className="stat-value">
                              {module.assignments?.filter(a => a.status === 'completed').length || 0} / {module.assignments?.length || 0}
                            </div>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                          </div>
                          <div className="stat-details">
                            <div className="stat-label">Created</div>
                            <div className="stat-value">{formatDate(module.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {module.assignments && module.assignments.length > 0 && (
                        <div className="assignments-preview">
                          <h4>Student Assignments</h4>
                          <div className="assignments-list">
                            {module.assignments.slice(0, 2).map(assignment => (
                              <div key={assignment.id} className="assignment-item">
                                <div className="student-name">{assignment.studentName}</div>
                                <div className={`assignment-status ${assignment.status}`}>
                                  {assignment.status === 'completed' && (
                                    <>
                                      <FontAwesomeIcon icon={faCheck} />
                                      {`${assignment.score}/${assignment.totalQuestions}`}
                                    </>
                                  )}
                                  {assignment.status === 'in-progress' && 'In Progress'}
                                  {assignment.status === 'assigned' && 'Assigned'}
                                </div>
                              </div>
                            ))}
                            {module.assignments.length > 2 && (
                              <div className="more-assignments">
                                +{module.assignments.length - 2} more students
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="module-actions">
                      <Link to={`/teacher/preview-practice-module/${module.id}`} className="preview-btn">
                        <FontAwesomeIcon icon={faEye} /> Preview
                      </Link>
                      <Link to={`/teacher/edit-practice-module/${module.id}`} className="edit-btn">
                        <FontAwesomeIcon icon={faEdit} /> Edit
                      </Link>
                      <button className="delete-btn" onClick={() => openDeleteModal(module)}>
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-arrow"
                    onClick={() => setCurrentPage(prevPage => Math.max(prevPage - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    &lt; Prev
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? 'active' : ''}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    className="pagination-arrow"
                    onClick={() => setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && moduleToDelete && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>
              <FontAwesomeIcon icon={faExclamationTriangle} /> Delete Practice Module
            </h3>
            <p>Are you sure you want to delete <strong>{moduleToDelete.title}</strong>?</p>
            <p>This will remove all associated student assignments and cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
              <button className="delete-confirm-btn" onClick={handleDeleteModule}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeModuleList;