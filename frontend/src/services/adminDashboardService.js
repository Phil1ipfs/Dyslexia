// src/services/adminDashboardService.js
/**
 * Admin Dashboard Service
 * This service handles all data fetching for the admin dashboard.
 * Currently using mock data but designed to be easily replaced with MongoDB queries.
 */
// Configuration for the service
const config = {
  // Set to true for mock data, false for API calls
  useMockData: true,
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
  refreshInterval: 30000, // 30 seconds
  // MongoDB collections (for future reference)
  collections: {
    users: 'users',
    activities: 'activities',
    assessments: 'assessments',
    prescriptiveData: 'prescriptiveData',
    teacherPerformance: 'teacherPerformance',
    systemLogs: 'systemLogs'
  }
};

/**
 * Database query templates for MongoDB integration
 * These can be used when transitioning from mock data to real database
 */
const mongoQueries = {
  getUserStats: {
    totalUsers: { $match: {} },
    activeUsers: { $match: { lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) } } },
    userTypes: { $group: { _id: '$userType', count: { $sum: 1 } } }
  },
  getActivityStats: {
    totalActivities: { $match: { type: 'activity' } },
    completedActivities: { $match: { status: 'completed' } },
    pendingApprovals: { $match: { status: 'pending_approval' } }
  },
  getStudentPerformance: {
    byReadingLevel: {
      $group: {
        _id: '$readingLevel',
        count: { $sum: 1 },
        avgScore: { $avg: '$averageScore' }
      }
    },
    challengeAreas: {
      $group: {
        _id: '$challengeArea',
        studentCount: { $sum: 1 },
        avgScore: { $avg: '$scores.$challengeArea' }
      }
    }
  },
  getTeacherPerformance: {
    topPerformers: {
      $group: {
        _id: '$teacherId',
        studentsHelped: { $sum: 1 },
        avgImprovement: { $avg: '$studentImprovement' },
        activitiesCreated: { $sum: '$activitiesCreated' }
      }
    }
  }
};

/**
 * API utility functions
 */
