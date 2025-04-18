// src/widgets/AdminPage/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from '../../components/Layout/NavigationBar/NavigationBar';
import '../../widgets/AdminPage/AdminLayout.css';

const AdminLayout = ({ onLogout }) => {
  return (
    <div className="admin-layout">
      <NavigationBar onLogout={onLogout} />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;