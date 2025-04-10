import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Sidebar from '../../components/Sidebar'; // Adjust the path based on your project structure

const SubmissionOverview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('Submission Overview');
  const [expandedSections, setExpandedSections] = useState(['Dashboard']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Navigation items structure - use the same structure as in AdminDashboard
  const navItems = {
    main: [
      'Dashboard',
      'Prescriptive Analytics'
    ],
    dashboardSubItems: [
      'Approval Request',
      'Submission Overview',
      'Registered Users',
      'Approved Activity',
      'Approval Dashboard'
    ],
    userLists: [
      'Student Lists',
      'Teacher Lists',
      'Parent List'
    ]
  };
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleSectionClick = (section) => {
    setActiveSection(section);
    if (isMobile) setSidebarOpen(false);
  };

  const toggleSectionExpand = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  
  // Mock data based on the provided image
  const submissions = [
    {
      id: 'SUB-2023-001',
      student: { name: 'Maria Santos', grade: 2 },
      studentId: 'ST-2023-142',
      activity: {
        title: 'Filipino Folk Tales',
        category: 'Reading Comprehension',
        timeSpent: '15 minutes',
        attempts: 1
      },
      submittedDate: 'Apr 6, 2023, 10:30 AM',
      status: 'Completed',
      score: '85%'
    },
    {
      id: 'SUB-2023-002',
      student: { name: 'Juan Reyes', grade: 1 },
      studentId: 'ST-2023-118',
      activity: {
        title: 'Filipino Letter Sounds',
        category: 'Phonetic Awareness',
        timeSpent: '20 minutes',
        attempts: 2
      },
      submittedDate: 'Apr 8, 2023, 11:45 AM',
      status: 'Needs Review',
      score: '63%'
    },
    {
      id: 'SUB-2023-003',
      student: { name: 'Ana Lim', grade: 3 },
      studentId: 'ST-2023-156',
      activity: {
        title: 'Filipino Sentence Structure',
        category: 'Grammar',
        timeSpent: '18 minutes',
        attempts: 1
      },
      submittedDate: 'Apr 7, 2023, 09:15 AM',
      status: 'Completed',
      score: '92%'
    },
    {
      id: 'SUB-2023-004',
      student: { name: 'Carlos Mendoza', grade: 1 },
      studentId: 'ST-2023-175',
      activity: {
        title: 'CVC Pattern Words',
        category: 'Word Recognition',
        timeSpent: '17 minutes',
        attempts: 1
      },
      submittedDate: 'Apr 7, 2023, 02:20 PM',
      status: 'In Progress',
      score: 'N/A'
    },
    {
      id: 'SUB-2023-005',
      student: { name: 'Sofia Cruz', grade: 3 },
      studentId: 'ST-2023-133',
      activity: {
        title: 'Filipino Short Stories',
        category: 'Reading Comprehension',
        timeSpent: '22 minutes',
        attempts: 1
      },
      submittedDate: 'Apr 6, 2023, 01:10 PM',
      status: 'Completed',
      score: '95%'
    }
  ];

  const stats = {
    total: 8,
    completed: 4,
    needsReview: 2,
    needsIntervention: 1,
    inProgress: 1,
    averageScore: '77.1%'
  };

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(sub => 
    sub.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status color class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Needs Review': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score === 'N/A') return 'text-gray-500';
    const numScore = parseInt(score);
    if (numScore >= 90) return 'text-green-600';
    if (numScore >= 75) return 'text-green-500';
    if (numScore >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="admin-dashboard">
      {/* Mobile menu toggle */}
      {isMobile && (
        <button 
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Sidebar Component */}
      <Sidebar 
        activeSection={activeSection}
        expandedSections={expandedSections}
        onSectionClick={handleSectionClick}
        onToggleExpand={toggleSectionExpand}
        navItems={navItems}
        isMobile={isMobile}
        isOpen={sidebarOpen}
      />
      
            <main className="dashboard-content">
              <DashboardHeader 
                title={activeSection}
                notifications={notifications}
                onNotificationClick={() => setNotifications(0)}
              />
              
              <div className="submission-overview-container">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                  <div className="relative w-full lg:w-80">
                    <input
                      type="text"
                      placeholder="Search by Student or Activity"
                      className="w-full border border-gray-300 rounded px-3 py-2 pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">
                      All Status
                    </button>
                    <button className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm">
                      Completed
                    </button>
                    <button className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm">
                      In Progress
                    </button>
                  </div>
                </div>
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Total Submissions</h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                </div>
                
                <div className="bg-green-50 p-5 rounded-md shadow-sm border border-green-100">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">Completed</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                </div>
                
                <div className="bg-yellow-50 p-5 rounded-md shadow-sm border border-yellow-100">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">Needs Review</h3>
                  <p className="text-3xl font-bold text-yellow-600">{stats.needsReview}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-red-50 p-5 rounded-md shadow-sm border border-red-100">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">Needs Intervention</h3>
                  <p className="text-3xl font-bold text-red-500">{stats.needsIntervention}</p>
                </div>
                
                <div className="bg-blue-50 p-5 rounded-md shadow-sm border border-blue-100">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">In Progress</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                
                <div className="bg-purple-50 p-5 rounded-md shadow-sm border border-purple-100">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">Average Score</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.averageScore}</p>
                </div>
              </div>
              
              {/* Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-600 text-white">
                      <th className="py-3 px-4 text-left text-sm font-medium">ID/Student</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">ID/Student</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Submitted</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-blue-700">{submission.id}</div>
                          <div>{submission.student.name} (Grade {submission.student.grade})</div>
                          <div className="text-xs text-gray-500">{submission.studentId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{submission.activity.title}</div>
                          <div className="text-sm text-gray-600">{submission.activity.category}</div>
                          <div className="text-xs text-gray-500">
                            Time spent: {submission.activity.timeSpent} | 
                            Attempts: {submission.activity.attempts}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {submission.submittedDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(submission.status)}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-medium ${getScoreColor(submission.score)}`}>
                          {submission.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
      </main>
    </div>
  );
};

export default SubmissionOverview;