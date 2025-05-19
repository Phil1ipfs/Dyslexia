// src/services/Teachers/StudentDetailsService.js
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
            `Student Details API Request: ${config.method.toUpperCase()} ${config.url}`
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

// StudentDetailsService object with methods
const StudentDetailsService = {
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
            console.log("Fetching parent profile for ID:", parentId);
            // Use the correct endpoint that properly accesses the database
            const { data } = await directApi.get(`/parents/profile/${parentId}`);

            // If data is returned correctly, process it to ensure consistent format
            if (data) {
                console.log("Parent profile data received:", data);
                // Process name fields if needed
                if (!data.name && (data.firstName || data.lastName)) {
                    let fullName = data.firstName || '';
                    if (data.middleName) fullName += ` ${data.middleName}`;
                    if (data.lastName) fullName += ` ${data.lastName}`;
                    data.name = fullName.trim();
                }

                return data;
            }
            console.warn("No data returned from parent profile API");
            throw new Error('No data returned from parent profile API');
        } catch (error) {
            console.error('Error fetching parent profile:', error);
            throw error;
        }
    },


// In StudentDetailsService.js, update the getParentProfileWithFallback method to fall back to student.parent:

getParentProfileWithFallback: async (parentId, student = null) => {
    try {
      // If we already have parent info from the student object, use it
      if (student && student.parent && typeof student.parent === 'object' && 
          student.parent.name && student.parent.profileImageUrl) {
        console.log("Using parent info directly from student object:", student.parent);
        return student.parent;
      }
      
      if (!parentId) {
        console.log("No parent ID provided, returning null");
        return null;
      }
  
      console.log("Fetching parent profile with ID:", parentId);
      
      try {
        const { data } = await directApi.get(`/parents/profile/${parentId}`, {
          timeout: 8000 // Longer timeout since it checks multiple DBs
        });
        
        if (data) {
          console.log("Parent profile successfully retrieved from API:", data);
          
          // Ensure the profileImageUrl has a cache-busting parameter
          if (data.profileImageUrl) {
            const cacheBuster = Date.now();
            data.profileImageUrl = data.profileImageUrl.includes('?') 
              ? `${data.profileImageUrl}&t=${cacheBuster}` 
              : `${data.profileImageUrl}?t=${cacheBuster}`;
          }
          
          return data;
        }
      } catch (e) {
        console.warn("Parent fetch from API failed:", e.message);
        
        // If the student object has parent info, use it as a fallback
        if (student && student.parent && typeof student.parent === 'object') {
          console.log("Falling back to parent info from student object:", student.parent);
          return student.parent;
        }
      }
      
      console.warn("No parent profile found, returning null");
      return null;
    } catch (err) {
      console.warn("Error in getParentProfileWithFallback:", err);
      return null;
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

    // Send progress report to parent
    sendProgressReport: async (studentId, reportData) => {
        try {
            const { data } = await api.post(
                `/progress-report/${studentId}/send`,
                reportData
            );
            return data;
        } catch (error) {
            console.error(`Error sending progress report for student ${studentId}:`, error);
            throw error;
        }
    },

    // Export progress report to PDF
    exportProgressReport: async (studentId, includeInterventions = true) => {
        try {
            const { data } = await api.get(`/progress-report/${studentId}/export`, {
                params: { includeInterventions }
            });
            return data;
        } catch (error) {
            console.error(`Error exporting progress report for student ${studentId}:`, error);
            throw error;
        }
    },

    // Reading Level Helpers
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
            'Low Emerging': 'mp-level-1',
            'High Emerging': 'mp-level-2',
            'Developing': 'mp-level-3',
            'Transitioning': 'mp-level-4',
            'At Grade Level': 'mp-level-5',
            'Advanced': 'mp-level-5',
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
            'Antas 5': 'Advanced',
            'Emergent': 'High Emerging',
            'Early': 'Low Emerging',
            'Fluent': 'At Grade Level'
        };
        return map[oldLevel] || oldLevel;
    },

    // Score-to-level helper
    getReadingLevelFromScore: (score, maxScore = 5) => {
        const pct = (score / maxScore) * 100;
        if (pct <= 20) return 'Low Emerging';
        if (pct <= 40) return 'High Emerging';
        if (pct <= 60) return 'Developing';
        if (pct <= 80) return 'Transitioning';
        return 'At Grade Level';
    }
};

export default StudentDetailsService;