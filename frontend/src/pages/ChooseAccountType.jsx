import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/chooseAccount.css';

import logo from '../assets/images/LITEREXIA.png';
import parentIcon from '../assets/icons/parent.png';
import teacherIcon from '../assets/icons/teacher.png';
import adminIcon from '../assets/icons/admin.png';
import wave from '../assets/images/wave.png';

function ErrorDialog({ message, onClose }) {
  return (
    <div className="error-dialog-overlay">
      <div className="error-dialog-box">
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

const ChooseAccountType = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSelect = (type) => {
    localStorage.setItem('selectedUserType', type);

    if (type === 'teacher') {
      navigate('/teacher-dashboard');
    } else {
      setError(`The "${type}" account type is not available yet.`);
    }
  };

  return (
    <div className="choose-container">
      {/* Error Dialog if needed */}
      {error && <ErrorDialog message={error} onClose={() => setError('')} />}

      <img src={logo} alt="Literexia Logo" className="choose-logo" />

      {/* Exit icon → go back to the Homepage */}
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

      {/* Wave background at bottom */}
      <img src={wave} alt="Wave" className="bottom-wave" />
    </div>
  );
};

export default ChooseAccountType;
