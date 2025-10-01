// services/Teachers/DashboardApiService.js
import axios from 'axios';

// API base URL from environment variable
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'https://api.literexia.com/api';

/**
 * Service for handling Dashboard API requests
 */
class DashboardApiService {
  /**
   * Fetch all dashboard data in a single request
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Dashboard data
   */
  static async getDashboardData(authHeaders) {
    try {
      console.log('Fetching dashboard data from database...');

      // Create axios instance with timeout
      const instance = axios.create({
        timeout: 10000, // 10 second timeout for database calls
      });

      const response = await instance.get(`${API_BASE_URL}/teachers/dashboard/data`, authHeaders);

      if (response.data) {
        console.log('Successfully retrieved dashboard data from database');
        return response.data;
      } else {
        throw new Error('Empty response from dashboard API');
      }
    } catch (error) {
      // Detailed error logging
      if (error.response) {
        console.error(`Error fetching dashboard data: Status ${error.response.status}`);
        console.error('Error response data:', error.response.data);
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('Error fetching dashboard data: No response received');
        throw new Error('Network Error: No response from server');
      } else {
        console.error('Error fetching dashboard data:', error.message);
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }


  /**
   * Get parent profile by ID
   * @param {string} parentId - Parent ID
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Parent profile
   */
  static async getParentProfile(parentId, authHeaders) {
    try {
      if (!parentId) {
        throw new Error('Parent ID is required');
      }

      const response = await axios.get(
        `${API_BASE_URL}/teachers/dashboard/parent/${parentId}`,
        authHeaders
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching parent profile:', error);
      throw error;
    }
  }

  /**
   * Update activity status
   * @param {string} activityId - ID of the activity to update
   * @param {string} status - New status
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Updated activity
   */
  static async updateActivityStatus(activityId, status, authHeaders) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/teachers/dashboard/update-activity/${activityId}`,
        { status },
        authHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Error updating activity status:', error);
      throw error;
    }
  }

  /**
   * Get metrics for dashboard
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Dashboard metrics
   */
  static async getMetrics(authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers/dashboard/metrics`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  /**
   * Get reading level distribution
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} - Reading level distribution data
   */
  static async getReadingLevelDistribution(authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers/dashboard/reading-level-distribution`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching reading level distribution:', error);
      throw error;
    }
  }

  /**
   * Get students needing attention
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} - Students needing attention
   */
  static async getStudentsNeedingAttention(authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers/dashboard/students-needing-attention`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching students needing attention:', error);
      throw error;
    }
  }

  /**
   * Get students by section
   * @param {string} section - Section name
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} - Students in the specified section
   */
  static async getStudentsBySection(section, authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers/dashboard/by-section/${section}`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching students by section:', error);
      throw error;
    }
  }
}

export default DashboardApiService;