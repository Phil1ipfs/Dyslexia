// src/services/authService.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                (import.meta.env.DEV ? 'http://localhost:5002' : '');

export const authService = {
  // Login user and return user data
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    
    // Store auth data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));
    
    // Set user type based on roles
    const roles = Array.isArray(data.user.roles) ? data.user.roles : [data.user.roles];
    
    if (roles.includes('parent') || roles.includes('magulang')) {
      localStorage.setItem('userType', 'parent');
    } else if (roles.includes('teacher') || roles.includes('guro')) {
      localStorage.setItem('userType', 'teacher');
    } else if (roles.includes('admin')) {
      localStorage.setItem('userType', 'admin');
    } else {
      localStorage.setItem('userType', 'user');
    }
    
    return data;
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
  },
  
  // Get current user
  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
  
  // Get user type
  getUserType: () => {
    return localStorage.getItem('userType') || 'user';
  },
  
  // Check if user has specific role
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    if (!user || !user.roles) return false;
    
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    return roles.includes(role);
  }
};

export default authService;