// API configuration for the application
const isProd = import.meta.env?.PROD || false;
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5001/';
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5001/api'; // Use a specific VITE_API_BASE_URL for clarity or fallback
const API_URL = `${API_BASE}/api`;

// Debug logging to verify environment variables are loaded correctly
console.log('🔍 API Config DEBUG:', {
  isProd,
  VITE_API_URL: import.meta.env?.VITE_API_URL,
  VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL,
  VITE_BACKEND_URL: import.meta.env?.VITE_BACKEND_URL,
  API_BASE_URL: API_BASE_URL,
  API_URL: API_URL
});

export default API_URL; 