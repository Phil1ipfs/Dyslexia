// src/components/Admin/Layout/NavigationBar/NavigationBar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../../../../services/authService';
import {
  Home,
  Users,
  FileCheck,
  ClipboardList,
  BarChart2,
  Inbox,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Upload,
  Eye,
  GraduationCap,
  School,
  UserSquare2,
  PieChart,
  Book,
  User
} from 'lucide-react';
import './NavigationBar.css';

const NavigationBar = ({ onLogout }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = useCallback(async () => {
    try {
      // Clear admin data immediately for better UX
      setAdminData(null);
      setLoading(true);
      setError(null);

      // Use authService logout method
      await authService.logout();

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { action: 'logout' }
      }));

      // Call the provided onLogout callback
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      console.error('Error during logout:', err);
      // Still proceed with logout even if there's an error
      if (onLogout) {
        onLogout();
      }
    }
  }, [onLogout]);

  const fetchAdminProfile = useCallback(async () => {
    try {
      console.log('Starting admin profile fetch...');
      setLoading(true);
      setError(null);

      // Get the auth token from authService first, then fallback to localStorage
      let token = authService.getToken();
      if (!token) {
        const user = JSON.parse(localStorage.getItem('user'));
        token = user?.token;
      }

      console.log('Auth token:', token ? 'Found' : 'Not found');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://api.literexia.com/api/admin/profile', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        // Token expired or invalid
        console.warn('Authentication failed - token may be expired');
        authService.logout();
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response format');
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (!data.success || !data.data) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure');
      }

      const profileData = data.data;
      console.log('Setting admin profile data:', profileData);

      if (!profileData.firstName || !profileData.lastName) {
        console.error('Missing name data:', profileData);
        throw new Error('Profile data missing required fields');
      }

      setAdminData(profileData);
      setLoading(false);
    } catch (err) {
      console.error('Error in profile fetch:', err);

      // Handle different types of errors
      if (err.message.includes('No authentication token')) {
        setError('Please log in to continue');
      } else if (err.message.includes('Session expired')) {
        setError('Session expired. Please log in again.');
      } else if (err.message.includes('Access denied')) {
        setError('Access denied. Please contact administrator.');
      } else if (err.message.includes('Invalid response format')) {
        setError('Server communication error. Please try again.');
      } else {
        setError(err.message || 'Failed to load profile data');
      }

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('Profile update event received - refreshing admin data');
      fetchAdminProfile();
    };

    const handleAuthStateChange = () => {
      console.log('Auth state change event received - refreshing admin data');
      fetchAdminProfile();
    };

    // Listen for custom events
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('authStateChanged', handleAuthStateChange);

    // Listen for storage changes (in case user logs in/out from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'userData') {
        console.log('Auth storage changed - refreshing admin data');
        fetchAdminProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchAdminProfile]);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/admin/dashboard',
      subItems: []
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      path: '/admin/user-management',
      subItems: [
        { id: 'student-list', label: 'Student List', path: '/admin/student-list', icon: GraduationCap },
        { id: 'teacher-list', label: 'Teacher List', path: '/admin/teacher-list', icon: School },
        { id: 'parent-list', label: 'Parent List', path: '/admin/parent-list', icon: UserSquare2 }
      ]
    },
    {
      id: 'assessment-results',
      label: 'Assessments',
      icon: PieChart,
      path: '/admin/assessment-results-overview',
      subItems: [
        { id: 'pre-assessment', label: 'Pre Assessment', path: '/admin/student-assessments', icon: Book },
        { id: 'post-assessment', label: 'Post Assessment', path: '/admin/assessment-results-overview', icon: BarChart2 }
      ]
    },
    {
      id: 'admin-profile',
      label: 'Admin Profile',
      icon: User,
      path: '/admin/profile',
      subItems: []
    },
    // {
    //   id: 'analytics',
    //   label: 'Activity Management',
    //   icon: BarChart2,
    //   path: '/admin/analytics',
    //   subItems: [
    //     { id: 'submission-overview', label: 'Activity Approval', path: '/admin/submissions-overview', icon: FileCheck }
    //   ]
    // }
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
    const currentPath = location.pathname;
    return currentPath === path;
  };

  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar__content">
        {/* Logo section */}
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">
            <img src="/images/cradleLogoTrans.png" alt="Cradle of Learners" />
            <h1>CRADLE OF LEARNERS INC.</h1>
          </div>
          
          {/* Profile section */}
          <div className="admin-sidebar__profile">
            <div className="admin-sidebar__avatar">
              {adminData?.profileImageUrl ? (
                <img
                  src={adminData.profileImageUrl}
                  alt={`${adminData.firstName} ${adminData.lastName}`}
                  onError={(e) => {
                    console.warn('Profile image failed to load');
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="admin-sidebar__avatar-placeholder">
                  {adminData?.firstName?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="admin-sidebar__user-info">
              <h3 className="admin-sidebar__name">
                {loading ? 'Loading...' :
                error ? (
                  <span style={{ color: '#ff6b6b', fontSize: '0.85em' }}>
                    {error.includes('Session expired') || error.includes('Please log in') ?
                      'Session Expired' :
                      error.includes('Server communication') ?
                        'Connection Error' :
                        'Error Loading Profile'
                    }
                  </span>
                ) :
                adminData ? `${adminData.firstName} ${adminData.lastName}` : 'Admin User'}
              </h3>
              <p className="admin-sidebar__role">
                {error && (error.includes('Session expired') || error.includes('Please log in')) ?
                  'Please refresh and log in again' :
                  'Administrator'
                }
              </p>
              {error && !error.includes('Session expired') && !error.includes('Please log in') && (
                <button
                  onClick={fetchAdminProfile}
                  style={{
                    fontSize: '0.75em',
                    padding: '4px 8px',
                    marginTop: '4px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <div className="admin-sidebar__menu">
          {navigationItems.map(item => (
            <div key={item.id} className="admin-sidebar__section">
              <Link 
                to={item.subItems.length > 0 ? '#' : item.path}
                className={`admin-sidebar__nav-item ${isActiveItem(item.path, item.subItems) ? 'admin-sidebar__nav-item--active' : ''}`}
                onClick={(e) => {
                  if (item.subItems.length > 0) {
                    e.preventDefault();
                    toggleSection(item.id);
                  }
                }}
              >
                <div className="admin-sidebar__item-content">
                  <item.icon className="admin-sidebar__icon" />
                  <span className="admin-sidebar__label">{item.label}</span>
                </div>
                {item.subItems.length > 0 && (
                  <div className="admin-sidebar__expand-icon">
                    {expandedSections.includes(item.id) ? 
                      <ChevronDown size={16} /> : 
                      <ChevronRight size={16} />
                    }
                  </div>
                )}
              </Link>

              {/* Submenu items */}
              {item.subItems.length > 0 && expandedSections.includes(item.id) && (
                <div className="admin-sidebar__submenu">
                  {item.subItems.map(subItem => (
                    <Link 
                      key={subItem.id}
                      to={subItem.path}
                      className={`admin-sidebar__submenu-item ${isActiveSubItem(subItem.path) ? 'admin-sidebar__submenu-item--active' : ''}`}
                    >
                      {subItem.icon && <subItem.icon className="admin-sidebar__submenu-icon" />}
                      <span className="admin-sidebar__submenu-label">{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer section */}
        <div className="admin-sidebar__footer">
          <button
            onClick={handleLogout}
            className="admin-sidebar__logout-btn"
            disabled={loading && !adminData}
          >
            <LogOut className="admin-sidebar__icon" />
            <span className="admin-sidebar__label">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;