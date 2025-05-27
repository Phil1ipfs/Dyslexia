import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  User,
  BookOpen,
  LogOut
} from 'lucide-react';
import './ParentSidebar.css';

const ParentSidebar = ({ onLogout }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState([]);
  const [parentData, setParentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL from environment variable or default
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchParentProfile = async () => {
      try {
        setLoading(true);
        // Get auth token from localStorage
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     JSON.parse(localStorage.getItem('userData'))?.token;
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Make API request to get parent profile
        const response = await axios.get(`${BASE_URL}/api/parents/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          setParentData({
            firstName: response.data.firstName || "",
            lastName: response.data.lastName || "",
            profileImageUrl: response.data.profileImageUrl || ""
          });
        } else {
          throw new Error('No profile data received');
        }
      } catch (err) {
        console.error('Error in profile fetch:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParentProfile();
  }, []);

  const navigationItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/parent/dashboard',
      subItems: []
    },
    {
      id: 'progress',
      label: 'View Student Progress',
      icon: BookOpen,
      path: '/parent/feedback',
      subItems: []
    }
  ];

  const isActiveItem = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation-bar">
      <div className="navigation-bar__brand">
        <div className="navigation-bar__logo-container">
          <img src="/images/cradleLogoTrans.png" alt="Cradle of Learners" className="navigation-bar__logo-image" />
          <h1 className="navigation-bar__company-name">CRADLE OF LEARNERS INC.</h1>
        </div>
        <div className="navigation-bar__profile">
          <div className="navigation-bar__avatar">
            {parentData?.profileImageUrl ? (
              <img 
                src={parentData.profileImageUrl} 
                alt={`${parentData.firstName} ${parentData.lastName}`} 
                className="navigation-bar__avatar-img"
              />
            ) : (
              <span className="navigation-bar__avatar-placeholder">
                {parentData?.firstName?.charAt(0) || 'P'}
              </span>
            )}
          </div>
          <div className="navigation-bar__profile-info">
            <h3 className="navigation-bar__admin-name">
              {loading ? 'Loading...' : 
               error ? 'Error loading profile' : 
               parentData ? `${parentData.firstName} ${parentData.lastName}` : 'Parent User'}
            </h3>
            <p className="navigation-bar__role">Parent</p>
          </div>
        </div>
      </div>

      <div className="navigation-bar__menu">
        {navigationItems.map(item => (
          <div key={item.id} className="navigation-bar__section">
            <Link 
              to={item.path}
              className={`navigation-bar__item ${isActiveItem(item.path) ? 'navigation-bar__item--active' : ''}`}
            >
              <div className="navigation-bar__item-content">
                <item.icon className="navigation-bar__icon" size={20} />
                <span className="navigation-bar__label">{item.label}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="navigation-bar__footer">
        <button onClick={onLogout} className="navigation-bar__logout-btn">
          <div className="navigation-bar__item-content">
            <LogOut className="navigation-bar__icon" size={20} />
            <span className="navigation-bar__label">Logout</span>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default ParentSidebar;
