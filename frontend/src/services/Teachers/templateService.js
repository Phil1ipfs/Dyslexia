import axios from 'axios';
import API_URL from '../../config/apiConfig';
import AuthService from '../../services/authService';

// Create an axios instance with default headers
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  config => {
    const token = AuthService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
  console.error('API Error:', errorMessage, error);
  
  // Handle specific error codes
  if (error.response?.status === 401) {
    // Unauthorized - token expired or invalid
    console.warn('Authentication error. You may need to log in again.');
    
    // Optional: Redirect to login or trigger auth refresh
    // window.location.href = '/login';
  }
  
  throw new Error(errorMessage);
};

// Get all templates (questions, choices, sentences)
export const getAllTemplates = async () => {
  try {
    const response = await apiClient.get('/interventions/templates/all');
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new question template
export const createQuestionTemplate = async (templateData) => {
  try {
    const response = await apiClient.post(
      '/interventions/templates/questions', 
      templateData
    );
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new choice template
export const createChoiceTemplate = async (templateData) => {
  try {
    const response = await apiClient.post(
      '/interventions/templates/choices', 
      templateData
    );
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new sentence template
export const createSentenceTemplate = async (templateData) => {
  try {
    const response = await apiClient.post(
      '/interventions/sentence-templates', 
      templateData
    );
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update a question template
export const updateQuestionTemplate = async (templateId, templateData) => {
  try {
    const response = await apiClient.put(
      `/interventions/templates/questions/${templateId}`, 
      templateData
    );
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update a choice template
export const updateChoiceTemplate = async (templateId, templateData) => {
  try {
    const response = await apiClient.put(
      `/interventions/templates/choices/${templateId}`, 
      templateData
    );
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update a sentence template
export const updateSentenceTemplate = async (templateId, templateData) => {
  try {
    const response = await apiClient.put(
      `/interventions/sentence-templates/${templateId}`, 
      templateData
    );
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a template
export const deleteTemplate = async (templateType, templateId) => {
  try {
    let endpoint;
    switch (templateType) {
      case 'question':
        endpoint = `/interventions/templates/questions/${templateId}`;
        break;
      case 'choice':
        endpoint = `/interventions/templates/choices/${templateId}`;
        break;
      case 'sentence':
        endpoint = `/interventions/sentence-templates/${templateId}`;
        break;
      default:
        throw new Error('Invalid template type');
    }
    
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}; 