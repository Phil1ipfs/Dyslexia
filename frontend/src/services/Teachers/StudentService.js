// // src/services/StudentService.js
// // =============================================================================
// // Enhanced service for Teacher Dashboard and Student Progress View
// // (details, assessments, progress, lesson assignment, prescriptive flow)
// // =============================================================================

// /* -------------------------------------------------------------------------- */
// /*  1.  MOCK DATA                                                             */
// /* -------------------------------------------------------------------------- */
// // -----------------------------------------------------------------------------
// // A. STUDENT ROSTER
// // -----------------------------------------------------------------------------
// const mockStudents = [
//   { id: '101', name: 'Juan dela Cruz',  age: 7, gradeLevel: 'Grade 1',  gender: 'Lalaki', section: 'Sampaguita', readingLevel: 'Antas 2', parent: 'Nina & Juan dela Cruz Sr.', parentEmail: 'j.delacruz@email.com', contactNumber: '(63) 999-111-2222', address: '123 Maginhawa Street, Quezon City', lastActivityDate: '2025-04-15T10:30:00Z' },
//   { id: '102', name: 'Maria Santos',    age: 6, gradeLevel: 'Kindergarten', gender: 'Babae',  section: 'Rosal', readingLevel: 'Antas 1', parent: 'Pedro & Carmen Santos', parentEmail: 'p.santos@email.com', contactNumber: '(63) 999-222-3333', address: '456 Kalayaan Ave, Quezon City', lastActivityDate: '2025-04-13T08:00:00Z' },
//   { id: '103', name: 'Pedro Reyes',     age: 8, gradeLevel: 'Grade 2',  gender: 'Lalaki', section: 'Orchid', readingLevel: 'Antas 3', parent: 'Elena & Antonio Reyes', parentEmail: 'a.reyes@email.com', contactNumber: '(63) 999-444-5555', address: '789 Commonwealth Ave, Quezon City', lastActivityDate: '2025-04-11T10:00:00Z' },
//   { id: '104', name: 'Ana Gomez',       age: 6, gradeLevel: 'Kindergarten', gender: 'Babae',  section: 'Rosal', readingLevel: 'Antas 1', parent: 'Maria & Jose Gomez', parentEmail: 'jose.gomez@email.com', contactNumber: '(63) 999-666-7777', address: '321 Quezon Avenue, Quezon City', lastActivityDate: '2025-04-14T11:00:00Z' },
//   { id: '105', name: 'Carlos Mendoza',  age: 7, gradeLevel: 'Grade 1',  gender: 'Lalaki', section: 'Sampaguita', readingLevel: 'Antas 2', parent: 'Rosa & Carlos Mendoza Sr.', parentEmail: 'r.mendoza@email.com', contactNumber: '(63) 999-888-9999', address: '654 Maginhawa Street, Quezon City', lastActivityDate: '2025-04-16T14:20:00Z' },
//   { id: '106', name: 'Sofia Cruz',      age: 6, gradeLevel: 'Kindergarten', gender: 'Babae',  section: 'Rosal', readingLevel: 'Antas 1', parent: 'Carmen & Luis Cruz', parentEmail: 'l.cruz@email.com', contactNumber: '(63) 999-111-0000', address: '987 P. Tuazon Boulevard, Quezon City', lastActivityDate: '2025-04-13T09:30:00Z' },
//   { id: '107', name: 'Miguel Lim',      age: 8, gradeLevel: 'Grade 2',  gender: 'Lalaki', section: 'Orchid', readingLevel: 'Antas 3', parent: 'Linda & Michael Lim', parentEmail: 'michael.lim@email.com', contactNumber: '(63) 999-222-1111', address: '159 East Avenue, Quezon City', lastActivityDate: '2025-04-11T10:00:00Z' },
//   { id: '108', name: 'Isabella Garcia', age: 7, gradeLevel: 'Grade 1',  gender: 'Babae',  section: 'Sampaguita', readingLevel: 'Antas 2', parent: 'Rosario & Eduardo Garcia', parentEmail: 'e.garcia@email.com', contactNumber: '(63) 999-333-2222', address: '753 Quezon Avenue, Quezon City', lastActivityDate: '2025-04-15T14:20:00Z' },
//   { id: '109', name: 'Jose Bautista',   age: 9, gradeLevel: 'Grade 3',  gender: 'Lalaki', section: 'Sampaguita', readingLevel: 'Antas 4', parent: 'Elena & Miguel Bautista', parentEmail: 'm.bautista@email.com', contactNumber: '(63) 999-444-3333', address: '951 Aurora Boulevard, Quezon City', lastActivityDate: '2025-04-10T11:00:00Z' },
//   { id: '110', name: 'Gabriela Torres', age: 9, gradeLevel: 'Grade 3',  gender: 'Babae',  section: 'Rosal', readingLevel: 'Antas 4', parent: 'Carmen & Antonio Torres', parentEmail: 'a.torres@email.com', contactNumber: '(63) 999-555-4444', address: '357 Scout Reyes, Quezon City', lastActivityDate: '2025-04-11T14:00:00Z' }
// ];

// // Reading level descriptions - this is needed for ViewStudent.jsx
// const readingLevelDescriptions = {
//   'Antas 1': 'Starting to Learn',
//   'Antas 2': 'Progressive Learner',
//   'Antas 3': 'Competent Reader',
//   'Antas 4': 'Proficient Reader',
//   'Antas 5': 'Advanced Reader'
// };

