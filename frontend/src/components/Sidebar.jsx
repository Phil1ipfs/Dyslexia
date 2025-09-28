import React from 'react';
import '../css/Admin/Sidebar.css';


const Sidebar = ({ active }) => {
  const menuItems = [
    'Dashboard',
    'Prescriptive Analytics',
    'Approval Request',
    'Submission Overview',
    'Registered Users',
    'Approved Activity',
    'User Lists',z
  ];

  return (
    <div className="sidebar">
      <div className="logo">LITEREXIA</div>
      <div className="user-info">
        <img src="https://i.imgur.com/1X8DkzW.png" alt="User" />
        <div>
          <p>Madam Jaja</p>
          <small>Admin</small>
        </div>
      </div>
      <ul className="menu">
        {menuItems.map((item, idx) => (
          <li key={idx} className={active === item ? 'active' : ''}>{item}</li>
        ))}
      </ul>
      <div className="bottom-menu">
        <p>⚙️ Settings</p>
        <p>📞 Log Out</p>
      </div>
    </div>
  );
};

export default Sidebar;