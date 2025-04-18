import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./teacherLayout.css";


const handleSidebarLogout = () => {
  // You might want to do additional cleanup here
  onLogout(); // This will call the logout function from App.jsx
};

function TeacherLayout({ onLogout }) {
  return (
    <div className="teacher-layout-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content-area">
        <Outlet />
      </div>
    </div>
  );
}

export default TeacherLayout;
