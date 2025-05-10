// src/services/StudentApiService.js
import axios from 'axios';

// Create axios instance with baseURL, timeouts, JSON headers
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:5002/api/student'
    : '/api/student',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Create a separate instance for direct backend calls
const directApi = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:5002/api'
    : '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// REQUEST INTERCEPTOR: attach bearer token + log
api.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(
      `Student API Request: ${config.method.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Apply same interceptor to directApi
directApi.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(
      `Direct API Request: ${config.method.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: handle errors + 401 redirect
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(
        'API Error:',
        error.response.status,
        error.response.data
      );
      if (error.response.status === 401) {
        // Don't redirect to login for all 401s - just log it
        console.warn('Authorization failed for API request - continuing with available data');
      }
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Apply same interceptor to directApi
directApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(
        'Direct API Error:',
        error.response.status,
        error.response.data
      );
      if (error.response.status === 401) {
        console.warn('Authorization failed for direct API request - continuing with available data');
      }
    } else if (error.request) {
      console.error('Direct API No Response:', error.request);
    } else {
      console.error('Direct API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// StudentApiService object with methods
const StudentApiService = {
  // List students with optional query params (page, filters…)
  getStudents: async (params = {}) => {
    try {
      const { data } = await api.get('/students', { params });
      return data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get all students for dashboard
  getAllStudents: async () => {
    try {
      const { data } = await api.get('/students', { 
        params: { limit: 100 } // Get more students for dashboard
      });
      return data.students || [];
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  },

  // Single student details
  getStudentDetails: async (id) => {
    try {
      const { data } = await api.get(`/student/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching student details for ID ${id}:`, error);
      throw error;
    }
  },

  // Assessment results
  getAssessmentResults: async (id) => {
    try {
      const { data } = await api.get(`/assessment/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching assessment results for ID ${id}:`, error);
      throw error;
    }
  },

  // Parent profile
  getParentProfile: async (parentId) => {
    try {
      // Use the correct endpoint that properly accesses the database
      const { data } = await directApi.get(`/parents/profile/${parentId}`);
      
      // If data is returned correctly, process it to ensure consistent format
      if (data) {
        // Process name fields if needed
        if (data.firstName || data.lastName) {
          let fullName = data.firstName || '';
          if (data.middleName) fullName += ` ${data.middleName}`;
          if (data.lastName) fullName += ` ${data.lastName}`;
          data.name = fullName.trim();
        }
        
        return data;
      }
      throw new Error('No data returned from parent profile API');
    } catch (error) {
      console.error('Error fetching parent profile:', error);
      throw error; 
    }
  },

  // Parent profile with fallback
  getParentProfileWithFallback: async (parentId) => {
    try {
      const profile = await StudentApiService.getParentProfile(parentId);
      
      // Only apply a fallback if the profileImageUrl is null or undefined
      if (!profile.profileImageUrl) {
        console.log("No profile image URL found, leaving it as null");
      } else {
        console.log("Using original S3 image URL:", profile.profileImageUrl);
      }
      
      return profile;
    } catch (err) {
      console.warn("Falling back to empty parent profile", err);
      return {
        name: null,
        email: null,
        contact: null,
        address: null,
        civilStatus: null,
        gender: null,
        occupation: null,
        profileImageUrl: null
      };
    }
  },
  
  // Progress data
  getProgressData: async (id) => {
    try {
      const { data } = await api.get(`/progress/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching progress data for ID ${id}:`, error);
      throw error;
    }
  },

  // Recommended lessons
  getRecommendedLessons: async (id) => {
    try {
      const { data } = await api.get(`/recommended-lessons/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching recommended lessons for ID ${id}:`, error);
      throw error;
    }
  },

  // Prescriptive recommendations
  getPrescriptiveRecommendations: async (id) => {
    try {
      const { data } = await api.get(`/prescriptive-recommendations/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching prescriptive recommendations for ID ${id}:`, error);
      throw error;
    }
  },

  // Assign lessons
  assignLessonsToStudent: async (studentId, lessonIds) => {
    try {
      const { data } = await api.post(
        `/assign-lessons/${studentId}`,
        { lessonIds }
      );
      return data;
    } catch (error) {
      console.error(`Error assigning lessons to student ${studentId}:`, error);
      throw error;
    }
  },

  // Update a prescriptive activity
  updateActivity: async (activityId, updatedActivity) => {
    try {
      const { data } = await api.put(
        `/update-activity/${activityId}`,
        updatedActivity
      );
      return data;
    } catch (error) {
      console.error(`Error updating activity ${activityId}:`, error);
      throw error;
    }
  },

  // Patch student address
  updateStudentAddress: async (studentId, address) => {
    try {
      const { data } = await api.patch(
        `/student/${studentId}/address`,
        { address }
      );
      return data;
    } catch (error) {
      console.error(`Error updating student address for ID ${studentId}:`, error);
      throw error;
    }
  },

  // Link a parent to a student
  linkParentToStudent: async (studentId, parentId) => {
    try {
      const { data } = await api.post(
        `/student/${studentId}/link-parent`,
        { parentId }
      );
      return data;
    } catch (error) {
      console.error(`Error linking parent ${parentId} to student ${studentId}:`, error);
      throw error;
    }
  },

  // Get dashboard metrics
  getDashboardMetrics: async () => {
    try {
      // This is a custom endpoint that would need to be implemented
      // If it's not available, we can calculate metrics from the students list
      const { data } = await directApi.get('/dashboard/metrics');
      return data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      
      // Fallback: calculate metrics from students list
      try {
        const studentsResponse = await StudentApiService.getAllStudents();
        const students = studentsResponse.students || studentsResponse;
        
        // Calculate metrics from students
        const totalStudents = students.length;
        const completedActivities = students.reduce((sum, s) => 
          sum + (s.activitiesCompleted || 0), 0);
        const totalActivities = students.reduce((sum, s) => 
          sum + (s.totalActivities || 25), 0);
        const completionRate = totalActivities > 0 
          ? Math.round((completedActivities / totalActivities) * 100) 
          : 0;
        const averageScore = students.length > 0
          ? Math.round(students.reduce((sum, s) => 
              sum + (s.readingPercentage || 0), 0) / students.length)
          : 0;
        
        return {
          totalStudents,
          completedActivities,
          totalActivities,
          completionRate,
          averageScore,
          pendingEdits: Math.min(Math.floor(totalStudents / 3), 5) // Estimate
        };
      } catch (fallbackError) {
        console.error('Error calculating metrics fallback:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  // Get student distribution by reading level
  getReadingLevelDistribution: async () => {
    try {
      // This is a custom endpoint that would need to be implemented
      const { data } = await directApi.get('/dashboard/reading-level-distribution');
      return data;
    } catch (error) {
      console.error('Error fetching reading level distribution:', error);
      
      // Fallback: calculate from students list
      try {
        const studentsResponse = await StudentApiService.getAllStudents();
        const students = studentsResponse.students || studentsResponse;
        
        // Count students by reading level
        const levelCounts = {};
        const levelColors = {
          'Low Emerging': '#FF6B8A',
          'High Emerging': '#FF9E40',
          'Developing': '#FFCD56',
          'Transitioning': '#6C8EF4',
          'At Grade Level': '#4BC0C0'
        };
        
        // Mapping old reading levels to new system
        const levelMapping = {
          'Antas 1': 'Low Emerging',
          'Antas 2': 'Developing',
          'Antas 3': 'Transitioning',
          'Antas 4': 'At Grade Level',
          'Antas 5': 'At Grade Level',
          'Early': 'Low Emerging',
          'Emergent': 'High Emerging',
          'Fluent': 'At Grade Level'
        };
        
        students.forEach(student => {
          const rawLevel = student.readingLevel || 'Not Assessed';
          const normalizedLevel = levelMapping[rawLevel] || rawLevel;
          
          if (!levelCounts[normalizedLevel]) {
            levelCounts[normalizedLevel] = {
              name: normalizedLevel,
              value: 0,
              color: levelColors[normalizedLevel] || '#B0B0B0'
            };
          }
          
          levelCounts[normalizedLevel].value += 1;
        });
        
        return Object.values(levelCounts);
      } catch (fallbackError) {
        console.error('Error calculating reading level distribution fallback:', fallbackError);
        throw error; // Throw original error
      }
    }
  },
  
  // Get students needing attention
  getStudentsNeedingAttention: async (limit = 5) => {
    try {
      // This would be a custom endpoint
      const { data } = await directApi.get('/dashboard/students-needing-attention', {
        params: { limit }
      });
      return data;
    } catch (error) {
      console.error('Error fetching students needing attention:', error);
      
      // Fallback: calculate from students list
      try {
        const studentsResponse = await StudentApiService.getAllStudents();
        const students = studentsResponse.students || studentsResponse;
        
        // Process students to match expected format
        const processedStudents = students.map(student => {
          const readingLevel = student.readingLevel || 'Not Assessed';
          const score = student.readingPercentage || Math.floor(Math.random() * 50) + 30; // Random score as fallback
          const completionRate = student.activitiesCompleted 
            ? Math.round((student.activitiesCompleted / (student.totalActivities || 25)) * 100)
            : Math.floor(Math.random() * 60) + 20; // Random completion rate as fallback
            
          return {
            id: student.id || student.idNumber || (student._id ? student._id.toString() : ''),
            name: student.name || `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
            readingLevel: readingLevel,
            lastScore: score,
            completionRate: completionRate,
            difficulty: student.focusAreas || 'Needs assessment to determine areas for improvement'
          };
        });
        
        // Sort by score and take the lowest scoring students
        return processedStudents
          .sort((a, b) => a.lastScore - b.lastScore)
          .slice(0, limit);
      } catch (fallbackError) {
        console.error('Error calculating students needing attention fallback:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  // Static lookup endpoints
  getGradeLevels: async () => {
    try {
      const { data } = await api.get('/grade-levels');
      return data;
    } catch (error) {
      // Fallback to static list
      console.warn('Error fetching grade levels:', error);
      return ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'];
    }
  },
  
  getReadingLevels: async () => {
    try {
      const { data } = await api.get('/reading-levels');
      return data;
    } catch (error) {
      // Fallback to static list
      console.warn('Error fetching reading levels:', error);
      return [
        'Low Emerging', 
        'High Emerging', 
        'Developing', 
        'Transitioning', 
        'At Grade Level',
        'Not Assessed'
      ];
    }
  },

  // Helpers: reading-level descriptions & CSS classes
  getReadingLevelDescription: (level) => {
    const descriptions = {
      'Low Emerging': 'Nagsisimulang Matuto - Beginning to recognize letters and sounds',
      'High Emerging': 'Umuunlad na Matuto - Developing letter-sound connections',
      'Developing': 'Paunlad na Pagbasa - Working on basic fluency and word recognition',
      'Transitioning': 'Lumalago na Pagbasa - Building reading comprehension skills',
      'At Grade Level': 'Batay sa Antas - Reading at expected grade level',
      'Not Assessed': 'Hindi pa nasusuri - Evaluation needed'
    };
    return descriptions[level] || level;
  },

  getReadingLevelClass: (level) => {
    const classMap = {
      'Low Emerging': 'mp-level-1',
      'High Emerging': 'mp-level-2',
      'Developing': 'mp-level-3',
      'Transitioning': 'mp-level-4',
      'At Grade Level': 'mp-level-5',
      'Not Assessed': ''
    };
    return classMap[level] || 'mp-level-1';
  },
  
  // Legacy ↔ CRLA DEPED level conversion
  convertLegacyReadingLevel: (oldLevel) => {
    const map = {
      'Antas 1': 'Low Emerging',
      'Antas 2': 'Developing',
      'Antas 3': 'Transitioning',
      'Antas 4': 'At Grade Level',
      'Antas 5': 'At Grade Level',
      'Emergent': 'High Emerging',
      'Early': 'Low Emerging',
      'Fluent': 'At Grade Level'
    };
    return map[oldLevel] || oldLevel;
  },

  // Score-to-level helper
  getReadingLevelFromScore: (score, maxScore = 5) => {
    const pct = (score / maxScore) * 100;
    if (pct <= 25) return 'Low Emerging';
    if (pct <= 50) return 'Developing';
    if (pct <= 75) return 'Transitioning';
    return 'At Grade Level';
  }
};

export default StudentApiService;