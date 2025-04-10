import React from 'react';
import Sidebar from '../components/Sidebar';
import ActivityTable from '../components/ActivityTable';
import '../css/Admin/AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="dashboard-page">
      <Sidebar active="Dashboard" />
      <main>
        <h2>Dashboard</h2>
        <DashboardCards />
        <h3>Latest Activities Approve</h3>
        <ActivityTable />
      </main>
    </div>
  );
};

export default AdminDashboard;

