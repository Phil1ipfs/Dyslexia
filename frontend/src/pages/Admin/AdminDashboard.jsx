// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DashboardHeader from '../../components/DashboardHeader';
import StatCard from '../../components/StatCard';
import ActivityTable from '../../components/ActivityTable';
import LoadingIndicator from '../../components/LoadingIndicator';
import ContentPlaceholder from '../../components/ContentPlaceholder';
import '../../styles/AdminDashboard.css';

// Mock data for the dashboard
const initialData = {
  userCount: 2456,
  userGrowth: 12,
  approvedActivities: 103,
  activityGrowth: 8,
  pendingApprovals: 20,
  pendingGrowth: -5,
  latestActivities: [
    {
      id: 1,
      teacherName: 'Teacher Rodney',
      topic: 'Aralin 1: Ponetiko',
      status: 'Approved',
      avatarColor: '#FF77C8'
    },
    {
      id: 2,
      teacherName: 'Teacher Rodney',
      topic: 'Aralin 2: Pagkilala sa salita',
      status: 'Approved',
      avatarColor: '#9977FF'
    },
    {
      id: 3,
      teacherName: 'Teacher Rodney',
      topic: 'Aralin 3: Patinig',
      status: 'Approved',
      avatarColor: '#5EEEEE'
    },
    {
      id: 4,
      teacherName: 'Teacher Rodney',
      topic: 'Aralin 1: Ponetiko',
      status: 'Approved',
      avatarColor: '#999999'
    }
  ]
};

// Navigation items structure
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

const AdminDashboard = () => {
  const [data, setData] = useState(initialData);
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [expandedSections, setExpandedSections] = useState(['Dashboard']);
  const [notifications, setNotifications] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Simulate data fetching on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you'd fetch from an API here
      setData(prevData => ({
        ...prevData,
        userCount: prevData.userCount + Math.floor(Math.random() * 10),
        userGrowth: Math.floor(Math.random() * 5) + 10,
        activityGrowth: Math.floor(Math.random() * 3) + 7,
        pendingGrowth: Math.floor(Math.random() * 10) - 5,
      }));
      
      setIsLoading(false);
    };
    
    fetchDashboardData();
    
    // Set up periodic refresh
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle section click
  const handleSectionClick = (section) => {
    setActiveSection(section);
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };
  
  // Toggle expanded sections
  const toggleSectionExpand = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };
  
  // Handle notification click
  const handleNotificationClick = () => {
    setNotifications(0);
  };
  
  // Add a new activity
  const addNewActivity = () => {
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const newActivity = {
        id: Date.now(),
        teacherName: 'Teacher Rodney',
        topic: `Aralin ${Math.floor(Math.random() * 5) + 1}: New Activity`,
        status: 'Approved',
        avatarColor: '#5EEEEE'
      };
      
      setData(prevData => ({
        ...prevData,
        approvedActivities: prevData.approvedActivities + 1,
        latestActivities: [newActivity, ...prevData.latestActivities.slice(0, 3)]
      }));
      
      setIsLoading(false);
    }, 800);
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Get current date for header
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };
  
  return (
    <div className="admin-dashboard">
      {/* Mobile menu toggle button */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        ≡
      </button>

      {/* Sidebar with mobile open state */}
      <Sidebar 
          activeSection={activeSection} 
          expandedSections={expandedSections}
          onSectionClick={handleSectionClick}
          onToggleExpand={toggleSectionExpand}
          navItems={navItems}
          isMobile={window.innerWidth <= 768}
          isOpen={sidebarOpen}
        />
      
      <main className="dashboard-content">
        <DashboardHeader 
          title={activeSection}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          currentDate={getCurrentDate()}
        />
        
        {isLoading && <LoadingIndicator />}
        
        {activeSection === 'Dashboard' ? (
          <>
            <div className="dashboard-stats">
              <StatCard 
                title="Total Users" 
                value={data.userCount.toLocaleString()} 
                icon="users"
                growth={data.userGrowth}
                className="users"
              />
              <StatCard 
                title="Total Approved Activities" 
                value={data.approvedActivities.toLocaleString()} 
                icon="check"
                growth={data.activityGrowth}
                className="activities"
              />
              <StatCard 
                title="Total Pending Approval" 
                value={data.pendingApprovals.toLocaleString()} 
                icon="warning"
                growth={data.pendingGrowth}
                className="pending"
              />
            </div>
            <ActivityTable 
              activities={data.latestActivities} 
              onAddActivity={addNewActivity}
              isLoading={isLoading}
            />
          </>
        ) : (
          <ContentPlaceholder sectionName={activeSection} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;