const api = {
  get: async (endpoint) => {
    if (config.useMockData) {
      // Return mock data instead of making API call
      return mockDataService[endpoint]();
    }
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  post: async (endpoint, data) => {
    if (config.useMockData) {
      console.log('Mock POST to:', endpoint, data);
      return { success: true };
    }
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  // MongoDB query helper (for future use)
  mongoQuery: async (collection, query, options = {}) => {
    const endpoint = `/mongodb/${collection}/find`;
    const data = { query, options };
    return api.post(endpoint, data);
  }
};

/**
 * Mock data service
 * This provides realistic mock data for the dashboard
 */
const mockDataService = {
  getDashboardStats: () => {
    return Promise.resolve({
      users: {
        total: 2456,
        students: 1950,
        teachers: 126,
        parents: 350,
        admins: 30,
        activeToday: 487,
        // User type distribution
        userGrowth: {
          month: 12.5,
          week: 3.2,
          day: 0.8
        }
      },
      activities: {
        totalApproved: 103,
        pendingApproval: 20,
        rejected: 5,
        totalActivities: 450,
        completedActivities: 3250,
        averageCompletionRate: 67.5,
        completionTrend: 'up'
      },
      prescriptiveAnalytics: {
        highPriorityStudents: 20,
        needingIntervention: 45,
        onTarget: 1250,
        excelling: 635,
        averageReadingLevel: 2.3,
        improvementRate: 15.2
      },
      academicData: {
        averageScore: 52,
        overallTrend: 'improving',
        patternAnalysis: {
          phonics: 55,
          wordRecognition: 48,
          comprehension: 52,
          fluency: 50,
          vocabulary: 58
        },
        antasDistribution: {
          'Antas 1': 580,
          'Antas 2': 690,
          'Antas 3': 490,
          'Antas 4': 190,
          'Antas 5': 0
        },
        assessmentCompletion: {
          preAssessment: 95,
          ongoing: 78,
          postAssessment: 45
        }
      },
      systemHealth: {
        uptime: 99.9,
        activeUsers: 487,
        avgResponseTime: 250,
        errorRate: 0.1,
        databaseHealth: 'good',
        serverLoad: 35
      }
    });
  },
  
  getRecentActivities: (limit = 10) => {
    const activityTypes = [
      'student_assessment',
      'teacher_activity',
      'parent_engagement',
      'system_alert',
      'approval',
      'user_registration',
      'data_export',
      'system_update'
    ];
    
    const statuses = ['success', 'warning', 'error', 'pending', 'info'];
    
    const activities = {
      student_assessment: [
        'Completed Phonics Assessment - Antas 2',
        'Submitted Comprehension Test - Antas 3',
        'Finished Pre-assessment evaluation',
        'Achieved 90% in Word Recognition'
      ],
      teacher_activity: [
        'Submitted new activity for approval',
        'Updated lesson plan for Antas 2',
        'Created custom assessment',
        'Submitted weekly progress report'
      ],
      parent_engagement: [
        'Viewed Ana Ramirez progress report',
        'Downloaded monthly assessment',
        'Scheduled parent-teacher meeting',
        'Accessed student dashboard'
      ],
      system_alert: [
        'Low performance detected',
        'System maintenance required',
        'Database backup completed',
        'New security patch applied'
      ],
      approval: [
        'Activity approved by admin',
        'Assessment template approved',
        'New user account approved',
        'Resource permission granted'
      ],
      user_registration: [
        'New student registered',
        'New teacher onboarded',
        'Parent account created',
        'Admin user added'
      ],
      data_export: [
        'Monthly report generated',
        'Student data exported',
        'Assessment results exported',
        'Analytics dashboard exported'
      ],
      system_update: [
        'System updated to v2.3.0',
        'New feature deployed',
        'Security patch applied',
        'Database optimized'
      ]
    };
    
    const generateActivity = (index) => {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Make sure the type exists in our activities object before accessing
      const actionsForType = activities[type] || [];
      const action = actionsForType.length > 0 
        ? actionsForType[Math.floor(Math.random() * actionsForType.length)] 
        : 'Performed an action';
      
      const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Carlos'];
      const lastNames = ['Cruz', 'Santos', 'Reyes', 'Gomez', 'Mendoza'];
      
      return {
        id: Date.now() + index,
        type,
        user: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        action,
        timestamp: new Date(Date.now() - Math.random() * 3600000 * 24).toISOString(),
        status,
        details: `Score: ${Math.floor(Math.random() * 100)}/100`
      };
    };
    
    return Promise.resolve(
      Array.from({ length: limit }, (_, i) => generateActivity(i))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
  },
  
  getSystemAlerts: () => {
    return Promise.resolve([
      {
        id: 'alert_001',
        type: 'critical',
        title: 'Reading Comprehension Performance Alert',
        message: '15 students in Antas 2 scoring below 40% in comprehension activities over the past week',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        action: 'View Details',
        impact: 'high',
        category: 'academic_performance'
      },
      {
        id: 'alert_002',
        type: 'warning',
        title: 'Pending Teacher Approvals',
        message: '8 activities have been awaiting approval for more than 24 hours',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        action: 'Review Pending',
        impact: 'medium',
        category: 'workflow'
      },
      {
        id: 'alert_003',
        type: 'info',
        title: 'Weekly Performance Report Available',
        message: 'Performance analytics for week 3-2025 are now ready for review and download',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        action: 'Download Report',
        impact: 'low',
        category: 'reporting'
      },
      {
        id: 'alert_004',
        type: 'warning',
        title: 'Low Parent Engagement',
        message: 'Parent dashboard access has decreased by 25% this month',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        action: 'View Analytics',
        impact: 'medium',
        category: 'engagement'
      }
    ]);
  },
  
  getPrescriptiveAnalytics: () => {
    return Promise.resolve({
      studentCategories: [
        {
          category: 'excelling',
          label: 'Excelling Students',
          count: 635,
          color: '#4CAF50',
          details: 'Students performing above 80% consistently',
          trend: 'up',
          percentage: 32.5
        },
        {
          category: 'onTarget',
          label: 'On Target',
          count: 1250,
          color: '#2196F3',
          details: 'Students meeting expected progress',
          trend: 'stable',
          percentage: 64.1
        },
        {
          category: 'needingSupport',
          label: 'Needing Support',
          count: 45,
          color: '#FF9800',
          details: 'Students requiring additional interventions',
          trend: 'down',
          percentage: 2.3
        },
        {
          category: 'highPriority',
          label: 'High Priority',
          count: 20,
          color: '#F44336',
          details: 'Students requiring immediate intervention',
          trend: 'down',
          percentage: 1.0
        }
      ],
      commonChallenges: [
        {
          area: 'Phonological Awareness',
          affectedStudents: 420,
          averageScore: 48,
          trend: 'improving',
          improvementRate: 5.2,
          targetScore: 75
        },
        {
          area: 'Word Recognition',
          affectedStudents: 380,
          averageScore: 52,
          trend: 'stable',
          improvementRate: 1.1,
          targetScore: 80
        },
        {
          area: 'Reading Comprehension',
          affectedStudents: 520,
          averageScore: 45,
          trend: 'declining',
          improvementRate: -2.3,
          targetScore: 70
        },
        {
          area: 'Reading Fluency',
          affectedStudents: 350,
          averageScore: 55,
          trend: 'improving',
          improvementRate: 3.8,
          targetScore: 85
        },
        {
          area: 'Vocabulary',
          affectedStudents: 280,
          averageScore: 58,
          trend: 'improving',
          improvementRate: 4.5,
          targetScore: 75
        }
      ],
      interventionRecommendations: [
        {
          area: 'Reading Comprehension',
          recommendation: 'Implement daily reading sessions with guided questions',
          priority: 'high',
          expectedImprovement: 15
        },
        {
          area: 'Phonological Awareness',
          recommendation: 'Increase use of audio-visual learning aids',
          priority: 'medium',
          expectedImprovement: 10
        }
      ]
    });
  },
  
  getTeacherPerformance: () => {
    return Promise.resolve({
      topPerformers: [
        {
          id: 't_001',
          name: 'Ms. Maria Santos',
          studentsHelped: 45,
          averageImprovement: 38,
          rating: 4.9,
          department: 'Grade 1',
          specialization: 'Reading Comprehension'
        },
        {
          id: 't_002',
          name: 'Mr. Juan Torres',
          studentsHelped: 38,
          averageImprovement: 35,
          rating: 4.8,
          department: 'Grade 2',
          specialization: 'Phonics'
        },
        {
          id: 't_003',
          name: 'Ms. Isabella Cruz',
          studentsHelped: 42,
          averageImprovement: 32,
          rating: 4.7,
          department: 'Grade 3',
          specialization: 'Writing'
        },
        {
          id: 't_004',
          name: 'Mr. Pedro Ramirez',
          studentsHelped: 35,
          averageImprovement: 30,
          rating: 4.6,
          department: 'Special Education',
          specialization: 'Intervention'
        },
        {
          id: 't_005',
          name: 'Ms. Ana Gomez',
          studentsHelped: 40,
          averageImprovement: 28,
          rating: 4.5,
          department: 'Grade 1',
          specialization: 'Vocabulary'
        }
      ],
      engagement: {
        activitiesCreated: 128,
        studentsMonitored: 1250,
        parentCommunications: 340,
        averageResponseTime: 4.2,
        weeklyContribution: {
          newActivities: 12,
          assessmentsGraded: 156,
          progressReports: 45,
          parentMeetings: 8
        }
      },
      performance: {
        overallRating: 4.5,
        engagementRate: 92,
        completionRate: 89,
        satisfactionRate: 94
      },
      departments: [
        { name: 'Grade 1', teachers: 35, avgPerformance: 4.6, studentsImpact: 420 },
        { name: 'Grade 2', teachers: 32, avgPerformance: 4.5, studentsImpact: 390 },
        { name: 'Grade 3', teachers: 28, avgPerformance: 4.4, studentsImpact: 380 },
        { name: 'Special Education', teachers: 15, avgPerformance: 4.7, studentsImpact: 75 },
        { name: 'Intervention', teachers: 10, avgPerformance: 4.8, studentsImpact: 60 }
      ]
    });
  },
  
  getStudentProgress: () => {
    return Promise.resolve({
      overall: {
        averageProgress: 67.5,
        completionRate: 82.3,
        engagementRate: 78.9,
        retentionRate: 94.2
      },
      byAntas: {
        'Antas 1': {
          progress: 75.2,
          students: 580,
          avgScore: 68,
          challenges: ['Phonics', 'Letter Recognition']
        },
        'Antas 2': {
          progress: 69.8,
          students: 690,
          avgScore: 62,
          challenges: ['Word Recognition', 'Simple Comprehension']
        },
        'Antas 3': {
          progress: 64.5,
          students: 490,
          avgScore: 58,
          challenges: ['Reading Fluency', 'Complex Comprehension']
        },
        'Antas 4': {
          progress: 58.2,
          students: 190,
          avgScore: 54,
          challenges: ['Advanced Comprehension', 'Critical Thinking']
        }
      },
      progressTrends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          progress: 65 + Math.random() * 10
        })).reverse(),
        weekly: Array.from({ length: 4 }, (_, i) => ({
          week: `Week ${i + 1}`,
          progress: 60 + Math.random() * 15
        })),
        monthly: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
          progress: 58 + Math.random() * 20
        })).reverse()
      }
    });
  },
  
  getParentEngagement: () => {
    return Promise.resolve({
      overall: {
        activeParents: 280,
        totalParents: 350,
        engagementRate: 80,
        avgWeeklyLogins: 3.5
      },
      activities: {
        dashboardViews: 1250,
        reportDownloads: 420,
        teacherCommunications: 340,
        meetingsScheduled: 85,
        feedbackSubmitted: 195
      },
      satisfaction: {
        overall: 4.3,
        communication: 4.5,
        reportClarity: 4.2,
        systemUsability: 4.1,
        support: 4.4
      },
      trends: {
        monthly: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
          engagement: 75 + Math.random() * 15
        })).reverse()
      }
    });
  }
};