// // -----------------------------------------------------------------------------
// // B. PRE-ASSESSMENT RESULTS  (aligned to Filipino reading skills)
// // -----------------------------------------------------------------------------
// const mockPreAssessmentResults = {
//   // ── Juan ────────────────────────────────────────────────────────────────
//   '101': {
//     studentId: '101',
//     readingLevel: 'Antas 2',
//     recommendedLevel: 'Antas 2',
//     assessmentDate: 'April 15, 2025',
//     scores: { patinig: 65, pantig: 70, pagkilalaNgSalita: 60, pagUnawaSaBinasa: 55 },
//     skillDetails: [
//       {
//         category: 'Patinig',
//         score: 65,
//         analysis: 'Si Juan ay nakakabasa ng mga patinig ngunit nahihirapan sa pagkilala ng mga diptonggo.',
//         sampleQuestions: [
//           { text: "Ano ang tunog ng letrang 'A'?", studentAnswer: 'a', correctAnswer: 'a', correct: true },
//           { text: "Piliin ang tamang patinig sa salitang 'buhok'.", studentAnswer: 'o', correctAnswer: 'u, o', correct: false }
//         ]
//       },
//       {
//         category: 'Pantig',
//         score: 70,
//         analysis: 'Nakakabasa siya ng mga simpleng pantig ngunit nahihirapan sa mga komplikadong pagpapalit-pantig.',
//         sampleQuestions: [
//           { text: "Ilang pantig ang salitang 'kasama'?", studentAnswer: '3', correctAnswer: '3', correct: true },
//           { text: "Paghiwalayin ang mga pantig sa salitang 'kaibigan'.", studentAnswer: 'ka-i-bi-gan', correctAnswer: 'ka-i-bi-gan', correct: true }
//         ]
//       },
//       {
//         category: 'Pagkilala ng Salita',
//         score: 60,
//         analysis: 'Nakikilala niya ang mga pamilyar na salita ngunit kailangan ng tulong sa mga bagong salita.',
//         sampleQuestions: [
//           { text: "Ano ang salitang ito: 'bahay'?", studentAnswer: 'bahay', correctAnswer: 'bahay', correct: true },
//           { text: "Ano ang salitang ito: 'gumagalang'?", studentAnswer: 'gumag-lang', correctAnswer: 'gumagalang', correct: false }
//         ]
//       },
//       {
//         category: 'Pag-unawa sa Binasa',
//         score: 55,
//         analysis: 'Nauunawaan niya ang mga simpleng pangungusap ngunit nahihirapan sa mas mahabang teksto.',
//         sampleQuestions: [
//           { text: "Sino ang pangunahing tauhan sa 'Si Juan at ang Mangga'?", studentAnswer: 'Juan', correctAnswer: 'Juan', correct: true },
//           { text: 'Ano ang aral na makukuha sa kwento?', studentAnswer: 'Hindi ko alam', correctAnswer: 'Maging matiyaga sa paghihintay', correct: false }
//         ]
//       }
//     ],
//     focusAreas: 'pagkilala ng mga tunog at pantig'
//   },

//   // ── Maria ───────────────────────────────────────────────────────────────
//   '102': {
//     studentId: '102',
//     readingLevel: 'Antas 1',
//     recommendedLevel: 'Antas 1',
//     assessmentDate: 'April 12, 2025',
//     scores: { patinig: 45, pantig: 40, pagkilalaNgSalita: 35, pagUnawaSaBinasa: 30 },
//     skillDetails: [
//       {
//         category: 'Patinig',
//         score: 45,
//         analysis: 'Si Maria ay nakakakilala ng ilang patinig ngunit kailangan ng karagdagang pagsasanay.',
//         sampleQuestions: [
//           { text: "Pumili ng patinig para sa salitang 'aso'.", studentAnswer: 'a', correctAnswer: 'a', correct: true }
//         ]
//       },
//       {
//         category: 'Pantig',
//         score: 40,
//         analysis: 'Nangangailangan pa ng tulong sa paghihiwalay ng pantig.',
//         sampleQuestions: [
//           { text: "Paghiwalayin ang pantig ng 'puno'.", studentAnswer: 'pu-no', correctAnswer: 'pu-no', correct: true }
//         ]
//       },
//       {
//         category: 'Pagkilala ng Salita',
//         score: 35,
//         analysis: 'Nahihirapan pa sa pagbabasa ng mga salitang may dalawang pantig.',
//         sampleQuestions: []
//       },
//       {
//         category: 'Pag-unawa sa Binasa',
//         score: 30,
//         analysis: 'Kailangang sanayin sa pag-unawa ng maiikling pangungusap.',
//         sampleQuestions: []
//       }
//     ],
//     focusAreas: 'pagkilala ng mga patinig at pantig'
//   },

//   // ── Pedro ───────────────────────────────────────────────────────────────
//   '103': {
//     studentId: '103',
//     readingLevel: 'Antas 3',
//     recommendedLevel: 'Antas 3',
//     assessmentDate: 'April 10, 2025',
//     scores: { patinig: 85, pantig: 80, pagkilalaNgSalita: 75, pagUnawaSaBinasa: 70 },
//     skillDetails: [
//       {
//         category: 'Pag-unawa sa Binasa',
//         score: 70,
//         analysis: 'May kakayahang umintindi ng mas mahabang teksto ngunit kailangang paigtingin ang inferencing skills.',
//         sampleQuestions: [
//           { text: 'Ano ang pangunahing ideya ng talata?', studentAnswer: 'Pagmamahal sa kalikasan', correctAnswer: 'Pagmamahal sa kalikasan', correct: true }
//         ]
//       }
//     ],
//     focusAreas: 'pag-unawa sa binasa'
//   },
  
//   // ── Ana ────────────────────────────────────────────────────────────────
//   '104': {
//     studentId: '104',
//     readingLevel: 'Antas 1',
//     recommendedLevel: 'Antas 1',
//     assessmentDate: 'April 14, 2025',
//     scores: { patinig: 50, pantig: 45, pagkilalaNgSalita: 40, pagUnawaSaBinasa: 35 },
//     skillDetails: [
//       {
//         category: 'Patinig',
//         score: 50,
//         analysis: 'Si Ana ay may pangunahing kaalaman sa patinig ngunit nahihirapan sa pagkilala ng tunog.',
//         sampleQuestions: []
//       }
//     ],
//     focusAreas: 'pagkilala ng mga patinig at tunog'
//   },
  
