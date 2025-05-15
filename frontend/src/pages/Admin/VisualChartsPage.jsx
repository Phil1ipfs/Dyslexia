// src/components/Admin/Charts/AdminVisualCharts.jsx
import React, { useState, useEffect } from 'react';
import { adminDashboardService } from '../../services/adminDashboardService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import '../../css/Admin/Charts/AdminVisualCharts.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminVisualCharts = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: null,
    studentProgress: null,
    teacherPerformance: null,
    prescriptiveAnalytics: null,
    parentEngagement: null
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  const [selectedMetric, setSelectedMetric] = useState('progress');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stats, studentProgress, teacherPerformance, prescriptiveAnalytics, parentEngagement] = await Promise.all([
          adminDashboardService.getDashboardStats(),
          adminDashboardService.getStudentProgress(),
          adminDashboardService.getTeacherPerformance(),
          adminDashboardService.getPrescriptiveAnalytics(),
          adminDashboardService.getParentEngagement()
        ]);

        setData({
          stats,
          studentProgress,
          teacherPerformance,
          prescriptiveAnalytics,
          parentEngagement
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for charts
  const prepareProgressData = () => {
    if (!data.studentProgress) return [];
    return data.studentProgress.progressTrends[selectedTimeframe] || [];
  };

  const prepareReadingLevelData = () => {
    if (!data.stats?.academicData?.antasDistribution) return [];
    return Object.entries(data.stats.academicData.antasDistribution).map(([level, count]) => ({
      name: level,
      value: count,
      percentage: ((count / 1950) * 100).toFixed(1)
    }));
  };

  const preparePatternAnalysisData = () => {
    if (!data.stats?.academicData?.patternAnalysis) return [];
    return Object.entries(data.stats.academicData.patternAnalysis).map(([area, score]) => ({
      area,
      score,
      target: 75 // Target score
    }));
  };

  const prepareChallengeData = () => {
    if (!data.prescriptiveAnalytics?.commonChallenges) return [];
    return data.prescriptiveAnalytics.commonChallenges.map(challenge => ({
      ...challenge,
      improvement: challenge.improvementRate || 0
    }));
  };

  const prepareTeacherPerformanceData = () => {
    if (!data.teacherPerformance?.topPerformers) return [];
    return data.teacherPerformance.topPerformers.slice(0, 5).map(teacher => ({
      name: teacher.name.split(' ')[0], // Short name for chart
      rating: teacher.rating,
      improvement: teacher.averageImprovement,
      students: teacher.studentsHelped
    }));
  };

  const prepareUserGrowthData = () => {
    // Simulated monthly growth data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      students: 1800 + index * 150,
      teachers: 110 + index * 16,
      parents: 320 + index * 30,
      total: 2230 + index * 196
    }));
  };

  if (loading) {
    return (
      <div className="admin-visual-charts__loading">
        <div className="admin-visual-charts__loading-spinner">Loading charts...</div>
      </div>
    );
  }

  return (
    <div className="admin-visual-charts">
      <div className="admin-visual-charts__header">
        <h1 className="admin-visual-charts__title">Visual Analytics Dashboard</h1>
        <div className="admin-visual-charts__controls">
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="admin-visual-charts__select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="admin-visual-charts__select"
          >
            <option value="progress">Progress</option>
            <option value="engagement">Engagement</option>
            <option value="performance">Performance</option>
          </select>
        </div>
      </div>

      <div className="admin-visual-charts__content">
        {/* Student Progress Trend Chart */}
        <div className="admin-visual-charts__section">
          <h2 className="admin-visual-charts__section-title">Student Progress Trends</h2>
          <div className="admin-visual-charts__chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={prepareProgressData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  formatter={(value) => {
                    if (selectedTimeframe === 'daily') {
                      return new Date(value).toLocaleDateString('en', { weekday: 'short' });
                    }
                    return value;
                  }}
                />
                <YAxis stroke="#6b7280" label={{ value: '% Progress', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Progress']}
                  labelFormatter={(label) => {
                    if (selectedTimeframe === 'daily') {
                      return new Date(label).toLocaleDateString();
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reading Level Distribution */}
        <div className="admin-visual-charts__section admin-visual-charts__section--half">
          <h2 className="admin-visual-charts__section-title">Reading Level Distribution</h2>
          <div className="admin-visual-charts__chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareReadingLevelData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {prepareReadingLevelData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, name === 'value' ? 'Students' : name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Pattern Analysis */}
        <div className="admin-visual-charts__section admin-visual-charts__section--half">
          <h2 className="admin-visual-charts__section-title">Performance Pattern Analysis</h2>
          <div className="admin-visual-charts__chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={preparePatternAnalysisData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="area" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#f3f4f6" strokeDasharray="5,5" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Common Challenges Chart */}
        <div className="admin-visual-charts__section">
          <h2 className="admin-visual-charts__section-title">Common Learning Challenges</h2>
          <div className="admin-visual-charts__chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={prepareChallengeData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="area" stroke="#6b7280" />
                <YAxis yAxisId="left" orientation="left" stroke="#6b7280" label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Avg Score %', angle: 90, position: 'insideRight' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'affectedStudents' ? value : `${value}%`,
                    name === 'affectedStudents' ? 'Students' : name === 'averageScore' ? 'Average Score' : 'Improvement Rate'
                  ]}
                />
                <Bar yAxisId="left" dataKey="affectedStudents" fill="#ef4444" />
                <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="#3b82f6" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="improvement" stroke="#10b981" strokeWidth={2} />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Teacher Performance Radar */}
        <div className="admin-visual-charts__section admin-visual-charts__section--half">
          <h2 className="admin-visual-charts__section-title">Top Teacher Performance</h2>
          <div className="admin-visual-charts__chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={prepareTeacherPerformanceData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'rating' ? `${value}/5.0` : `${value}${name === 'improvement' ? '%' : ''}`,
                    name === 'rating' ? 'Rating' : name === 'improvement' ? 'Avg Improvement' : 'Students Helped'
                  ]}
                />
                <Bar dataKey="rating" fill="#3b82f6" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Trend */}
        <div className="admin-visual-charts__section admin-visual-charts__section--half">
          <h2 className="admin-visual-charts__section-title">User Growth Trends</h2>
          <div className="admin-visual-charts__chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={prepareUserGrowthData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Area type="monotone" dataKey="students" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="teachers" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="parents" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Parent Engagement Metrics */}
        <div className="admin-visual-charts__section">
          <h2 className="admin-visual-charts__section-title">Parent Engagement Overview</h2>
          <div className="admin-visual-charts__grid">
            <div className="admin-visual-charts__metric-card">
              <h3 className="admin-visual-charts__metric-title">Active Parents</h3>
              <div className="admin-visual-charts__metric-value">
                {data.parentEngagement?.overall?.activeParents || 0}
              </div>
              <div className="admin-visual-charts__metric-subtitle">
                of {data.parentEngagement?.overall?.totalParents || 0} total
              </div>
            </div>
            <div className="admin-visual-charts__metric-card">
              <h3 className="admin-visual-charts__metric-title">Engagement Rate</h3>
              <div className="admin-visual-charts__metric-value">
                {data.parentEngagement?.overall?.engagementRate || 0}%
              </div>
              <div className="admin-visual-charts__metric-subtitle">
                +2.5% from last month
              </div>
            </div>
            <div className="admin-visual-charts__metric-card">
              <h3 className="admin-visual-charts__metric-title">Avg Weekly Logins</h3>
              <div className="admin-visual-charts__metric-value">
                {data.parentEngagement?.overall?.avgWeeklyLogins || 0}
              </div>
              <div className="admin-visual-charts__metric-subtitle">
                per parent
              </div>
            </div>
            <div className="admin-visual-charts__metric-card">
              <h3 className="admin-visual-charts__metric-title">Satisfaction Score</h3>
              <div className="admin-visual-charts__metric-value">
                {data.parentEngagement?.satisfaction?.overall || 0}/5.0
              </div>
              <div className="admin-visual-charts__metric-subtitle">
                overall rating
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVisualCharts;