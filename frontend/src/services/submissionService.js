// src/services/submissionService.js

/**
 * Service for handling submission data
 * In a real application, these would make API calls to a backend server
 */

// Simulated API delay
const simulateApiCall = (data) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 800);
    });
  };
  
  // Mock submissions data
  const mockSubmissions = [
    {
      id: 1,
      teacherName: 'Filipino Folk Tales',
      topic: 'Reading Comprehension',
      timeSpent: '15 minutes',
      attempts: 1,
      submitted: 'Apr 8, 2025, 10:30 AM',
      status: 'Completed'
    },
    {
      id: 2,
      teacherName: 'Filipino Letter Sounds',
      topic: 'Phonological Awareness',
      timeSpent: '20 minutes',
      attempts: 2,
      submitted: 'Apr 8, 2025, 11:45 AM',
      status: 'Pending'
    },
    {
      id: 3,
      teacherName: 'Filipino Sentence Structure',
      topic: 'Grammar',
      timeSpent: '18 minutes',
      attempts: 1,
      submitted: 'Apr 7, 2025, 09:15 AM',
      status: 'Completed'
    },
    {
      id: 4,
      teacherName: 'CVC Pattern Words',
      topic: 'Word Recognition',
      timeSpent: '5 minutes',
      attempts: 1,
      submitted: 'Apr 7, 2025, 02:20 PM',
      status: 'Pending'
    },
    {
      id: 5,
      teacherName: 'Filipino Short Stories',
      topic: 'Reading Comprehension',
      timeSpent: '22 minutes',
      attempts: 1,
      submitted: 'Apr 6, 2025, 01:10 PM',
      status: 'Completed'
    },
    {
      id: 6,
      teacherName: 'Vowel Sounds',
      topic: 'Phonological Awareness',
      timeSpent: '12 minutes',
      attempts: 3,
      submitted: 'Apr 5, 2025, 03:45 PM',
      status: 'Needs Intervention'
    },
    {
      id: 7,
      teacherName: 'Basic Vocabulary',
      topic: 'Word Recognition',
      timeSpent: '10 minutes',
      attempts: 2,
      submitted: 'Apr 5, 2025, 11:20 AM',
      status: 'Completed'
    },
    {
      id: 8,
      teacherName: 'Sight Words',
      topic: 'Word Recognition',
      timeSpent: '8 minutes',
      attempts: 1,
      submitted: 'Apr 4, 2025, 09:30 AM',
      status: 'Needs Intervention'
    }
  ];
  
  /**
   * Fetch all submissions
   * @returns {Promise} - Promise that resolves to an array of submissions
   */
  export const fetchAllSubmissions = async () => {
    try {
      // In a real app, this would be an API call like:
      // const response = await fetch('/api/submissions');
      // const data = await response.json();
      
      return await simulateApiCall(mockSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  };
  
  /**
   * Fetch submission statistics
   * @returns {Promise} - Promise that resolves to submission statistics
   */
  export const fetchSubmissionStats = async () => {
    try {
      // Calculate statistics
      const total = mockSubmissions.length;
      const completed = mockSubmissions.filter(s => s.status === 'Completed').length;
      const needsIntervention = mockSubmissions.filter(s => s.status === 'Needs Intervention').length;
      const pending = mockSubmissions.filter(s => s.status === 'Pending').length;
  
      const stats = {
        total,
        completed,
        needsIntervention,
        pending
      };
  
      return await simulateApiCall(stats);
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      throw error;
    }
  };
  
  /**
   * Filter submissions based on criteria
   * @param {string} searchTerm - Search term to filter by
   * @param {string} timeFilter - Time filter (All Time, This Week, This Month)
   * @param {string} gradeFilter - Grade filter
   * @param {string} statusFilter - Status filter
   * @returns {Promise} - Promise that resolves to filtered submissions
   */
  export const filterSubmissions = async (searchTerm, timeFilter, gradeFilter, statusFilter) => {
    try {
      // In a real app, this would be an API call with query parameters
      
      // Simulate filtering on the client side
      const filtered = mockSubmissions.filter(submission => {
        const matchesSearch = !searchTerm || 
                            submission.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            submission.topic.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTimeFilter = true;
        if (timeFilter === 'This Week') {
          // Logic to filter by this week
          // In a real app, you would compare dates
          matchesTimeFilter = submission.submitted.includes('Apr');
        } else if (timeFilter === 'This Month') {
          // Logic to filter by this month
          matchesTimeFilter = submission.submitted.includes('Apr');
        }
    
        let matchesStatusFilter = true;
        if (statusFilter !== 'All Statuses') {
          matchesStatusFilter = submission.status === statusFilter;
        }
    
        // Grade filter would be implemented here if we had grade data
        
        return matchesSearch && matchesTimeFilter && matchesStatusFilter;
      });
  
      return await simulateApiCall(filtered);
    } catch (error) {
      console.error('Error filtering submissions:', error);
      throw error;
    }
  };
  
  /**
   * Update submission status
   * @param {number} id - Submission ID
   * @param {string} status - New status
   * @returns {Promise} - Promise that resolves to updated submission
   */
  export const updateSubmissionStatus = async (id, status) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/submissions/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status })
      // });
      // const data = await response.json();
      
      // Simulate updating the submission
      const updatedSubmission = mockSubmissions.find(s => s.id === id);
      if (updatedSubmission) {
        updatedSubmission.status = status;
      }
      
      return await simulateApiCall(updatedSubmission);
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw error;
    }
  };