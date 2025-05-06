// src/components/Admin/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Users, BookOpen, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Building, GraduationCap } from 'lucide-react';
import '../../../css/Admin/Dashboard/AdminDashboard.css';
import { adminDashboardService } from '../../../services/adminDashboardService';

// Create a function to generate placeholder images
const generatePlaceholderAvatar = (initials) => {
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%234a5568"/%3E%3Ctext x="20" y="25" font-family="Arial" font-size="16" text-anchor="middle" fill="white"%3E${initials}%3C/text%3E%3C/svg%3E`;
};

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

const DashboardCard = ({ title, value, icon: Icon, subtitle, trend, color = '#007bff', loading = false }) => (
  <div className="admin-dashboard-card">
    <div className="admin-dashboard-card__header">
      <div className="admin-dashboard-card__icon" style={{ backgroundColor: `${color}15`, color }}>
        <Icon />
      </div>
      {trend && (
        <div className={`admin-dashboard-card__trend admin-dashboard-card__trend--${trend.direction}`}>
          <TrendingUp size={16} />
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
        </>
      )}
    </div>
  </div>
);

const ActivityFeedItem = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'student_assessment': return <GraduationCap size={16} />;
      case 'teacher_activity': return <Users size={16} />;
      case 'parent_engagement': return <Users size={16} />;
      case 'system_alert': return <AlertTriangle size={16} />;
      case 'approval': return <CheckCircle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getActivityColor = () => {
    switch (activity.status) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'pending': return '#2196F3';
      default: return '#757575';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="admin-dashboard-activity-item">
      <div className="admin-dashboard-activity-item__icon" style={{ color: getActivityColor() }}>
        {getActivityIcon()}
      </div>
      <div className="admin-dashboard-activity-item__content">
        <div className="admin-dashboard-activity-item__header">
          <span className="admin-dashboard-activity-item__user">{activity.user}</span>
          <span className="admin-dashboard-activity-item__time">{formatTimeAgo(activity.timestamp)}</span>
        </div>
        <p className="admin-dashboard-activity-item__action">{activity.action}</p>
        {activity.details && (
          <span className="admin-dashboard-activity-item__details">{activity.details}</span>
        )}
      </div>
    </div>
  );
};

const AlertCard = ({ alert }) => {
  const getAlertColor = () => {
    switch (alert.type) {
      case 'critical': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#757575';
    }
  };

  return (
    <div className="admin-dashboard-alert" style={{ borderLeftColor: getAlertColor() }}>
      <div className="admin-dashboard-alert__header">
        <div className="admin-dashboard-alert__icon" style={{ color: getAlertColor() }}>
          <AlertTriangle size={16} />
        </div>
        <h4 className="admin-dashboard-alert__title">{alert.title}</h4>
      </div>
      <p className="admin-dashboard-alert__message">{alert.message}</p>
      <div className="admin-dashboard-alert__footer">
        <span className="admin-dashboard-alert__time">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
        <button className="admin-dashboard-alert__action">{alert.action}</button>
      </div>
    </div>
  );
};

const PrescriptiveAnalyticsCard = ({ category }) => (
  <div className="admin-dashboard-prescriptive-card">
    <div className="admin-dashboard-prescriptive-card__header">
      <div className="admin-dashboard-prescriptive-card__indicator" style={{ backgroundColor: category.color }} />
      <h4 className="admin-dashboard-prescriptive-card__title">{category.label}</h4>
    </div>
    <div className="admin-dashboard-prescriptive-card__value">{category.count}</div>
    <p className="admin-dashboard-prescriptive-card__details">{category.details}</p>
  </div>
);

