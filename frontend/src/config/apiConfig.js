// API configuration for the application
const isProd = import.meta.env?.PROD || false;
const API_BASE = import.meta.env?.VITE_API_URL || (isProd ? '' : 'https://literexia.onrender.com/');
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://literexia.onrender.com/api'; // Use a specific VITE_API_BASE_URL for clarity or fallback
const API_URL = `${API_BASE}/api`;

export default API_URL; 