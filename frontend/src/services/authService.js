// services/AuthService.js

// Import axios for HTTP requests
import axios from 'axios';

// Get backend URL from environment variables (without trailing slash)
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
console.log('🔍 AuthService DEBUG - Environment variables:', {
  VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  API_URL: API_URL
});

const AuthService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} expectedRole - Expected user role (optional, for backward compatibility)
   * @returns {Promise} Promise with login result
   */
  login: async (email, password, expectedRole = null) => {
    try {
      console.log('AuthService login - sending request with:', {
        email,
        useAutoDetection: !expectedRole
      });

      // Prepare request payload
      const requestData = { email, password };

      // Only include expectedRole if it's explicitly provided (for backward compatibility)
      if (expectedRole) {
        requestData.expectedRole = expectedRole;
      }

      const response = await axios.post(`${API_URL}/auth/login`, requestData);

      if (response.data.token) {
        // Store user data with token - single source of truth
        localStorage.setItem('user', JSON.stringify(response.data));
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: () => {
    // Clear all auth-related data
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise with registration result
   */
  register: async (userData) => {
    try {
      return await axios.post(`${API_URL}/auth/register`, userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Get current user information
   * @returns {Object|null} Current user data or null if not logged in
   */
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in
   */
  isLoggedIn: () => {
    const user = AuthService.getCurrentUser();
    return !!user && !!user.token;
  },

  /**
   * Get authentication token
   * @returns {string|null} JWT token or null if not logged in
   */
  getToken: () => {
    try {
      const user = AuthService.getCurrentUser();
      return user?.token || null;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },
  /**
   * Check if current user has a specific role
   * @param {string} roleName - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole: (roleName) => {
    const user = AuthService.getCurrentUser();
    
    if (!user || !user.user || !user.user.roles) {
      return false;
    }
    
    const userRoles = Array.isArray(user.user.roles) 
      ? user.user.roles 
      : [user.user.roles];
    
    // Handle Tagalog role names
    const roleMap = {
      'guro': 'teacher',
      'magulang': 'parent'
    };
    
    // Check if user has the role (case insensitive)
    const normalizedRoleName = roleName.toLowerCase();
    const mappedRoleName = roleMap[normalizedRoleName] || normalizedRoleName;
    
    return userRoles.some(role => {
      const userRole = typeof role === 'string' ? role.toLowerCase() : '';
      return userRole === normalizedRoleName || userRole === mappedRoleName;
    });
  },

  /**
   * Get user role
   * @returns {string|null} User role or null if not available
   */
  getUserRole: () => {
    const user = AuthService.getCurrentUser();
    
    if (!user || !user.user || !user.user.roles) {
      return null;
    }
    
    const userRoles = Array.isArray(user.user.roles) 
      ? user.user.roles 
      : [user.user.roles];
    
    return userRoles[0] || null;
  }
};

export default AuthService;