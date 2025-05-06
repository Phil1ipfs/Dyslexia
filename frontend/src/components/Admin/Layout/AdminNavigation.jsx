// src/components/Layout/AdminNavigation.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileCheck, 
  ClipboardList, 
  ChartBar, 
  Inbox, 
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import './AdminNavigation.css';

const AdminNavigation = ({ onLogout, adminData }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState([]);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/admin/dashboard',
      subItems: []
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ChartBar,
      path: '/admin/analytics',
      subItems: [
        { id: 'visual-charts', label: 'Visual Charts', path: '/admin/visual-charts' },
        { id: 'submission-overview', label: 'Submission Overview', path: '/admin/submission-overview' },
        { id: 'performance-reports', label: 'Performance Reports', path: '/admin/performance-reports' }
      ]
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      path: '/admin/user-management',
      subItems: [
        { id: 'student-list', label: 'Student List', path: '/admin/user-management/students' },
        { id: 'teacher-list', label: 'Teacher List', path: '/admin/user-management/teachers' },
        { id: 'parent-list', label: 'Parent List', path: '/admin/user-management/parents' },
        { id: 'add-account', label: 'Add Account', path: '/admin/user-management/add-account' }
      ]
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: FileCheck,
      path: '/admin/approvals',
      subItems: [
        { id: 'pending-approvals', label: 'Pending Approvals', path: '/admin/approvals/pending' },
        { id: 'approved-items', label: 'Approved Items', path: '/admin/approvals/approved' },
        { id: 'rejected-items', label: 'Rejected Items', path: '/admin/approvals/rejected' }
      ]
    },
    {
      id: 'content-management',
      label: 'Content Management',
      icon: ClipboardList,
      path: '/admin/content-management',
      subItems: [
        { id: 'activities', label: 'Activities', path: '/admin/content-management/activities' },
        { id: 'assessments', label: 'Assessments', path: '/admin/content-management/assessments' },
        { id: 'resources', label: 'Resources', path: '/admin/content-management/resources' }
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: Inbox,
      path: '/admin/communication',
      subItems: [
        { id: 'notifications', label: 'Notifications', path: '/admin/communication/notifications' },
        { id: 'announcements', label: 'Announcements', path: '/admin/communication/announcements' },
        { id: 'parent-communications', label: 'Parent Communications', path: '/admin/communication/parents' }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  const isActiveItem = (path, subItems = []) => {
    const currentPath = location.pathname;
    return currentPath === path || subItems.some(item => currentPath === item.path);
  };

  const isActiveSubItem = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="admin-navigation">
      <div className="admin-navigation__brand">
        <h1 className="admin-navigation__logo">LITEREXIA</h1>
        <div className="admin-navigation__profile">
          <div className="admin-navigation__avatar">
            {adminData?.avatar ? (
              <img src={adminData.avatar} alt={adminData.name} />
            ) : (
              <span>{adminData?.name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div className="admin-navigation__profile-info">
            <h3 className="admin-navigation__admin-name">{adminData?.name || 'Admin User'}</h3>
            <p className="admin-navigation__role">Administrator</p>
          </div>
        </div>
      </div>

      <div className="admin-navigation__menu">
        {navigationItems.map(item => (
          <div key={item.id} className="admin-navigation__section">
            <Link
              to={item.path}
              className={`admin-navigation__item ${isActiveItem(item.path, item.subItems) ? 'admin-navigation__item--active' : ''}`}
              onClick={(e) => {
                if (item.subItems.length > 0) {
                  e.preventDefault();
                  toggleSection(item.id);
                }
              }}
            >
              <div className="admin-navigation__item-content">
                <item.icon className="admin-navigation__icon" size={20} />
                <span className="admin-navigation__label">{item.label}</span>
              </div>
              {item.subItems.length > 0 && (
                <div className="admin-navigation__expand-icon">
                  {expandedSections.includes(item.id) ? 
                    <ChevronDown size={16} /> : 
                    <ChevronRight size={16} />
                  }
                </div>
              )}
            </Link>

            {item.subItems.length > 0 && expandedSections.includes(item.id) && (
              <div className="admin-navigation__submenu">
                {item.subItems.map(subItem => (
                  <Link
                    key={subItem.id}
                    to={subItem.path}
                    className={`admin-navigation__subitem ${isActiveSubItem(subItem.path) ? 'admin-navigation__subitem--active' : ''}`}
                  >
                    <span className="admin-navigation__sublabel">{subItem.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-navigation__footer">
        <Link to="/admin/settings" className="admin-navigation__item">
          <div className="admin-navigation__item-content">
            <Settings className="admin-navigation__icon" size={20} />
            <span className="admin-navigation__label">Settings</span>
          </div>
        </Link>
        
        <button onClick={onLogout} className="admin-navigation__item admin-navigation__logout-btn">
          <div className="admin-navigation__item-content">
            <LogOut className="admin-navigation__icon" size={20} />
            <span className="admin-navigation__label">Logout</span>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default AdminNavigation;