/**
 * Main service class for admin dashboard
 * This class provides all the data needed for the admin dashboard
 * and can easily be switched between mock data and real MongoDB queries
 */
class AdminDashboardService {
  constructor() {
    this.mockData = mockDataService;
  }
  
  // Dashboard statistics
  async getDashboardStats() {
    if (config.useMockData) {
      return this.mockData.getDashboardStats();
    }
    // MongoDB implementation
    const [users, activities, academic, system] = await Promise.all([
      api.mongoQuery(config.collections.users, mongoQueries.getUserStats),
      api.mongoQuery(config.collections.activities, mongoQueries.getActivityStats),
      api.mongoQuery(config.collections.assessments, mongoQueries.getStudentPerformance),
      api.get('/dashboard/system-health')
    ]);
    return {
      users,
      activities,
      academicData: academic,
      systemHealth: system
    };
  }
  
  // Recent activities
  async getRecentActivities(limit = 10) {
    if (config.useMockData) {
      return this.mockData.getRecentActivities(limit);
    }
    return api.mongoQuery(config.collections.systemLogs, {
      $match: {},
      $sort: { timestamp: -1 },
      $limit: limit
    });
  }
  
  // System alerts
  async getSystemAlerts() {
    if (config.useMockData) {
      return this.mockData.getSystemAlerts();
    }
    return api.get('/dashboard/alerts');
  }
  
