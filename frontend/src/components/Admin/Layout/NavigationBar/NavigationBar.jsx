// src/components/Layout/NavigationBar/NavigationBar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavigationBar.css';

// Icon components
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ChartsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M18 9l-6-6-7 7" />
  </svg>
);

const SubmissionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const UserListsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ApprovalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Create a simple inline SVG placeholder as base64 data URL
const placeholderAvatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23f0f0f0"/%3E%3Ctext x="20" y="25" font-family="Arial" font-size="16" text-anchor="middle" fill="%23999"%3EAA%3C/text%3E%3C/svg%3E';

const NavigationBar = ({ onLogout }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState([]);
  
  // Navigation items structure
  const navItems = {
    main: ['Dashboard'],
    dashboardSubItems: ['Visual Charts', 'Submissions Overview'],
    userLists: ['Student List', 'Teacher List', 'Parent List', 'Add Account'],
    approvalItems: ['Pending Approvals', 'Approved Items', 'Rejected Items']
  };
  
  // Determine active section from current path
  const getActiveSection = () => {
    const path = location.pathname;
    
    if (path.includes('/admin/dashboard')) return 'Dashboard';
    if (path.includes('/admin/analytics')) return 'Analytics';
    if (path.includes('/admin/visual-charts')) return 'Visual Charts';
    if (path.includes('/admin/submissions-overview')) return 'Submissions Overview';
    
    if (path.includes('/admin/user-lists/student-list')) return 'Student List';
    if (path.includes('/admin/user-lists/teacher-list')) return 'Teacher List';
    if (path.includes('/admin/user-lists/parent-list')) return 'Parent List';
    if (path.includes('/admin/user-lists/add-account')) return 'Add Account';
    if (path.includes('/admin/user-lists')) return 'User Lists';
    
    if (path.includes('/admin/approval-dashboard/pending')) return 'Pending Approvals';
    if (path.includes('/admin/approval-dashboard/approved')) return 'Approved Items';
    if (path.includes('/admin/approval-dashboard/rejected')) return 'Rejected Items';
    if (path.includes('/admin/approval-dashboard')) return 'Approval Dashboard';
    
    return '';
  };
  
  const activeSection = getActiveSection();
  
  // Toggle section expansion
  const toggleSectionExpand = (section) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter(s => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };
  
  // Handle navigation clicks
  const handleSectionClick = (section, path) => {
    // If clicking on parent items that should expand, toggle expansion
    if (section === 'Dashboard' || section === 'User Lists' || section === 'Approval Dashboard') {
      toggleSectionExpand(section);
    }
  };
  
  // Convert section name to path
  const getSectionPath = (section) => {
    const baseUrl = '/admin';
    
    // Main sections
    if (section === 'Dashboard') return `${baseUrl}/dashboard`;
    
    // Dashboard subsections
    if (section === 'Analytics') return `${baseUrl}/analytics`;
    if (section === 'Visual Charts') return `${baseUrl}/visual-charts`;
    if (section === 'Submissions Overview') return `${baseUrl}/submissions-overview`;
    
    // User Lists
    if (section === 'User Lists') return `${baseUrl}/user-lists`;
    if (section === 'Student List') return `${baseUrl}/user-lists/student-list`;
    if (section === 'Teacher List') return `${baseUrl}/user-lists/teacher-list`;
    if (section === 'Parent List') return `${baseUrl}/user-lists/parent-list`;
    if (section === 'Add Account') return `${baseUrl}/user-lists/add-account`;
    
    // Approval Dashboard
    if (section === 'Approval Dashboard') return `${baseUrl}/approval-dashboard`;
    if (section === 'Pending Approvals') return `${baseUrl}/approval-dashboard/pending`;
    if (section === 'Approved Items') return `${baseUrl}/approval-dashboard/approved`;
    if (section === 'Rejected Items') return `${baseUrl}/approval-dashboard/rejected`;
    
    // Default
    return baseUrl;
  };

  return (
    <nav className="navigation-bar">
      <div className="logo-container">
        <h1 className="logo">LITEREXIA</h1>
        <div className="admin-profile">
          <div className="admin-avatar">
            <img 
              src={placeholderAvatar} 
              alt="Admin" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              style={{
                display: 'none',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: '#4a5568',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              JJ
            </div>
          </div>
          <div className="admin-info">
            <p className="admin-name">Madam Jaja</p>
            <p className="admin-role">Admin</p>
          </div>
        </div>
      </div>

      <div className="nav-menu">
        {/* Main Navigation Items */}
        <div className="nav-section">
          {navItems.main.map(item => (
            <React.Fragment key={item}>
              <div 
                className={`nav-item ${activeSection === item ? 'active' : ''}`}
                onClick={() => handleSectionClick(item)}
              >
                <Link to={getSectionPath(item)} className="nav-link">
                  <DashboardIcon />
                  <span>{item}</span>
                </Link>
                <span 
                  className={`dropdown-arrow ${expandedSections.includes('Dashboard') ? 'expanded' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionExpand('Dashboard');
                  }}
                >
                  {expandedSections.includes('Dashboard') ? '▲' : '▼'}
                </span>
              </div>
              
              {/* Dashboard Submenu */}
              {expandedSections.includes('Dashboard') && (
                <div className="sub-menu">
                  {navItems.dashboardSubItems.map(subItem => (
                    <div key={subItem}>
                      <Link 
                        to={getSectionPath(subItem)} 
                        className={`dropdown-item ${activeSection === subItem ? 'active' : ''}`}
                      >
                        {subItem}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* User Lists Section */}
        <div className="nav-section">
          <div className={`nav-item ${activeSection === 'User Lists' || navItems.userLists.includes(activeSection) ? 'active' : ''}`}>
            <Link to="/admin/user-lists" className="nav-link">
              <UserListsIcon />
              <span>User Lists</span>
            </Link>
            <span 
              className={`dropdown-arrow ${expandedSections.includes('User Lists') ? 'expanded' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleSectionExpand('User Lists');
              }}
            >
              {expandedSections.includes('User Lists') ? '▲' : '▼'}
            </span>
          </div>
          
          {/* User Lists Submenu */}
          {expandedSections.includes('User Lists') && (
            <div className="sub-menu">
              {navItems.userLists.map(subItem => (
                <div key={subItem}>
                  <Link 
                    to={getSectionPath(subItem)} 
                    className={`dropdown-item ${activeSection === subItem ? 'active' : ''}`}
                  >
                    {subItem}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Approval Dashboard Section */}
        <div className="nav-section">
          <div className={`nav-item ${activeSection === 'Approval Dashboard' || navItems.approvalItems.includes(activeSection) ? 'active' : ''}`}>
            <Link to="/admin/approval-dashboard" className="nav-link">
              <ApprovalIcon />
              <span>Approval Dashboard</span>
            </Link>
            <span 
              className={`dropdown-arrow ${expandedSections.includes('Approval Dashboard') ? 'expanded' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleSectionExpand('Approval Dashboard');
              }}
            >
              {expandedSections.includes('Approval Dashboard') ? '▲' : '▼'}
            </span>
          </div>
          
          {/* Approval Dashboard Submenu */}
          {expandedSections.includes('Approval Dashboard') && (
            <div className="sub-menu">
              {navItems.approvalItems.map(subItem => (
                <div key={subItem}>
                  <Link 
                    to={getSectionPath(subItem)} 
                    className={`dropdown-item ${activeSection === subItem ? 'active' : ''}`}
                  >
                    {subItem}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bottom-nav">
        <Link to="/admin/settings" className="nav-link">
          <SettingsIcon />
          <span>Settings</span>
        </Link>
        
        <button className="logout-button" onClick={onLogout}>
          <LogoutIcon />
          <span>Log Out</span>
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;