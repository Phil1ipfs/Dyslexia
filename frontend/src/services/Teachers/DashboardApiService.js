// src/services/DashboardApiService.js
import axios from 'axios';

// Setup API base URL from environment variables or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

/**
 * Service for fetching dashboard-specific data from MongoDB collections
 */
const DashboardApiService = {
  /**
   * Get authentication headers with Bearer token
   * @returns {Object} Headers object
   */
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  },

  /**
   * Fetch all students from test.users collection
   * @returns {Promise<Array>} Array of student objects
   */
  async getAllStudents() {
    try {
      const response = await axios.get(`${API_BASE_URL}/student/students`, this.getAuthHeaders());
      if (response.data && response.data.students) {
        return response.data.students;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Unexpected data format in getAllStudents', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  /**
   * Fetch reading level distribution data
   * @returns {Promise<Array>} Distribution data
   */
  async getReadingLevelDistribution() {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/reading-level-distribution`, this.getAuthHeaders());
      return response.data || [];
    } catch (error) {
      console.error('Error fetching reading level distribution:', error);
      
      // Calculate distribution manually from students as fallback
      try {
        const studentsData = await this.getAllStudents();
        
        // Count students by reading level
        const distribution = {};
        studentsData.forEach(student => {
          const level = student.readingLevel || 'Not Assessed';
          distribution[level] = (distribution[level] || 0) + 1;
        });
        
        // Format for chart display
        return Object.entries(distribution).map(([name, value]) => ({
          name,
          value,
          color: this.getReadingLevelColor(name)
        }));
      } catch (fallbackError) {
        console.error('Fallback distribution calculation failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  /**
   * Fetch students needing attention
   * @param {number} limit Number of students to return
   * @returns {Promise<Array>} Students needing attention
   */
  async getStudentsNeedingAttention(limit = 5) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/students-needing-attention`, 
        { ...this.getAuthHeaders(), params: { limit } }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching students needing attention:', error);
      
      // Calculate manually as fallback
      try {
        const students = await this.getAllStudents();
        
        // Identify students needing attention based on reading level and scores
        return students
          .filter(student => 
            student.readingLevel === 'Not Assessed' || 
            student.readingLevel === 'Early' ||
            student.readingLevel === 'Emergent' ||
            (student.readingPercentage && student.readingPercentage < 70)
          )
          .slice(0, limit)
          .map(student => ({
            id: student._id?.$oid || student._id || student.id || student.idNumber?.toString(),
            name: student.name || `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim(),
            readingLevel: student.readingLevel || 'Not Assessed',
            lastScore: student.readingPercentage || 
                       (student.readingLevel === 'Fluent' ? 85 : 
                        student.readingLevel === 'Emergent' ? 55 :
                        student.readingLevel === 'Early' ? 40 : 60),
            completionRate: student.completedLessons?.length 
              ? (student.completedLessons.length / 25) * 100 
              : Math.floor(Math.random() * 60) + 20
          }));
      } catch (fallbackError) {
        console.error('Fallback attention calculation failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  /**
   * Fetch dashboard metrics
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/metrics`, this.getAuthHeaders());
      return response.data || {
        totalStudents: 0,
        completionRate: 0,
        averageScore: 0,
        assignedActivities: 0,
        completedActivities: 0,
        pendingEdits: 0
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      
      // Calculate metrics manually as fallback
      try {
        const students = await this.getAllStudents();
        const totalStudents = students.length;
        
        // Only count activities for assessed students
        const assessedStudents = students.filter(student => student.readingLevel !== 'Not Assessed');
        const totalAssignedActivities = assessedStudents.length * 25; // Assuming 25 activities per student
        
        // Calculate completed activities based on completedLessons or readingPercentage
        const completedActivities = assessedStudents.reduce((sum, student) => {
          if (student.completedLessons && Array.isArray(student.completedLessons)) {
            return sum + student.completedLessons.length;
          } else if (student.readingPercentage) {
            return sum + Math.round((student.readingPercentage / 100) * 25);
          } else {
            return sum + Math.round((50 / 100) * 25); 
          }
        }, 0);
        
        const completionRate = totalAssignedActivities > 0
          ? Math.round((completedActivities / totalAssignedActivities) * 100)
          : 0;
        
        const averageScore = assessedStudents.length > 0
          ? Math.round(assessedStudents.reduce((sum, student) => {
              return sum + (student.readingPercentage || 
                (student.readingLevel === 'Fluent' ? 85 : 
                 student.readingLevel === 'Emergent' ? 55 :
                 student.readingLevel === 'Early' ? 40 : 60));
            }, 0) / assessedStudents.length)
          : 0;
        
        // Count students needing attention for pendingEdits count
        const pendingEdits = students.filter(student => 
          student.readingLevel === 'Not Assessed' || 
          student.readingLevel === 'Early' ||
          student.readingLevel === 'Emergent' ||
          (student.readingPercentage && student.readingPercentage < 70)
        ).length;
        
        return {
          totalStudents,
          completionRate,
          averageScore,
          assignedActivities: totalAssignedActivities,
          completedActivities,
          pendingEdits
        };
      } catch (fallbackError) {
        console.error('Fallback metrics calculation failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  /**
   * Get color for a reading level
   * @param {string} level Reading level
   * @returns {string} HEX color code
   */
  getReadingLevelColor(level) {
    const colors = {
      'Early': '#FF6B8A',
      'Emergent': '#FF9E40',
      'Fluent': '#4BC0C0',
      'Not Assessed': '#B0B0B0'
    };
    return colors[level] || '#B0B0B0';
  },

  /**
   * Determine categories needing improvement based on reading level
   * @param {string} readingLevel Reading level
   * @returns {Array} Categories needing improvement
   */
  determineCategoriesForImprovement(readingLevel) {
    switch(readingLevel) {
      case 'Early':
        return ['Alphabet Knowledge', 'Phonological Awareness'];
      case 'Emergent':
        return ['Phonological Awareness', 'Decoding'];
      case 'Fluent':
        return ['Reading Comprehension', 'Critical Thinking'];
      case 'Not Assessed':
        return ['Pre-Assessment Needed'];
      default:
        return ['Literacy Skills Assessment'];
    }
  }
};

export default DashboardApiService;