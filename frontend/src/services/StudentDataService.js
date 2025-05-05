// src/services/StudentDataService.js

// Mock Data for students
const mockStudentsData = [
    {
      id: 'STD-1001',
      name: 'Isabella Cruz',
      age: 5,
      gradeLevel: 'Kindergarten',
      section: 'Sampaguita',
      gender: 'Female',
      readingLevel: 'Antas 1',
      parent: 'Maricel & Ramon Cruz',
      contactNumber: '+63 912 222 3344',
      parentEmail: 'cruz_family@email.com',
      address: '123 Bonifacio St., Quezon City',
      lastAssessmentDate: '2025-03-15',
      progress: 45,
      lastActivityDate: '2025-04-01'
    },
    // {
    //   id: 'STD-1002',
    //   name: 'Luis Ramirez',
    //   age: 6,
    //   gradeLevel: 'Grade 1',
    //   section: 'Rosal',
    //   gender: 'Male',
    //   readingLevel: 'Antas 2',
    //   parent: 'Ana Ramirez',
    //   contactNumber: '+63 913 333 1234',
    //   parentEmail: 'ramirez_family@email.com',
    //   address: '45 Mabini Ave., Quezon City',
    //   lastAssessmentDate: '2025-03-20',
    //   progress: 60,
    //   lastActivityDate: '2025-03-29'
    // },
    {
      id: 'STD-1003',
      name: 'Juan Carlos Dela Rosa',
      age: 9,
      gradeLevel: 'Grade 3',
      section: 'Orchid',
      gender: 'Male',
      readingLevel: 'Antas 4',
      parent: 'Nina & Carlos Dela Rosa',
      contactNumber: '+63 922 334 5678',
      parentEmail: 'delarosa_family@email.com',
      address: '78 Rizal St., Quezon City',
      lastAssessmentDate: '2025-03-10',
      progress: 88,
      lastActivityDate: '2025-04-02'
    },
    {
      id: 'STD-1004',
      name: 'Kit Nicholas Santiago',
      age: 8,
      gradeLevel: 'Grade 2',
      section: 'Lily',
      gender: 'Male',
      readingLevel: 'Antas 3',
      parent: 'Teresa & Roberto Santiago',
      contactNumber: '+63 912 345 6789',
      parentEmail: 'santiago_family@email.com',
      address: '29 Aguinaldo Blvd., Quezon City',
      lastAssessmentDate: '2025-02-28',
      progress: 72,
      lastActivityDate: '2025-03-28'
    },
    {
      id: 'STD-1005',
      name: 'Sophia Reyes',
      age: 9,
      gradeLevel: 'Grade 3',
      section: 'Orchid',
      gender: 'Female',
      readingLevel: 'Antas 5',
      parent: 'Ana Reyes',
      contactNumber: '+63 923 456 7890',
      parentEmail: 'reyes_family@email.com',
      address: '56 Laurel St., Quezon City',
      lastAssessmentDate: '2025-03-25',
      progress: 90,
      lastActivityDate: '2025-03-25'
    },
    {
      id: 'STD-1006',
      name: 'Miguel Aquino',
      age: 7,
      gradeLevel: 'Grade 1',
      section: 'Rosal',
      gender: 'Male',
      readingLevel: 'Antas 2',
      parent: 'Jose & Maria Aquino',
      contactNumber: '+63 933 567 8901',
      parentEmail: 'aquino_family@email.com',
      address: '12 Luna St., Quezon City',
      lastAssessmentDate: '2025-03-18',
      progress: 65,
      lastActivityDate: '2025-03-31'
    },
    {
      id: 'STD-1007',
      name: 'Maria Santos',
      age: 6,
      gradeLevel: 'Kindergarten',
      section: 'Sampaguita',
      gender: 'Female',
      readingLevel: 'Antas 1',
      parent: 'Pedro & Elena Santos',
      contactNumber: '+63 943 678 9012',
      parentEmail: 'santos_family@email.com',
      address: '90 Bonifacio St., Quezon City',
      lastAssessmentDate: '2025-03-12',
      progress: 40,
      lastActivityDate: '2025-03-30'
    },
    {
      id: 'STD-1008',
      name: 'Gabriel Lim',
      age: 8,
      gradeLevel: 'Grade 2',
      section: 'Lily',
      gender: 'Male',
      readingLevel: 'Antas 3',
      parent: 'Linda & Michael Lim',
      contactNumber: '+63 953 789 0123',
      parentEmail: 'lim_family@email.com',
      address: '34 Jacinto St., Quezon City',
      lastAssessmentDate: '2025-03-22',
      progress: 75,
      lastActivityDate: '2025-04-01'
    }
  ];
  
  // Simulate API delay
  const simulateApiDelay = () => new Promise(resolve => 
    setTimeout(resolve, Math.random() * 500 + 300)
  );
  
  // Get all students with optional delay
  export const getStudents = async () => {
    await simulateApiDelay();
    return [...mockStudentsData];
  };
  
  // Get a single student by ID
  export const getStudentById = async (studentId) => {
    await simulateApiDelay();
    const student = mockStudentsData.find(s => s.id === studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    return { ...student };
  };
  
  // Generate mock progress report for a student
  export const getStudentProgressReport = async (studentId) => {
    await simulateApiDelay();
    
    // Find the student
    const student = mockStudentsData.find(s => s.id === studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    // Generate a progress report based on student data
    return {
      studentId,
      schoolYear: '2024-2025',
      domains: [
        {
          name: 'COMMUNICATIONS ARTS',
          objectives: [
            {
              description: 'For lexical building and increase in vocabulary bank, these were attainable for this school year:',
              subItems: [
                {
                  name: 'Spells words with silent consonants',
                  achieved: student.progress > 70,
                  minimalAssistance: student.progress <= 70 && student.progress > 50,
                  moderateAssistance: student.progress <= 50 && student.progress > 30,
                  maximalAssistance: student.progress <= 30,
                  remarks: `${student.name} was given several word families with silent consonants - silent B, K, L, P, G and W. ${student.gender === 'Male' ? 'He' : 'She'} was able to enunciate ${student.progress}% of the words in the list correctly.`
                },
                {
                  name: 'Identifies and reads CVC words',
                  achieved: student.progress > 65,
                  minimalAssistance: student.progress <= 65 && student.progress > 45,
                  moderateAssistance: student.progress <= 45 && student.progress > 25,
                  maximalAssistance: student.progress <= 25,
                  remarks: `${student.name} can identify and read consonant-vowel-consonant patterns with ${student.progress > 70 ? 'high' : student.progress > 50 ? 'moderate' : 'low'} accuracy.`
                },
                {
                  name: 'Reads simple sentences fluently',
                  achieved: student.progress > 75,
                  minimalAssistance: student.progress <= 75 && student.progress > 60,
                  moderateAssistance: student.progress <= 60 && student.progress > 40,
                  maximalAssistance: student.progress <= 40,
                  remarks: `${student.name} needs practice with longer words. Material presented was one picture and one word per slide; teacher reads the word and asks ${student.name} to say it with her on the second reading.`
                }
              ]
            }
          ]
        },
        {
          name: 'READING COMPREHENSION',
          objectives: [
            {
              description: 'For comprehension skill development, these were targeted:',
              subItems: [
                {
                  name: 'Answers simple questions about a story',
                  achieved: student.progress > 80,
                  minimalAssistance: student.progress <= 80 && student.progress > 65,
                  moderateAssistance: student.progress <= 65 && student.progress > 45,
                  maximalAssistance: student.progress <= 45,
                  remarks: `${student.name} can answer simple who/what questions related to stories read to ${student.gender === 'Male' ? 'him' : 'her'}, but needs support with why questions.`
                },
                {
                  name: 'Identifies main characters in a story',
                  achieved: student.progress > 60,
                  minimalAssistance: student.progress <= 60 && student.progress > 45,
                  moderateAssistance: student.progress <= 45 && student.progress > 30,
                  maximalAssistance: student.progress <= 30,
                  remarks: `${student.name} successfully identifies main characters in stories after one reading.`
                }
              ]
            }
          ]
        }
      ],
      recommendations: [
        `${student.name} is still developing fine motor skills and may need additional practice and support to improve ${student.gender === 'Male' ? 'his' : 'her'} hand writing and control when using small things.`,
        `I encourage ${student.gender === 'Male' ? 'him' : 'her'} to work on strengthening ${student.gender === 'Male' ? 'his' : 'her'} fine motor skills such as using scissors and holding a pencil correctly. Consistent practice at home will help improve ${student.gender === 'Male' ? 'his' : 'her'} control and precision.`,
        `${student.gender === 'Male' ? 'He' : 'She'} needs to focus on developing better control over ${student.gender === 'Male' ? 'his' : 'her'} fine motor movements, such as coloring within the lines and proper grip while writing. Continued practice and guidance will support ${student.gender === 'Male' ? 'his' : 'her'} progress in this area.`
      ]
    };
  };
  
  // Send progress report to parent
  export const sendProgressReportToParent = async (studentId, message) => {
    await simulateApiDelay();
    
    // This would normally send an email or notification
    console.log(`Sending progress report for student ${studentId} to parent`);
    console.log('Message:', message);
    
    return {
      success: true,
      message: 'Progress report sent successfully',
      sentAt: new Date().toISOString()
    };
  };
  
  // Update student information
  export const updateStudent = async (studentId, updatedData) => {
    await simulateApiDelay();
    
    const studentIndex = mockStudentsData.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    // Update the student data
    mockStudentsData[studentIndex] = {
      ...mockStudentsData[studentIndex],
      ...updatedData
    };
    
    return {
      success: true,
      message: 'Student information updated successfully',
      student: { ...mockStudentsData[studentIndex] }
    };
  };