import axios from 'axios';

/**
 * MainAssessmentService - Service for managing main assessments in the teacher dashboard
 * Handles all API interactions with the main assessment endpoints
 */
class MainAssessmentService {
  constructor() {
    this.apiInitialized = false;
    this.apiUrl = '/api/main-assessment'; // Set the correct API URL
    this.checkApiAvailability();
  }

  /**
   * Check if the Main Assessment API endpoint exists
   * This helps with handling the case where the backend API might not be fully set up yet
   */
  checkApiAvailability = async () => {
    try {
      // Try ping without auth headers first
      await axios.get('/api/main-assessment/ping');
      this.apiInitialized = true;
      console.log('Main Assessment API is available');
      return true;
    } catch (error) {
      // Check specifically for auth errors
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          // Auth error means the API exists but we need auth
          this.apiInitialized = true;
          console.log('Main Assessment API requires authentication');
          return true;
        } else if (error.response.status !== 404) {
          // If we get any response other than 404, the API exists but returned an error
          this.apiInitialized = true;
          console.log('Main Assessment API is available (returned non-404 error)');
          return true;
        }
      }
      
      console.warn('Main Assessment API might not be fully set up yet:', error.message);
      this.apiInitialized = false;
      return false;
    }
  };

  /**
   * Get authentication headers
   * @returns {Object} Headers with authentication token
   */
  getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    
    // If no token is available, try to get it from AuthService
    if (!token) {
      try {
        // Try to import AuthService dynamically
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          return {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          };
        }
      } catch (error) {
        console.warn('Could not get authentication token:', error);
      }
    }
    
    return {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json'
      },
      withCredentials: true
    };
  };

  /**
   * Fetch all main assessments from the server
   * @returns {Promise} Promise with the assessment data
   */
  getAllAssessments = async () => {
    try {
      // Add debug log to help trace the execution flow
      console.log('[MainAssessmentService] Starting getAllAssessments call');
      
      // If API is not initialized, try to check it first
      if (!this.apiInitialized) {
        console.log('[MainAssessmentService] API not initialized, checking availability');
        const isAvailable = await this.checkApiAvailability();
        if (!isAvailable) {
          console.log('[MainAssessmentService] API not available, returning empty data');
          return {
            success: true,
            data: [],
            message: "The Main Assessment API is not available yet. Please ensure the backend is running."
          };
        }
      }
      
      // Get auth headers and log them for debugging
      const authHeaders = this.getAuthHeaders();
      console.log('[MainAssessmentService] Auth headers ready:', 
        authHeaders.headers ? 'Authorization header present: ' + !!authHeaders.headers.Authorization : 'No headers');
      
      // Make the real API request
      console.log('[MainAssessmentService] Making API request to /api/main-assessment');
      const response = await axios.get('/api/main-assessment?limit=100', authHeaders);
      
      // Log the raw response for debugging
      console.log('[MainAssessmentService] Raw API response:', response);
      
      // If the backend returns a 404 or empty data, handle it gracefully
      if (!response.data) {
        console.log('[MainAssessmentService] No data in response');
        return {
          success: true,
          data: [] // Return empty array when no data exists yet
        };
      }
      
      // Check for different response formats
      let assessmentData = [];
      if (response.data.data) {
        console.log('[MainAssessmentService] Found data in response.data.data');
        assessmentData = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('[MainAssessmentService] Response.data is an array, using directly');
        assessmentData = response.data;
      } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        console.log('[MainAssessmentService] Response.data is an object, checking for other properties');
        // Try to find data in other common response formats
        if (response.data.assessments) {
          console.log('[MainAssessmentService] Found data in response.data.assessments');
          assessmentData = response.data.assessments;
        } else if (response.data.templates) {
          console.log('[MainAssessmentService] Found data in response.data.templates');
          assessmentData = response.data.templates;
        } else if (response.data.items) {
          console.log('[MainAssessmentService] Found data in response.data.items');
          assessmentData = response.data.items;
        }
      }
      
      console.log(`[MainAssessmentService] Found ${assessmentData.length} assessments`);
      
      return {
        success: true,
        data: assessmentData
      };
    } catch (error) {
      // If the error is a 404 (Not Found), it might mean the collection doesn't exist yet
      if (error.response && error.response.status === 404) {
        console.log('[MainAssessmentService] 404 error, collection might not exist yet');
        return {
          success: true,
          data: [] // Return empty array for 404s
        };
      }
      
      // Add more detailed error logging
      console.error('[MainAssessmentService] Error fetching assessments:', error);
      
      if (error.response) {
        console.error('[MainAssessmentService] Error response status:', error.response.status);
        console.error('[MainAssessmentService] Error response data:', error.response.data);
      } else if (error.request) {
        console.error('[MainAssessmentService] No response received from server:', error.request);
      } else {
        console.error('[MainAssessmentService] Error setting up request:', error.message);
      }
      
      // Return an empty array with error message for more graceful handling
      return {
        success: false,
        data: [],
        error: error.message,
        message: "Failed to fetch assessments. See console for details."
      };
    }
  };

  /**
   * Fetch a single assessment by ID
   * @param {string} assessmentId - The ID of the assessment to fetch
   * @returns {Promise} Promise with the assessment data
   */
  getAssessmentById = async (assessmentId) => {
    try {
      const response = await axios.get(`/api/main-assessment/${assessmentId}`, this.getAuthHeaders());
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Error fetching assessment ${assessmentId}:`, error);
      throw error;
    }
  };

  /**
   * Fetch assessments filtered by reading level and/or category
   * @param {Object} filters - Object containing filter criteria
   * @param {string} [filters.readingLevel] - Optional reading level to filter by
   * @param {string} [filters.category] - Optional category to filter by
   * @returns {Promise} Promise with the filtered assessments
   */
  getFilteredAssessments = async (filters = {}) => {
    try {
      const { readingLevel, category } = filters;
      let url = '/api/main-assessment/filter?';
      
      if (readingLevel && readingLevel !== 'all') {
        url += `readingLevel=${encodeURIComponent(readingLevel)}&`;
      }
      
      if (category && category !== 'all') {
        url += `category=${encodeURIComponent(category)}&`;
      }
      
      const response = await axios.get(url, this.getAuthHeaders());
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching filtered assessments:', error);
      throw error;
    }
  };

  /**
   * Create a new assessment
   * @param {Object} assessmentData - The assessment data to create
   * @returns {Promise} Promise with the created assessment
   */
  createAssessment = async (assessmentData) => {
    try {
      console.log('Creating assessment:', assessmentData);
      
      // For debugging, log the request details
      console.log('API URL:', '/api/main-assessment');
      console.log('Request headers:', this.getAuthHeaders());
      
      // Make the real API call
      const response = await axios.post(
        '/api/main-assessment',
        assessmentData,
        this.getAuthHeaders()
      );
      
      console.log('Assessment creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating assessment:', error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        // If there's a specific error message from the server, log it
        if (error.response.data && error.response.data.message) {
          console.error('Server error message:', error.response.data.message);
        }
        
        // If there's a validation error, log the details
        if (error.response.data && error.response.data.error) {
          console.error('Validation error details:', error.response.data.error);
        }
      } else if (error.request) {
        console.error('No response received from server. Request details:', error.request);
      } else {
        console.error('Error setting up the request:', error.message);
      }
      
      throw error;
    }
  };

  /**
   * Update an existing assessment
   * @param {string} assessmentId - ID of the assessment to update
   * @param {Object} assessmentData - The updated assessment data
   * @returns {Promise} Promise with the updated assessment
   */
  updateAssessment = async (assessmentId, assessmentData) => {
    try {
      const response = await axios.put(`/api/main-assessment/${assessmentId}`, assessmentData, this.getAuthHeaders());
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Error updating assessment ${assessmentId}:`, error);
      throw error;
    }
  };

  /**
   * Delete an assessment
   * @param {string} assessmentId - ID of the assessment to delete
   * @returns {Promise} Promise with the deletion result
   */
  deleteAssessment = async (assessmentId) => {
    try {
      const response = await axios.delete(`/api/main-assessment/${assessmentId}`, this.getAuthHeaders());
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error deleting assessment ${assessmentId}:`, error);
      throw error;
    }
  };

  /**
   * Toggle the active status of an assessment
   * @param {string} assessmentId - ID of the assessment to toggle status
   * @param {string} newStatus - The new status ('active' or 'inactive')
   * @returns {Promise} Promise with the updated assessment
   */
  toggleAssessmentStatus = async (assessmentId, newStatus) => {
    try {
      const response = await axios.patch(
        `/api/main-assessment/${assessmentId}/status`, 
        { status: newStatus },
        this.getAuthHeaders()
      );
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Error toggling assessment ${assessmentId} status:`, error);
      throw error;
    }
  };

  /**
   * Get assessments for a specific student based on their reading level
   * @param {string} studentId - ID of the student
   * @param {string} readingLevel - Reading level of the student
   * @returns {Promise} Promise with the available assessments
   */
  getAssessmentsForStudent = async (studentId, readingLevel) => {
    try {
      const response = await axios.get(
        `/api/main-assessment/student/${studentId}?readingLevel=${encodeURIComponent(readingLevel)}`,
        this.getAuthHeaders()
      );
      return {
        success: response.data.success,
        data: response.data.data || []
      };
    } catch (error) {
      console.error(`Error fetching assessments for student ${studentId}:`, error);
      throw error;
    }
  };

  /**
   * Get assessment statistics
   * Returns the count of assessments by reading level and category
   * @returns {Promise} Promise with the assessment statistics
   */
  getAssessmentStats = async () => {
    try {
      const response = await axios.get('/api/main-assessment/stats', this.getAuthHeaders());
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching assessment statistics:', error);
      throw error;
    }
  };

  /**
   * Upload an image to the S3 bucket
   * @param {File} file - The file to upload
   * @param {string} path - The path within the bucket (e.g., 'main-assessment')
   * @returns {Promise} Promise with the uploaded file URL
   */
  uploadImageToS3 = async (file, path = 'main-assessment') => {
    try {
      if (!file) {
        throw new Error('No file provided for upload');
      }
      
      // Validate file before uploading
      if (file.size === 0) {
        throw new Error('File is empty');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }
      
      // Create form data for the file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      
      // Get authentication headers (modified to work with FormData)
      const authHeaders = this.getAuthHeaders();
      const uploadConfig = {
        ...authHeaders,
        headers: {
          ...authHeaders.headers,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // Try multiple endpoints for upload - these are fallbacks in case one fails
      const endpoints = [
        '/api/main-assessment/upload-image',
        '/api/uploads/s3',
        '/api/teachers/s3'
      ];
      
      let lastError = null;
      let response = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to upload to endpoint: ${endpoint}`);
          response = await axios.post(endpoint, formData, uploadConfig);
          
          if (response.data && (response.data.success || response.data.url)) {
            console.log(`Upload successful using ${endpoint}`);
            break; // Break the loop if upload succeeds
          } else {
            throw new Error(`Upload endpoint ${endpoint} returned invalid response`);
          }
        } catch (err) {
          lastError = err;
          console.warn(`Upload failed for endpoint ${endpoint}:`, err.message);
          
          // If it's an auth error, don't try other endpoints
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            throw new Error(`Authentication failed: ${err.response.data?.message || 'Access denied'}`);
          }
        }
      }
      
      // If we still don't have a successful response after trying all endpoints
      if (!response || !response.data || (!response.data.success && !response.data.url)) {
        const errorMsg = lastError?.response?.data?.message || lastError?.message || 'Failed to upload file to any endpoint';
        throw new Error(errorMsg);
      }
      
      // Process the successful response
      const data = response.data;
      
      // Different endpoints might return data in different formats, handle both
      const fileUrl = data.url || 
        (data.filename ? `https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/${path}/${data.filename}` : null);
      
      if (!fileUrl) {
        throw new Error('File upload succeeded but no URL was returned');
      }
      
      return {
        success: true,
        url: fileUrl,
        filename: data.filename || file.name
      };
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      
      // Return more specific error information
      let errorMessage = 'Failed to upload file to storage';
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Authentication failed - please refresh the page and try again';
        } else if (error.response.status === 413) {
          errorMessage = 'File size too large - please use a smaller image';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error - please try again later';
        } else {
          errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error - please check your internet connection';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timeout - please try with a smaller image or check your connection';
      }
      
      return {
        success: false,
        error: error.message || errorMessage,
        statusCode: error.response?.status
      };
    }
  };
}

export default new MainAssessmentService(); 