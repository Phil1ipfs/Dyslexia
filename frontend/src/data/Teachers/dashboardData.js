// frontend/src/data/Teachers/dashboardData.js

// Colors for Antas levels - based on the Literexia curriculum levels
const antasColors = {
  'Antas 1': '#FF6B8A', // Nag-uumpisang Matuto (Kindergarten)
  'Antas 2': '#FF9E40', // Pa-unlad na Nag-aaral (Grade 1)
  'Antas 3': '#FFCD56', // Sanay na Mag-aaral (Grade 2)
  'Antas 4': '#4BC0C0'  // Maalam at Mapanuring Mag-aaral (Grade 3)
};

// Student distribution by Antas level
const studentsByAntasLevel = [
  { name: 'Antas 1', value: 12, color: antasColors['Antas 1'] },
  { name: 'Antas 2', value: 15, color: antasColors['Antas 2'] },
  { name: 'Antas 3', value: 8, color: antasColors['Antas 3'] },
  { name: 'Antas 4', value: 5, color: antasColors['Antas 4'] }
];

// Dashboard metrics
const metrics = {
  totalStudents: 40,
  parentCount: 25,
  completionRate: 72,
  assignedActivities: 85,
  completedActivities: 61,
  pendingEdits: 7,
  openConcerns: 5
};

// Weekly and daily progress data for each Antas level
const progressData = {
  'Antas 1': {
    week: [
      { name: '1', progress: 60 },
      { name: '2', progress: 65 },
      { name: '3', progress: 68 },
      { name: '4', progress: 70 },
      { name: '5', progress: 71 }
    ],
    day: [
      { name: 'Lun', progress: 65 },
      { name: 'Mar', progress: 67 },
      { name: 'Miy', progress: 69 },
      { name: 'Huw', progress: 70 },
      { name: 'Biy', progress: 71 }
    ]
  },
  'Antas 2': {
    week: [
      { name: '1', progress: 68 },
      { name: '2', progress: 70 },
      { name: '3', progress: 73 },
      { name: '4', progress: 75 },
      { name: '5', progress: 78 }
    ],
    day: [
      { name: 'Lun', progress: 75 },
      { name: 'Mar', progress: 76 },
      { name: 'Miy', progress: 76 },
      { name: 'Huw', progress: 77 },
      { name: 'Biy', progress: 78 }
    ]
  },
  'Antas 3': {
    week: [
      { name: '1', progress: 72 },
      { name: '2', progress: 75 },
      { name: '3', progress: 78 },
      { name: '4', progress: 80 },
      { name: '5', progress: 82 }
    ],
    day: [
      { name: 'Lun', progress: 80 },
      { name: 'Mar', progress: 80 },
      { name: 'Miy', progress: 81 },
      { name: 'Huw', progress: 82 },
      { name: 'Biy', progress: 82 }
    ]
  },
  'Antas 4': {
    week: [
      { name: '1', progress: 80 },
      { name: '2', progress: 82 },
      { name: '3', progress: 85 },
      { name: '4', progress: 86 },
      { name: '5', progress: 88 }
    ],
    day: [
      { name: 'Lun', progress: 86 },
      { name: 'Mar', progress: 86 },
      { name: 'Miy', progress: 87 },
      { name: 'Huw', progress: 87 },
      { name: 'Biy', progress: 88 }
    ]
  }
};

// Student scores data for chart in Students Needing Attention
const studentScores = [
  { name: 'Maria S.', score: 58 },
  { name: 'Carlos R.', score: 62 },
  { name: 'Ana G.', score: 64 },
  { name: 'John R.', score: 63 },
  { name: 'Sofia C.', score: 60 }
];

// Prescriptive data with focus on Filipino reading comprehension challenges
const prescriptiveData = [
  {
    antasLevel: 'Antas 1',
    students: 12,
    issues: [
      { issue: 'Pagbasa ng mga Patinig', count: 5 },
      { issue: 'Ang mga Tunog ng mga Bagay sa Paligid', count: 4 },
      { issue: 'Direksyong Pakaliwa-Pakanan', count: 3 }
    ],
    broadAnalysis: 'Mga mag-aaral sa Antas 1 ay nahihirapan sa pagbasa ng mga patinig at pagkilala sa mga tunog. Makakatulong ang mga multi-sensory na pagsasanay at interactive games para sa pangunahing kasanayan sa pagbasa.'
  },
  {
    antasLevel: 'Antas 2',
    students: 15,
    issues: [
      { issue: 'Pangungusap na Paglalarawan', count: 6 },
      { issue: 'Pagtukoy ng mga Pantig sa Salita', count: 5 },
      { issue: 'Salitang Naglalarawan', count: 4 }
    ],
    broadAnalysis: 'Sa Antas 2, nangangailangan ng tulong ang mga mag-aaral sa istruktura ng paglalarawan at paghihiwalay ng pantig. Makakatulong ang mga pagsasanay na may larawan at pagpalakpak ng pantig.'
  },
  {
    antasLevel: 'Antas 3',
    students: 8,
    issues: [
      { issue: 'Diptonggo at Klaster', count: 3 },
      { issue: 'Panghalip Panao', count: 3 },
      { issue: 'Pangungusap na Pasalaysay', count: 2 }
    ],
    broadAnalysis: 'Ang mga mag-aaral sa Antas 3 ay nangangailangan ng mas malalim na pag-unawa sa estruktura ng wika, partikular sa diptonggo at panghalip. Maganda ang paggamit ng mga interactive na kwento at pagsulat.'
  },
  {
    antasLevel: 'Antas 4',
    students: 5,
    issues: [
      { issue: 'Kayarian ng Pangngalan', count: 2 },
      { issue: 'Antas ng Pang-uri', count: 2 },
      { issue: 'Pang-ukol', count: 1 }
    ],
    broadAnalysis: 'Sa Antas 4, nakakatugon na ang mga mag-aaral sa pundasyonal na kahirapan, ngunit kailangan pa rin ng suporta sa mas komplikadong aspeto ng wika. Hikayatin ang kritikal na pag-iisip sa pamamagitan ng pagsulat at pagsusuri ng teksto.'
  }
];

// Pending tasks focusing on parent concerns and activity modifications
const pendingTasks = [
  { 
    id: 1, 
    type: 'Parent Concern', 
    studentName: 'Maria Santos', 
    date: '2025-04-18', 
    status: 'Urgent', 
    antasLevel: 'Antas 1',
    details: 'Nahihirapan sa mga aktibidad tungkol sa mga tunog ng mga bagay'
  },
  { 
    id: 2, 
    type: 'Activity Modification', 
    studentName: 'Carlos Rivera', 
    date: '2025-04-17', 
    status: 'Pending', 
    antasLevel: 'Antas 2',
    details: 'Pagdagdag ng mga audio cues sa mga aktibidad sa pagpapantig'
  },
  { 
    id: 3, 
    type: 'Parent Concern', 
    studentName: 'Sofia Cruz', 
    date: '2025-04-16', 
    status: 'Pending', 
    antasLevel: 'Antas 1',
    details: 'Gusto ng magulang ng karagdagang mga materyales para sa pagsasanay sa bahay'
  },
  { 
    id: 4, 
    type: 'Activity Modification', 
    studentName: 'John Reyes', 
    date: '2025-04-15', 
    status: 'Pending', 
    antasLevel: 'Antas 3',
    details: 'Pagsasaayos ng mga aktibidad sa diptonggo para sa mas mainam na pag-unawa'
  },
  { 
    id: 5, 
    type: 'Parent Concern', 
    studentName: 'Ana Garcia', 
    date: '2025-04-14', 
    status: 'Urgent', 
    antasLevel: 'Antas 2',
    details: 'Hindi makasabay sa mga aktibidad sa Pangungusap na Paglalarawan'
  }
];

// Students needing attention - based on low scores and difficulties
const studentsNeedingAttention = [
  { 
    id: 1, 
    name: 'Maria Santos', 
    antasLevel: 'Antas 1', 
    lastScore: 58, 
    completionRate: 65, 
    lastActivity: '2025-04-18',
    difficulty: 'Pagbasa ng mga Patinig'
  },
  { 
    id: 2, 
    name: 'Carlos Rivera', 
    antasLevel: 'Antas 2', 
    lastScore: 62, 
    completionRate: 70, 
    lastActivity: '2025-04-17',
    difficulty: 'Pagtukoy ng mga Pantig sa Salita'
  },
  { 
    id: 3, 
    name: 'Ana Garcia', 
    antasLevel: 'Antas 2', 
    lastScore: 64, 
    completionRate: 68, 
    lastActivity: '2025-04-16',
    difficulty: 'Pangungusap na Paglalarawan'
  },
  { 
    id: 4, 
    name: 'John Reyes', 
    antasLevel: 'Antas 3', 
    lastScore: 63, 
    completionRate: 72, 
    lastActivity: '2025-04-15',
    difficulty: 'Diptonggo at Klaster'
  },
  { 
    id: 5, 
    name: 'Sofia Cruz', 
    antasLevel: 'Antas 1', 
    lastScore: 60, 
    completionRate: 67, 
    lastActivity: '2025-04-14',
    difficulty: 'Direksyong Pakaliwa-Pakanan'
  }
];

// Activity log with Filipino learning activities
const activityLog = [
  {
    time: '10:15 AM',
    content: '<span class="edu-log-highlight">Maria Santos</span> ay kumukumpleto ng <span class="edu-log-highlight">Pagsasanay sa Patinig</span> na may iskor na <span class="edu-log-highlight">65%</span>'
  },
  {
    time: '9:45 AM',
    content: 'Bagong <span class="edu-log-highlight">Aktibidad sa Pantig</span> ay nilikha para sa <span class="edu-log-highlight">Antas 2</span> at ipinadala para sa pag-apruba'
  },
  {
    time: '9:30 AM',
    content: '<span class="edu-log-highlight">Carlos Rivera</span> ay nangangailangan ng tulong sa <span class="edu-log-highlight">Pagtukoy ng mga Pantig</span>'
  },
  {
    time: '9:15 AM',
    content: '<span class="edu-log-highlight">John Reyes</span> ay inilipat sa <span class="edu-log-highlight">Antas 3</span> batay sa resulta ng assessment'
  },
  {
    time: '9:00 AM',
    content: 'Magulang ni <span class="edu-log-highlight">Sofia Cruz</span> ay nagpadala ng mensahe tungkol sa pag-unlad'
  },
  {
    time: '8:45 AM',
    content: 'Sistema ay nagtalaga ng <span class="edu-log-highlight">Pagsasanay sa Direksyon</span> sa 4 na mag-aaral sa <span class="edu-log-highlight">Antas 1</span>'
  }
];

// Admin approval notifications
const notifications = [
  {
    id: 1,
    type: 'curriculum',
    status: 'approved',
    message: 'Pag-update sa Aktibidad ng Pantig ay inaprubahan na',
    time: '10:05 AM',
    date: '2025-04-19'
  },
  {
    id: 2,
    type: 'activity',
    status: 'pending',
    message: 'Bagong aktibidad para sa Diptonggo ay naghihintay ng pag-apruba',
    time: '9:30 AM',
    date: '2025-04-19'
  },
  {
    id: 3,
    type: 'curriculum',
    status: 'rejected',
    message: 'Pag-update sa Pang-uri ay tinanggihan - kailangan ng karagdagang content',
    time: '4:15 PM',
    date: '2025-04-18'
  },
  {
    id: 4,
    type: 'activity',
    status: 'pending',
    message: 'Pagbago sa aktibidad ng Panghalip Panao ay naghihintay ng pag-apruba',
    time: '2:45 PM',
    date: '2025-04-18'
  },
  {
    id: 5,
    type: 'student',
    status: 'approved',
    message: 'Bagong mag-aaral na profile ay nabuo at handa na',
    time: '11:20 AM',
    date: '2025-04-18'
  }
];

// Export all data for the dashboard
export default {
  studentsByAntasLevel,
  metrics,
  progressData,
  prescriptiveData,
  pendingTasks,
  studentsNeedingAttention,
  activityLog,
  notifications,
  studentScores
};