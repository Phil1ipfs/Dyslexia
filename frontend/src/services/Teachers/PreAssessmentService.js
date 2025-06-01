import axios from 'axios';
import API_URL from '../../config/apiConfig';

/**
 * PreAssessmentService - Service for managing pre-assessments in the teacher dashboard
 * Handles all API interactions with the pre-assessment endpoints
 */
class PreAssessmentService {
  constructor() {
    this.apiUrl = `${API_URL}/pre-assessment`;
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers with authentication token
   */
  getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  };

  /**
   * Fetch all pre-assessments from the server
   * @returns {Promise} Promise with the assessment data
   */
  getAllPreAssessments = async () => {
    try {
      console.log('PreAssessmentService: Fetching all pre-assessments');
      
      // Log the auth token being used
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        console.log('PreAssessmentService: Using auth token:', token.substring(0, 20) + '...');
      } else {
        console.warn('PreAssessmentService: No auth token found in localStorage');
      }
      
      // Request pre-assessments from the API
      console.log('PreAssessmentService: Making GET request to', `${this.apiUrl}/assessments`);
      const response = await axios.get(`${this.apiUrl}/assessments`, this.getAuthHeaders());
      console.log('PreAssessmentService: Received response:', response.status, response.statusText);
      
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      // If the error is a 404 (Not Found), it might mean the collection doesn't exist yet
      if (error.response && error.response.status === 404) {
        console.warn('PreAssessmentService: Resource not found (404)');
        return {
          success: true,
          data: [] // Return empty array for 404s
        };
      }
      
      console.error('PreAssessmentService: Error fetching pre-assessments:', error);
      return {
        success: false,
        data: [],
        message: "Failed to fetch pre-assessments. Please try again later."
      };
    }
  };

  /**
   * Fetch a single pre-assessment by ID
   * @param {string} id - The ID of the assessment to fetch
   * @returns {Promise} Promise with the assessment data
   */
  getPreAssessmentById = async (id) => {
    try {
      const response = await axios.get(`${this.apiUrl}/assessments/${id}`, this.getAuthHeaders());
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error(`Error fetching pre-assessment ${id}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Create a new pre-assessment
   * @param {Object} assessmentData - The assessment data to create
   * @returns {Promise} Promise with the created assessment
   */
  createPreAssessment = async (assessmentData) => {
    try {
      console.log('Creating pre-assessment:', assessmentData);
      
      const response = await axios.post(
        `${this.apiUrl}/assessments`,
        assessmentData,
        this.getAuthHeaders()
      );
      
      console.log('Pre-assessment creation response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error('Error creating pre-assessment:', error);
      return {
        success: false,
        data: null,
        message: `Failed to create pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Update an existing pre-assessment
   * @param {string} id - The ID of the assessment to update
   * @param {Object} updateData - The updated assessment data
   * @returns {Promise} Promise with the updated assessment
   */
  updatePreAssessment = async (id, updateData) => {
    try {
      const response = await axios.put(
        `${this.apiUrl}/assessments/${id}`,
        updateData,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error(`Error updating pre-assessment ${id}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to update pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Delete a pre-assessment
   * @param {string} id - The ID of the assessment to delete
   * @returns {Promise} Promise with the deletion result
   */
  deletePreAssessment = async (id) => {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/assessments/${id}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error(`Error deleting pre-assessment ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Get all question types
   * @returns {Promise} Promise with the question types
   */
  getAllQuestionTypes = async () => {
    try {
      const response = await axios.get(`${this.apiUrl}/question-types`, this.getAuthHeaders());
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error('Error fetching question types:', error);
      return {
        success: false,
        data: [],
        message: `Failed to fetch question types. Please try again later.`
      };
    }
  };

  /**
   * Create a new question type
   * @param {Object} questionTypeData - The question type data to create
   * @returns {Promise} Promise with the created question type
   */
  createQuestionType = async (questionTypeData) => {
    try {
      const response = await axios.post(
        `${this.apiUrl}/question-types`,
        questionTypeData,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating question type:', error);
      return {
        success: false,
        data: null,
        message: `Failed to create question type. Please try again later.`
      };
    }
  };

  /**
   * Update an existing question type
   * @param {string} id - The ID of the question type to update
   * @param {Object} updateData - The updated question type data
   * @returns {Promise} Promise with the updated question type
   */
  updateQuestionType = async (id, updateData) => {
    try {
      const response = await axios.put(
        `${this.apiUrl}/question-types/${id}`,
        updateData,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating question type ${id}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to update question type. Please try again later.`
      };
    }
  };

  /**
   * Delete a question type
   * @param {string} id - The ID of the question type to delete
   * @returns {Promise} Promise with the deletion result
   */
  deleteQuestionType = async (id) => {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/question-types/${id}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting question type ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete question type. Please try again later.`
      };
    }
  };

  /**
   * Upload media file (image or audio)
   * @param {File} file - The file to upload
   * @returns {Promise} Promise with the uploaded media URL
   */
  uploadMedia = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get auth headers but remove Content-Type so browser can set it with boundary
      const authHeaders = this.getAuthHeaders();
      const headers = { ...authHeaders.headers };
      delete headers['Content-Type'];

      const response = await axios.post(`${this.apiUrl}/upload-media`, formData, {
        headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error uploading media file:', error);
      return {
        success: false,
        data: null,
        message: `Failed to upload media file. Please try again later.`
      };
    }
  };

  /**
   * Delete media file
   * @param {string} fileKey - The key of the file to delete
   * @returns {Promise} Promise with the deletion result
   */
  deleteMedia = async (fileKey) => {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/delete-media/${fileKey}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting media file with key ${fileKey}:`, error);
      return {
        success: false,
        message: `Failed to delete media file. Please try again later.`
      };
    }
  };

  /**
   * Get pre-assessment results for a student
   * @param {string} studentId - The ID of the student
   * @returns {Promise} Promise with the student's pre-assessment results
   */
  getStudentPreAssessmentResults = async (studentId) => {
    try {
      const response = await axios.get(
        `${this.apiUrl}/student-results/${studentId}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // If 404, the student hasn't taken the assessment yet
      if (error.response && error.response.status === 404) {
        return {
          success: true,
          data: {
            hasCompleted: false,
            studentId
          }
        };
      }
      
      console.error(`Error fetching pre-assessment results for student ${studentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch pre-assessment results. Please try again later.`
      };
    }
  };

  /**
   * Add a question to a pre-assessment
   * @param {string} assessmentId - The ID of the assessment
   * @param {Object} questionData - The question data to add
   * @returns {Promise} Promise with the updated assessment
   */
  addQuestionToPreAssessment = async (assessmentId, questionData) => {
    try {
      // First get the current assessment
      const assessmentResponse = await this.getPreAssessmentById(assessmentId);
      if (!assessmentResponse.success) {
        return assessmentResponse;
      }
      
      const assessment = assessmentResponse.data;
      
      // Add the new question to the questions array
      const updatedQuestions = [...assessment.questions, questionData];
      
      // Update the assessment with the new questions array
      return await this.updatePreAssessment(assessmentId, {
        ...assessment,
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error adding question to pre-assessment ${assessmentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to add question to pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Update a question in a pre-assessment
   * @param {string} assessmentId - The ID of the assessment
   * @param {string} questionId - The ID of the question to update
   * @param {Object} questionData - The updated question data
   * @returns {Promise} Promise with the updated assessment
   */
  updateQuestionInPreAssessment = async (assessmentId, questionId, questionData) => {
    try {
      // First get the current assessment
      const assessmentResponse = await this.getPreAssessmentById(assessmentId);
      if (!assessmentResponse.success) {
        return assessmentResponse;
      }
      
      const assessment = assessmentResponse.data;
      
      // Find and update the specific question
      const updatedQuestions = assessment.questions.map(question => 
        question.questionId === questionId ? { ...question, ...questionData } : question
      );
      
      // Update the assessment with the modified questions array
      return await this.updatePreAssessment(assessmentId, {
        ...assessment,
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error updating question ${questionId} in pre-assessment ${assessmentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to update question in pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Delete a question from a pre-assessment
   * @param {string} assessmentId - The ID of the assessment
   * @param {string} questionId - The ID of the question to delete
   * @returns {Promise} Promise with the updated assessment
   */
  deleteQuestionFromPreAssessment = async (assessmentId, questionId) => {
    try {
      // First get the current assessment
      const assessmentResponse = await this.getPreAssessmentById(assessmentId);
      if (!assessmentResponse.success) {
        return assessmentResponse;
      }
      
      const assessment = assessmentResponse.data;
      
      // Filter out the question to be deleted
      const updatedQuestions = assessment.questions.filter(question => 
        question.questionId !== questionId
      );
      
      // Update the assessment with the filtered questions array
      return await this.updatePreAssessment(assessmentId, {
        ...assessment,
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error deleting question ${questionId} from pre-assessment ${assessmentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to delete question from pre-assessment. Please try again later.`
      };
    }
  };
}

export default new PreAssessmentService();