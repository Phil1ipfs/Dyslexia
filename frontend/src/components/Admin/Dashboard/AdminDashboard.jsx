// src/components/Admin/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Activity,
  Eye,
  Users,
  GraduationCap,
  School,
  UserSquare2,
  AlertTriangle,
  Info,
  BarChart3,
  CheckCircle,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Lightbulb,
  Shield,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import CategoryAnalysisModal from './CategoryAnalysisModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    students: { count: 0, active: 0, avgReadingLevel: 2.5 },
    teachers: { count: 0, activities: 0 },
    parents: { count: 0, communications: 0 }
  });

  // Prescriptive Analysis State
  const [prescriptiveData, setPrescriptiveData] = useState(null);
  const [prescriptiveLoading, setPrescriptiveLoading] = useState(false);
  const [prescriptiveError, setPrescriptiveError] = useState(null);

  // Category Modal State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryData, setSelectedCategoryData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Recommendations Collapse State
  const [isRecommendationsExpanded, setIsRecommendationsExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching dashboard data...');

        // Get token from user object stored by authService
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('No user data found - please login');
        }

        const user = JSON.parse(userStr);
        const token = user?.token;
        if (!token) {
          throw new Error('No auth token found - please login');
        }

        // Verify admin role from user object
        const userData = user?.user;
        if (userData) {
          const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
          if (!roles.includes('admin')) {
            throw new Error('User is not authorized to view admin dashboard');
          }
        }

        // Use environment variable for API base URL
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          } else if (response.status === 403) {
            throw new Error('You are not authorized to view this dashboard.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received dashboard data:', data);

        // Process the data to match our dashboard structure
        const processedData = {
          totalUsers: data.users?.total || 0,
          students: {
            count: data.users?.students || 0,
            active: data.users?.activeToday || 0,
            avgReadingLevel: data.academicData?.averageReadingLevel || 2.5
          },
          teachers: {
            count: data.users?.teachers || 0,
            activities: data.activities?.activitiesCreated || 0
          },
          parents: {
            count: data.users?.parents || 0,
            communications: data.activities?.parentCommunications || 0
          }
        };

        setDashboardData(processedData);
        
        // Simulate a slight delay to show loading animation
        setTimeout(() => {
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data');
        
        // If unauthorized, redirect to login
        if (error.message.includes('Session expired') || error.message.includes('not authorized')) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleViewStudents = () => navigate('/admin/student-list');
  const handleViewTeachers = () => navigate('/admin/teacher-list');
  const handleViewParents = () => navigate('/admin/parent-list');

  // Category Modal Handlers
  const handleCategoryClick = (categoryName, categoryData) => {
    setSelectedCategory(categoryName);
    setSelectedCategoryData(categoryData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setSelectedCategoryData(null);
  };

  // Recommendations Toggle Handler
  const handleToggleRecommendations = () => {
    setIsRecommendationsExpanded(!isRecommendationsExpanded);
  };

  // Fetch Prescriptive Analysis Data
  const fetchPrescriptiveAnalysis = async () => {
    try {
      setPrescriptiveLoading(true);
      setPrescriptiveError(null);

      // Get token from user object (where authService stores it)
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No authentication data found. Please login again.');
      }

      let token;
      try {
        const parsed = JSON.parse(userData);
        token = parsed.token;
      } catch (e) {
        console.error('Error parsing user data:', e);
        throw new Error('Invalid authentication data. Please login again.');
      }

      if (!token) {
        throw new Error('No auth token found. Please login again.');
      }

      console.log('[ADMIN DASHBOARD] Fetching prescriptive analysis...');

      const response = await fetch('http://localhost:5001/api/admin/prescriptive-analysis', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You are not authorized to view this analysis.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[ADMIN DASHBOARD] ✅ Prescriptive analysis received:', result);

      if (result.success && result.data) {
        setPrescriptiveData(result.data);
      } else {
        throw new Error(result.error || 'Failed to get prescriptive analysis');
      }

    } catch (error) {
      console.error('[ADMIN DASHBOARD] ❌ Error fetching prescriptive analysis:', error);
      setPrescriptiveError(error.message);
    } finally {
      setPrescriptiveLoading(false);
    }
  };

  // Fetch prescriptive analysis when component mounts
  useEffect(() => {
    if (dashboardData.totalUsers > 0) {
      fetchPrescriptiveAnalysis();
    }
  }, [dashboardData.totalUsers]);
  
  // Format date for display
  const formatDate = (date = new Date()) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const chartData = [
    { name: 'Teachers', value: dashboardData.teachers.count || 0, color: '#FFB347' },
    { name: 'Parents', value: dashboardData.parents.count || 0, color: '#98D8AA' },
    { name: 'Students', value: dashboardData.students.count || 0, color: '#FF6B6B' }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="admin-dashboard__loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard admin-dashboard--error">
        <div className="admin-dashboard__error-message">
          <p>Error loading dashboard: {error}</p>
          <button onClick={() => window.location.reload()} className="admin-dashboard__retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall stats for the attention banner
  const activeStudentsPercentage = dashboardData.students.count > 0 
    ? Math.round((dashboardData.students.active / dashboardData.students.count) * 100) 
    : 0;
  
  const showAttentionBanner = activeStudentsPercentage < 30;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">
          <BarChart3 size={24} />
          Dashboard Overview
        </h1>
        <div className="admin-dashboard__actions">
          <button onClick={() => window.location.reload()} className="admin-dashboard__refresh-btn">
            <Activity size={20} />
            Refresh
          </button>
          <button className="admin-dashboard__notification-btn">
            <Bell size={20} />
          </button>
        </div>
      </div>
      
      {/* Info Banner */}
      <div className="admin-dashboard__info-banner">
        <Info className="admin-dashboard__info-icon" size={28} />
        <div className="admin-dashboard__info-content">
          <h3>Admin Dashboard Overview</h3>
          <p>
            Welcome to the admin dashboard. Here you can view key metrics about users, 
            student performance, and system activities. Last updated: {formatDate()}
          </p>
        </div>
      </div>

      <div className="admin-dashboard__metrics-grid">
        {/* Total Users Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <Users size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Total Users</h3>
            <p className="admin-dashboard-card__value">{dashboardData.totalUsers}</p>
          </div>
        </div>

        {/* Students Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <GraduationCap size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Students</h3>
            <p className="admin-dashboard-card__value">{dashboardData.students.count}</p>
            <button className="admin-dashboard-card__view-btn" onClick={handleViewStudents}>
              <Eye size={16} />
              View Students
            </button>
          </div>
        </div>

        {/* Teachers Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <School size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Teachers</h3>
            <p className="admin-dashboard-card__value">{dashboardData.teachers.count}</p>
            <button className="admin-dashboard-card__view-btn" onClick={handleViewTeachers}>
              <Eye size={16} />
              View Teachers
            </button>
          </div>
        </div>

        {/* Parents Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <UserSquare2 size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Parents</h3>
            <p className="admin-dashboard-card__value">{dashboardData.parents.count}</p>
            <button className="admin-dashboard-card__view-btn" onClick={handleViewParents}>
              <Eye size={16} />
              View Parents
            </button>
          </div>
        </div>
      </div>
      
      {/* Show attention banner if needed */}
      {showAttentionBanner && (
        <div className="admin-dashboard__attention-banner">
          <AlertTriangle className="admin-dashboard__attention-icon" size={28} />
          <div className="admin-dashboard__attention-content">
            <h4>Low Student Activity</h4>
            <p>
              Only {activeStudentsPercentage}% of students were active today. 
              Consider sending a notification to teachers and parents to encourage platform usage.
            </p>
          </div>
          <button className="admin-dashboard__action-btn">
            <Bell size={16} />
            Send Notification
          </button>
        </div>
      )}

      <div className="admin-dashboard__analytics-section">
        <h2 className="admin-dashboard__section-title">
          <Activity size={20} />
          User Analytics
        </h2>
        <div className="admin-dashboard__chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={5}
                dataKey="value"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  value,
                  index
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill={chartData[index].color}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {`${chartData[index].name} (${value})`}
                    </text>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} Users`, name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{
                  paddingLeft: '24px',
                  fontSize: '14px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prescriptive Analysis Section - The Cornerstone of the Project */}
      <div className="admin-dashboard__prescriptive-section">
        <div className="prescriptive-section__header">
          <h2 className="admin-dashboard__section-title">
            <Brain size={20} />
            Prescriptive Analysis
          </h2>
          <div className="prescriptive-section__subtitle">
            <Target size={16} />
            Advanced BKT & IRT Models for Comprehensive Student Assessment
          </div>
        </div>

        {prescriptiveLoading && (
          <div className="prescriptive-section__loading">
            <div className="loading-spinner"></div>
            <p>Analyzing student performance using BKT and IRT models...</p>
          </div>
        )}

        {prescriptiveError && (
          <div className="prescriptive-section__error">
            <AlertCircle size={16} />
            <span>Error loading analysis: {prescriptiveError}</span>
            <button onClick={fetchPrescriptiveAnalysis} className="retry-button">
              Retry Analysis
            </button>
          </div>
        )}

        {prescriptiveData && (
          <div className="prescriptive-analysis__content">

            {/* Overall Performance Summary */}
            <div className="prescriptive-card prescriptive-card--overview">
              <div className="prescriptive-card__header">
                <div className="header-content">
                  <BarChart3 size={20} />
                <h3>Overall Performance Summary</h3>
                </div>
                <div className={`performance-badge performance-badge--${prescriptiveData.overallPerformance?.riskLevel?.toLowerCase() || 'moderate'}`}>
                  {prescriptiveData.overallPerformance?.riskLevel || 'Moderate'} Risk
                </div>
              </div>
              <div className="prescriptive-card__content">
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric__label">Total Students Analyzed</span>
                    <span className="metric__value">{prescriptiveData.totalStudents || 0}</span>
                  </div>
                  <div className="metric">
                    <span className="metric__label">Average Score</span>
                    <span className="metric__value">{prescriptiveData.overallPerformance?.averageScore || 0}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric__label">Pass Rate</span>
                    <span className="metric__value">{prescriptiveData.overallPerformance?.passRate || 0}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric__label">Improvement Rate</span>
                    <span className="metric__value metric__value--trend">
                      {(prescriptiveData.overallPerformance?.improvementRate || 0) > 0 ? (
                        <><TrendingUp size={14} /> +{prescriptiveData.overallPerformance?.improvementRate}%</>
                      ) : (
                        <><TrendingDown size={14} /> {prescriptiveData.overallPerformance?.improvementRate || 0}%</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Analysis Grid */}
            <div className="prescriptive-categories">
              <h3 className="section-subtitle">
                <BookOpen size={16} />
                Category-Specific Analysis (BKT & IRT Models)
              </h3>
              <div className="categories-grid">
                {prescriptiveData.categoryAnalysis && Object.entries(prescriptiveData.categoryAnalysis).map(([category, analysis]) => {
                  const getPerformanceLevel = (accuracy) => {
                    if (accuracy >= 75) return 'Proficient';
                    if (accuracy >= 60) return 'Developing';
                    if (accuracy >= 40) return 'Struggling';
                    return 'Critical';
                  };

                  const getPerformanceClass = (accuracy) => {
                    if (accuracy >= 75) return 'proficient';
                    if (accuracy >= 60) return 'developing';
                    if (accuracy >= 40) return 'struggling';
                    return 'critical';
                  };

                  const performanceLevel = getPerformanceLevel(analysis.performance?.accuracy || 0);
                  const performanceClass = getPerformanceClass(analysis.performance?.accuracy || 0);

                  return (
                    <div 
                      key={category} 
                      className="category-card category-card--clickable"
                      onClick={() => handleCategoryClick(category, analysis)}
                    >
                    <div className="category-card__header">
                      <div className="category-title">
                        <Award size={16} />
                        <h4>{category}</h4>
                      </div>
                      <div className="category-status">
                          <span className={`status-badge status-badge--${performanceClass}`}>
                            {performanceLevel}
                        </span>
                      </div>
                    </div>

                    <div className="category-metrics">
                      <div className="metric-row">
                        <span>Students:</span>
                          <span className="metric-value">{analysis.studentCount || 0}</span>
                      </div>
                      <div className="metric-row">
                        <span>Accuracy:</span>
                          <span className={`accuracy accuracy--${performanceClass}`}>
                            {analysis.performance?.accuracy || 0}%
                        </span>
                      </div>
                      <div className="metric-row">
                        <span>BKT Mastery:</span>
                          <span className="metric-value">{Math.round((analysis.skillMastery?.averageMastery || 0) * 100)}%</span>
                      </div>
                      <div className="metric-row">
                        <span>IRT Ability:</span>
                          <span className={`irt-ability ${(analysis.abilityEstimates?.averageAbility || 0) >= 0 ? 'irt-ability--positive' : 'irt-ability--negative'}`}>
                            {(analysis.abilityEstimates?.averageAbility || 0) >= 0 ? '+' : ''}{analysis.abilityEstimates?.averageAbility || 0}
                        </span>
                      </div>
                    </div>

                      <div className="category-card__footer">
                        <span className="click-hint">Click to view detailed analysis</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Analysis */}
            {prescriptiveData.sectionAnalysis && Object.keys(prescriptiveData.sectionAnalysis).length > 0 && (
            <div className="prescriptive-sections">
              <h3 className="section-subtitle">
                <School size={16} />
                Section-Level Performance Analysis
              </h3>
              <div className="sections-grid">
                  {Object.entries(prescriptiveData.sectionAnalysis).map(([section, analysis]) => (
                  <div key={section} className="section-card">
                    <div className="section-card__header">
                      <h4>Section {section}</h4>
                        <div className={`risk-indicator risk-indicator--${(analysis.riskLevel || 'moderate').toLowerCase()}`}>
                          {analysis.riskLevel || 'Moderate'} Risk
                        </div>
                    </div>

                    <div className="section-metrics">
                      <div className="metric-row">
                        <span>Students:</span>
                          <span className="metric-value">{analysis.studentCount || 0}</span>
                      </div>
                      <div className="metric-row">
                        <span>Overall Accuracy:</span>
                          <span className="metric-value">{Math.round(analysis.overallAccuracy || 0)}%</span>
                      </div>
                        <div className="metric-row">
                          <span>Avg Response Time:</span>
                          <span className="metric-value">
                            {analysis.averageResponseTime ? 
                              `${parseFloat(analysis.averageResponseTime).toFixed(1)}s` : 
                              '0s'
                            }
                          </span>
                        </div>
                      <div className="metric-row">
                        <span>Intervention Needed:</span>
                        <span className={analysis.interventionNeeded ? 'text-warning' : 'text-success'}>
                          {analysis.interventionNeeded ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    <div className="section-insights">
                        {analysis.strengths && analysis.strengths.length > 0 && (
                        <div className="insight-group">
                          <h6>Strengths:</h6>
                          <ul>
                            {analysis.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                        {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                        <div className="insight-group">
                          <h6>Areas for Improvement:</h6>
                          <ul>
                            {analysis.weaknesses.map((weakness, index) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Skill Mastery Analysis */}
            {prescriptiveData.skillMasteryAnalysis && (
            <div className="prescriptive-mastery">
              <h3 className="section-subtitle">
                <Target size={16} />
                Skill Mastery Analysis (Bayesian Knowledge Tracing)
              </h3>
              <div className="mastery-overview">
                <div className="mastery-card">
                  <h4>Overall Mastery Distribution</h4>
                  <div className="mastery-stats">
                    <div className="mastery-stat">
                      <span className="mastery-label">Mastered Students</span>
                      <span className="mastery-value mastery-value--good">
                          {prescriptiveData.skillMasteryAnalysis?.overall?.masteredStudents || 0}
                      </span>
                    </div>
                    <div className="mastery-stat">
                      <span className="mastery-label">Struggling Students</span>
                      <span className="mastery-value mastery-value--warning">
                          {prescriptiveData.skillMasteryAnalysis?.overall?.strugglingStudents || 0}
                      </span>
                    </div>
                    <div className="mastery-stat">
                      <span className="mastery-label">Average Mastery</span>
                      <span className="mastery-value">
                          {Math.round((prescriptiveData.skillMasteryAnalysis?.overall?.averageMastery || 0) * 100)}%
                      </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Intervention Analysis */}
            {prescriptiveData.interventionAnalysis && (
              <div className="prescriptive-interventions">
                <h3 className="section-subtitle">
                  <GraduationCap size={16} />
                  Intervention Effectiveness Analysis
                </h3>
                <div className="intervention-overview">
                  <div className="intervention-metrics">
                    <div className="metric">
                      <span className="metric__label">Total Interventions</span>
                      <span className="metric__value">{prescriptiveData.interventionAnalysis?.overall?.totalInterventions || 0}</span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Success Rate</span>
                      <span className="metric__value">{Math.round(prescriptiveData.interventionAnalysis?.overall?.effectivenessRate || 0)}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Average Improvement</span>
                      <span className="metric__value">+{Math.round(prescriptiveData.interventionAnalysis?.overall?.averageImprovement || 0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comprehensive Recommendations */}
            {prescriptiveData.recommendations && (
              <div className="prescriptive-recommendations">
                <div className="recommendations-header">
                  <h3 className="section-subtitle">
                    <Lightbulb size={16} />
                    Comprehensive Recommendations
                  </h3>
                  <button 
                    className="recommendations-toggle-btn"
                    onClick={handleToggleRecommendations}
                    aria-label={isRecommendationsExpanded ? 'Collapse recommendations' : 'Expand recommendations'}
                  >
                    {isRecommendationsExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                    <span className="toggle-text">
                      {isRecommendationsExpanded ? 'Collapse' : 'Expand'}
                    </span>
                  </button>
                </div>

                <div className={`recommendations-content ${isRecommendationsExpanded ? 'recommendations-content--expanded' : 'recommendations-content--collapsed'}`}>
                  <div className="recommendations-grid">
                  {prescriptiveData.recommendations.immediate && prescriptiveData.recommendations.immediate.length > 0 && (
                    <div className="recommendation-category">
                      <h4 className="recommendation-title recommendation-title--critical">
                        <AlertCircle size={16} />
                        Immediate Action Required
                      </h4>
                      <div className="recommendation-list">
                        {prescriptiveData.recommendations.immediate.map((rec, index) => (
                          <div key={index} className="recommendation-item recommendation-item--critical">
                            <div className="recommendation-header">
                              <h5>{rec.title || 'Immediate Action Required'}</h5>
                              <span className="recommendation-timeline">{rec.timeline || 'ASAP'}</span>
                            </div>
                            <p className="recommendation-description">{rec.description || 'No description available'}</p>
                            <p className="recommendation-action"><strong>Action:</strong> {rec.action || 'Action required'}</p>
                            <p className="recommendation-impact"><strong>Expected Impact:</strong> {rec.expectedImpact || 'Positive impact expected'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {prescriptiveData.recommendations.shortTerm && prescriptiveData.recommendations.shortTerm.length > 0 && (
                    <div className="recommendation-category">
                      <h4 className="recommendation-title recommendation-title--high">
                        <TrendingUp size={16} />
                        Short-term Improvements (2-4 weeks)
                      </h4>
                      <div className="recommendation-list">
                        {prescriptiveData.recommendations.shortTerm.map((rec, index) => (
                          <div key={index} className="recommendation-item recommendation-item--high">
                            <div className="recommendation-header">
                              <h5>{rec.title || 'Short-term Improvement'}</h5>
                              <span className="recommendation-timeline">{rec.timeline || '2-4 weeks'}</span>
                            </div>
                            <p className="recommendation-description">{rec.description || 'No description available'}</p>
                            <p className="recommendation-action"><strong>Action:</strong> {rec.action || 'Action required'}</p>
                            <p className="recommendation-impact"><strong>Expected Impact:</strong> {rec.expectedImpact || 'Positive impact expected'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {prescriptiveData.recommendations.longTerm && prescriptiveData.recommendations.longTerm.length > 0 && (
                    <div className="recommendation-category">
                      <h4 className="recommendation-title recommendation-title--medium">
                        <Target size={16} />
                        Long-term Strategic Plans (2-3 months)
                      </h4>
                      <div className="recommendation-list">
                        {prescriptiveData.recommendations.longTerm.map((rec, index) => (
                          <div key={index} className="recommendation-item recommendation-item--medium">
                            <div className="recommendation-header">
                              <h5>{rec.title || 'Long-term Strategy'}</h5>
                              <span className="recommendation-timeline">{rec.timeline || '2-3 months'}</span>
                            </div>
                            <p className="recommendation-description">{rec.description || 'No description available'}</p>
                            <p className="recommendation-action"><strong>Action:</strong> {rec.action || 'Action required'}</p>
                            <p className="recommendation-impact"><strong>Expected Impact:</strong> {rec.expectedImpact || 'Positive impact expected'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}

            {/* Data Quality Metrics */}
            {prescriptiveData.dataQuality && (
            <div className="prescriptive-data-quality">
              <h3 className="section-subtitle">
                <Info size={16} />
                Analysis Data Quality & Coverage
              </h3>
              <div className="data-quality-metrics">
                <div className="quality-metric">
                  <span className="quality-label">Response Completeness</span>
                  <div className="quality-bar">
                    <div
                      className="quality-progress"
                        style={{width: `${prescriptiveData.dataQuality?.responseCompleteness || 0}%`}}
                    ></div>
                    </div>
                    <span className="quality-value">{prescriptiveData.dataQuality?.responseCompleteness || 0}%</span>
                </div>
                <div className="quality-metric">
                  <span className="quality-label">Assessment Coverage</span>
                  <div className="quality-bar">
                    <div
                      className="quality-progress"
                        style={{width: `${prescriptiveData.dataQuality?.assessmentCoverage || 0}%`}}
                    ></div>
                    </div>
                    <span className="quality-value">{prescriptiveData.dataQuality?.assessmentCoverage || 0}%</span>
                </div>
                <div className="quality-metric">
                  <span className="quality-label">Intervention Coverage</span>
                  <div className="quality-bar">
                    <div
                      className="quality-progress"
                        style={{width: `${prescriptiveData.dataQuality?.interventionCoverage || 0}%`}}
                    ></div>
                    </div>
                    <span className="quality-value">{prescriptiveData.dataQuality?.interventionCoverage || 0}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Footer */}
            <div className="prescriptive-footer">
              <div className="analysis-info">
                <p><strong>Analysis Generated:</strong> {prescriptiveData.timestamp ? new Date(prescriptiveData.timestamp).toLocaleString() : 'Just now'}</p>
                <p><strong>Mathematical Models Used:</strong> Bayesian Knowledge Tracing (BKT) & Item Response Theory (IRT)</p>
                <p><strong>Total Students Analyzed:</strong> {prescriptiveData.totalStudents || 0} across {prescriptiveData.totalSections || 0} sections</p>
              </div>
              <button
                onClick={fetchPrescriptiveAnalysis}
                className="refresh-analysis-button"
                disabled={prescriptiveLoading}
              >
                {prescriptiveLoading ? 'Regenerating...' : 'Refresh Analysis'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Analysis Modal */}
      <CategoryAnalysisModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categoryData={selectedCategoryData}
        categoryName={selectedCategory}
      />
    </div>
  );
};

export default AdminDashboard;