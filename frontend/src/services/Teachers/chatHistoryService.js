// services/Teachers/chatHistoryService.js
import axios from 'axios';

// Check if in production
const isProd = import.meta.env.PROD;
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? '' : 'https://api.literexia.com/');

/**
 * Save chat history to database
 * @param {string} userId - User identifier
 * @param {string} userType - Type of user (teacher, student, parent, admin)
 * @param {string} sessionId - Unique session identifier
 * @param {Array} messages - Array of chat messages
 * @param {string} category - Chat category (all, teaching, activities, interventions)
 * @param {string} language - Chat language (filipino, english)
 * @returns {Promise<Object>} Response data
 */
export const saveChatHistory = async (userId, userType, sessionId, messages, category = 'all', language = 'filipino') => {
  try {
    const url = `${API_BASE_URL}/api/chatbot/history/save`;
    console.log('[CHAT HISTORY SERVICE] Saving to:', url);
    console.log('[CHAT HISTORY SERVICE] Payload:', { userId, userType, sessionId, messageCount: messages.length, category, language });

    const response = await axios.post(url, {
      userId,
      userType,
      sessionId,
      messages,
      category,
      language
    });

    console.log('[CHAT HISTORY SERVICE] Save response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[CHAT HISTORY SERVICE] Error saving chat history:', error);
    console.error('[CHAT HISTORY SERVICE] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

/**
 * Load chat history for a specific session
 * @param {string} userId - User identifier
 * @param {string} userType - Type of user
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object>} Chat history data
 */
export const loadChatHistory = async (userId, userType, sessionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chatbot/history/load/${userId}/${userType}`, {
      params: { sessionId }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading chat history:', error);
    throw error;
  }
};

/**
 * Load recent chat sessions for a user
 * @param {string} userId - User identifier
 * @param {string} userType - Type of user
 * @param {number} limit - Number of sessions to load (default: 10)
 * @returns {Promise<Object>} Recent chat sessions
 */
export const loadRecentChatSessions = async (userId, userType, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chatbot/history/load/${userId}/${userType}`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading recent chat sessions:', error);
    throw error;
  }
};

/**
 * Get all chat sessions for a user
 * @param {string} userId - User identifier
 * @param {string} userType - Type of user
 * @returns {Promise<Object>} All chat sessions with previews
 */
export const getAllChatSessions = async (userId, userType) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chatbot/history/sessions/${userId}/${userType}`);
    return response.data;
  } catch (error) {
    console.error('Error getting all chat sessions:', error);
    throw error;
  }
};

/**
 * Delete a chat session
 * @param {string} sessionId - Session identifier to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteChatSession = async (sessionId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/chatbot/history/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
};

/**
 * Generate a unique session ID
 * @returns {string} Unique session identifier
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
