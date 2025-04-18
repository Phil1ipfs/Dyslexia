// src/services/studentService.js

/**
 * Service for handling student data
 * In a real application, these would make API calls to a backend server
 */

// Simulated API delay
const simulateApiCall = (data) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 500);
    });
  };
  
  // Mock student data
  const mockStudents = [
    {
      id: 1,
      name: 'Christine Brooks',
      parentEmail: 'christianbrooks@gmail.com',
      parentName: 'Christine Brooks'
    },
    {
      id: 2,
      name: 'Rosie Pearson',
      parentEmail: 'christianbrooks@gmail.com',
      parentName: 'Alan Cain'
    },
    {
      id: 3,
      name: 'Darrell Caldwell',
      parentEmail: 'christianbrooks@gmail.com',
      parentName: 'Alan Cain'
    },
    {
      id: 4,
      name: 'Gilbert Johnston',
      parentEmail: 'christianbrooks@gmail.com',
      parentName: 'Alan Cain'
    },
    {
      id: 5,
      name: 'Alan Cain',
      parentEmail: 'christianbrooks@gmail.com',
      parentName: 'Alan Cain'
    },
    {
      id: 6,
      name: 'Alfred Murray',
      parentEmail: 'christianbrooks@gmail.com',
      parentName: 'Alan Cain'
    }
  ];
  
  // Mock stats data
  const mockStats = {
    totalStudents: 8,
    totalTeachers: 4,
    totalParents: 2
  };
  
  /**
   * Fetch all students
   * @returns {Promise} - Promise that resolves to an array of students
   */
  export const fetchAllStudents = async () => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/students');
      // const data = await response.json();
      
      return await simulateApiCall(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  };
  
  /**
   * Fetch student overview statistics
   * @returns {Promise} - Promise that resolves to stats object
   */
  export const fetchStudentStats = async () => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/students/stats');
      // const data = await response.json();
      
      return await simulateApiCall(mockStats);
    } catch (error) {
      console.error('Error fetching student stats:', error);
      throw error;
    }
  };
  
  /**
   * Add a new student
   * @param {Object} studentData - New student data
   * @returns {Promise} - Promise that resolves to the new student
   */
  export const addStudent = async (studentData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/students', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(studentData)
      // });
      // const data = await response.json();
      
      // Simulate creating a new student
      const newStudent = {
        id: mockStudents.length + 1,
        ...studentData
      };
      
      // Add to mock data
      mockStudents.push(newStudent);
      
      return await simulateApiCall(newStudent);
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };
  
  /**
   * Update an existing student
   * @param {number} studentId - ID of student to update
   * @param {Object} updatedData - Updated student data
   * @returns {Promise} - Promise that resolves to the updated student
   */
  export const updateStudent = async (studentId, updatedData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/students/${studentId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updatedData)
      // });
      // const data = await response.json();
      
      // Find and update the student in our mock data
      const studentIndex = mockStudents.findIndex(s => s.id === studentId);
      if (studentIndex !== -1) {
        mockStudents[studentIndex] = {
          ...mockStudents[studentIndex],
          ...updatedData
        };
        
        return await simulateApiCall(mockStudents[studentIndex]);
      }
      
      throw new Error('Student not found');
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };
  
  /**
   * Delete a student
   * @param {number} studentId - ID of student to delete
   * @returns {Promise} - Promise that resolves when student is deleted
   */
  export const deleteStudent = async (studentId) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/students/${studentId}`, {
      //   method: 'DELETE'
      // });
      
      // Remove from mock data
      const studentIndex = mockStudents.findIndex(s => s.id === studentId);
      if (studentIndex !== -1) {
        mockStudents.splice(studentIndex, 1);
        return await simulateApiCall({ success: true });
      }
      
      throw new Error('Student not found');
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };
  
  /**
   * Search for students
   * @param {string} searchTerm - Term to search for
   * @param {string} searchBy - Field to search by (name, email, parent)
   * @returns {Promise} - Promise that resolves to filtered students
   */
  export const searchStudents = async (searchTerm, searchBy) => {
    try {
      // In a real app, this would be an API call with query parameters
      // const response = await fetch(`/api/students/search?term=${searchTerm}&by=${searchBy}`);
      // const data = await response.json();
      
      // Filter students based on search criteria
      let filteredStudents = [...mockStudents];
      
      if (searchTerm.trim() !== '') {
        filteredStudents = mockStudents.filter(student => {
          const searchValue = searchTerm.toLowerCase();
          
          if (searchBy === 'name') {
            return student.name.toLowerCase().includes(searchValue);
          } else if (searchBy === 'email') {
            return student.parentEmail.toLowerCase().includes(searchValue);
          } else if (searchBy === 'parent') {
            return student.parentName.toLowerCase().includes(searchValue);
          }
          
          return true;
        });
      }
      
      return await simulateApiCall(filteredStudents);
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  };