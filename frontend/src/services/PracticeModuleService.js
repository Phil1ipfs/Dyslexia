// src/services/PracticeModuleService.js

/**
 * Service for managing practice modules and templates.
 * This would normally interact with an API, but for demo purposes,
 * we're using mock data.
 */
class PracticeModuleService {
  /**
   * Get templates for a specific concept
   * @param {string} concept - The concept name (e.g., "Vowel Sound", "Syllable Blending")
   * @returns {Array} - Array of available templates for the concept
   */
  getTemplatesForConcept(concept) {
    // Mock data - in a real implementation, this would come from an API
    const allTemplates = {
      "Vowel Sound": [
        {
          id: 1,
          title: "Vowel Sound Recognition",
          itemCount: 5,
          level: "Antas Una",
          description: "Practice identifying different vowel sounds in Filipino."
        },
        {
          id: 2,
          title: "Vowel Pairs Practice",
          itemCount: 8,
          level: "Antas Dalawa",
          description: "Practice identifying and using vowel pairs in Filipino."
        }
      ],
      "Syllable Blending": [
        {
          id: 3,
          title: "Syllable Combination Basics",
          itemCount: 6,
          level: "Antas Una",
          description: "Basic practice for blending syllables in simple Filipino words."
        },
        {
          id: 4,
          title: "Advanced Syllable Blending",
          itemCount: 10,
          level: "Antas Dalawa",
          description: "More advanced practice for blending syllables in complex Filipino words."
        }
      ],
      "Word Recognition": [
        {
          id: 5,
          title: "Common Words Recognition",
          itemCount: 5,
          level: "Antas Una",
          description: "Practice recognizing common Filipino words."
        },
        {
          id: 6,
          title: "Sight Words Practice",
          itemCount: 8,
          level: "Antas Dalawa",
          description: "Practice recognizing Filipino sight words."
        }
      ],
      "Reading Comprehension": [
        {
          id: 7,
          title: "Simple Story Comprehension",
          itemCount: 4,
          level: "Antas Dalawa",
          description: "Practice understanding simple Filipino stories."
        },
        {
          id: 8,
          title: "Reading and Answering Questions",
          itemCount: 6,
          level: "Antas Tatlo",
          description: "Practice reading Filipino passages and answering questions."
        }
      ]
    };
    
    // Return templates for the requested concept, or empty array if none exist
    return allTemplates[concept] || [];
  }
  
  /**
   * Assign a practice module to a student
   * @param {number} studentId - The student's ID
   * @param {number} templateId - The template ID to assign
   * @returns {Promise} - Promise resolving to the assignment result
   */
  assignPracticeModule(studentId, templateId) {
    // In a real implementation, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          assignmentId: Math.floor(Math.random() * 1000),
          message: "Practice module assigned successfully"
        });
      }, 500);
    });
  }
  
  /**
   * Get assigned practice modules for a student
   * @param {number} studentId - The student's ID
   * @returns {Promise} - Promise resolving to an array of assigned modules
   */
  getAssignedModules(studentId) {
    // In a real implementation, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 101,
            templateId: 3,
            title: "Syllable Combination Basics",
            assignedDate: "2025-04-15",
            dueDate: "2025-04-22",
            status: "in-progress",
            progress: 60
          },
          {
            id: 102,
            templateId: 5,
            title: "Common Words Recognition",
            assignedDate: "2025-04-12",
            dueDate: "2025-04-19",
            status: "completed",
            progress: 100,
            score: 85
          }
        ]);
      }, 500);
    });
  }
  
  /**
   * Get a student's progress on a specific activity
   * @param {number} studentId - The student's ID
   * @param {number} activityId - The activity ID
   * @returns {Promise} - Promise resolving to the activity progress details
   */
  getActivityProgress(studentId, activityId) {
    // In a real implementation, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: activityId,
          progress: 75,
          score: 80,
          timeSpent: "14:30",
          lastAccessed: "2025-04-18T14:30:00",
          questions: [
            {
              id: 1,
              text: "Ano ang unang letra ng salitang 'aso'?",
              correct: true,
              studentAnswer: "A",
              correctAnswer: "A"
            },
            {
              id: 2,
              text: "Ilang pantig mayroon ang salitang 'bahay'?",
              correct: true,
              studentAnswer: "2",
              correctAnswer: "2"
            },
            {
              id: 3,
              text: "Anong tunog ang nag-uumpisa sa salitang 'eroplano'?",
              correct: false,
              studentAnswer: "O",
              correctAnswer: "E"
            }
          ]
        });
      }, 500);
    });
  }
  
  /**
   * Create a new practice module template
   * @param {Object} templateData - The template data
   * @returns {Promise} - Promise resolving to the created template
   */
  createTemplate(templateData) {
    // In a real implementation, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.floor(Math.random() * 1000),
          ...templateData,
          createdAt: new Date().toISOString(),
          status: "pending_approval"
        });
      }, 800);
    });
  }
}

export default new PracticeModuleService();