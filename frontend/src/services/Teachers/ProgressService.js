// src/services/ProgressService.js
// Mock service for student progress data with English translations of field names

// Mock data for student details
const mockStudents = [
  {
    id: '101',
    name: 'Juan Cruz',
    age: 7,
    gradeLevel: 'Grade 1',
    gender: 'Male',
    readingLevel: 'Antas 2',
    section: 'Sampaguita'
  },
  {
    id: '102',
    name: 'Maria Santos',
    age: 6,
    gradeLevel: 'Kindergarten',
    gender: 'Female',
    readingLevel: 'Antas 1',
    section: 'Rosal'
  },
  {
    id: '103',
    name: 'Pedro Reyes',
    age: 8,
    gradeLevel: 'Grade 2',
    gender: 'Male',
    readingLevel: 'Antas 3',
    section: 'Orchid'
  }
];

// Mock assessment data for pre-assessment results
const mockAssessmentData = {
  '101': {
    studentId: '101',
    readingLevel: 'Antas 2',
    recommendedLevel: 'Antas 2',
    assessmentDate: 'Abril 15, 2025',
    overallScore: 63,
    skillDetails: [
      {
        category: 'Patinig',
        score: 65,
        analysis: 'Nakakabasa si Juan ng mga patinig ngunit nahihirapan sa pagkilala ng mga diptonggo.',
        sampleQuestions: [
          { text: "Ano ang tunog ng letrang 'A'?", studentAnswer: 'a', correctAnswer: 'a', correct: true },
          { text: "Piliin ang tamang patinig sa salitang 'buhok'.", studentAnswer: 'o', correctAnswer: 'u, o', correct: false }
        ]
      },
      {
        category: 'Pantig',
        score: 70,
        analysis: 'Nakakabasa siya ng mga simpleng pantig ngunit nahihirapan sa mga komplikadong pagpapalit-pantig.',
        sampleQuestions: [
          { text: "Ilang pantig ang salitang 'kasama'?", studentAnswer: '3', correctAnswer: '3', correct: true },
          { text: "Paghiwalayin ang mga pantig sa salitang 'kaibigan'.", studentAnswer: 'ka-i-bi-gan', correctAnswer: 'ka-i-bi-gan', correct: true }
        ]
      },
      {
        category: 'Pagkilala ng Salita',
        score: 60,
        analysis: 'Nakikilala niya ang mga pamilyar na salita ngunit kailangan ng tulong sa mga bagong salita.',
        sampleQuestions: [
          { text: "Ano ang salitang ito: 'bahay'?", studentAnswer: 'bahay', correctAnswer: 'bahay', correct: true },
          { text: "Ano ang salitang ito: 'gumagalang'?", studentAnswer: 'gumag-lang', correctAnswer: 'gumagalang', correct: false }
        ]
      },
      {
        category: 'Pag-unawa sa Binasa',
        score: 55,
        analysis: 'Nauunawaan niya ang mga simpleng pangungusap ngunit nahihirapan sa mas mahabang teksto.',
        sampleQuestions: [
          { text: "Sino ang pangunahing tauhan sa 'Si Juan at ang Mangga'?", studentAnswer: 'Juan', correctAnswer: 'Juan', correct: true },
          { text: 'Ano ang aral na makukuha sa kwento?', studentAnswer: 'Hindi ko alam', correctAnswer: 'Maging matiyaga sa paghihintay', correct: false }
        ]
      }
    ],
    focusAreas: 'pagkilala ng mga tunog at pantig'
  },
  '102': {
    studentId: '102',
    readingLevel: 'Antas 1',
    recommendedLevel: 'Antas 1',
    assessmentDate: 'Abril 12, 2025',
    overallScore: 38,
    skillDetails: [
      {
        category: 'Patinig',
        score: 45,
        analysis: 'Si Maria ay nakakakilala ng ilang patinig ngunit kailangan ng karagdagang pagsasanay.',
        sampleQuestions: [
          { text: "Pumili ng patinig para sa salitang 'aso'.", studentAnswer: 'a', correctAnswer: 'a', correct: true }
        ]
      },
      {
        category: 'Pantig',
        score: 40,
        analysis: 'Nangangailangan pa ng tulong sa paghihiwalay ng pantig.',
        sampleQuestions: [
          { text: "Paghiwalayin ang pantig ng 'puno'.", studentAnswer: 'pu-no', correctAnswer: 'pu-no', correct: true }
        ]
      },
      {
        category: 'Pagkilala ng Salita',
        score: 35,
        analysis: 'Nahihirapan pa sa pagbabasa ng mga salitang may dalawang pantig.',
        sampleQuestions: []
      },
      {
        category: 'Pag-unawa sa Binasa',
        score: 30,
        analysis: 'Kailangang sanayin sa pag-unawa ng maiikling pangungusap.',
        sampleQuestions: []
      }
    ],
    focusAreas: 'pagkilala ng mga patinig at pantig'
  },
  '103': {
    studentId: '103',
    readingLevel: 'Antas 3',
    recommendedLevel: 'Antas 3',
    assessmentDate: 'Abril 10, 2025',
    overallScore: 78,
    skillDetails: [
      {
        category: 'Pag-unawa sa Binasa',
        score: 70,
        analysis: 'May kakayahang umintindi ng mas mahabang teksto ngunit kailangang paigtingin ang inferencing skills.',
        sampleQuestions: [
          { text: 'Ano ang pangunahing ideya ng talata?', studentAnswer: 'Pagmamahal sa kalikasan', correctAnswer: 'Pagmamahal sa kalikasan', correct: true }
        ]
      }
    ],
    focusAreas: 'pag-unawa sa binasa'
  }
};

// Mock progress data
const mockProgressData = {
  '101': {
    studentId: '101',
    activitiesCompleted: 15,
    totalActivities: 25,
    totalTimeSpent: 320, // minutes
    scores: {
      patinig: 75,
      pantig: 68,
      pagkilalaNgSalita: 62,
      pagUnawaSaBinasa: 58
    },
    recentActivities: [
      { id: 'act001', title: 'Pagkilala ng Patinig', category: 'Patinig', date: '2025-04-15T10:30:00Z', score: 65, timeSpent: 15 },
      { id: 'act002', title: 'Pagbuo ng Pantig', category: 'Pantig', date: '2025-04-16T14:20:00Z', score: 70, timeSpent: 20 },
      { id: 'act003', title: 'Pagbasa ng mga Salitang may Diptonggo', category: 'Patinig', date: '2025-04-18T09:15:00Z', score: 75, timeSpent: 25 },
      { id: 'act004', title: 'Paghihiwalay ng Pantig', category: 'Pantig', date: '2025-04-20T11:45:00Z', score: 68, timeSpent: 18 },
      { id: 'act005', title: 'Pagkilala ng mga Pamilyar na Salita', category: 'Pagkilala ng Salita', date: '2025-04-22T13:10:00Z', score: 62, timeSpent: 22 },
      { id: 'act006', title: 'Pagsasanay sa mga Karaniwang Salita', category: 'Pagkilala ng Salita', date: '2025-04-24T10:20:00Z', score: 65, timeSpent: 20 },
      { id: 'act007', title: 'Pag-unawa sa Maikling Kwento', category: 'Pag-unawa sa Binasa', date: '2025-04-26T09:30:00Z', score: 58, timeSpent: 25 },
      { id: 'act008', title: 'Pagsagot sa mga Tanong tungkol sa Kwento', category: 'Pag-unawa sa Binasa', date: '2025-04-27T14:00:00Z', score: 60, timeSpent: 30 },
      { id: 'act009', title: 'Pagkilala ng Diptonggo', category: 'Patinig', date: '2025-04-28T11:15:00Z', score: 80, timeSpent: 22 },
      { id: 'act010', title: 'Pagbasa ng mga Salitang may Tatlong Pantig', category: 'Pantig', date: '2025-04-28T15:30:00Z', score: 72, timeSpent: 25 }
    ]
  },
  '102': {
    studentId: '102',
    activitiesCompleted: 8,
    totalActivities: 20,
    totalTimeSpent: 180,
    scores: {
      patinig: 52,
      pantig: 48,
      pagkilalaNgSalita: 40,
      pagUnawaSaBinasa: 35
    },
    recentActivities: [
      { id: 'act201', title: 'Mga Patinig: Flashcards', category: 'Patinig', date: '2025-04-13T08:00:00Z', score: 50, timeSpent: 10 },
      { id: 'act202', title: 'Pagbuo ng Payak na Pantig', category: 'Pantig', date: '2025-04-15T09:30:00Z', score: 48, timeSpent: 12 }
    ]
  },
  '103': {
    studentId: '103',
    activitiesCompleted: 22,
    totalActivities: 30,
    totalTimeSpent: 450,
    scores: {
      patinig: 90,
      pantig: 85,
      pagkilalaNgSalita: 80,
      pagUnawaSaBinasa: 75
    },
    recentActivities: [
      { id: 'act301', title: 'Tekstong Deskriptibo', category: 'Pag-unawa sa Binasa', date: '2025-04-11T10:00:00Z', score: 75, timeSpent: 25 }
    ]
  }
};

// Mock recommended lessons based on CRLA assessment
const mockRecommendedLessons = {
  // Juan (Antas 2 + reinforcement Antas 1)
  '101': [
    // Antas 2
    { id: 'lesson101', title: 'Mga Diptonggo at Klaster', level: 'Antas 2', category: 'Patinig', description: 'Pag-aaral ng mga diptonggo at klaster na matatagpuan sa mga salitang Filipino.', estimatedTime: '20 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
    { id: 'lesson102', title: 'Kailanan ng Pangngalan', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng isahan at maramihan ng mga pangngalan sa Filipino.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
    { id: 'lesson103', title: 'Panghalip Panao', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng mga panghalip na panao tulad ng ako, ikaw, siya, kami, tayo, kayo, sila.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: true, isRecommended: false },
    { id: 'lesson104', title: 'Panghalip Paari at Palagyo', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng mga panghalip na paari at palagyo.', estimatedTime: '30 minuto', difficulty: 'Mahirap', assigned: false, isRecommended: true },
    { id: 'lesson105', title: 'Paalpabetong Ayos ng mga Salita', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pagsasanay sa paglalagay ng mga salita sa paalpabetong ayos.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: false },
    { id: 'lesson106', title: 'Aspekto ng Pandiwa', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng aspekto ng pandiwa: pawatas, naganap, kasalukuyan, at gaganapin.', estimatedTime: '35 minuto', difficulty: 'Mahirap', assigned: false, isRecommended: false },
    { id: 'lesson107', title: 'Pang-abay na Pamaraan', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng mga pang-abay na naglalarawan ng paraan.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: false },
    { id: 'lesson108', title: 'Pangungusap na Pasalaysay', level: 'Antas 2', category: 'Pag-unawa sa Binasa', description: 'Pag-aaral ng mga pangungusap na pasalaysay at pagsasanay sa pagbuo nito.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
    { id: 'lesson109', title: 'Pangungusap na Patanong', level: 'Antas 2', category: 'Pag-unawa sa Binasa', description: 'Pag-aaral ng mga pangungusap na patanong at pagsasanay sa pagbuo nito.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },

    // Antas 1 reinforcement
    { id: 'lesson201', title: 'Mga Patinig (A-E-I-O-U)', level: 'Antas 1', category: 'Patinig', description: 'Pagkilala at pagbigkas ng limang pangunahing patinig.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: false },
    { id: 'lesson202', title: 'Pagbuo ng Payak na Pantig', level: 'Antas 1', category: 'Pantig', description: 'Pagsasanay sa paghiwalay at pagbasa ng C-V na pantig (ba, be, bi …).', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: false },
    { id: 'lesson203', title: 'Pagkilala ng Payak na Salita', level: 'Antas 1', category: 'Pagkilala ng Salita', description: 'Pagtukoy sa mga pang-araw-araw na salitang may dalawang pantig.', estimatedTime: '18 minuto', difficulty: 'Madali', assigned: false, isRecommended: false }
  ],

  // Maria (Antas 1)
  '102': [
    { id: 'lesson301', title: 'Patinig: Pagkilala at Pagbigkas', level: 'Antas 1', category: 'Patinig', description: 'Interactive flashcards para sa limang patinig.', estimatedTime: '12 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
    { id: 'lesson302', title: 'Pantig: CV Pattern', level: 'Antas 1', category: 'Pantig', description: 'Pagbuo ng mga pantig gamit ang mga patinig at katinig.', estimatedTime: '18 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
    { id: 'lesson303', title: 'Salitang May Dalawang Pantig', level: 'Antas 1', category: 'Pagkilala ng Salita', description: 'Pagbasa ng mga payak na salitang may dalawang pantig.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: false }
  ],

  // Pedro (Antas 3)
  '103': [
    { id: 'lesson401', title: 'Pagbasa ng Tekstong Deskriptibo', level: 'Antas 3', category: 'Pag-unawa sa Binasa', description: 'Pagkilala sa mga detalyeng naglalarawan sa isang teksto.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
    { id: 'lesson402', title: 'Pagkilala ng Tambalang Salita', level: 'Antas 3', category: 'Pagkilala ng Salita', description: 'Pag-aaral sa pagbuo at kahulugan ng tambalang salita.', estimatedTime: '30 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true }
  ]
};

// Mock prescriptive recommendations
const mockPrescriptiveRecommendations = {
  '101': [
    {
      id: 1,
      title: "Pagsasanay sa Pagkilala ng Patinig",
      category: "Patinig",
      status: "draft",
      score: 65,
      targetScore: 80,
      readingLevel: "Antas 2",
      analysis: "Nahihirapan ang mag-aaral sa pagkilala ng mga diptonggo at mga katulad na tunog ng patinig. Kailangan ng mas focused na pagsasanay.",
      recommendation: "Magtalaga ng mga pagsasanay sa pagkilala ng patinig na may audio support",
      questions: [
        {
          id: 1,
          questionText: "Anong tunog ang naririnig mo?",
          options: ["A", "E", "I", "O"],
          correctAnswer: 0,
          feedback: "Ang patinig 'A' ay may malalim na tunog."
        },
        {
          id: 2,
          questionText: "Aling titik ang gumagawa ng 'oh' na tunog?",
          options: ["A", "U", "O", "I"],
          correctAnswer: 2,
          feedback: "Ang titik 'O' ay gumagawa ng 'oh' na tunog."
        }
      ]
    },
    {
      id: 2,
      title: "Mga Gawain sa Paghihiwalay ng Pantig",
      category: "Pantig",
      status: "in_progress",
      score: 70,
      targetScore: 85,
      readingLevel: "Antas 2",
      analysis: "Nagpapakita ng katamtamang progreso sa paghihiwalay ng pantig ngunit kailangan pa ng mas maraming pagsasanay sa mga komplikadong kombinasyon ng pantig.",
      recommendation: "Ipagpatuloy ang mga pagsasanay sa paghihiwalay ng pantig, na nakatutok sa mga salitang may tatlong pantig",
      questions: [
        {
          id: 1,
          questionText: "Pagsama-samahin ang 'fan' at 'tas' at 'tic'. Anong salita ang nabubuo?",
          options: ["fantastic", "fantasy", "fascinate", "fascination"],
          correctAnswer: 0,
          feedback: "Kapag pinagsama-sama natin ang 'fan', 'tas', at 'tic', makakabuo tayo ng 'fantastic'."
        }
      ]
    }
  ],
  '102': [],
  '103': []
};

// Mock admin approvals
const mockAdminApprovals = {
  '101': [
    {
      id: 3,
      title: "Mga Pagsasanay sa Pagkilala ng Salita",
      category: "Pagkilala ng Salita",
      status: "pending_approval",
      score: 62,
      targetScore: 80,
      analysis: "Kailangan ng karagdagang pagsasanay sa pagkilala ng mga madalas na salita, lalo na sa mga salitang may magkakatulad na pattern ng letra.",
      recommendation: "Magbigay ng mga pagsasanay sa pagkilala ng salita na may visual aids",
      changes: [
        "Binago ang antas ng kahirapan upang mas tumugma sa kasalukuyang kakayahan ng mag-aaral",
        "Nagdagdag ng mas maraming visual prompts para sa mga pattern ng letra",
        "Nagdagdag ng karagdagang pag-uulit para sa mga problematikong pattern ng salita"
      ],
      lastModified: "2025-04-15T14:30:00Z",
      submittedAt: "2025-04-15T14:30:00Z"
    }
  ],
  '102': [],
  '103': []
};

// Simulation of API delay
const apiDelay = (ms = 500) => new Promise(res => setTimeout(res, ms));

// Service functions
export const getStudentDetails = async (id) => {
  await apiDelay();
  return mockStudents.find(s => s.id === id) || null;
};

export const getAssessmentResults = async (id) => {
  await apiDelay();
  return mockAssessmentData[id] || null;
};

export const getProgressData = async (id) => {
  await apiDelay();
  return mockProgressData[id] || null;
};

export const getRecommendedLessons = async (id) => {
  await apiDelay();
  return mockRecommendedLessons[id] || [];
};

export const getPrescriptiveRecommendations = async (id) => {
  await apiDelay();
  return mockPrescriptiveRecommendations[id] || [];
};

export const getAdminApprovals = async (id) => {
  await apiDelay();
  return mockAdminApprovals[id] || [];
};

// Assign lessons to a student
export const assignLessonsToStudent = async (studentId, lessonIds = []) => {
  await apiDelay(1000); // Longer delay to simulate API call

  // Mark lessons as assigned
  if (mockRecommendedLessons[studentId]) {
    mockRecommendedLessons[studentId].forEach(lesson => {
      if (lessonIds.includes(lesson.id)) {
        lesson.assigned = true;
      }
    });
  }

  return {
    success: true,
    message: `Successfully assigned ${lessonIds.length} lessons to student`,
    assignedLessons: lessonIds
  };
};

// Update activity
export const updateActivity = async (activityId, updatedActivity) => {
  await apiDelay(1500); // Longer delay to simulate API call

  // Find and update the activity in prescriptive recommendations
  for (const studentId in mockPrescriptiveRecommendations) {
    const recommendations = mockPrescriptiveRecommendations[studentId];
    const activityIndex = recommendations.findIndex(rec => rec.id === activityId);

    if (activityIndex !== -1) {
      mockPrescriptiveRecommendations[studentId][activityIndex] = {
        ...mockPrescriptiveRecommendations[studentId][activityIndex],
        ...updatedActivity,
        status: 'pending_approval'
      };

      // Add to admin approvals
      if (!mockAdminApprovals[studentId]) {
        mockAdminApprovals[studentId] = [];
      }

      mockAdminApprovals[studentId].push({
        ...updatedActivity,
        submittedAt: new Date().toISOString()
      });

      return { success: true, message: 'Activity updated successfully' };
    }
  }

  return { success: false, message: 'Activity not found' };
};