const ChallengePieChart = ({ challenges }) => {
  const total = challenges.reduce((sum, challenge) => sum + challenge.affectedStudents, 0);
  
  return (
    <div className="admin-dashboard-challenge-chart">
      <div className="admin-dashboard-challenge-chart__legend">
        {challenges.map((challenge, index) => (
          <div key={challenge.area} className="admin-dashboard-challenge-chart__legend-item">
            <div 
              className="admin-dashboard-challenge-chart__legend-indicator" 
              style={{ backgroundColor: `hsl(${index * 90}, 70%, 50%)` }}
            />
            <span className="admin-dashboard-challenge-chart__legend-label">
              {challenge.area} ({challenge.affectedStudents})
            </span>
          </div>
        ))}
      </div>
      <div className="admin-dashboard-challenge-chart__pie-container">
        <svg viewBox="0 0 200 200" width="200" height="200">
          {challenges.map((challenge, index) => {
            const startAngle = challenges.slice(0, index).reduce((sum, ch) => sum + (ch.affectedStudents / total) * 360, 0);
            const angle = (challenge.affectedStudents / total) * 360;
            const endAngle = startAngle + angle;
            
            const x1 = 100 + 80 * Math.cos(startAngle * Math.PI / 180);
            const y1 = 100 + 80 * Math.sin(startAngle * Math.PI / 180);
            const x2 = 100 + 80 * Math.cos(endAngle * Math.PI / 180);
            const y2 = 100 + 80 * Math.sin(endAngle * Math.PI / 180);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            return (
              <path
                key={challenge.area}
                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={`hsl(${index * 90}, 70%, 50%)`}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [prescriptiveData, setPrescriptiveData] = useState(null);
  const [teacherPerformance, setTeacherPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activitiesData, alertsData, prescriptiveDataRes, teacherPerfData] = await Promise.all([
          adminDashboardService.getDashboardStats(),
          adminDashboardService.getRecentActivities(),
          adminDashboardService.getSystemAlerts(),
          adminDashboardService.getPrescriptiveAnalytics(),
          adminDashboardService.getTeacherPerformance()
        ]);

        setStats(statsData);
        setRecentActivities(activitiesData);
        setSystemAlerts(alertsData);
        setPrescriptiveData(prescriptiveDataRes);
        setTeacherPerformance(teacherPerfData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up real-time updates (simulate with polling)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="admin-dashboard__loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <div className="admin-dashboard__actions">
          <button className="admin-dashboard__notification-btn">
            <Bell size={20} />
            {systemAlerts.length > 0 && (
              <span className="admin-dashboard__notification-badge">{systemAlerts.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="admin-dashboard__metrics-grid">
        <DashboardCard
          title="Total Users"
          value={stats?.users.total.toLocaleString()}
          icon={UserIcon}
          subtitle={`${stats?.users.activeToday} active today`}
          color="#2196F3"
          trend={{ direction: 'up', value: 5.2 }}
        />
        <DashboardCard
          title="Students"
          value={stats?.users.students.toLocaleString()}
          icon={StudentsIcon}
          subtitle={`${Math.round(stats?.prescriptiveAnalytics.averageReadingLevel)} avg reading level`}
          color="#4CAF50"
          trend={{ direction: 'up', value: 2.1 }}
        />
        <DashboardCard
          title="Teachers"
          value={stats?.users.teachers.toLocaleString()}
          icon={TeachersIcon}
          subtitle={`${teacherPerformance?.engagement.activitiesCreated} activities created`}
          color="#FF9800"
          trend={{ direction: 'stable', value: 0.5 }}
        />
        <DashboardCard
          title="Parents"
          value={stats?.users.parents.toLocaleString()}
          icon={ParentsIcon}
          subtitle={`${teacherPerformance?.engagement.parentCommunications} communications`}
          color="#9C27B0"
          trend={{ direction: 'up', value: 3.8 }}
        />
      </div>

      {/* Academic Performance Row */}
      <div className="admin-dashboard__academic-grid">
        <DashboardCard
          title="Average Score"
          value={`${stats?.academicData.averageScore}%`}
          icon={BookOpen}
          subtitle="Across all assessments"
          color="#2196F3"
          trend={{ direction: 'up', value: 4.5 }}
        />
        <DashboardCard
          title="Completion Rate"
          value={`${stats?.activities.averageCompletionRate}%`}
          icon={CheckCircle}
          subtitle={`${stats?.activities.completedActivities} completed`}
          color="#4CAF50"
          trend={{ direction: 'up', value: 2.3 }}
        />
        <DashboardCard
          title="Pending Approvals"
          value={stats?.activities.pendingApproval}
          icon={Clock}
          subtitle="Awaiting review"
          color="#FF9800"
          trend={{ direction: 'down', value: 1.2 }}
        />
        <DashboardCard
          title="High Priority"
          value={stats?.prescriptiveAnalytics.highPriorityStudents}
          icon={AlertTriangle}
          subtitle="Students needing intervention"
          color="#F44336"
          trend={{ direction: 'down', value: 2.5 }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="admin-dashboard__content-grid">
        {/* Prescriptive Analytics Section */}
        <div className="admin-dashboard__section admin-dashboard__section--prescriptive">
          <h2 className="admin-dashboard__section-title">Prescriptive Analytics</h2>
          <div className="admin-dashboard__prescriptive-grid">
            {prescriptiveData?.studentCategories.map(category => (
              <PrescriptiveAnalyticsCard key={category.category} category={category} />
            ))}
          </div>
          
          <div className="admin-dashboard__challenges-section">
            <h3 className="admin-dashboard__subsection-title">Common Challenges</h3>
            <div className="admin-dashboard__challenges-grid">
              <ChallengePieChart challenges={prescriptiveData?.commonChallenges || []} />
              <div className="admin-dashboard__challenges-list">
                {prescriptiveData?.commonChallenges.map(challenge => (
                  <div key={challenge.area} className="admin-dashboard__challenge-item">
                    <div className="admin-dashboard__challenge-header">
                      <span className="admin-dashboard__challenge-area">{challenge.area}</span>
                      <span className={`admin-dashboard__challenge-trend admin-dashboard__challenge-trend--${challenge.trend}`}>
                        {challenge.trend}
                      </span>
                    </div>
                    <div className="admin-dashboard__challenge-stats">
                      <span className="admin-dashboard__challenge-affected">{challenge.affectedStudents} students</span>
                      <span className="admin-dashboard__challenge-score">{challenge.averageScore}% avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div className="admin-dashboard__section admin-dashboard__section--activity">
          <h2 className="admin-dashboard__section-title">Recent Activity</h2>
          <div className="admin-dashboard__activity-feed">
            {recentActivities.map(activity => (
              <ActivityFeedItem key={activity.id} activity={activity} />
            ))}
          </div>
          <button className="admin-dashboard__view-all-btn">View All Activities</button>
        </div>

        {/* System Alerts Section */}
        <div className="admin-dashboard__section admin-dashboard__section--alerts">
          <h2 className="admin-dashboard__section-title">System Alerts</h2>
          <div className="admin-dashboard__alerts-container">
            {systemAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* Teacher Performance Section */}
        <div className="admin-dashboard__section admin-dashboard__section--teacher-performance">
          <h2 className="admin-dashboard__section-title">Teacher Performance</h2>
          <div className="admin-dashboard__teacher-performance-grid">
            <div className="admin-dashboard__top-teachers">
              <h3 className="admin-dashboard__subsection-title">Top Performers</h3>
              <div className="admin-dashboard__teacher-list">
                {teacherPerformance?.topPerformers.map((teacher, index) => (
                  <div key={teacher.name} className="admin-dashboard__teacher-item">
                    <div className="admin-dashboard__teacher-rank">#{index + 1}</div>
                    <div className="admin-dashboard__teacher-info">
                      <div className="admin-dashboard__teacher-name">{teacher.name}</div>
                      <div className="admin-dashboard__teacher-stats">
                        <span className="admin-dashboard__teacher-students">{teacher.studentsHelped} students</span>
                        <span className="admin-dashboard__teacher-improvement">+{teacher.averageImprovement}% improvement</span>
                      </div>
                    </div>
                    <div className="admin-dashboard__teacher-rating">{teacher.rating}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="admin-dashboard__teacher-metrics">
              <h3 className="admin-dashboard__subsection-title">Engagement Metrics</h3>
              <div className="admin-dashboard__teacher-metrics-grid">
                <div className="admin-dashboard__metric-card">
                  <div className="admin-dashboard__metric-value">{teacherPerformance?.engagement.activitiesCreated}</div>
                  <div className="admin-dashboard__metric-label">Activities Created</div>
                </div>
                <div className="admin-dashboard__metric-card">
                  <div className="admin-dashboard__metric-value">{teacherPerformance?.engagement.studentsMonitored}</div>
                  <div className="admin-dashboard__metric-label">Students Monitored</div>
                </div>
                <div className="admin-dashboard__metric-card">
                  <div className="admin-dashboard__metric-value">{teacherPerformance?.engagement.parentCommunications}</div>
                  <div className="admin-dashboard__metric-label">Parent Communications</div>
                </div>
                <div className="admin-dashboard__metric-card">
                  <div className="admin-dashboard__metric-value">{teacherPerformance?.engagement.averageResponseTime}h</div>
                  <div className="admin-dashboard__metric-label">Avg Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics Section */}
        <div className="admin-dashboard__section admin-dashboard__section--summary">
          <h2 className="admin-dashboard__section-title">Summary Statistics</h2>
          <div className="admin-dashboard__summary-grid">
            <div className="admin-dashboard__summary-card">
              <h3 className="admin-dashboard__summary-title">Reading Level Distribution</h3>
              <div className="admin-dashboard__bar-chart">
                {Object.entries(stats?.academicData.antasDistribution || {}).map(([level, count]) => {
                  const total = Object.values(stats?.academicData.antasDistribution || {}).reduce((sum, c) => sum + c, 0);
                  const percentage = total > 0 ? (count / total * 100) : 0;
                  
                  return (
                    <div key={level} className="admin-dashboard__bar-item">
                      <div className="admin-dashboard__bar-label">{level}</div>
                      <div className="admin-dashboard__bar-container">
                        <div 
                          className="admin-dashboard__bar" 
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="admin-dashboard__bar-value">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="admin-dashboard__summary-card">
              <h3 className="admin-dashboard__summary-title">Performance Patterns</h3>
              <div className="admin-dashboard__pattern-grid">
                {Object.entries(stats?.academicData.patternAnalysis || {}).map(([area, score]) => (
                  <div key={area} className="admin-dashboard__pattern-item">
                    <div className="admin-dashboard__pattern-header">
                      <span className="admin-dashboard__pattern-area">{area}</span>
                      <span className="admin-dashboard__pattern-score">{score}%</span>
                    </div>
                    <div className="admin-dashboard__pattern-bar">
                      <div 
                        className="admin-dashboard__pattern-fill" 
                        style={{ width: `${score}%`, backgroundColor: score >= 60 ? '#4CAF50' : score >= 40 ? '#FF9800' : '#F44336' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;