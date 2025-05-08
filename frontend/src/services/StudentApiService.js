// // src/services/StudentApiService.js
// import axios from 'axios';

// // Setup axios defaults
// const api = axios.create({
//     baseURL: import.meta.env.DEV ? 'http://localhost:5002/api/student' : '/api/student',
//     timeout: 30000, // 30 second timeout
//     headers: {
//       'Content-Type': 'application/json',
//       'X-Requested-With': 'XMLHttpRequest'
//     }
//   });

// // Add request interceptor for auth token
// api.interceptors.request.use(
//   config => {
//     // Add the auth token to every request
//     const token = localStorage.getItem('token') || localStorage.getItem('authToken');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
    
//     console.log(`Student API Request: ${config.method.toUpperCase()} ${config.url}`);
//     return config;
//   },
//   error => {
//     console.error('API Request Error:', error);
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor for error handling
// api.interceptors.response.use(
//   response => {
//     return response;
//   },
//   error => {
//     if (error.response) {
//       console.error('API Error:', error.response.status, error.response.data);

//       if (error.response.status === 401) {
//         // Unauthorized - redirect to login
//         window.location.href = '/login';
//       }
//     } else if (error.request) {
//       console.error('API No Response:', error.request);
//     } else {
//       console.error('API Request Setup Error:', error.message);
//     }

//     return Promise.reject(error);
//   }
// );

// // Student Service API
// const StudentApiService = {
//   // Get all students with filtering options
//   getStudents: async (params = {}) => {
//     try {
//       const { data } = await api.get('/students', { params });
//       return data;
//     } catch (error) {
//       console.error('Error fetching students:', error);
//       throw error;
//     }
//   },
  
//   // Get a specific student's details
//   getStudentDetails: async (id) => {
//     try {
//       const { data } = await api.get(`/student/${id}`);
//       return data;
//     } catch (error) {
//       console.error(`Error fetching student details for ID ${id}:`, error);
//       throw error;
//     }
//   },
  
//   // Get assessment results for a student
//   getAssessmentResults: async (id) => {
//     try {
//       const { data } = await api.get(`/assessment/${id}`);
//       return data;
//     } catch (error) {
//       console.error(`Error fetching assessment for student ID ${id}:`, error);
//       throw error;
//     }
//   },
  
//   // Get progress data for a student
//   getProgressData: async (id) => {
//     try {
//       const { data } = await api.get(`/progress/${id}`);
//       return data;
//     } catch (error) {
//       console.error(`Error fetching progress data for student ID ${id}:`, error);
//       throw error;
//     }
//   },
  
//   // Get recommended lessons for a student
//   getRecommendedLessons: async (id) => {
//     try {
//       const { data } = await api.get(`/recommended-lessons/${id}`);
//       return data;
//     } catch (error) {
//       console.error(`Error fetching recommended lessons for student ID ${id}:`, error);
//       throw error;
//     }
//   },
  
//   // Get prescriptive recommendations for a student
//   getPrescriptiveRecommendations: async (id) => {
//     try {
//       const { data } = await api.get(`/prescriptive-recommendations/${id}`);
//       return data;
//     } catch (error) {
//       console.error(`Error fetching prescriptive recommendations for student ID ${id}:`, error);
//       throw error;
//     }
//   },
  
//   // Assign lessons to a student
//   assignLessonsToStudent: async (studentId, lessonIds) => {
//     try {
//       const { data } = await api.post(`/assign-lessons/${studentId}`, { lessonIds });
//       return data;
//     } catch (error) {
//       console.error(`Error assigning lessons to student ID ${studentId}:`, error);
//       throw error;
//     }
//   },
  
//   // Update an activity
//   updateActivity: async (activityId, updatedActivity) => {
//     try {
//       const { data } = await api.put(`/update-activity/${activityId}`, updatedActivity);
//       return data;
//     } catch (error) {
//       console.error(`Error updating activity ID ${activityId}:`, error);
//       throw error;
//     }
//   },
  
//   // Get all grade levels
//   getGradeLevels: async () => {
//     try {
//       const { data } = await api.get('/grade-levels');
//       return data;
//     } catch (error) {
//       console.error('Error fetching grade levels:', error);
//       throw error;
//     }
//   },
  
//   // Get all reading levels
//   getReadingLevels: async () => {
//     try {
//       const { data } = await api.get('/reading-levels');
//       return data;
//     } catch (error) {
//       console.error('Error fetching reading levels:', error);
//       throw error;
//     }
//   },
  
//   // Helper methods for reading level descriptions and colors
//   getReadingLevelDescription: (level) => {
//     const descriptions = {
//       'Low Emerging': 'Nagsisimulang Matuto',
//       'High Emerging': 'Umuunlad na Matuto',
//       'Developing': 'Paunlad na Pagbasa',
//       'Transitioning': 'Lumalago na Pagbasa',
//       'At Grade Level': 'Batay sa Antas',
//       'Not Assessed': 'Hindi pa nasusuri'
//     };
//     return descriptions[level] || level;
//   },
  
//   getReadingLevelClass: (level) => {
//     const classMap = {
//       'Low Emerging': 'mp-level-1',
//       'High Emerging': 'mp-level-2',
//       'Developing': 'mp-level-3',
//       'Transitioning': 'mp-level-4',
//       'At Grade Level': 'mp-level-5',
//       'Not Assessed': ''
//     };
//     return classMap[level] || 'mp-level-1';
//   },
  
//   // Convert legacy reading level to new CRLA DEPED system
//   convertLegacyReadingLevel: (level) => {
//     const levelMap = {
//       'Antas 1': 'Low Emerging',
//       'Antas 2': 'Developing',
//       'Antas 3': 'Transitioning',
//       'Antas 4': 'At Grade Level', 
//       'Antas 5': 'At Grade Level',
//       'Emergent': 'Low Emerging',
//       'Early': 'Developing',
//       'Fluent': 'At Grade Level'
//     };
//     return levelMap[level] || level;
//   },
  
//   // Get reading level from score
//   getReadingLevelFromScore: (score, maxScore = 5) => {
//     const percentage = (score / maxScore) * 100;
    
//     if (percentage <= 25) {
//       return 'Low Emerging';
//     } else if (percentage <= 50) {
//       return 'Developing';
//     } else if (percentage <= 75) {
//       return 'Transitioning';
//     } else {
//       return 'At Grade Level';
//     }
//   }
// };

// export default StudentApiService;


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
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Setup Error:', error.message);
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

  // ▶ Lookup parent profile
  getParentProfile: async (parentId) => {
    const { data } = await api.get(`/parent/${parentId}`);
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
