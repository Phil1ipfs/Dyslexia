// API configuration for the application
const isProd = import.meta.env?.PROD || false;
const API_BASE = import.meta.env?.VITE_API_URL || (isProd ? '' : 'https://literexia.onrender.com/');
const API_URL = `${API_BASE}/api`;

export const API_BASE_URL = 'https://literexia.onrender.com/api';

export default API_URL; 