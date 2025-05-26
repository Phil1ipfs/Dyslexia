// services/Teachers/DashboardApiService.js
import axios from 'axios';

// API base URL from environment variable
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5001/api';

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
      console.log('Fetching dashboard data from API...');
      const response = await axios.get(`${API_BASE_URL}/dashboard/data`, authHeaders);
      
      if (response.data) {
        console.log('Successfully retrieved dashboard data');
        return response.data;
      } else {
        console.warn('Dashboard data response was empty');
        return {
          students: [],
          studentsNeedingAttention: [],
          readingLevelDistribution: [],
          metrics: {
            totalStudents: 0,
            completionRate: 0,
            averageScore: 0,
            pendingEdits: 0
          },
          prescriptiveData: [],
          sections: ['Sampaguita', 'Unity', 'Dignity'],
          progressData: {}
        };
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
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
        return { 
          name: 'Not Specified',
          address: 'Address not available' 
        };
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/parent/${parentId}`,
        authHeaders
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching parent profile:', error);
      return { 
        name: 'Not Found',
        address: 'Address not available' 
      };
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
        `${API_BASE_URL}/dashboard/update-activity/${activityId}`,
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
      const response = await axios.get(`${API_BASE_URL}/dashboard/metrics`, authHeaders);
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
      const response = await axios.get(`${API_BASE_URL}/dashboard/reading-level-distribution`, authHeaders);
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
      const response = await axios.get(`${API_BASE_URL}/dashboard/students-needing-attention`, authHeaders);
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
      const response = await axios.get(`${API_BASE_URL}/dashboard/by-section/${section}`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching students by section:', error);
      throw error;
    }
  }
}

export default DashboardApiService;