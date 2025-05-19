// src/services/Teachers/ViewStudentService.js
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
      `View Student API Request: ${config.method.toUpperCase()} ${config.url}`
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

// ViewStudentService object with methods
const ViewStudentService = {
  // List students with optional query params (page, filters, etc.)
  getStudents: async (params = {}) => {
    try {
      const { data } = await api.get('/students', { params });
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
      }
      
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
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
        return data.students;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  },
  
  // Search students by name
  searchStudents: async (query) => {
    try {
      const { data } = await api.get('/students/search', { 
        params: { q: query } 
      });
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  },

  // Filter students by criteria
  filterStudents: async (filters) => {
    try {
      const { data } = await api.get('/students/filter', { params: filters });
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error filtering students:', error);
      throw error;
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
      return ['Grade 1', 'Grade 2', 'Grade 3'];  
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
        'Advanced',
        'Not Assessed'
      ];
    }
  },
  
  getSections: async () => {
    try {
      const { data } = await api.get('/sections');
      return data;
    } catch (error) {
      // Fallback to static list
      console.warn('Error fetching sections:', error);
      return [
        'Sampaguita', 
        'Rosal', 
        'Rosa', 
        'Lily', 
        'Orchid',
        'Unity',
        'Peace',
        'Dignity'
      ];
    }
  },

  getReadingLevelDescription: (level) => {
    const descriptions = {
      'Low Emerging': 'Beginning to recognize letters and sounds',
      'High Emerging': 'Developing letter-sound connections',
      'Developing': 'Working on basic fluency and word recognition',
      'Transitioning': 'Building reading comprehension skills',
      'At Grade Level': 'Reading at expected grade level', 
      'Advanced': 'Reading above grade level with strong comprehension',
      'Not Assessed': 'Evaluation needed'
    };
    return descriptions[level] || level;
  },

  getReadingLevelClass: (level) => {
    const classMap = {
      'Low Emerging': 'vs-level-1',
      'High Emerging': 'vs-level-2',
      'Developing': 'vs-level-3',
      'Transitioning': 'vs-level-4',
      'At Grade Level': 'vs-level-5',
      'Advanced': 'vs-level-advanced',
      'Not Assessed': 'vs-level-na'
    };
    return classMap[level] || 'vs-level-na';
  },
  
  // Legacy ↔ CRLA DEPED level conversion
  convertLegacyReadingLevel: (oldLevel) => {
    if (!oldLevel) return 'Not Assessed';
    if (oldLevel === false) return 'Not Assessed';
    
    const map = {
      'Antas 1': 'Low Emerging',
      'Antas 2': 'Developing',
      'Antas 3': 'Transitioning',
      'Antas 4': 'At Grade Level',
      'Antas 5': 'Advanced',
      'Emergent': 'High Emerging',
      'Early': 'Low Emerging',
      'Fluent': 'At Grade Level'
    };
    return map[oldLevel] || oldLevel;
  }
};

export default ViewStudentService;