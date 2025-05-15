// src/components/Admin/Submissions/SubmissionsOverview.jsx
import React, { useState, useEffect } from 'react';
import '../../css/Admin/Dashboard/SubmissionsOverview.css';
import { 
  FileCheck, 
  XCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  AlertCircle,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';

// Temporary mock service until MongoDB implementation
const mockSubmissionsService = {
  async getSubmissions(filter = '') {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const submissions = [
      {
        id: 'SUB001',
        studentName: 'Maria Santos',
        studentId: 'ST001',
        grade: 'Grade 1',
        section: 'Sampaguita',
        activityTitle: 'Mga Uri ng Pangungusap',
        activityType: 'Worksheet',
        submissionDate: new Date('2024-11-17T10:30:00'),
        dueDate: new Date('2024-11-18T23:59:00'),
        status: 'pending',
        score: null,
        totalPoints: 20,
        teacherComments: '',
        attachments: 2,
        timeSpent: '15 mins'
      },
      {
        id: 'SUB002',
        studentName: 'Juan dela Cruz',
        studentId: 'ST002',
        grade: 'Grade 1',
        section: 'Sampaguita',
        activityTitle: 'Salitang Naglalarawan',
        activityType: 'Quiz',
        submissionDate: new Date('2024-11-16T14:15:00'),
        dueDate: new Date('2024-11-17T23:59:00'),
        status: 'graded',
        score: 18,
        totalPoints: 20,
        teacherComments: 'Mahusay! Pero tandaan ang tamang pagbigkas ng "mayaman".',
        attachments: 1,
        timeSpent: '12 mins'
      },
      {
        id: 'SUB003',
        studentName: 'Anna Reyes',
        studentId: 'ST003',
        grade: 'Grade 1',
        section: 'Rosal',
        activityTitle: 'Pangngalan',
        activityType: 'Assignment',
        submissionDate: new Date('2024-11-16T09:45:00'),
        dueDate: new Date('2024-11-16T23:59:00'),
        status: 'pending',
        score: null,
        totalPoints: 15,
        teacherComments: '',
        attachments: 3,
        timeSpent: '18 mins'
      },
      {
        id: 'SUB004',
        studentName: 'Pedro Gomez',
        studentId: 'ST004',
        grade: 'Grade 1',
        section: 'Orchid',
        activityTitle: 'Pandiwa',
        activityType: 'Practice',
        submissionDate: new Date('2024-11-15T16:20:00'),
        dueDate: new Date('2024-11-16T23:59:00'),
        status: 'graded',
        score: 12,
        totalPoints: 15,
        teacherComments: 'Kailangan ng karagdagang pagsasanay sa mga aspekto ng pandiwa.',
        attachments: 1,
        timeSpent: '22 mins'
      },
      {
        id: 'SUB005',
        studentName: 'Sofia Lim',
        studentId: 'ST005',
        grade: 'Grade 1',
        section: 'Sampaguita',
        activityTitle: 'Sanhi at Bunga',
        activityType: 'Interactive',
        submissionDate: new Date('2024-11-15T11:00:00'),
        dueDate: new Date('2024-11-15T23:59:00'),
        status: 'graded',
        score: 20,
        totalPoints: 20,
        teacherComments: 'Napakagaling! Perfect score sa pagkilala ng sanhi at bunga.',
        attachments: 0,
        timeSpent: '25 mins'
      },
      {
        id: 'SUB006',
        studentName: 'Miguel Torres',
        studentId: 'ST006',
        grade: 'Grade 1',
        section: 'Rosal',
        activityTitle: 'Mga Uri ng Pangungusap',
        activityType: 'Worksheet',
        submissionDate: new Date('2024-11-14T15:30:00'),
        dueDate: new Date('2024-11-14T23:59:00'),
        status: 'flagged',
        score: null,
        totalPoints: 20,
        teacherComments: '',
        attachments: 1,
        timeSpent: '8 mins',
        flagReason: 'Possible copying detected'
      }
    ];
    
    return submissions.filter(submission => 
      submission.studentName.toLowerCase().includes(filter.toLowerCase()) ||
      submission.activityTitle.toLowerCase().includes(filter.toLowerCase()) ||
      submission.section.toLowerCase().includes(filter.toLowerCase())
    );
  },
  
  async getSubmissionStats() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      total: 6,
      pending: 2,
      graded: 3,
      flagged: 1,
      averageScore: 83,
      averageCompletionTime: '17 mins',
      submissionsToday: 2,
      upcomingDeadlines: 3
    };
  }
};

