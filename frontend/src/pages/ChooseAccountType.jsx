// src/pages/ChooseAccountType.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/chooseAccount.css';

import logo from '../assets/images/Teachers/LITEREXIA.png';
import parentIcon from '../assets/icons/Teachers/parent.png';
import teacherIcon from '../assets/icons/Teachers/teacher.png';
import adminIcon from '../assets/icons/Teachers/admin.png';
import wave from '../assets/images/Teachers/wave.png';

const ChooseAccountType = () => {
  const navigate = useNavigate();

  const handleSelect = (type) => {
    // Save the selected user type in localStorage using a consistent key.
    localStorage.setItem('userType', type);
    // Navigate to login where the role will be read and used for redirection.
    navigate('/login');
  };

  return (
    <div className="choose-container">
      <img src={logo} alt="Literexia Logo" className="choose-logo" />
      <button className="choose-exit" onClick={() => navigate('/')}>X</button>
      <div className="choose-content">
        <h1>Piliin ang Account Type</h1>
        <p>Magsimula sa pagpili ng uri ng account na nababagay sa iyo.</p>
        <div className="account-options">
          <div className="account-card" onClick={() => handleSelect('parent')}>
            <img src={parentIcon} alt="Parent" />
            <span>Magulang</span>
          </div>
          <div className="account-card" onClick={() => handleSelect('teacher')}>
            <img src={teacherIcon} alt="Teacher" />
            <span>Guro</span>
          </div>
          <div className="account-card" onClick={() => handleSelect('admin')}>
            <img src={adminIcon} alt="Admin" />
            <span>Admin</span>
          </div>
        </div>
      </div>
      <img src={wave} alt="Wave" className="bottom-wave" />
    </div>
  );
};

export default ChooseAccountType;
