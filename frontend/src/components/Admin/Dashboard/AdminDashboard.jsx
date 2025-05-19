// src/components/Admin/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Users, BookOpen, Activity, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../../css/Admin/Dashboard/AdminDashboard.css';
import { adminDashboardService } from '../../../services/adminDashboardService';

// Icon components for dashboard cards
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const StudentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const TeachersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ParentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5Z" />
    <path d="M12 12L8 21l4-7 4 7-4-9Z" />
  </svg>
);

const DashboardCard = ({ title, value, icon: Icon, subtitle, trend, color = '#007bff', loading = false, onView }) => (
  <div className="admin-dashboard-card">
    <div className="admin-dashboard-card__header">
      <div className="admin-dashboard-card__icon" style={{ backgroundColor: `${color}15`, color }}>
        <Icon />
      </div>
      {trend && (
        <div className={`admin-dashboard-card__trend admin-dashboard-card__trend--${trend.direction}`}>
          <Activity size={16} />
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
    <div className="admin-dashboard-card__content">
      <h3 className="admin-dashboard-card__title">{title}</h3>
      {loading ? (
        <div className="admin-dashboard-card__skeleton">Loading...</div>
      ) : (
        <>
          <div className="admin-dashboard-card__value">{value}</div>
          {subtitle && <p className="admin-dashboard-card__subtitle">{subtitle}</p>}
          {onView && (
            <button onClick={onView} className="admin-dashboard-card__view-btn">
              <Eye size={16} />
              View List
            </button>
          )}
        </>
      )}
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: {
      total: 0,
      students: 0,
      teachers: 0,
      parents: 0,
      activeToday: 0
    },
    academicData: {
      averageScore: 0,
      averageReadingLevel: 0
    },
    activities: {
      averageCompletionRate: 0,
      completedActivities: 0,
      pendingApproval: 0,
      activitiesCreated: 0,
      parentCommunications: 0
    },
    prescriptiveAnalytics: {
      highPriorityStudents: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for manual refresh

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching dashboard data...');
        const response = await adminDashboardService.getDashboardStats();
        console.log('Received dashboard data:', response);
        setStats(response);
      } catch (error) {
        console.error('Error in dashboard:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshKey]); // Add refreshKey to dependencies

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // Trigger a refresh by updating the key
  };

  // Navigation handlers
  const handleViewStudents = () => navigate('/admin/student-list');
  const handleViewTeachers = () => navigate('/admin/teacher-list');
  const handleViewParents = () => navigate('/admin/parent-list');

  if (error) {
    return (
      <div className="admin-dashboard admin-dashboard--error">
        <div className="admin-dashboard__error-message">
          Error loading dashboard: {error}
          <button onClick={handleRefresh} className="admin-dashboard__retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <div className="admin-dashboard__actions">
          <button onClick={handleRefresh} className="admin-dashboard__refresh-btn">
            <Activity size={20} />
            Refresh
          </button>
          <button className="admin-dashboard__notification-btn">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="admin-dashboard__metrics-grid">
        <DashboardCard
          title="Total Users"
          value={stats.users.total}
          icon={UserIcon}
          subtitle={`${stats.users.activeToday} active today`}
          color="#2196F3"
          loading={loading}
        />
        <DashboardCard
          title="Students"
          value={stats.users.students}
          icon={StudentsIcon}
          subtitle={`${stats.academicData.averageReadingLevel} avg reading level`}
          color="#4CAF50"
          loading={loading}
          onView={handleViewStudents}
        />
        <DashboardCard
          title="Teachers"
          value={stats.users.teachers}
          icon={TeachersIcon}
          subtitle={`${stats.activities.activitiesCreated} activities created`}
          color="#FF9800"
          loading={loading}
          onView={handleViewTeachers}
        />
        <DashboardCard
          title="Parents"
          value={stats.users.parents}
          icon={ParentsIcon}
          subtitle={`${stats.activities.parentCommunications} communications`}
          color="#9C27B0"
          loading={loading}
          onView={handleViewParents}
        />
      </div>

      {/* Academic Performance Row */}
      <div className="admin-dashboard__academic-grid">
        <DashboardCard
          title="Average Score"
          value={`${stats.academicData.averageScore}%`}
          icon={BookOpen}
          subtitle="Across all assessments"
          color="#2196F3"
          loading={loading}
        />
        <DashboardCard
          title="Completion Rate"
          value={`${stats.activities.averageCompletionRate}%`}
          icon={CheckCircle}
          subtitle={`${stats.activities.completedActivities} completed`}
          color="#4CAF50"
          loading={loading}
        />
        <DashboardCard
          title="Pending Approvals"
          value={stats.activities.pendingApproval}
          icon={Clock}
          subtitle="Awaiting review"
          color="#FF9800"
          loading={loading}
        />
        <DashboardCard
          title="High Priority"
          value={stats.prescriptiveAnalytics.highPriorityStudents}
          icon={AlertTriangle}
          subtitle="Students needing intervention"
          color="#F44336"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;