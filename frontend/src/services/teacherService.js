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
      console.error('API Error:', error.response.status, error.response.data);

      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
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

    // Normalize the profileImageUrl field - convert "null" string to actual null
    if (data && data.profileImageUrl === "null") {
      data.profileImageUrl = null;
    }

    return data;
  } catch (error) {
    // Handle the case where no profile exists yet
    if (error.response && error.response.status === 404) {
      console.log("No teacher profile found - returning default template");
      return {
        firstName: "",
        middleName: "",
        lastName: "",
        position: "",
        employeeId: "",
        email: "",
        contact: "",
        gender: "",
        civilStatus: "",
        dob: "",
        address: "",
        profileImageUrl: null,
        emergencyContact: {
          name: "",
          number: ""
        }
      };
    }

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

  // Create a copy of the profile data to normalize
  const normalizedProfile = { ...profile };

  // Ensure profileImageUrl is null, not "null" string
  if (normalizedProfile.profileImageUrl === "null") {
    normalizedProfile.profileImageUrl = null;
  }

  try {
    // Handle case where profile doesn't exist yet (first time saving)
    const { data } = await api.put('/teachers/profile', normalizedProfile);

    // Normalize the returned data
    if (data.teacher && data.teacher.profileImageUrl === "null") {
      data.teacher.profileImageUrl = null;
    }

    return data;
  } catch (error) {
    // If 404, try creating a new profile with POST instead
    if (error.response && error.response.status === 404) {
      try {
        const { data } = await api.post('/teachers/profile', normalizedProfile);

        // Normalize the returned data
        if (data.teacher && data.teacher.profileImageUrl === "null") {
          data.teacher.profileImageUrl = null;
        }

        return data;
      } catch (postError) {
        console.error('Error creating new profile:', postError);
        throw postError;
      }
    }

    console.error('Error updating teacher profile:', error);
    throw error;
  }
};

/**
 * Upload profile image to S3
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Upload result
 */
export const uploadProfileImage = async (file, onProgress) => {
  // Create form data
  const formData = new FormData();
  formData.append('profileImage', file);
  
  try {
    console.log('Starting profile image upload, size:', file.size);
    
    const { data } = await api.post('/teachers/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
      // Increase timeout for larger files
      timeout: 60000 // 60 seconds
    });
    
    console.log('Upload completed successfully:', data);
    
    return data; // { success: true, imageUrl: imageUrl }
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    // Log detailed response data if available
    if (error.response?.data) {
      console.log('Response data:', error.response.data);
    }
    
    // Create a more informative error
    const errorMessage = error.response?.data?.details || error.message || 'Unknown error';
    const enhancedError = new Error(`Failed to upload image: ${errorMessage}`);
    
    // Add original error for debugging
    enhancedError.originalError = error;
    
    throw enhancedError;
  }
};
/**
 * Delete profile image from S3
 * @returns {Promise<Object>} Delete result
 */
export const deleteProfileImage = async () => {
  try {
    const { data } = await api.delete('/teachers/profile/image');
    return data; // { success: true, message: '...' }
  } catch (error) {
    console.error('Error deleting profile image:', error);

    // If 404, the profile or image might not exist yet
    if (error.response && error.response.status === 404) {
      return { success: false, message: 'No image to delete' };
    }

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

    // Handle case where profile doesn't exist yet
    if (error.response && error.response.status === 404) {
      throw new Error('Please create your profile before changing password');
    }

    console.error('Error updating password:', error);
    throw error;
  }
};