  // Prescriptive analytics
  async getPrescriptiveAnalytics() {
    if (config.useMockData) {
      return this.mockData.getPrescriptiveAnalytics();
    }
    return api.get('/dashboard/prescriptive-analytics');
  }
  
  // Teacher performance
  async getTeacherPerformance() {
    if (config.useMockData) {
      return this.mockData.getTeacherPerformance();
    }
    return api.mongoQuery(config.collections.teacherPerformance,
      mongoQueries.getTeacherPerformance
    );
  }
  
  // Student progress
  async getStudentProgress() {
    if (config.useMockData) {
      return this.mockData.getStudentProgress();
    }
    return api.get('/dashboard/student-progress');
  }
  
  // Parent engagement
  async getParentEngagement() {
    if (config.useMockData) {
      return this.mockData.getParentEngagement();
    }
    return api.get('/dashboard/parent-engagement');
  }
  
  // Utility methods for data manipulation
  calculateTrends(data, timeframe = 'weekly') {
    // Implement trend calculation logic
    return data.map((item, index) => ({
      ...item,
      trend: index > 0 ?
        ((item.value - data[index - 1].value) / data[index - 1].value * 100).toFixed(1) :
        0
    }));
  }
  
  async exportDashboardData(format = 'json', dateRange = null) {
    const data = await Promise.all([
      this.getDashboardStats(),
      this.getRecentActivities(),
      this.getPrescriptiveAnalytics(),
      this.getTeacherPerformance()
    ]);
    
    const dashboardData = {
      exportDate: new Date().toISOString(),
      dateRange,
      stats: data[0],
      activities: data[1],
      prescriptiveAnalytics: data[2],
      teacherPerformance: data[3]
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(dashboardData, null, 2);
      case 'csv':
        // Implement CSV export logic
        return this.convertToCSV(dashboardData);
      default:
        return dashboardData;
    }
  }
  
  convertToCSV(data) {
    // Implement CSV conversion logic
    const csv = [];
    // Convert data to CSV format
    return csv.join('\n');
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;