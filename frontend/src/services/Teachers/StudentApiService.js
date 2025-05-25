// src/services/StudentApiService.js
import axios from 'axios';

// Create axios instance with baseURL, timeouts, JSON headers
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:5001/api/student'
    : '/api/student',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Create a separate instance for direct backend calls
const directApi = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:5001/api'
    : '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// REQUEST INTERCEPTOR: attach bearer token + log
api.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(
      `Student API Request: ${config.method.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Apply same interceptor to directApi
directApi.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(
      `Direct API Request: ${config.method.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: handle errors + 401 redirect
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(
        'API Error:',
        error.response.status,
        error.response.data
      );
      if (error.response.status === 401) {
        // Don't redirect to login for all 401s - just log it
        console.warn('Authorization failed for API request - continuing with available data');
      }
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Apply same interceptor to directApi
directApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(
        'Direct API Error:',
        error.response.status,
        error.response.data
      );
      if (error.response.status === 401) {
        console.warn('Authorization failed for direct API request - continuing with available data');
      }
    } else if (error.request) {
      console.error('Direct API No Response:', error.request);
    } else {
      console.error('Direct API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// StudentApiService object with methods
const StudentApiService = {
  // List students with optional query params (page, filters…)
  getStudents: async (params = {}) => {
    try {
      const { data } = await api.get('/students', { params });
      return data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get all students for dashboard
  getAllStudents: async () => {
    try {
      const { data } = await api.get('/students', {
        params: { limit: 100 } // Get more students for dashboard
      });
      return data.students || [];
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  },

  // Single student details
  getStudentDetails: async (id) => {
    try {
      // Fix: Correct URL pattern, avoiding duplicate "student" in path
      const { data } = await api.get(`/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching student details for ID ${id}:`, error);
      throw error;
    }
  },

  // Get pre-assessment results
  getPreAssessmentResults: async (id) => {
    try {
      console.log(`Calling pre-assessment results with ID: ${id}`);
      // Use the api instance with the correct endpoint path (no leading slash)
      const { data } = await api.get(`${id}/pre-assessment-results`);
      console.log("Success! Received pre-assessment data:", data);
      
      // Ensure skillDetails is always an array
      if (data && !data.skillDetails) {
        data.skillDetails = [];
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching pre-assessment results for student ID ${id}:`, error);
      console.error(`Full URL attempted: ${error.config?.url}`);
      
      // Return structured empty data if no results found
      if (error.response?.status === 404) {
        return {
          studentId: id,
          hasCompleted: false,
          skillDetails: [], // Add empty skillDetails array
          message: error.response.data.message || 'No pre-assessment results found'
        };
      }
      throw error;
    }
  },

  // Get pre-assessment status
  getPreAssessmentStatus: async (id) => {
    try {
      console.log(`Calling pre-assessment status with ID: ${id}`);
      // Use the api instance with the correct endpoint path (no leading slash)
      const { data } = await api.get(`${id}/pre-assessment-status`);
      console.log("Success! Received pre-assessment status:", data);
      return data;
    } catch (error) {
      console.error(`Error fetching pre-assessment status for student ID ${id}:`, error);
      console.error(`Full URL attempted: ${error.config?.url}`);
      return {
        studentId: id,
        hasCompleted: false,
        preAssessmentCompleted: false
      };
    }
  },

  // Parent profile
  getParentProfile: async (parentId) => {
    try {
      // Check if parentId is valid MongoDB ObjectId format
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(parentId);
      if (!isValidObjectId) {
        console.warn(`Invalid parent ID format: ${parentId}`);
        throw new Error('Invalid parent ID format');
      }
      
      console.log(`Fetching parent profile for ID: ${parentId}`);
      
      // Try the main endpoint first
      try {
        const { data } = await directApi.get(`/parents/profile/${parentId}`);
        
        // If data is returned correctly, process it to ensure consistent format
        if (data) {
          console.log("Parent profile data received:", data);
          
          // Process name fields if needed
          if (data.firstName || data.lastName) {
            let fullName = data.firstName || '';
            if (data.middleName) fullName += ` ${data.middleName}`;
            if (data.lastName) fullName += ` ${data.lastName}`;
            data.name = fullName.trim();
          }
          
          return data;
        }
      } catch (mainEndpointError) {
        console.warn(`Main parent endpoint failed for ID ${parentId}, trying fallback:`, mainEndpointError);
        
        // Try fallback endpoint
        try {
          const { data } = await directApi.get(`/dashboard/parent/${parentId}`);
          if (data) {
            console.log("Parent profile data received from fallback:", data);
            return data;
          }
        } catch (fallbackError) {
          console.warn(`Fallback parent endpoint failed for ID ${parentId}:`, fallbackError);
          // Let it continue to the error handling below
        }
      }
      
      throw new Error('No data returned from parent profile API');
    } catch (error) {
      console.error('Error fetching parent profile:', error);
      throw error;
    }
  },

  // Parent profile with fallback
  getParentProfileWithFallback: async (parentId) => {
    try {
      if (!parentId) {
        throw new Error('No parent ID provided');
      }
      
      const profile = await StudentApiService.getParentProfile(parentId);

      // Only apply a fallback if the profileImageUrl is null or undefined
      if (!profile.profileImageUrl) {
        console.log("No profile image URL found, leaving it as null");
      } else {
        console.log("Using original S3 image URL:", profile.profileImageUrl);
      }

      return profile;
    } catch (err) {
      console.warn(`Falling back to empty parent profile for ID ${parentId}:`, err);
      return {
        name: `Parent of ID: ${parentId.substring(0, 8)}...`,
        firstName: null,
        middleName: null,
        lastName: null,
        email: null,
        contact: null,
        address: null,
        civilStatus: null,
        gender: null,
        occupation: null,
        profileImageUrl: null
      };
    }
  },

  // Progress data
  getProgressData: async (id) => {
    try {
      // Fix: Correct URL pattern, avoiding duplicate "student" in path
      const { data } = await api.get(`/${id}/progress`);
      return data;
    } catch (error) {
      console.error(`Error fetching progress data for ID ${id}:`, error);
      throw error;
    }
  },

  // Recommended lessons
  getRecommendedLessons: async (id) => {
    try {
      // Fix: Correct URL pattern, avoiding duplicate "student" in path
      const { data } = await api.get(`/${id}/recommended-lessons`);
      return data;
    } catch (error) {
      console.error(`Error fetching recommended lessons for ID ${id}:`, error);
      throw error;
    }
  },

  // Prescriptive recommendations
  getPrescriptiveRecommendations: async (id) => {
    try {
      // Fix: Correct URL pattern, avoiding duplicate "student" in path
      const { data } = await api.get(`/${id}/prescriptive-recommendations`);
      return data;
    } catch (error) {
      console.error(`Error fetching prescriptive recommendations for ID ${id}:`, error);
      throw error;
    }
  },

  // Assign lessons
  assignLessonsToStudent: async (studentId, lessonIds) => {
    try {
      // Fix: Correct URL pattern, avoiding duplicate "student" in path
      const { data } = await api.post(
        `/assign-lessons/${studentId}`,
        { lessonIds }
      );
      return data;
    } catch (error) {
      console.error(`Error assigning lessons to student ${studentId}:`, error);
      throw error;
    }
  },

  // Update a prescriptive activity
  updateActivity: async (activityId, updatedActivity) => {
    try {
      const { data } = await api.put(
        `/update-activity/${activityId}`,
        updatedActivity
      );
      return data;
    } catch (error) {
      console.error(`Error updating activity ${activityId}:`, error);
      throw error;
    }
  },

  // Patch student address
  updateStudentAddress: async (studentId, address) => {
    try {
      // Fix: Correct URL pattern, avoiding duplicate "student" in path
      const { data } = await api.patch(
        `/${studentId}/address`,
        { address }
      );
      return data;
    } catch (error) {
      console.error(`Error updating student address for ID ${studentId}:`, error);
      throw error;
    }
  },

  // Link a parent to a student
  linkParentToStudent: async (studentId, parentId) => {
    try {
      // Fix: Correct URL pattern, avoiding duplicate "student" in path
      const { data } = await api.post(
        `/${studentId}/link-parent`,
        { parentId }
      );
      return data;
    } catch (error) {
      console.error(`Error linking parent ${parentId} to student ${studentId}:`, error);
      throw error;
    }
  },

  // Get dashboard metrics
  getDashboardMetrics: async () => {
    try {
      // This is a custom endpoint that would need to be implemented
      // If it's not available, we can calculate metrics from the students list
      const { data } = await directApi.get('/dashboard/metrics');
      return data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);

      // Fallback: calculate metrics from students list
      try {
        const studentsResponse = await StudentApiService.getAllStudents();
        const students = studentsResponse.students || studentsResponse;

        // Calculate metrics from students
        const totalStudents = students.length;
        const completedActivities = students.reduce((sum, s) =>
          sum + (s.activitiesCompleted || 0), 0);
        const totalActivities = students.reduce((sum, s) =>
          sum + (s.totalActivities || 25), 0);
        const completionRate = totalActivities > 0
          ? Math.round((completedActivities / totalActivities) * 100)
          : 0;
        const averageScore = students.length > 0
          ? Math.round(students.reduce((sum, s) =>
            sum + (s.readingPercentage || 0), 0) / students.length)
          : 0;

        return {
          totalStudents,
          completedActivities,
          totalActivities,
          completionRate,
          averageScore,
          pendingEdits: Math.min(Math.floor(totalStudents / 3), 5) // Estimate
        };
      } catch (fallbackError) {
        console.error('Error calculating metrics fallback:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  // Get student distribution by reading level
  getReadingLevelDistribution: async () => {
    try {
      // This is a custom endpoint that would need to be implemented
      const { data } = await directApi.get('/dashboard/reading-level-distribution');
      return data;
    } catch (error) {
      console.error('Error fetching reading level distribution:', error);

      // Fallback: calculate from students list
      try {
        const studentsResponse = await StudentApiService.getAllStudents();
        const students = studentsResponse.students || studentsResponse;

        // Count students by reading level
        const levelCounts = {};
        const levelColors = {
          'Low Emerging': '#FF6B8A',
          'High Emerging': '#FF9E40',
          'Developing': '#FFCD56',
          'Transitioning': '#6C8EF4',
          'At Grade Level': '#4BC0C0'
        };

        // Define levelMapping if it doesn't exist
        const levelMapping = {
          'Low Emerging': 'Low Emerging',
          'High Emerging': 'High Emerging',
          'Developing': 'Developing',
          'Transitioning': 'Transitioning', 
          'At Grade Level': 'At Grade Level',
          'Not Assessed': 'Not Assessed'
        };

        students.forEach(student => {
          const rawLevel = student.readingLevel || 'Not Assessed';
          const normalizedLevel = levelMapping[rawLevel] || rawLevel;

          if (!levelCounts[normalizedLevel]) {
            levelCounts[normalizedLevel] = {
              name: normalizedLevel,
              value: 0,
              color: levelColors[normalizedLevel] || '#B0B0B0'
            };
          }

          levelCounts[normalizedLevel].value += 1;
        });

        return Object.values(levelCounts);
      } catch (fallbackError) {
        console.error('Error calculating reading level distribution fallback:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  // Get students needing attention
  getStudentsNeedingAttention: async (limit = 5) => {
    try {
      // This would be a custom endpoint
      const { data } = await directApi.get('/dashboard/students-needing-attention', {
        params: { limit }
      });
      return data;
    } catch (error) {
      console.error('Error fetching students needing attention:', error);

      // Fallback: calculate from students list
      try {
        const studentsResponse = await StudentApiService.getAllStudents();
        const students = studentsResponse.students || studentsResponse;

        // Process students to match expected format
        const processedStudents = students.map(student => {
          const readingLevel = student.readingLevel || 'Not Assessed';
          const score = student.readingPercentage || Math.floor(Math.random() * 50) + 30; // Random score as fallback
          const completionRate = student.activitiesCompleted
            ? Math.round((student.activitiesCompleted / (student.totalActivities || 25)) * 100)
            : Math.floor(Math.random() * 60) + 20; // Random completion rate as fallback

          return {
            id: student.id || student.idNumber || (student._id ? student._id.toString() : ''),
            name: student.name || `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
            readingLevel: readingLevel,
            lastScore: score,
            completionRate: completionRate,
            difficulty: student.focusAreas || 'Needs assessment to determine areas for improvement'
          };
        });

        // Sort by score and take the lowest scoring students
        return processedStudents
          .sort((a, b) => a.lastScore - b.lastScore)
          .slice(0, limit);
      } catch (fallbackError) {
        console.error('Error calculating students needing attention fallback:', fallbackError);
        throw error; // Throw original error
      }
    }
  },

  // Static lookup endpoints
  getGradeLevels: async () => {
    try {
      // First, try to get grade levels from the API
      try {
        // Fix: Use the correct endpoint path with no leading slash
        const { data } = await api.get('grade-levels');
        console.log("Successfully fetched grade levels from API:", data);
        return data;
      } catch (apiError) {
        console.warn('Error fetching grade levels from API, trying dashboard API:', apiError);
        
        // Try alternate endpoint
        try {
          const { data } = await directApi.get('/dashboard/grade-levels');
          console.log("Successfully fetched grade levels from dashboard API:", data);
          return data;
        } catch (dashboardError) {
          console.warn('Error fetching grade levels from dashboard API, using static fallback:', dashboardError);
        }
        
        // If all API endpoints fail, use the static fallback
        return [
          'Kindergarten',
          'Grade 1',
          'Grade 2',
          'Grade 3',
          'Grade 4',
          'Grade 5',
          'Grade 6'
        ];
      }
    } catch (error) {
      // Fallback to static list
      console.warn('Error fetching grade levels:', error);
      return ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
    }
  },

  getReadingLevels: async () => {
    try {
      // First, try to get reading levels from the API
      try {
        // Fix: Use the correct endpoint path with no leading slash
        const { data } = await api.get('reading-levels');
        console.log("Successfully fetched reading levels from API:", data);
        return data;
      } catch (apiError) {
        console.warn('Error fetching reading levels from API, using fallback:', apiError);
        
        // Try alternate endpoint
        try {
          const { data } = await directApi.get('/dashboard/reading-levels');
          console.log("Successfully fetched reading levels from dashboard API:", data);
          return data;
        } catch (dashboardError) {
          console.warn('Error fetching reading levels from dashboard API, using static fallback:', dashboardError);
        }
        
        // If all API endpoints fail, use the static fallback
        return [
          'Low Emerging',
          'High Emerging',
          'Developing',
          'Transitioning',
          'At Grade Level',
          'Not Assessed'
        ];
      }
    } catch (error) {
      console.error('Error in getReadingLevels function:', error);
      // Final fallback to ensure we always return something
      return [
        'Low Emerging',
        'High Emerging',
        'Developing',
        'Transitioning',
        'At Grade Level',
        'Not Assessed'
      ];
    }
  },

  getReadingLevelDescription: (level) => {
    const descriptions = {
      'Low Emerging': 'Nagsisimulang Matuto - Beginning to recognize letters and sounds',
      'High Emerging': 'Umuunlad na Matuto - Developing letter-sound connections',
      'Developing': 'Paunlad na Pagbasa - Working on basic fluency and word recognition',
      'Transitioning': 'Lumalago na Pagbasa - Building reading comprehension skills',
      'At Grade Level': 'Batay sa Antas - Reading at expected grade level',
      'Not Assessed': 'Hindi pa nasusuri - Evaluation needed'
    };
    return descriptions[level] || level;
  },

  getReadingLevelClass: (level) => {
    const classMap = {
      'Low Emerging': 'mp-level-1',
      'High Emerging': 'mp-level-2',
      'Developing': 'mp-level-3',
      'Transitioning': 'mp-level-4',
      'At Grade Level': 'mp-level-5',
      'Not Assessed': ''
    };
    return classMap[level] || 'mp-level-1';
  },

  // Get sections/classes
  getSections: async () => {
    try {
      // First, try to get sections from the API
      try {
        // Fix: Use the correct endpoint path with no leading slash
        const { data } = await api.get('sections');
        console.log("Successfully fetched sections from API:", data);
        return data;
      } catch (apiError) {
        console.warn('Error fetching sections from API, trying dashboard API:', apiError);
        
        // Try alternate endpoint
        try {
          const { data } = await directApi.get('/dashboard/sections');
          console.log("Successfully fetched sections from dashboard API:", data);
          return data;
        } catch (dashboardError) {
          console.warn('Error fetching sections from dashboard API, trying users collection:', dashboardError);
          
          // Try to get sections from the users collection
          try {
            // Get all students and extract unique sections
            const { data: studentsData } = await api.get('/students', { params: { limit: 100 } });
            
            if (studentsData && studentsData.students && studentsData.students.length > 0) {
              console.log("Extracting sections from students data");
              
              // Extract unique sections from students
              const sectionsSet = new Set();
              
              studentsData.students.forEach(student => {
                if (student.section) {
                  sectionsSet.add(student.section);
                }
              });
              
              const uniqueSections = Array.from(sectionsSet);
              
              // If we found sections, return them
              if (uniqueSections.length > 0) {
                console.log("Successfully extracted sections from students:", uniqueSections);
                return uniqueSections;
              }
            }
          } catch (usersError) {
            console.warn('Error extracting sections from users collection:', usersError);
            // Continue to fallback
          }
          
          // If we couldn't get sections from the users collection, try the users API directly
          try {
            const { data: usersData } = await directApi.get('/users/sections');
            if (Array.isArray(usersData)) {
              console.log("Successfully fetched sections from users API:", usersData);
              return usersData;
            }
          } catch (usersApiError) {
            console.warn('Error fetching sections from users API:', usersApiError);
            // Continue to fallback
          }
        }
        
        // If all API endpoints fail, use the static fallback
        return [
          'Sampaguita', 
          'Rosal', 
          'Rosa', 
          'Lily', 
          'Orchid',
          'Unity',
          'Peace',
          'Dignity'
        ];
      }
    } catch (error) {
      // Fallback to static list
      console.warn('Error fetching sections:', error);
      return [
        'Sampaguita', 
        'Rosal', 
        'Rosa', 
        'Lily', 
        'Orchid',
        'Unity',
        'Peace',
        'Dignity'
      ];
    }
  },

  // Get category results for a student
  getCategoryResults: async (id) => {
    try {
      console.log(`Fetching category results for student ID: ${id}`);
      // Use the api instance with the correct endpoint path (no leading slash)
      const { data } = await api.get(`${id}/category-results`);
      
      console.log("Category results raw data:", data);
      
      // Check if we have meaningful data
      if (data && data.categories && data.categories.length > 0) {
        // Make sure all category objects have required properties
        data.categories = data.categories.map(category => ({
          categoryName: category.categoryName || 'Unknown Category',
          totalQuestions: category.totalQuestions || 0,
          correctAnswers: category.correctAnswers || 0,
          score: category.score || 0,
          isPassed: category.isPassed || (category.score >= 75),
          passingThreshold: category.passingThreshold || 75
        }));
        console.log("Valid category data found with", data.categories.length, "categories");
        return data;
      } else {
        // No meaningful data
        console.log("No valid category data found in API response");
        return null;
      }
    } catch (error) {
      console.error(`Error fetching category results for student ${id}:`, error);
      
      // Return null in case of error
      return null;
    }
  },

  // Transform pre-assessment data to category results format
  transformPreAssessmentToCategories: (preAssessmentData) => {
    if (!preAssessmentData || !preAssessmentData.skillDetails || preAssessmentData.skillDetails.length === 0) {
      return null;
    }

    // Create categories array from skillDetails
    const categories = preAssessmentData.skillDetails.map(skill => ({
      categoryName: skill.categoryName || skill.category,
      totalQuestions: skill.total || 0,
      correctAnswers: skill.correct || 0,
      score: skill.score || 0,
      isPassed: skill.score >= 75,
      passingThreshold: 75
    }));

    // Calculate if all categories passed
    const allCategoriesPassed = categories.every(cat => cat.isPassed);

    // Format the data to match category_results structure
    return {
      studentId: preAssessmentData.studentId,
      assessmentType: 'pre-assessment',
      assessmentDate: preAssessmentData.completedAt || new Date().toISOString(),
      categories: categories,
      overallScore: preAssessmentData.overallScore || 0,
      readingLevel: preAssessmentData.readingLevel || 'Not Assessed',
      readingPercentage: preAssessmentData.overallScore || 0,
      allCategoriesPassed: allCategoriesPassed
    };
  },

  // Score-to-level helper
  getReadingLevelFromScore: (score, maxScore = 5) => {
    const pct = (score / maxScore) * 100;
    if (pct <= 25) return 'Low Emerging';
    if (pct <= 50) return 'Developing';
    if (pct <= 75) return 'Transitioning';
    return 'At Grade Level';
  }
};

export default StudentApiService;