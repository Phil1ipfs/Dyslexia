// src/services/teacherService.js
import axios from 'axios';

// Setup axios defaults for API calls
const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:5002/api' : '/api', 
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' 
  }
});

// Add a request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle common errors
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Fetch teacher profile data from API
 * @returns {Promise<Object>} The teacher profile data
 */
export const fetchTeacherProfile = async () => {
  try {
    const { data } = await api.get('/teachers/profile');
    return data;
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    throw error;
  }
};

/**
 * Update teacher profile data
 * @param {Object} profile - The updated profile data
 * @returns {Promise<Object>} The updated teacher profile
 */
export const updateTeacherProfile = async (profile) => {
  // Validate required fields on client side
  if (!profile.firstName?.trim() || !profile.email?.trim() || !profile.contact?.trim()) {
    throw new Error('Missing required fields');
  }
  
  try {
    const { data } = await api.put('/teachers/profile', profile);
    return data.teacher;
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    throw error;
  }
};

/**
 * Upload profile image
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Upload result
 */
export const uploadProfileImage = async (file, onProgress) => {
  // Create form data
  const formData = new FormData();
  formData.append('profileImage', file);
  
  try {
    const { data } = await api.post('/teachers/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
    });
    
    return data; // { success: true, imageUrl: '...' }
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Delete profile image
 * @returns {Promise<Object>} Delete result
 */
export const deleteProfileImage = async () => {
  try {
    const { data } = await api.delete('/teachers/profile/image');
    return data; // { success: true, message: '...' }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
};

/**
 * Update teacher password
 * @param {string} currentPassword - The current password
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} Success message
 */
export const updateTeacherPassword = async (currentPassword, newPassword) => {
  // Validate password complexity on client side
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    throw new Error('Password does not meet requirements');
  }
  
  try {
    const { data } = await api.post('/teachers/password', { currentPassword, newPassword });
    return data;
  } catch (error) {
    // If server returns specific error code, preserve it
    if (error.response && error.response.data && error.response.data.error === 'INCORRECT_PASSWORD') {
      const customError = new Error('INCORRECT_PASSWORD');
      throw customError;
    }
    console.error('Error updating password:', error);
    throw error;
  }
};