const SubmissionsOverview = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submissionDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Selected submission for detailed view
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [submissions, searchQuery, statusFilter, activityTypeFilter, sortBy, sortOrder]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsData, statsData] = await Promise.all([
        mockSubmissionsService.getSubmissions(),
        mockSubmissionsService.getSubmissionStats()
      ]);
      setSubmissions(submissionsData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load submissions data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...submissions];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(submission =>
        submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.section.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }
    
    // Apply activity type filter
    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(submission => submission.activityType === activityTypeFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'submissionDate' || sortBy === 'dueDate') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredSubmissions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="status-icon status-pending" />;
      case 'graded':
        return <CheckCircle className="status-icon status-graded" />;
      case 'flagged':
        return <AlertCircle className="status-icon status-flagged" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge status-pending">Pending</span>;
      case 'graded':
        return <span className="status-badge status-graded">Graded</span>;
      case 'flagged':
        return <span className="status-badge status-flagged">Flagged</span>;
      default:
        return null;
    }
  };
  
  const formatDate = (date) => {
    const now = new Date();
    const submissionDate = new Date(date);
    const diffTime = Math.abs(now - submissionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return submissionDate.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };
  
  const isOverdue = (dueDate, status) => {
    if (status === 'graded' || status === 'flagged') return false;
    return new Date() > new Date(dueDate);
  };
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(startIndex, endIndex);
  
  if (loading) {
    return (
      <div className="submissions-overview">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="submissions-overview">
        <div className="error-container">
          <XCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="submissions-overview">
      {/* Header */}
      <div className="submissions-header">
        <div className="header-content">
          <h1>Submissions Overview</h1>
          <p className="header-subtitle">Grade 1 - Antas 1 & 2 Activities</p>
        </div>
        <div className="header-actions">
          <button className="export-button">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>
      
      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6' }}>
            <FileCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Submissions</h3>
            <span className="stat-value">{stats?.total || 0}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Pending Review</h3>
            <span className="stat-value">{stats?.pending || 0}</span>
            <span className="stat-trend">High Priority</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Graded</h3>
            <span className="stat-value">{stats?.graded || 0}</span>
            <span className="stat-trend">Avg: {stats?.averageScore || 0}%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Flagged</h3>
            <span className="stat-value">{stats?.flagged || 0}</span>
            <span className="stat-trend">Need Review</span>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="filters-container">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name, activity, or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="graded">Graded</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Activity Type</label>
            <select 
              value={activityTypeFilter} 
              onChange={(e) => setActivityTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="Worksheet">Worksheet</option>
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
              <option value="Practice">Practice</option>
              <option value="Interactive">Interactive</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="submissionDate">Submission Date</option>
              <option value="dueDate">Due Date</option>
              <option value="studentName">Student Name</option>
              <option value="activityTitle">Activity Title</option>
              <option value="score">Score</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Order</label>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="filter-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Submissions Table */}
      <div className="submissions-table-container">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Activity</th>
              <th>Type</th>
              <th>Section</th>
              <th>Submitted</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Score</th>
              <th>Time Spent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSubmissions.map((submission) => (
              <tr key={submission.id} className="submission-row">
                <td className="student-cell">
                  <div className="student-info">
                    <span className="student-name">{submission.studentName}</span>
                    <span className="student-id">{submission.studentId}</span>
                  </div>
                </td>
                <td className="activity-cell">
                  <div className="activity-info">
                    <span className="activity-title">{submission.activityTitle}</span>
                    {submission.attachments > 0 && (
                      <span className="attachments-count">
                        {submission.attachments} file{submission.attachments > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="activity-type-badge">{submission.activityType}</span>
                </td>
                <td>{submission.section}</td>
                <td>
                  <span className="date-text">
                    {formatDate(submission.submissionDate)}
                  </span>
                </td>
                <td>
                  <span 
                    className={`due-date ${isOverdue(submission.dueDate, submission.status) ? 'overdue' : ''}`}
                  >
                    {new Date(submission.dueDate).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric'
                    })}
                    {isOverdue(submission.dueDate, submission.status) && (
                      <AlertCircle size={12} className="overdue-icon" />
                    )}
                  </span>
                </td>
                <td>
                  <div className="status-cell">
                    {getStatusIcon(submission.status)}
                    {getStatusBadge(submission.status)}
                  </div>
                </td>
                <td>
                  {submission.score !== null ? (
                    <span className={`score ${(submission.score / submission.totalPoints) >= 0.7 ? 'good' : (submission.score / submission.totalPoints) >= 0.5 ? 'average' : 'poor'}`}>
                      {submission.score}/{submission.totalPoints}
                    </span>
                  ) : (
                    <span className="score-pending">-</span>
                  )}
                </td>
                <td>{submission.timeSpent}</td>
                <td>
                  <div className="actions-cell">
                    <button 
                      className="action-button view-button"
                      onClick={() => setSelectedSubmission(submission)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="action-button menu-button"
                      title="More Actions"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`pagination-number ${page === currentPage ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
      
      {/* Detailed View Modal (if submission is selected) */}
      {selectedSubmission && (
        <div className="submission-detail-modal">
          <div className="modal-overlay" onClick={() => setSelectedSubmission(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>Submission Details</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedSubmission(null)}
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>Student Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <span>{selectedSubmission.studentName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Student ID</label>
                    <span>{selectedSubmission.studentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Grade & Section</label>
                    <span>{selectedSubmission.grade} - {selectedSubmission.section}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Activity Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Activity Title</label>
                    <span>{selectedSubmission.activityTitle}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type</label>
                    <span>{selectedSubmission.activityType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Time Spent</label>
                    <span>{selectedSubmission.timeSpent}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Submission Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Submitted</label>
                    <span>{new Date(selectedSubmission.submissionDate).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Due Date</label>
                    <span>{new Date(selectedSubmission.dueDate).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <div className="status-cell">
                      {getStatusIcon(selectedSubmission.status)}
                      {getStatusBadge(selectedSubmission.status)}
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedSubmission.status === 'graded' && (
                <div className="detail-section">
                  <h3>Assessment Results</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Score</label>
                      <span className="score-display">
                        {selectedSubmission.score}/{selectedSubmission.totalPoints}
                        <span className="score-percentage">
                          ({((selectedSubmission.score / selectedSubmission.totalPoints) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                  {selectedSubmission.teacherComments && (
                    <div className="teacher-comments">
                      <label>Teacher Comments</label>
                      <p>{selectedSubmission.teacherComments}</p>
                    </div>
                  )}
                </div>
              )}
              
              {selectedSubmission.status === 'flagged' && (
                <div className="detail-section flagged-section">
                  <h3>Flag Information</h3>
                  <div className="flag-details">
                    <AlertCircle size={20} className="flag-icon" />
                    <p>{selectedSubmission.flagReason}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="action-button secondary" onClick={() => setSelectedSubmission(null)}>
                Close
              </button>
              <button className="action-button primary">
                View Full Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsOverview;