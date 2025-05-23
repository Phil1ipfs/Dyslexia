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
  Eye,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';

// Mock service for teacher activity proposals
const mockProposalsService = {
  async getProposals(filter = '') {
    await new Promise(resolve => setTimeout(resolve, 500));
    const proposals = [
      {
        id: 'PRO001',
        activityTitle: 'Mga Uri ng Pangungusap',
        activityType: 'Worksheet',
        description: "Worksheet para sa iba't ibang uri ng pangungusap.",
        teacherName: 'Mr. Dela Cruz',
        dateSubmitted: new Date('2024-11-17T10:30:00'),
        status: 'pending',
        attachments: 1,
      },
      {
        id: 'PRO002',
        activityTitle: 'Salitang Naglalarawan',
        activityType: 'Quiz',
        description: 'Maikling pagsusulit tungkol sa mga salitang naglalarawan.',
        teacherName: 'Ms. Santos',
        dateSubmitted: new Date('2024-11-16T14:15:00'),
        status: 'approved',
        attachments: 0,
      },
      {
        id: 'PRO003',
        activityTitle: 'Pangngalan',
        activityType: 'Assignment',
        description: 'Takdang-aralin ukol sa pangngalan.',
        teacherName: 'Ms. Lim',
        dateSubmitted: new Date('2024-11-16T09:45:00'),
        status: 'pending',
        attachments: 2,
      },
      {
        id: 'PRO004',
        activityTitle: 'Pandiwa',
        activityType: 'Practice',
        description: 'Practice activity para sa pandiwa.',
        teacherName: 'Mr. Gomez',
        dateSubmitted: new Date('2024-11-15T16:20:00'),
        status: 'rejected',
        attachments: 1,
        rejectionReason: 'Incomplete instructions.'
      },
    ];
    return proposals.filter(proposal =>
      proposal.activityTitle.toLowerCase().includes(filter.toLowerCase()) ||
      proposal.teacherName.toLowerCase().includes(filter.toLowerCase())
    );
  },
};

const SubmissionsOverview = () => {
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [proposals, searchQuery, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const proposalsData = await mockProposalsService.getProposals();
      setProposals(proposalsData);
    } catch (err) {
      setError('Failed to load proposals data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...proposals];
    if (searchQuery) {
      filtered = filtered.filter(proposal =>
        proposal.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }
    setFilteredProposals(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge status-pending">Pending</span>;
      case 'approved':
        return <span className="status-badge status-approved">Approved</span>;
      case 'rejected':
        return <span className="status-badge status-rejected">Rejected</span>;
      default:
        return null;
    }
  };

  const handleApprove = async (proposalId) => {
    setActionLoading(true);
    setTimeout(() => {
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'approved', rejectionReason: undefined } : p));
      setSelectedProposal(null);
      setActionLoading(false);
    }, 700);
  };

  const handleReject = async (proposalId, reason) => {
    setActionLoading(true);
    setTimeout(() => {
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'rejected', rejectionReason: reason } : p));
      setSelectedProposal(null);
      setRejectComment('');
      setActionLoading(false);
    }, 700);
  };

  // Pagination
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProposals = filteredProposals.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="submissions-overview">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading proposals...</p>
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
          <h1>Activity Proposals Review</h1>
          <p className="header-subtitle">Approve or reject teacher-submitted activities</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-container">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by activity title or teacher name..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      )}

      {/* Proposals Table */}
      <div className="submissions-table-container">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Activity Title</th>
              <th>Type</th>
              <th>Description</th>
              <th>Teacher</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentProposals.map((proposal) => (
              <tr key={proposal.id} className="submission-row">
                <td>{proposal.activityTitle}</td>
                <td><span className="activity-type-badge">{proposal.activityType}</span></td>
                <td>{proposal.description.length > 40 ? proposal.description.slice(0, 40) + '...' : proposal.description}</td>
                <td>{proposal.teacherName}</td>
                <td>{new Date(proposal.dateSubmitted).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td>{getStatusBadge(proposal.status)}</td>
                <td>
                  <div className="actions-cell">
                    <button
                      className="action-button view-button"
                      onClick={() => setSelectedProposal(proposal)}
                      title="View Details"
                    >
                      <Eye size={16} />
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredProposals.length)} of {filteredProposals.length} proposals
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

      {/* Detailed View Modal */}
      {selectedProposal && (
        <div className="submission-detail-modal">
          <div className="modal-overlay" onClick={() => setSelectedProposal(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>Proposal Details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedProposal(null)}
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Activity Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Title</label>
                    <span>{selectedProposal.activityTitle}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type</label>
                    <span>{selectedProposal.activityType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Description</label>
                    <span>{selectedProposal.description}</span>
                  </div>
                  <div className="detail-item">
                    <label>Teacher</label>
                    <span>{selectedProposal.teacherName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date Submitted</label>
                    <span>{new Date(selectedProposal.dateSubmitted).toLocaleString()}</span>
                  </div>
                  {selectedProposal.attachments > 0 && (
                    <div className="detail-item">
                      <label>Attachments</label>
                      <span>{selectedProposal.attachments} file{selectedProposal.attachments > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedProposal.status === 'rejected' && selectedProposal.rejectionReason && (
                <div className="detail-section flagged-section">
                  <h3>Rejection Reason</h3>
                  <div className="flag-details">
                    <AlertCircle size={20} className="flag-icon" />
                    <p>{selectedProposal.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="action-button secondary" onClick={() => setSelectedProposal(null)}>
                Close
              </button>
              {selectedProposal.status === 'pending' && (
                <>
                  <button
                    className="action-button primary"
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedProposal.id)}
                  >
                    {actionLoading ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    className="action-button danger"
                    disabled={actionLoading}
                    onClick={() => handleReject(selectedProposal.id, rejectComment)}
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                  <input
                    type="text"
                    className="reject-comment-input"
                    placeholder="Reason for rejection (required)"
                    value={rejectComment}
                    onChange={e => setRejectComment(e.target.value)}
                    style={{ marginLeft: 8, minWidth: 200 }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsOverview;