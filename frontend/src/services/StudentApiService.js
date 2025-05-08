// src/services/StudentApiService.js
import axios from 'axios';

// —————————————————————————————————————————————————————————
//  axios instance with baseURL, timeouts, JSON headers
// —————————————————————————————————————————————————————————
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

// —————————————————————————————————————————————————————————
//  REQUEST INTERCEPTOR: attach bearer token + log
// —————————————————————————————————————————————————————————
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

// —————————————————————————————————————————————————————————
//  RESPONSE INTERCEPTOR: handle errors + 401 redirect
// —————————————————————————————————————————————————————————
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

// —————————————————————————————————————————————————————————
//  StudentApiService
// —————————————————————————————————————————————————————————
const StudentApiService = {
  // ▶ List students with optional query params (page, filters…)
  getStudents: async (params = {}) => {
    const { data } = await api.get('/students', { params });
    return data;
  },

  // ▶ Single student details
  getStudentDetails: async (id) => {
    const { data } = await api.get(`/student/${id}`);
    return data;
  },

  // ▶ Assessment results
  getAssessmentResults: async (id) => {
    const { data } = await api.get(`/assessment/${id}`);
    return data;
  },

  // ▶ Parent profile - properly fetch from database
  getParentProfile: async (parentId) => {
    try {
      // Use the correct endpoint that properly accesses the database
      // This should connect to an endpoint that correctly accesses both databases:
      // - users_web database for the user information
      // - mobile_literexia database for profile information
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

  // ▶ Parent profile with fallback
  getParentProfileWithFallback: async (parentId) => {
    try {
      const profile = await StudentApiService.getParentProfile(parentId);
      
      // Use the S3 image URL directly - no more placeholder avatar service
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
  
  // ▶ Progress data
  getProgressData: async (id) => {
    const { data } = await api.get(`/progress/${id}`);
    return data;
  },

  // ▶ Recommended lessons
  getRecommendedLessons: async (id) => {
    const { data } = await api.get(`/recommended-lessons/${id}`);
    return data;
  },

  // ▶ Prescriptive recommendations
  getPrescriptiveRecommendations: async (id) => {
    const { data } = await api.get(`/prescriptive-recommendations/${id}`);
    return data;
  },

  // ▶ Assign lessons
  assignLessonsToStudent: async (studentId, lessonIds) => {
    const { data } = await api.post(
      `/assign-lessons/${studentId}`,
      { lessonIds }
    );
    return data;
  },

  // ▶ Update a prescriptive activity
  updateActivity: async (activityId, updatedActivity) => {
    const { data } = await api.put(
      `/update-activity/${activityId}`,
      updatedActivity
    );
    return data;
  },

  // ▶ Patch student address
  updateStudentAddress: async (studentId, address) => {
    const { data } = await api.patch(
      `/student/${studentId}/address`,
      { address }
    );
    return data;
  },

  // ▶ Link a parent to a student
  linkParentToStudent: async (studentId, parentId) => {
    const { data } = await api.post(
      `/student/${studentId}/link-parent`,
      { parentId }
    );
    return data;
  },

  // ▶ Static lookup endpoints
  getGradeLevels: async () => {
    const { data } = await api.get('/grade-levels');
    return data;
  },
  
  getReadingLevels: async () => {
    const { data } = await api.get('/reading-levels');
    return data;
  },

  // ▶ Helpers: reading-level descriptions & CSS classes
  getReadingLevelDescription: (level) => {
    const descriptions = {
      'Low Emerging':     'Nagsisimulang Matuto',
      'High Emerging':    'Umuunlad na Matuto',
      'Developing':       'Paunlad na Pagbasa',
      'Transitioning':    'Lumalago na Pagbasa',
      'At Grade Level':   'Batay sa Antas',
      'Not Assessed':     'Hindi pa nasusuri'
    };
    return descriptions[level] || level;
  },

  getReadingLevelClass: (level) => {
    const classMap = {
      'Low Emerging':     'mp-level-1',
      'High Emerging':    'mp-level-2',
      'Developing':       'mp-level-3',
      'Transitioning':    'mp-level-4',
      'At Grade Level':   'mp-level-5',
      'Not Assessed':     ''
    };
    return classMap[level] || 'mp-level-1';
  },
  
  // ▶ Legacy ↔ CRLA DEPED level conversion
  convertLegacyReadingLevel: (oldLevel) => {
    const map = {
      'Antas 1':  'Low Emerging',
      'Antas 2':  'Developing',
      'Antas 3':  'Transitioning',
      'Antas 4':  'At Grade Level',
      'Antas 5':  'At Grade Level',
      Emergent:   'Low Emerging',
      Early:      'Developing',
      Fluent:     'At Grade Level'
    };
    return map[oldLevel] || oldLevel;
  },

  // ▶ Score-to-level helper
  getReadingLevelFromScore: (score, maxScore = 5) => {
    const pct = (score / maxScore) * 100;
    if (pct <= 25) return 'Low Emerging';
    if (pct <= 50) return 'Developing';
    if (pct <= 75) return 'Transitioning';
    return 'At Grade Level';
  }
};

export default StudentApiService;