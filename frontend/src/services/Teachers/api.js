// src/services/Teachers/api.js
import axios from 'axios';

/**
 * Create a configured Axios instance for API calls
 * This centralizes all API configuration in one place
 */
const api = axios.create({
  // Use environment variable or default to local server
  baseURL: import.meta.env.VITE_API_URL || 'https://api.literexia.com/',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Include cookies
});

// Add request interceptor to add authentication token
api.interceptors.request.use(
  config => {
    // Get token from user object stored in localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to handle common error patterns
api.interceptors.response.use(
  response => {
    // Any status code within the range of 2xx triggers this function
    return response;
  },
  error => {
    // Any status codes outside the range of 2xx trigger this function
    if (error.response) {
      // Server responded with a status code outside of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('authToken');
        
        // If you have access to your router, you can redirect
        // Example with react-router: history.push('/login');
        
        // Or just use window.location for simplicity
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export API service functions
export default {
  // General API methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // Domain-specific API methods for intervention management (CLAUDE.md compliant)
  interventions: {
    // Get all interventions for a student
    getStudentInterventions: (studentId) =>
      api.get(`/api/intervention-assessment/student/${studentId}`),

    // Get intervention by ID
    getById: (interventionId) =>
      api.get(`/api/intervention-assessment/${interventionId}`),

    // Check if intervention exists for student and category
    checkExisting: (studentId, category) =>
      api.get(`/api/intervention-assessment/eligibility/${studentId}/${category}`),

    // Create new intervention assessment (Teacher-created)
    create: (interventionData) =>
      api.post('/api/intervention-assessment', interventionData),

    // Generate new intervention using CLAUDE.md Doctor-Teacher-Student model
    generate: (analysisId, category) =>
      api.post('/api/intervention-assessment/generate', { analysisId, category }),

    // Update intervention
    update: (interventionId, updateData) =>
      api.put(`/api/intervention-assessment/${interventionId}`, updateData),

    // Delete intervention
    delete: (interventionId) =>
      api.delete(`/api/intervention-assessment/${interventionId}`),

    // Start intervention (mark as started)
    start: (interventionId) =>
      api.post(`/api/intervention-assessment/${interventionId}/start`),

    // Complete intervention (mark as completed)
    complete: (interventionId) =>
      api.post(`/api/intervention-assessment/${interventionId}/complete`),
      
    // Legacy push to mobile (will be deprecated)
    pushToMobile: (interventionId) => 
      api.post(`/api/interventions/${interventionId}/push`),
      
    // Get main assessment questions (legacy system)
    getMainAssessmentQuestions: (category, readingLevel) =>
      api.get(`/api/interventions/questions/main?category=${encodeURIComponent(category)}&readingLevel=${encodeURIComponent(readingLevel)}`),

    // Get template questions (CLAUDE.md system)
    getTemplateQuestions: (category) =>
      api.get(`/api/templates/questions?category=${encodeURIComponent(category)}`),

    // Get template choices (CLAUDE.md system)
    getTemplateChoices: (choiceTypes = []) => {
      const queryParam = choiceTypes.length > 0 ?
        `?choiceTypes=${choiceTypes.join(',')}` : '';
      return api.get(`/api/templates/choices${queryParam}`);
    },

    // Get template choices by types (CLAUDE.md system)
    getTemplateChoicesByTypes: (choiceTypes) =>
      api.post('/api/templates/choices/by-types', { choiceTypes }),

    // Get sentence templates (CLAUDE.md system)
    getSentenceTemplates: (readingLevel) =>
      api.get(`/api/templates/sentences/level/${encodeURIComponent(readingLevel)}`),

    // Create sentence template (CLAUDE.md system)
    createSentenceTemplate: (templateData) =>
      api.post('/api/templates/sentences', templateData),

    // Create template question (CLAUDE.md system)
    createTemplateQuestion: (templateData) =>
      api.post('/api/templates/questions', templateData),

    // Create template choice (CLAUDE.md system)
    createTemplateChoice: (choiceData) =>
      api.post('/api/templates/choices', choiceData),

    // Generate intervention using templates (CLAUDE.md system)
    generateInterventionFromTemplates: (prescriptiveAnalysisId, category) =>
      api.post('/api/templates/generate-intervention', { prescriptiveAnalysisId, category }),
      
    // Upload file directly to S3 with public access (RECOMMENDED)
    uploadFile: (file, targetFolder = 'mobile') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFolder', targetFolder);

      return api.post('/api/uploads/s3', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    // Get upload URL (DEPRECATED - use uploadFile instead)
    getUploadUrl: (fileName, fileType, targetFolder = 'mobile') =>
      api.post('/api/interventions/upload-url', { fileName, fileType, targetFolder }),
      
    // Record intervention response
    recordResponse: (responseData) => 
      api.post('/api/interventions/responses', responseData),
      
    // Get prescriptive analysis for student and category
    getPrescriptiveAnalysis: (studentId, category) =>
      api.get(`/api/prescriptive-analytics/student/${studentId}/latest`),

    // Generate prescriptive analysis (CLAUDE.md Doctor's diagnosis)
    generatePrescriptiveAnalysis: (categoryResultId) =>
      api.post('/api/prescriptive-analytics/generate', { categoryResultId }),

    // Get all prescriptive analyses for student
    getStudentPrescriptiveAnalyses: (studentId) =>
      api.get(`/api/prescriptive-analytics/student/${studentId}`)
  }
};