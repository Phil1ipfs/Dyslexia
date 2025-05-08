// backend/services/prescriptiveAnalytics.js
function generatePrescriptions(student) {
    const level = student.readingLevel || 'Not Assessed';
  
    const data = {
      'Antas 1': [
        { id: 1, text: 'Mag-practice sa pagbigkas ng patinig araw-araw.' },
        { id: 2, text: 'Maglaro ng flashcards tungkol sa titik A, E, I, O, U.' }
      ],
      'Antas 3': [
        { id: 5, text: 'Pagtuunan ng pansin ang paghihiwalay ng pantig.' },
        { id: 6, text: 'Magbasa ng mga salitang may diptonggo.' }
      ],
      'Not Assessed': [
        { id: 99, text: 'Kumpletuhin muna ang pre-assessment upang makakuha ng rekomendasyon.' }
      ]
    };
  
    return data[level] || data['Not Assessed'];
  }
  
  module.exports = { generatePrescriptions };
  