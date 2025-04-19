// frontend/src/data/Teachers/studentDetailsData.js

// ————————————————————————————————————————————————
// Sample “Student” entity
// ————————————————————————————————————————————————
export const sampleStudent = {
    id: "STD-5432",
    name: "Alex Thompson",
    age: 10,
    readingLevel: "Advanced",
    gradeLevel: "Grade 4",
    classSection: "4‑A",
    address: "123 Learning Street, Education City",
    parent: "Sarah Thompson",
    email: "sarah.thompson@example.com",
    contact: "(555) 123‑4567",
    relationship: "Mother",
    guardianType: "Parent",
    notificationPreference: "Email & SMS",
    siblings: [
      {
        name: "Emily Thompson",
        age: 8,
        grade: "Grade 2",
        readingLevel: "On Level",
        id: "STD‑5433"
      },
      {
        name: "Michael Thompson",
        age: 12,
        grade: "Grade 6",
        readingLevel: "Advanced",
        id: "STD‑5431"
      }
    ]
  };
  
  // ————————————————————————————————————————————————
  // Sample feedback history
  // ————————————————————————————————————————————————
  export const sampleFeedbackHistory = [
    {
      subject: "Academic",
      message:
        "Your child’s math scores have improved by 15% since our last quiz.",
      date: "Mar 15, 2025",
      sender: "Ms. Johnson",
      senderType: "teacher",
      hasReport: true
    },
    {
      subject: "Concern",
      message:
        "They’ve been distracted in afternoon sessions—can we meet to discuss?",
      date: "Mar 5, 2025",
      sender: "Ms. Johnson",
      senderType: "teacher",
      hasReport: false,
      response:
        "Thanks! I’ll send materials home and arrange extra reading time tomorrow.",
      responseDate: "Mar 6, 2025"
    },
    {
      subject: "Concern",
      message:
        "I’m struggling with the new reading assignment. Could I get extra support?",
      date: "Feb 20, 2025",
      sender: "Sarah Thompson",
      senderType: "parent",
      hasReport: false,
      response:
        "Of course! I’ll email some worksheets and set aside class time tomorrow.",
      responseDate: "Feb 21, 2025"
    },
    {
      subject: "Positive",
      message:
        "Your child did an incredible job on their science project—creative and thorough!",
      date: "Feb 10, 2025",
      sender: "Ms. Johnson",
      senderType: "teacher",
      hasReport: false
    },
    {
      subject: "Behavioral",
      message:
        "They’ve shown great leadership in group activities—very encouraging!",
      date: "Jan 25, 2025",
      sender: "Ms. Johnson",
      senderType: "teacher",
      hasReport: false
    }
  ];
  