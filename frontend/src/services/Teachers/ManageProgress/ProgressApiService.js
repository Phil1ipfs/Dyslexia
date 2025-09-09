// services/Teachers/ManageProgress/ProgressApiService.js 
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import AuthService from '../../AuthService';

const ProgressApiService = {
  /**
   * Get category progress for a student
   */
  getCategoryProgress: async (studentId) => {
    try {
      const token = AuthService.getToken();
      // Use the teacher-specific endpoint consistently
      const response = await axios.get(`${API_BASE_URL}/api/category-progress/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching category progress for student ${studentId}:`, error);
      
      // Return a more useful default structure with categoryIDs that match your data
      return {
        userId: studentId,
        categories: [],
        completedCategories: 0,
        totalCategories: 5, // Assuming 5 total categories
        overallProgress: 0,
        nextCategory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  },

  /**
   * Update category status for a student
   */
  updateCategoryStatus: async (studentId, categoryId, updateData) => {
    try {
      const token = AuthService.getToken();
      // Use teacher-specific endpoint
      const response = await axios.put(
        `${API_BASE_URL}/api/category-progress/${studentId}/${categoryId}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating category status for student ${studentId}, category ${categoryId}:`, error);
      throw error;
    }
  },

  /**
   * Get student responses for a specific student
   */
  getStudentResponses: async (studentId) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(`${API_BASE_URL}/api/student-responses/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching student responses for student ${studentId}:`, error);
      return {
        success: false,
        data: [],
        message: 'No responses found'
      };
    }
  },

  /**
   * Get student responses for a specific category
   */
  getStudentResponsesByCategory: async (studentId, categoryName) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(`${API_BASE_URL}/api/student-responses/${studentId}/${categoryName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching student responses for student ${studentId}, category ${categoryName}:`, error);
      return {
        success: false,
        data: [],
        message: 'No responses found'
      };
    }
  },

  /**
   * Get all students with category progress summary
   */
  getAllStudentsProgress: async () => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(`${API_BASE_URL}/api/category-progress/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all students progress:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch students progress'
      };
    }
  }
};

export default ProgressApiService;