//   // ── Carlos ──────────────────────────────────────────────────────────────
//   '105': {
//     studentId: '105',
//     readingLevel: 'Antas 2',
//     recommendedLevel: 'Antas 2',
//     assessmentDate: 'April 16, 2025',
//     scores: { patinig: 68, pantig: 65, pagkilalaNgSalita: 62, pagUnawaSaBinasa: 58 },
//     skillDetails: [],
//     focusAreas: 'pagkilala ng mga salita at pag-unawa'
//   },
  
//   // ── Sofia ───────────────────────────────────────────────────────────────
//   '106': {
//     studentId: '106',
//     readingLevel: 'Antas 1',
//     recommendedLevel: 'Antas 1',
//     assessmentDate: 'April 13, 2025',
//     scores: { patinig: 48, pantig: 43, pagkilalaNgSalita: 38, pagUnawaSaBinasa: 33 },
//     skillDetails: [],
//     focusAreas: 'direksyong pakaliwa-pakanan at pagkilala ng tunog'
//   },
  
//   // ── Miguel ──────────────────────────────────────────────────────────────
//   '107': {
//     studentId: '107',
//     readingLevel: 'Antas 3',
//     recommendedLevel: 'Antas 3',
//     assessmentDate: 'April 11, 2025',
//     scores: { patinig: 82, pantig: 78, pagkilalaNgSalita: 76, pagUnawaSaBinasa: 72 },
//     skillDetails: [],
//     focusAreas: 'diptonggo at klaster'
//   },
  
//   // ── Isabella ────────────────────────────────────────────────────────────
//   '108': {
//     studentId: '108',
//     readingLevel: 'Antas 2',
//     recommendedLevel: 'Antas 2',
//     assessmentDate: 'April 15, 2025',
//     scores: { patinig: 70, pantig: 67, pagkilalaNgSalita: 65, pagUnawaSaBinasa: 60 },
//     skillDetails: [],
//     focusAreas: 'pang-abay na pamaraan'
//   },
  
//   // ── Jose ────────────────────────────────────────────────────────────────
//   '109': {
//     studentId: '109',
//     readingLevel: 'Antas 4',
//     recommendedLevel: 'Antas 4',
//     assessmentDate: 'April 10, 2025',
//     scores: { patinig: 90, pantig: 88, pagkilalaNgSalita: 85, pagUnawaSaBinasa: 82 },
//     skillDetails: [],
//     focusAreas: 'panghalip panao'
//   },
  
//   // ── Gabriela ────────────────────────────────────────────────────────────
//   '110': {
//     studentId: '110',
//     readingLevel: 'Antas 4',
//     recommendedLevel: 'Antas 4',
//     assessmentDate: 'April 11, 2025',
//     scores: { patinig: 92, pantig: 90, pagkilalaNgSalita: 88, pagUnawaSaBinasa: 85 },
//     skillDetails: [],
//     focusAreas: 'kayarian ng pangngalan'
//   }
// };

// // -----------------------------------------------------------------------------
// // C. PROGRESS DATA (analytics + timeline)
// // -----------------------------------------------------------------------------
// const mockProgressData = {
//   // ── Juan ────────────────────────────────────────────────────────────────
//   '101': {
//     studentId: '101',
//     activitiesCompleted: 15,
//     totalActivities: 25,
//     totalTimeSpent: 320, // minutes
//     scores: { patinig: 75, pantig: 68, pagkilalaNgSalita: 62, pagUnawaSaBinasa: 58 },
//     recentActivities: [
//       { id: 'act001', title: 'Pagkilala ng Patinig',               category: 'Patinig',               date: '2025-04-15T10:30:00Z', score: 65, timeSpent: 15 },
//       { id: 'act002', title: 'Pagbuo ng Pantig',                   category: 'Pantig',                date: '2025-04-16T14:20:00Z', score: 70, timeSpent: 20 },
//       { id: 'act003', title: 'Pagbasa ng mga Salitang may Diptonggo', category: 'Patinig',             date: '2025-04-18T09:15:00Z', score: 75, timeSpent: 25 },
//       { id: 'act004', title: 'Paghihiwalay ng Pantig',             category: 'Pantig',                date: '2025-04-20T11:45:00Z', score: 68, timeSpent: 18 },
//       { id: 'act005', title: 'Pagkilala ng mga Pamilyar na Salita', category: 'Pagkilala ng Salita',   date: '2025-04-22T13:10:00Z', score: 62, timeSpent: 22 },
//       { id: 'act006', title: 'Pagsasanay sa mga Karaniwang Salita', category: 'Pagkilala ng Salita',   date: '2025-04-24T10:20:00Z', score: 65, timeSpent: 20 },
//       { id: 'act007', title: 'Pag-unawa sa Maikling Kwento',        category: 'Pag-unawa sa Binasa',   date: '2025-04-26T09:30:00Z', score: 58, timeSpent: 25 },
//       { id: 'act008', title: 'Pagsagot sa mga Tanong tungkol sa Kwento', category: 'Pag-unawa sa Binasa', date: '2025-04-27T14:00:00Z', score: 60, timeSpent: 30 },
//       { id: 'act009', title: 'Pagkilala ng Diptonggo',             category: 'Patinig',               date: '2025-04-28T11:15:00Z', score: 80, timeSpent: 22 },
//       { id: 'act010', title: 'Pagbasa ng mga Salitang may Tatlong Pantig', category: 'Pantig',         date: '2025-04-28T15:30:00Z', score: 72, timeSpent: 25 }
//     ],
//     skillMasteryOverTime: {
//       patinig: [
//         { date: '2025-04-15', score: 65 },
//         { date: '2025-04-18', score: 75 },
//         { date: '2025-04-28', score: 80 }
//       ],
//       pantig: [
//         { date: '2025-04-16', score: 70 },
//         { date: '2025-04-20', score: 68 },
//         { date: '2025-04-28', score: 72 }
//       ],
//       pagkilalaNgSalita: [
//         { date: '2025-04-22', score: 62 },
//         { date: '2025-04-24', score: 65 }
//       ],
//       pagUnawaSaBinasa: [
//         { date: '2025-04-26', score: 58 },
//         { date: '2025-04-27', score: 60 }
//       ]
//     }
//   },

