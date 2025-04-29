// src/services/teacherService.js

/**
 * Service module for teacher-related API operations
 * This file contains functions for fetching, updating, and managing teacher data
 * In a production environment, these would make actual API calls to a backend
 */

// Mock data for development - would be replaced with API calls to MongoDB
const mockTeacherData = {
    name: "Madam Jaja",
    position: "Elementary Reading Specialist",
    employeeId: "TCR-2023-0104",
    email: "jaja@literexia.edu.ph",
    contact: "+63 912 345 6789",
    gender: "Female",
    dob: "  1985-09-15", 
    address: "  123 Maharlika St., Los Baños, Laguna",
    emergencyContact: {
      name: "  Roberto Jaja",
      number: "  +63 943 210 9876",
    }
  };
  
  /**
   * Fetches teacher profile information
   * @returns {Promise<Object>} Teacher profile data
   */
  export const fetchTeacherProfile = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would be a fetch call to an API endpoint
    // return fetch('/api/teachers/profile').then(res => res.json());
    
    // For now, return mock data
    return { ...mockTeacherData };
  };
  
  /**
   * Updates teacher profile information
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Updated teacher profile
   */
  export const updateTeacherProfile = async (profileData) => {
    // Validate required fields
    if (!profileData.name || !profileData.email || !profileData.contact) {
      throw new Error('Missing required fields');
    }
  
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      throw new Error('Invalid email format');
    }
  
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    // In a real app, this would be a fetch call to an API endpoint
    // return fetch('/api/teachers/profile', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(profileData)
    // }).then(res => res.json());
    
    // For now, update mock data and return
    Object.assign(mockTeacherData, profileData);
    return { ...mockTeacherData };
  };
  
  /**
   * Updates teacher password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  export const updateTeacherPassword = async (currentPassword, newPassword) => {
    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Password does not meet requirements');
    }
  
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    // Mock validation - in a real app, this would be done server-side
    if (currentPassword !== 'password123') { // Just a mock check
      throw new Error('INCORRECT_PASSWORD');
    }
  
    // In a real app, this would be a fetch call to an API endpoint
    // return fetch('/api/teachers/change-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ currentPassword, newPassword })
    // }).then(res => res.json());
    
    // For now, just return success
    return { success: true, message: 'Password updated successfully' };
  };