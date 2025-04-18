// src/pages/Admin/SubmissionOverviewPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAllSubmissions, 
  fetchSubmissionStats, 
  filterSubmissions 
} from '../../services/submissionService';
import './SubmissionOverviewPage.css';

/**
 * Submission Overview Page Component
 * Displays a dashboard of submissions with filtering capability
 */
const SubmissionOverviewPage = () => {
  // States for filters and data
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    needsIntervention: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial submissions and stats
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [submissionsData, statsData] = await Promise.all([
          fetchAllSubmissions(),
          fetchSubmissionStats()
        ]);
        
        setSubmissions(submissionsData);
        setFilteredSubmissions(submissionsData);
        setStats(statsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load submissions data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Apply filters when they change
  const applyFilters = useCallback(async () => {
    try {
      setLoading(true);
      const filtered = await filterSubmissions(
        searchTerm, 
        timeFilter, 
        gradeFilter, 
        statusFilter
      );
      setFilteredSubmissions(filtered);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError('Failed to filter submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, timeFilter, gradeFilter, statusFilter]);

  // Call applyFilters when filter states change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Toggle dropdown visibility
  const toggleDropdown = (dropdown, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    
    if (dropdown === 'time') {
      setIsTimeDropdownOpen(!isTimeDropdownOpen);
      setIsGradeDropdownOpen(false);
      setIsStatusDropdownOpen(false);
    } else if (dropdown === 'grade') {
      setIsGradeDropdownOpen(!isGradeDropdownOpen);
      setIsTimeDropdownOpen(false);
      setIsStatusDropdownOpen(false);
    } else if (dropdown === 'status') {
      setIsStatusDropdownOpen(!isStatusDropdownOpen);
      setIsTimeDropdownOpen(false);
      setIsGradeDropdownOpen(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsTimeDropdownOpen(false);
      setIsGradeDropdownOpen(false);
      setIsStatusDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Set filter and close dropdown
  const setFilterAndClose = (setter, value, dropdown) => {
    setter(value);
    
    if (dropdown === 'time') {
      setIsTimeDropdownOpen(false);
    } else if (dropdown === 'grade') {
      setIsGradeDropdownOpen(false);
    } else if (dropdown === 'status') {
      setIsStatusDropdownOpen(false);
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'submission-status-completed';
      case 'Pending':
        return 'submission-status-pending';
      case 'Needs Intervention':
        return 'submission-status-intervention';
      case 'In Progress':
        return 'submission-status-progress';
      default:
        return '';
    }
  };

  // Show loading state
  if (loading && submissions.length === 0) {
    return (
      <div className="submission-page">
        <h1 className="submission-page-title">Submission Overview</h1>
        <div className="submission-loading-state">Loading submissions data...</div>
      </div>
    );
  }

  // Show error state
  if (error && submissions.length === 0) {
    return (
      <div className="submission-page">
        <h1 className="submission-page-title">Submission Overview</h1>
        <div className="submission-error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="submission-page">
      <h1 className="submission-page-title">Submission Overview</h1>
      
      <div className="submission-filters-row">
        <div className="submission-search-container">
          <input
            type="text"
            placeholder="Search by Activity"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="submission-search-input"
          />
        </div>
        
        <div className="submission-filter-dropdowns">
          {/* Time Filter */}
          <div className="submission-filter-dropdown">
            <button 
              className="submission-filter-button"
              onClick={(e) => toggleDropdown('time', e)}
            >
              {timeFilter}
              <span className="submission-dropdown-arrow">▼</span>
            </button>
            {isTimeDropdownOpen && (
              <div className="submission-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="submission-dropdown-group">
                  <div 
                    className={`submission-dropdown-item ${timeFilter === 'All Time' ? 'active' : ''}`} 
                    onClick={() => setFilterAndClose(setTimeFilter, 'All Time', 'time')}
                  >
                    All Time
                  </div>
                  <div 
                    className={`submission-dropdown-item ${timeFilter === 'This Week' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setTimeFilter, 'This Week', 'time')}
                  >
                    This Week
                  </div>
                  <div 
                    className={`submission-dropdown-item ${timeFilter === 'This Month' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setTimeFilter, 'This Month', 'time')}
                  >
                    This Month
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Grade Filter */}
          <div className="submission-filter-dropdown">
            <button 
              className="submission-filter-button"
              onClick={(e) => toggleDropdown('grade', e)}
            >
              {gradeFilter}
              <span className="submission-dropdown-arrow">▼</span>
            </button>
            {isGradeDropdownOpen && (
              <div className="submission-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="submission-dropdown-group">
                  <div 
                    className={`submission-dropdown-item ${gradeFilter === 'All Grades' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setGradeFilter, 'All Grades', 'grade')}
                  >
                    All Grades
                  </div>
                  <div 
                    className={`submission-dropdown-item ${gradeFilter === 'Grade 1' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setGradeFilter, 'Grade 1', 'grade')}
                  >
                    Grade 1
                  </div>
                  <div 
                    className={`submission-dropdown-item ${gradeFilter === 'Grade 2' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setGradeFilter, 'Grade 2', 'grade')}
                  >
                    Grade 2
                  </div>
                  <div 
                    className={`submission-dropdown-item ${gradeFilter === 'Grade 3' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setGradeFilter, 'Grade 3', 'grade')}
                  >
                    Grade 3
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="submission-filter-dropdown">
            <button 
              className="submission-filter-button"
              onClick={(e) => toggleDropdown('status', e)}
            >
              {statusFilter}
              <span className="submission-dropdown-arrow">▼</span>
            </button>
            {isStatusDropdownOpen && (
              <div className="submission-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="submission-dropdown-group">
                  <div 
                    className={`submission-dropdown-item ${statusFilter === 'All Statuses' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setStatusFilter, 'All Statuses', 'status')}
                  >
                    All Statuses
                  </div>
                  <div 
                    className={`submission-dropdown-item ${statusFilter === 'Completed' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setStatusFilter, 'Completed', 'status')}
                  >
                    Completed
                  </div>
                  <div 
                    className={`submission-dropdown-item ${statusFilter === 'Needs Intervention' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setStatusFilter, 'Needs Intervention', 'status')}
                  >
                    Needs Intervention
                  </div>
                  <div 
                    className={`submission-dropdown-item ${statusFilter === 'In Progress' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setStatusFilter, 'In Progress', 'status')}
                  >
                    In Progress
                  </div>
                  <div 
                    className={`submission-dropdown-item ${statusFilter === 'Pending' ? 'active' : ''}`}
                    onClick={() => setFilterAndClose(setStatusFilter, 'Pending', 'status')}
                  >
                    Pending
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="submission-stats-cards">
        <div className="submission-stat-card">
          <div className="submission-stat-label">Total Submissions</div>
          <div className="submission-stat-value">{stats.total}</div>
        </div>
        
        <div className="submission-stat-card completed">
          <div className="submission-stat-label">Completed</div>
          <div className="submission-stat-value">{stats.completed}</div>
        </div>
        
        <div className="submission-stat-card intervention">
          <div className="submission-stat-label">Needs Intervention</div>
          <div className="submission-stat-value">{stats.needsIntervention}</div>
        </div>
        
        <div className="submission-stat-card pending">
          <div className="submission-stat-label">Pending</div>
          <div className="submission-stat-value">{stats.pending}</div>
        </div>
      </div>
      
      <div className="submission-table">
        <div className="submission-table-header">
          <div className="submission-th submission-teacher-name">Submission Details</div>
          <div className="submission-th topic">Topic</div>
          <div className="submission-th submitted">Submitted</div>
          <div className="submission-th status">Status</div>
        </div>
        
        <div className="submission-table-body">
          {loading && filteredSubmissions.length > 0 && (
            <div className="submission-loading-overlay">
              <div className="submission-loading-spinner">Updating results...</div>
            </div>
          )}
          
          {filteredSubmissions.map((submission) => (
            <div className="submission-table-row" key={submission.id}>
              <div className="submission-td submission-teacher-name">
                <div>{submission.teacherName}</div>
                <div className="submission-details">
                  {submission.topic}<br />
                  Time spent: {submission.timeSpent} | 
                  Attempts: {submission.attempts}
                </div>
              </div>
              <div className="submission-td topic">{submission.topic}</div>
              <div className="submission-td submitted">{submission.submitted}</div>
              <div className="submission-td status">
                <span className={`submission-status-badge ${getStatusClass(submission.status)}`}>
                  {submission.status}
                </span>
              </div>
            </div>
          ))}
          
          {filteredSubmissions.length === 0 && !loading && (
            <div className="submission-no-results">
              No submissions found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionOverviewPage;