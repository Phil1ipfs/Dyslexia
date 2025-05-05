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
// Update your api interceptor in teacherService.js to include the token
api.interceptors.request.use(
  config => {
    // Add the auth token to every request
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
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



// src/services/teacherService.js - Add auth token and profile initialization

// Add this function to initialize profiles:
export const initializeTeacherProfile = async () => {
  try {
    const { data } = await api.post('/teachers/profile/initialize');
    console.log('Profile initialized:', data.teacher);
    return data.teacher;
  } catch (error) {
    console.error('Error initializing teacher profile:', error);
    return null;
  }
};

// Update fetchTeacherProfile to handle 404/initialization
export const fetchTeacherProfile = async () => {
  try {
    const { data } = await api.get('/teachers/profile');

    // Normalize the profileImageUrl field - convert "null" string to actual null
    if (data && data.profileImageUrl === "null") {
      data.profileImageUrl = null;
    }

    return data;
  } catch (error) {
    // Handle the case where profile needs initialization
    if (error.response && error.response.status === 404 && 
        error.response.data.action === 'initialize') {
      console.log("No teacher profile found - attempting to initialize");
      
      try {
        const profile = await initializeTeacherProfile();
        if (profile) {
          return profile;
        }
      } catch (initError) {
        console.error("Failed to initialize profile:", initError);
      }
    }
    
    // If initialization fails or other error, return default template
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

  // Ensure profileImageUrl is handled correctly
  if (normalizedProfile.profileImageUrl === "null" || normalizedProfile.profileImageUrl === undefined) {
    normalizedProfile.profileImageUrl = null;
  }
  
  // Make sure all fields are properly formatted
  if (!normalizedProfile.middleName) normalizedProfile.middleName = '';
  if (!normalizedProfile.position) normalizedProfile.position = '';
  if (!normalizedProfile.gender) normalizedProfile.gender = '';
  if (!normalizedProfile.civilStatus) normalizedProfile.civilStatus = '';
  if (!normalizedProfile.dob) normalizedProfile.dob = '';
  if (!normalizedProfile.address) normalizedProfile.address = '';
  
  // Ensure emergencyContact is properly structured
  if (!normalizedProfile.emergencyContact) {
    normalizedProfile.emergencyContact = { name: '', number: '' };
  } else if (typeof normalizedProfile.emergencyContact === 'object') {
    if (!normalizedProfile.emergencyContact.name) normalizedProfile.emergencyContact.name = '';
    if (!normalizedProfile.emergencyContact.number) normalizedProfile.emergencyContact.number = '';
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
// Improved uploadProfileImage function in teacherService.js
// Improved uploadProfileImage function in teacherService.js
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
    
    // Handle various response formats
    if (data && typeof data === 'object') {
      // If response contains success flag, return it directly
      if ('success' in data) {
        return data;
      }
      // Normalize response format
      return { 
        success: true, 
        imageUrl: data.imageUrl || data.url || null,
        message: data.message || 'Upload successful'
      };
    }
    
    // Fallback for unexpected response format
    return { 
      success: true, 
      imageUrl: null,
      message: 'Upload completed but no URL returned'
    };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    // Log detailed response data if available
    if (error.response?.data) {
      console.log('Response data:', error.response.data);
    }
    
    // Create a more informative error
    const errorMessage = error.response?.data?.details || 
                         error.response?.data?.error || 
                         error.message || 
                         'Unknown error';
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


