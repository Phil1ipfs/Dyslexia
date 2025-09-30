// src/pages/ChooseAccountType.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/chooseAccount.css';

import logo from '../assets/images/Teachers/LITEREXIA.png';
import parentIcon from '../assets/icons/Teachers/parent.png';
import teacherIcon from '../assets/icons/Teachers/teacher.png';
import adminIcon from '../assets/icons/Teachers/admin.png';

const ChooseAccountType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [roleTypes, setRoleTypes] = useState({
    teacher: { displayName: 'Guro' },
    parent: { displayName: 'Magulang' },
    admin: { displayName: 'Admin' }
  });

  // When component mounts, fetch role types from API if possible
  useEffect(() => {
    const fetchRoleTypes = async () => {
      try {
        const BASE = import.meta.env.VITE_API_BASE_URL ||
                    (import.meta.env.DEV ? 'http://localhost:5001/api' : '');

        // Try to fetch role definitions from API
        const response = await fetch(`${BASE}/roles`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data)) {
            // Create a mapping of role type to display name
            const roleMapping = {};
            data.forEach(role => {
              if (role.name) {
                // Map Tagalog display names based on role name
                const displayName = 
                  role.name === 'teacher' ? 'Guro' : 
                  role.name === 'parent' ? 'Magulang' : 
                  role.name === 'admin' ? 'Admin' : role.name;
                
                roleMapping[role.name] = {
                  displayName,
                  ...role
                };
              }
            });
            
            if (Object.keys(roleMapping).length > 0) {
              setRoleTypes(roleMapping);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching role types:', error);
        // Continue with default values in case of error
      }
    };
    
    fetchRoleTypes();
  }, []);

  // Check for redirect message from AdminProfile
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const redirectReason = urlParams.get('redirect');

    if (redirectReason === 'email_changed') {
      setDialogMessage('Your email has been updated successfully!\n\nFor security reasons, please log in again with your new credentials.');
      setShowDialog(true);
    } else if (redirectReason === 'password_changed') {
      setDialogMessage('Your password has been changed successfully!\n\nFor security reasons, please log in again with your new password.');
      setShowDialog(true);
    }
  }, [location]);

  const handleDialogClose = () => {
    setShowDialog(false);
    // Clean up URL parameters
    navigate('/choose-account', { replace: true });
  };

  const handleSelect = (type) => {
    // Only store the type name, no hardcoded IDs
    localStorage.setItem('userType', type);

    // Navigate to login where the role will be used for redirection
    navigate('/login');
  };

  return (
    <div className="choose-container">
      <img src={logo} alt="Literexia Logo" className="choose-logo" />
      <button className="choose-exit" onClick={() => navigate('/')}>X</button>
      <div className="choose-content">
        <h1>Choose Your Account Type</h1>
        <div className="account-options">
          <div className="account-card" onClick={() => handleSelect('parent')}>
            <img src={parentIcon} alt="Parent" />
            <span>{roleTypes.parent?.displayName || 'Magulang'}</span>
          </div>
          <div className="account-card" onClick={() => handleSelect('teacher')}>
            <img src={teacherIcon} alt="Teacher" />
            <span>{roleTypes.teacher?.displayName || 'Guro'}</span>
          </div>
          <div className="account-card" onClick={() => handleSelect('admin')}>
            <img src={adminIcon} alt="Admin" />
            <span>{roleTypes.admin?.displayName || 'Admin'}</span>
          </div>
        </div>
      </div>

      {/* Custom Dialog */}
      {showDialog && (
        <div className="custom-dialog-overlay">
          <div className="custom-dialog">
            <div className="custom-dialog-header">
              <h3>✅ Success!</h3>
            </div>
            <div className="custom-dialog-content">
              <p>{dialogMessage}</p>
            </div>
            <div className="custom-dialog-actions">
              <button
                className="custom-dialog-btn custom-dialog-btn-primary"
                onClick={handleDialogClose}
              >
                OK, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChooseAccountType;