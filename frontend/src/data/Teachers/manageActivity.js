// src/data/Teachers/manageActivity.js

// Import your icons (these are placeholders)
import ponetikoIcon from '../../assets/icons/Teachers/ponetiko-icon.png';
import salitaIcon from '../../assets/icons/Teachers/salita-icon.png';
import pantigIcon from '../../assets/icons/Teachers/pantig-icon.png';
import pagbasaIcon from '../../assets/icons/Teachers/pagbasa-icon.png';
import talasalitaanIcon from '../../assets/icons/Teachers/talasalitaan-icon.png';

// Reading levels data
export const readingLevels = [
  "Antas Una",
  "Antas Pangalawa",
  "Antas Pangatlo",
  "Antas Apat",
  "Antas Lima"
];

// Categories data
export const categories = [
  "Pagtukoy ng Tunog",
  "Pag-uugnay ng Tunog at Letra",
  "Pagbasa ng Pantig",
  "Pagbasa ng Salita",
  "Pag-unawa sa Salita",
  "Pagpili ng Tamang Salita",
  "Pagbuo ng Pangungusap",
  "Talasalitaan"
];

// Content types for sorting
export const contentTypes = [
  "Newest First",
  "Oldest First",
  "Alphabetical A-Z",
  "Alphabetical Z-A"
];

// Activity structure data
export const activityStructure = {
  ponetiko: {
    title: "Ehersisyong Ponetiko",
    icon: ponetikoIcon,
    categories: [
      "Pagtukoy ng Tunog",
      "Pag-uugnay ng Tunog at Letra",
      "Pagbasa ng Pantig"
    ]
  },
  salita: {
    title: "Pagkilala sa mga Salita",
    icon: salitaIcon,
    categories: [
      "Pagbasa ng Salita",
      "Pag-unawa sa Salita",
      "Pagpili ng Tamang Salita"
    ]
  },
  pantig: {
    title: "Estruktura ng Pantig",
    icon: pantigIcon,
    categories: [
      "Pagbuo ng Pantig",
      "Paghahati ng Pantig",
      "Pagsusuri ng Pantig"
    ]
  },
  pagbasa: {
    title: "Pagbasa ng Teksto",
    icon: pagbasaIcon,
    categories: [
      "Maikling Kuwento",
      "Talata",
      "Pag-unawa sa Binasa"
    ]
  },
  talasalitaan: {
    title: "Talasalitaan",
    icon: talasalitaanIcon,
    categories: [
      "Mga Salitang Magkasingkahulugan",
      "Mga Salitang Magkasalungat",
      "Mga Kahulugan ng Salita"
    ]
  }
};

// Sample activities data
export const activitiesData = [
  {
    id: 1,
    title: "Pagbasa ng Teksto: Antas Dalawa",
    level: "Antas Dalawa",
    categories: ["Pag-unawa sa Binasa"],
    type: "assessment",
    createdAt: "2025-03-10T08:30:00",
    status: "active"
  },
  {
    id: 2,
    title: "Vowel Sound Practice Module",
    level: "Antas Una",
    categories: ["Ponetiko"],
    type: "practice",
    createdAt: "2025-03-12T10:15:00",
    status: "active"
  },
  {
    id: 3,
    title: "Pagkilala sa mga Salita",
    level: "Antas Dalawa",
    categories: ["Salita", "Pagpili ng Tamang Salita"],
    type: "assessment",
    createdAt: "2025-03-15T14:20:00",
    status: "pending_approval"
  },
  {
    id: 4,
    title: "Estruktura ng Pantig",
    level: "Antas Pangatlo",
    categories: ["Pantig", "Pagsusuri ng Pantig"],
    type: "practice",
    createdAt: "2025-03-18T09:45:00",
    status: "active"
  },
  {
    id: 5,
    title: "Pagbuo ng mga Pangungusap",
    level: "Antas Apat",
    categories: ["Pangungusap"],
    type: "assessment",
    createdAt: "2025-03-20T13:10:00",
    status: "active"
  },
  {
    id: 6,
    title: "Mga Salitang Magkasingkahulugan",
    level: "Antas Lima",
    categories: ["Talasalitaan"],
    type: "practice",
    createdAt: "2025-03-22T11:30:00",
    status: "pending_approval"
  }
];

// Tabs data
export const tabsData = [
  { id: "assessments", label: "Assessments" },
  { id: "practice", label: "Practice Modules" },
  { id: "pre-assessment", label: "Pre assessment" },
  { id: "admin-approval", label: "Admin Approval" }
];

// Activity approval workflow statuses
export const approvalStatuses = {
  PENDING: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned_for_changes",
  ACTIVE: "active",
  INACTIVE: "inactive"
};

// Activity workflow data based on document 3
export const workflowProcess = {
  curriculumLevel: {
    preconditions: [
      "User is Teacher or Super-Teacher, authenticated",
      "Teacher has a valid session and roleType includes permission to manage activities"
    ],
    trigger: "Teacher clicks 'Manage Activities' in the side-nav",
    tableInvolved: ["ACTIVITIES_TEMPLATE", "ACTIVITY_EDITS", "ADMIN_NOTIFICATIONS", "TEACHER_NOTIFICATIONS"]
  },
  studentAssignment: {
    preconditions: [
      "Teacher is on a class roster or student-detail page",
      "Students have been enrolled and assigned antasLevel"
    ],
    trigger: "Teacher clicks 'Assign Activity' button beside an activity",
    tableInvolved: ["STUDENTS_ACTIVITY_INSTANCE", "STUDENT_NOTIFICATIONS", "PARENT_CONCERN"]
  }
};