//   // ── Maria ───────────────────────────────────────────────────────────────
//   '102': {
//     studentId: '102',
//     activitiesCompleted: 8,
//     totalActivities: 20,
//     totalTimeSpent: 180,
//     scores: { patinig: 52, pantig: 48, pagkilalaNgSalita: 40, pagUnawaSaBinasa: 35 },
//     recentActivities: [
//       { id: 'act201', title: 'Flashcards: Patinig',         category: 'Patinig', date: '2025-04-13T08:00:00Z', score: 50, timeSpent: 10 },
//       { id: 'act202', title: 'Pagbuo ng Payak na Pantig',   category: 'Pantig',  date: '2025-04-15T09:30:00Z', score: 48, timeSpent: 12 }
//     ],
//     skillMasteryOverTime: {
//       patinig: [ { date: '2025-04-13', score: 50 }, { date: '2025-04-20', score: 52 } ],
//       pantig:  [ { date: '2025-04-15', score: 48 }, { date: '2025-04-22', score: 50 } ],
//       pagkilalaNgSalita: [ { date: '2025-04-18', score: 38 }, { date: '2025-04-25', score: 40 } ],
//       pagUnawaSaBinasa: [ { date: '2025-04-19', score: 33 }, { date: '2025-04-26', score: 35 } ]
//     }
//   },

//   // ── Pedro ───────────────────────────────────────────────────────────────
//   '103': {
//     studentId: '103',
//     activitiesCompleted: 22,
//     totalActivities: 30,
//     totalTimeSpent: 450,
//     scores: { patinig: 90, pantig: 85, pagkilalaNgSalita: 80, pagUnawaSaBinasa: 75 },
//     recentActivities: [
//       { id: 'act301', title: 'Tekstong Deskriptibo', category: 'Pag-unawa sa Binasa', date: '2025-04-11T10:00:00Z', score: 75, timeSpent: 25 }
//     ],
//     skillMasteryOverTime: {
//       patinig: [ { date: '2025-04-05', score: 88 }, { date: '2025-04-11', score: 90 }, { date: '2025-04-18', score: 92 }, { date: '2025-04-25', score: 93 } ],
//       pantig:  [ { date: '2025-04-05', score: 82 }, { date: '2025-04-11', score: 85 }, { date: '2025-04-18', score: 87 }, { date: '2025-04-25', score: 89 } ],
//       pagkilalaNgSalita: [ { date: '2025-04-11', score: 80 }, { date: '2025-04-18', score: 82 }, { date: '2025-04-25', score: 85 } ],
//       pagUnawaSaBinasa:  [ { date: '2025-04-11', score: 75 }, { date: '2025-04-18', score: 78 }, { date: '2025-04-25', score: 80 } ]
//     }
//   },
  
//   // Add basic progress data for all students
//   '104': {
//     studentId: '104',
//     activitiesCompleted: 6,
//     totalActivities: 18,
//     totalTimeSpent: 150,
//     scores: { patinig: 51, pantig: 46, pagkilalaNgSalita: 42, pagUnawaSaBinasa: 36 },
//     recentActivities: [],
//     skillMasteryOverTime: {
//       patinig: [ { date: '2025-04-14', score: 49 }, { date: '2025-04-21', score: 51 } ],
//       pantig:  [ { date: '2025-04-14', score: 44 }, { date: '2025-04-21', score: 46 } ],
//       pagkilalaNgSalita: [ { date: '2025-04-14', score: 40 }, { date: '2025-04-21', score: 42 } ],
//       pagUnawaSaBinasa: [ { date: '2025-04-14', score: 35 }, { date: '2025-04-21', score: 36 } ]
//     }
//   },
  
//   '105': {
//     studentId: '105',
//     activitiesCompleted: 13,
//     totalActivities: 25,
//     totalTimeSpent: 280,
//     scores: { patinig: 70, pantig: 67, pagkilalaNgSalita: 63, pagUnawaSaBinasa: 59 },
//     recentActivities: [],
//     skillMasteryOverTime: {
//       patinig: [ { date: '2025-04-11', score: 66 }, { date: '2025-04-18', score: 68 }, { date: '2025-04-25', score: 70 } ],
//       pantig:  [ { date: '2025-04-11', score: 64 }, { date: '2025-04-18', score: 65 }, { date: '2025-04-25', score: 67 } ],
//       pagkilalaNgSalita: [ { date: '2025-04-11', score: 60 }, { date: '2025-04-18', score: 62 }, { date: '2025-04-25', score: 63 } ],
//       pagUnawaSaBinasa: [ { date: '2025-04-11', score: 56 }, { date: '2025-04-18', score: 58 }, { date: '2025-04-25', score: 59 } ]
//     }
//   },
  
//   '106': {
//     studentId: '106',
//     activitiesCompleted: 7,
//     totalActivities: 20,
//     totalTimeSpent: 170,
//     scores: { patinig: 49, pantig: 45, pagkilalaNgSalita: 40, pagUnawaSaBinasa: 36 },
//     recentActivities: [],
//     skillMasteryOverTime: {
//       patinig: [ { date: '2025-04-13', score: 47 }, { date: '2025-04-20', score: 49 } ],
//       pantig:  [ { date: '2025-04-13', score: 43 }, { date: '2025-04-20', score: 45 } ],
//       pagkilalaNgSalita: [ { date: '2025-04-13', score: 38 }, { date: '2025-04-20', score: 40 } ],
//       pagUnawaSaBinasa: [ { date: '2025-04-13', score: 34 }, { date: '2025-04-20', score: 36 } ]
//     }
//   },
  
//   '107': {
//     studentId: '107',
//     activitiesCompleted: 20,
//     totalActivities: 28,
//     totalTimeSpent: 420,
//     scores: { patinig: 84, pantig: 80, pagkilalaNgSalita: 78, pagUnawaSaBinasa: 74 },
//     recentActivities: [],
//     skillMasteryOverTime: {
//       patinig: [ { date: '2025-04-07', score: 80 }, { date: '2025-04-14', score: 82 }, { date: '2025-04-21', score: 84 } ],
//       pantig:  [ { date: '2025-04-07', score: 76 }, { date: '2025-04-14', score: 78 }, { date: '2025-04-21', score: 80 } ],
//       pagkilalaNgSalita: [ { date: '2025-04-07', score: 74 }, { date: '2025-04-14', score: 76 }, { date: '2025-04-21', score: 78 } ],
//       pagUnawaSaBinasa: [ { date: '2025-04-07', score: 70 }, { date: '2025-04-14', score: 72 }, { date: '2025-04-21', score: 74 } ]
//     }
//   },
  
//   '108': {
//     studentId: '108',
//     activitiesCompleted: 14,
//     totalActivities: 25,
//     totalTimeSpent: 300,
//     scores: { patinig: 72, pantig: 69, pagkilalaNgSalita: 67, pagUnawaSaBinasa: 62 },
//     recentActivities: [],
//     skillMasteryOverTime: {
//       patinig: [ { date: '2025-04-08', score: 68 }, { date: '2025-04-15', score: 70 }, { date: '2025-04-22', score: 72 } ],
//       pantig:  [ { date: '2025-04-08', score: 65 }, { date: '2025-04-15', score: 67 }, { date: '2025-04-22', score: 69 } ],
//       pagkilalaNgSalita: [ { date: '2025-04-08', score: 63 }, { date: '2025-04-15', score: 65 }, { date: '2025-04-22', score: 67 } ],
//       pagUnawaSaBinasa: [ { date: '2025-04-08', score: 58 }, { date: '2025-04-15', score: 60 }, { date: '2025-04-22', score: 62 } ]
//       }
//     },
    
//     '109': {
//       studentId: '109',
//       activitiesCompleted: 26,
//       totalActivities: 30,
//       totalTimeSpent: 520,
//       scores: { patinig: 92, pantig: 90, pagkilalaNgSalita: 87, pagUnawaSaBinasa: 84 },
//       recentActivities: [],
//       skillMasteryOverTime: {
//         patinig: [ { date: '2025-04-03', score: 86 }, { date: '2025-04-10', score: 89 }, { date: '2025-04-17', score: 91 }, { date: '2025-04-24', score: 92 } ],
//         pantig:  [ { date: '2025-04-03', score: 84 }, { date: '2025-04-10', score: 87 }, { date: '2025-04-17', score: 89 }, { date: '2025-04-24', score: 90 } ],
//         pagkilalaNgSalita: [ { date: '2025-04-03', score: 81 }, { date: '2025-04-10', score: 84 }, { date: '2025-04-17', score: 86 }, { date: '2025-04-24', score: 87 } ],
//         pagUnawaSaBinasa: [ { date: '2025-04-03', score: 78 }, { date: '2025-04-10', score: 81 }, { date: '2025-04-17', score: 83 }, { date: '2025-04-24', score: 84 } ]
//       }
//     },
    
//     '110': {
//       studentId: '110',
//       activitiesCompleted: 28,
//       totalActivities: 30,
//       totalTimeSpent: 540,
//       scores: { patinig: 94, pantig: 92, pagkilalaNgSalita: 90, pagUnawaSaBinasa: 88 },
//       recentActivities: [],
//       skillMasteryOverTime: {
//         patinig: [ { date: '2025-04-04', score: 88 }, { date: '2025-04-11', score: 91 }, { date: '2025-04-18', score: 93 }, { date: '2025-04-25', score: 94 } ],
//         pantig:  [ { date: '2025-04-04', score: 86 }, { date: '2025-04-11', score: 89 }, { date: '2025-04-18', score: 91 }, { date: '2025-04-25', score: 92 } ],
//         pagkilalaNgSalita: [ { date: '2025-04-04', score: 84 }, { date: '2025-04-11', score: 87 }, { date: '2025-04-18', score: 89 }, { date: '2025-04-25', score: 90 } ],
//         pagUnawaSaBinasa: [ { date: '2025-04-04', score: 82 }, { date: '2025-04-11', score: 85 }, { date: '2025-04-18', score: 87 }, { date: '2025-04-25', score: 88 } ]
//       }
//     }
//   };
  
//   // -----------------------------------------------------------------------------
//   // D. RECOMMENDED LESSONS  (Antas-aligned)
//   // -----------------------------------------------------------------------------
//   const mockRecommendedLessons = {
//     // Juan (Antas 2 + reinforcement Antas 1)
//     '101': [
//       // Antas 2
//       { id: 'lesson101', title: 'Mga Diptonggo at Klaster', level: 'Antas 2', category: 'Patinig', description: 'Pag-aaral ng mga diptonggo at klaster na matatagpuan sa mga salitang Filipino.', estimatedTime: '20 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
//       { id: 'lesson102', title: 'Kailanan ng Pangngalan',   level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng isahan at maramihan ng mga pangngalan sa Filipino.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
//       { id: 'lesson103', title: 'Panghalip Panao',          level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng mga panghalip na panao tulad ng ako, ikaw, siya, kami, tayo, kayo, sila.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: true,  isRecommended: false },
//       { id: 'lesson104', title: 'Panghalip Paari at Palagyo',level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng mga panghalip na paari at palagyo.', estimatedTime: '30 minuto', difficulty: 'Mahirap', assigned: false, isRecommended: true },
//       { id: 'lesson105', title: 'Paalpabetong Ayos ng mga Salita', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pagsasanay sa paglalagay ng mga salita sa paalpabetong ayos.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: false },
//       { id: 'lesson106', title: 'Aspekto ng Pandiwa',       level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng aspekto ng pandiwa: pawatas, naganap, kasalukuyan, at gaganapin.', estimatedTime: '35 minuto', difficulty: 'Mahirap', assigned: false, isRecommended: false },
//       { id: 'lesson107', title: 'Pang-abay na Pamaraan',    level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng mga pang-abay na naglalarawan ng paraan.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: false },
//       { id: 'lesson108', title: 'Pangungusap na Pasalaysay',level: 'Antas 2', category: 'Pag-unawa sa Binasa', description: 'Pag-aaral ng mga pangungusap na pasalaysay at pagsasanay sa pagbuo nito.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
//       { id: 'lesson109', title: 'Pangungusap na Patanong',  level: 'Antas 2', category: 'Pag-unawa sa Binasa', description: 'Pag-aaral ng mga pangungusap na patanong at pagsasanay sa pagbuo nito.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
  
//       // Antas 1 reinforcement
//       { id: 'lesson201', title: 'Mga Patinig (A-E-I-O-U)',  level: 'Antas 1', category: 'Patinig', description: 'Pagkilala at pagbigkas ng limang pangunahing patinig.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: false },
//       { id: 'lesson202', title: 'Pagbuo ng Payak na Pantig',level: 'Antas 1', category: 'Pantig',  description: 'Pagsasanay sa paghiwalay at pagbasa ng C-V na pantig (ba, be, bi …).', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: false },
//       { id: 'lesson203', title: 'Pagkilala ng Payak na Salita', level: 'Antas 1', category: 'Pagkilala ng Salita', description: 'Pagtukoy sa mga pang-araw-araw na salitang may dalawang pantig.', estimatedTime: '18 minuto', difficulty: 'Madali', assigned: false, isRecommended: false }
//     ],
  
//     // Maria (Antas 1)
//     '102': [
//       { id: 'lesson301', title: 'Patinig: Pagkilala at Pagbigkas', level: 'Antas 1', category: 'Patinig', description: 'Interactive flashcards para sa limang patinig.', estimatedTime: '12 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
//       { id: 'lesson302', title: 'Pantig: CV Pattern',             level: 'Antas 1', category: 'Pantig',  description: 'Pagbuo ng mga pantig gamit ang mga patinig at katinig.', estimatedTime: '18 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
//       { id: 'lesson303', title: 'Salitang May Dalawang Pantig',   level: 'Antas 1', category: 'Pagkilala ng Salita', description: 'Pagbasa ng mga payak na salitang may dalawang pantig.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: false }
//     ],
  
//     // Pedro (Antas 3)
//     '103': [
//       { id: 'lesson401', title: 'Pagbasa ng Tekstong Deskriptibo', level: 'Antas 3', category: 'Pag-unawa sa Binasa', description: 'Pagkilala sa mga detalyeng naglalarawan sa isang teksto.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
//       { id: 'lesson402', title: 'Pagkilala ng Tambalang Salita',   level: 'Antas 3', category: 'Pagkilala ng Salita', description: 'Pag-aaral sa pagbuo at kahulugan ng tambalang salita.', estimatedTime: '30 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true }
//     ]
//   };
  
//   // -----------------------------------------------------------------------------
//   // E. PRESCRIPTIVE RECOMMENDATIONS
//   // -----------------------------------------------------------------------------
//   const mockPrescriptiveRecommendations = {
//     '101': [
//       { id: 'rec101', title: 'Karagdagang Gawain: Diptonggo', category: 'Patinig', rationale: 'Mahina ang marka sa mga tunog /aw/ at /iw/.', status: 'draft' },
//       { id: 'rec102', title: 'Mga Interactive na Laro: Pantig', category: 'Pantig', rationale: 'Nahihirapan sa pagbuo ng mga komplikadong pantig.', status: 'draft' }
//     ],
//     '102': [
//       { id: 'rec201', title: 'Patinig Flashcards', category: 'Patinig', rationale: 'Kailangan ng higit na pagsasanay sa pagkilala ng patinig.', status: 'draft' }
//     ],
//     '103': [
//       { id: 'rec301', title: 'Komprehensyon sa Pagbasa', category: 'Pag-unawa sa Binasa', rationale: 'Dapat palakasin ang kakayahang maghinuha mula sa binasa.', status: 'draft' }
//     ],
//     '104': [
//       { id: 'rec401', title: 'Tunog ng mga Patinig', category: 'Patinig', rationale: 'Magbigay ng higit na pagsasanay sa pagkilala ng tunog ng mga patinig.', status: 'draft' }
//     ],
//     '105': [
//       { id: 'rec501', title: 'Pagbasa ng Salita', category: 'Pagkilala ng Salita', rationale: 'Kailangan ng karagdagang pagsasanay sa pagkilala ng salita.', status: 'draft' }
//     ],
//     '106': [
//       { id: 'rec601', title: 'Direksyong Pakaliwa-Pakanan', category: 'Pagkilala ng Salita', rationale: 'Tulungan sa pagbasa ng direksyon mula kaliwa papuntang kanan.', status: 'draft' }
//     ],
//     '107': [
//       { id: 'rec701', title: 'Diptonggo at Klaster', category: 'Patinig', rationale: 'Palakasin ang pagkilala sa mga diptonggo at klaster.', status: 'draft' }
//     ],
//     '108': [
//       { id: 'rec801', title: 'Pang-abay na Pamaraan', category: 'Pagkilala ng Salita', rationale: 'Bigyang pansin ang paggamit ng pang-abay na pamaraan.', status: 'draft' }
//     ],
//     '109': [],
//     '110': []
//   };
  
//   /* -------------------------------------------------------------------------- */
//   /*  2.  HELPER "API" FUNCTIONS                                                */
//   /* -------------------------------------------------------------------------- */
//   const apiDelay = (ms = 0) => new Promise(res => setTimeout(res, ms));
  
//   // Export getStudents function - this is what ViewStudent.jsx needs
//   export async function getStudents() {
//     await apiDelay();
//     return mockStudents;
//   }
  
//   // Export getReadingLevelDescription function - this is what ViewStudent.jsx needs
//   export function getReadingLevelDescription(level) {
//     return readingLevelDescriptions[level] || level;
//   }
  
//   // All the other existing functions remain the same
//   export async function getStudentDetails(id)              { await apiDelay(); return mockStudents.find(s => s.id === id) || null; }
//   export async function getPreAssessmentResults(id)        { await apiDelay(); return mockPreAssessmentResults[id] || null; }
//   export async function getProgressData(id)                { await apiDelay(); return mockProgressData[id] || null; }
//   export async function getRecommendedLessons(id)          { await apiDelay(); return mockRecommendedLessons[id] || []; }
//   export async function getPrescriptiveRecommendations(id) { await apiDelay(); return mockPrescriptiveRecommendations[id] || []; }
  
//   // Get all students (useful for dashboard)
//   export async function getAllStudents() {
//     await apiDelay();
//     return mockStudents;
//   }
  
//   // Get list of student IDs
//   export async function getStudentIds() {
//     await apiDelay();
//     return mockStudents.map(student => student.id);
//   }
  
//   // Calculate overall metrics for dashboard
//   export async function getDashboardMetrics() {
//     await apiDelay();
//     const studentIds = await getStudentIds();
    
//     let totalActivities = 0;
//     let completedActivities = 0;
//     let pendingActivities = 0;
    
//     for (const id of studentIds) {
//       const progress = mockProgressData[id];
//       const prescriptiveRecs = mockPrescriptiveRecommendations[id];
      
//       if (progress) {
//         totalActivities += progress.totalActivities;
//         completedActivities += progress.activitiesCompleted;
//       }
      
//       if (prescriptiveRecs) {
//         pendingActivities += prescriptiveRecs.filter(rec => rec.status === 'draft').length;
//       }
//     }
    
//     return {
//       totalStudents: studentIds.length,
//       totalActivities,
//       completedActivities,
//       completionRate: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
//       pendingEdits: pendingActivities
//     };
//   }
  
//   // Find students needing attention (lowest performing)
//   export async function getStudentsNeedingAttention(limit = 5) {
//     await apiDelay();
//     const studentIds = await getStudentIds();
//     const studentsWithScores = [];
    
//     for (const id of studentIds) {
//       const details = await getStudentDetails(id);
//       const assessment = await getPreAssessmentResults(id);
//       const progress = await getProgressData(id);
      
//       if (details && assessment && progress) {
//         const avgScore = Math.round(
//           Object.values(progress.scores).reduce((a, b) => a + b, 0) / 
//           Object.values(progress.scores).length
//         );
        
//         studentsWithScores.push({
//           ...details,
//           readingLevel: assessment.readingLevel,
//           lastScore: avgScore,
//           completionRate: progress.totalActivities > 0 ? 
//             Math.round((progress.activitiesCompleted / progress.totalActivities) * 100) : 0,
//           difficulty: assessment.focusAreas
//         });
//       }
//     }
    
//     // Sort by score (ascending) and take the lowest scoring students
//     return studentsWithScores.sort((a, b) => a.lastScore - b.lastScore).slice(0, limit);
//   }
  
//   // Get student distribution by Antas level
//   export async function getAntasDistribution() {
//     await apiDelay();
//     const studentIds = await getStudentIds();
//     const distribution = {};
//     const antasColors = {
//       'Antas 1': '#FF6B8A', // Nag-uumpisang Matuto (Kindergarten)
//       'Antas 2': '#FF9E40', // Pa-unlad na Nag-aaral (Grade 1)
//       'Antas 3': '#FFCD56', // Sanay na Mag-aaral (Grade 2)
//       'Antas 4': '#4BC0C0'  // Maalam at Mapanuring Mag-aaral (Grade 3)
//     };
    
//     for (const id of studentIds) {
//       const assessment = await getPreAssessmentResults(id);
      
//       if (assessment) {
//         const level = assessment.readingLevel;
//         if (!distribution[level]) {
//           distribution[level] = {
//             name: level,
//             value: 0,
//             color: antasColors[level] || '#4BC0C0'
//           };
//         }
//         distribution[level].value += 1;
//       }
//     }
    
//     return Object.values(distribution);
//   }
  
//   // Get progress data for all Antas levels
//   export async function getProgressByAntas() {
//     await apiDelay();
//     const studentIds = await getStudentIds();
//     const progressByAntas = {};
    
//     for (const id of studentIds) {
//       const assessment = await getPreAssessmentResults(id);
//       const progress = await getProgressData(id);
      
//       if (assessment && progress) {
//         const level = assessment.readingLevel;
//         if (!progressByAntas[level]) {
//           progressByAntas[level] = {
//             week: [],
//             day: []
//           };
//         }
        
//         // Add skill mastery data to week data
//         const skillMastery = progress.skillMasteryOverTime;
//         if (skillMastery) {
//           const weekData = {};
          
//           Object.values(skillMastery).forEach(skills => {
//             skills.forEach(entry => {
//               const date = new Date(entry.date);
//               const weekNum = Math.ceil((date.getDate()) / 7);
//               const weekKey = weekNum.toString();
              
//               if (!weekData[weekKey]) {
//                 weekData[weekKey] = { name: weekKey, progress: 0, count: 0 };
//               }
              
//               weekData[weekKey].progress += entry.score;
//               weekData[weekKey].count += 1;
//             });
//           });
          
//           // Calculate average progress per week
//           const weekArray = Object.values(weekData).map(week => ({
//             name: week.name,
//             progress: Math.round(week.progress / week.count)
//           }));
          
//           // Sort by week number
//           weekArray.sort((a, b) => parseInt(a.name) - parseInt(b.name));
          
//           // Merge with existing data
//           progressByAntas[level].week = weekArray;
//         }
//       }
//     }
    
//     return progressByAntas;
//   }
  
//   // Get prescriptive analytics data
//   export async function getPrescriptiveAnalytics() {
//     await apiDelay();
//     const distribution = await getAntasDistribution();
//     const prescriptiveData = [];
    
//     for (const antas of distribution) {
//       const studentsInAntas = [];
      
//       for (const student of mockStudents) {
//         const assessment = await getPreAssessmentResults(student.id);
//         if (assessment && assessment.readingLevel === antas.name) {
//           studentsInAntas.push({
//             id: student.id,
//             name: student.name,
//             difficulty: assessment.focusAreas
//           });
//         }
//       }
      
//       // Group by difficulty areas
//       const difficultyAreas = {};
//       studentsInAntas.forEach(student => {
//         const difficulties = student.difficulty.split(' at ');
        
//         difficulties.forEach(diff => {
//           const trimmedDiff = diff.trim();
//           if (trimmedDiff) {
//             if (!difficultyAreas[trimmedDiff]) {
//               difficultyAreas[trimmedDiff] = { issue: trimmedDiff, count: 0 };
//             }
//             difficultyAreas[trimmedDiff].count += 1;
//           }
//         });
//       });
      
//       prescriptiveData.push({
//         antasLevel: antas.name,
//         students: antas.value,
//         issues: Object.values(difficultyAreas).sort((a, b) => b.count - a.count),
//         broadAnalysis: `${antas.value} mag-aaral sa ${antas.name} ay nangangailangan ng tulong sa ${Object.values(difficultyAreas)[0]?.issue || 'pagbasa'}.`
//       });
//     }
    
//     return prescriptiveData;
//   }
  
//   // Get pending activity modifications
//   export async function getPendingActivities() {
//     await apiDelay();
    
//     const activities = [];
    
//     for (const id in mockPrescriptiveRecommendations) {
//       const recommendations = mockPrescriptiveRecommendations[id];
//       const student = await getStudentDetails(id);
//       const assessment = await getPreAssessmentResults(id);
      
//       if (recommendations && recommendations.length > 0 && student && assessment) {
//         for (const rec of recommendations) {
//           if (rec.status === 'draft') {
//             activities.push({
//               id: rec.id,
//               type: 'Activity Modification',
//               studentName: student.name,
//               date: new Date().toISOString().split('T')[0],
//               status: 'Pending',
//               antasLevel: assessment.readingLevel,
//               details: rec.rationale
//             });
//           }
//         }
//       }
//     }
    
//     return activities;
//   }
  
//   // Assign lessons to a student (mark as assigned and unlock next flow)
//   export async function assignLessonsToStudent(studentId, lessonIds = []) {
//     await apiDelay();
//     (mockRecommendedLessons[studentId] || []).forEach(les => { if (lessonIds.includes(les.id)) les.assigned = true; });
//     return { success: true };
//   }
  
//   // Update (edit) a recommendation/activity
//   export async function updateActivity(activityId, payload) {
//     await apiDelay();
//     for (const recList of Object.values(mockPrescriptiveRecommendations)) {
//       const idx = recList.findIndex(r => r.id === activityId);
//       if (idx !== -1) { recList[idx] = { ...recList[idx], ...payload }; return { success: true }; }
//     }
//     return { success: false, message: 'Activity not found' };
//   }


// src/services/StudentService.js
import axios from 'axios';
const DEFAULT_API = 'http://localhost:5002/api';


// Configuration
const API_BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL ||
  (typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL) ||
  DEFAULT_API;

/**
 * Get the auth token from localStorage
 * @returns {string|null} The authentication token or null if not found
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Create headers with authorization token
 * @returns {Object} Headers object with Authorization
 */
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * Fetch all students from the API
 * @returns {Promise<Array>} Array of student objects
 */
export const getStudents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/students`, getAuthHeaders());
    
    if (response.data && response.data.students) {
      return response.data.students;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific student
 * @param {string} id Student ID
 * @returns {Promise<Object>} Student details object
 */
export const getStudentDetails = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/student/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching student details for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get pre-assessment results for a specific student
 * @param {string} id Student ID
 * @returns {Promise<Object>} Pre-assessment results
 */
export const getPreAssessmentResults = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/assessment/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching assessment results for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get progress data for a specific student
 * @param {string} id Student ID
 * @returns {Promise<Object>} Student progress data
 */
export const getProgressData = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/progress/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching progress data for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get recommended lessons for a specific student
 * @param {string} id Student ID
 * @returns {Promise<Array>} Array of recommended lesson objects
 */
export const getRecommendedLessons = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/recommended-lessons/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching recommended lessons for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get prescriptive recommendations for a specific student
 * @param {string} id Student ID
 * @returns {Promise<Array>} Array of prescriptive recommendation objects
 */
export const getPrescriptiveRecommendations = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/prescriptive-recommendations/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching prescriptive recommendations for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get descriptive text for a reading level
 * @param {string} level Reading level code
 * @returns {string} Reading level description
 */
export const getReadingLevelDescription = (level) => {
  const descriptions = {
    'Antas 1': 'Starting to Learn',
    'Antas 2': 'Progressive Learner',
    'Antas 3': 'Competent Reader',
    'Antas 4': 'Proficient Reader',
    'Antas 5': 'Advanced Reader',
    'Early': 'Early Reader',
    'Emergent': 'Emergent Reader',
    'Fluent': 'Fluent Reader',
    'Not Assessed': 'Not Assessed'
  };
  
  return descriptions[level] || level;
};

/**
 * Assign lessons to a student
 * @param {string} studentId Student ID
 * @param {Array<string>} lessonIds Array of lesson IDs to assign
 * @returns {Promise<Object>} Assignment result
 */
export const assignLessonsToStudent = async (studentId, lessonIds = []) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/student/assign-lessons/${studentId}`,
      { lessonIds },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error assigning lessons to student ${studentId}:`, error);
    throw error;
  }
};

/**
 * Update a student activity/recommendation
 * @param {string} activityId Activity ID
 * @param {Object} payload Updated activity data
 * @returns {Promise<Object>} Update result
 */
export const updateActivity = async (activityId, payload) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/student/update-activity/${activityId}`,
      payload,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating activity ${activityId}:`, error);
    throw error;
  }
};

/**
 * Get all available reading levels
 * @returns {Promise<Array<string>>} Array of reading level names
 */
export const getReadingLevels = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/reading-levels`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching reading levels:', error);
    throw error;
  }
};