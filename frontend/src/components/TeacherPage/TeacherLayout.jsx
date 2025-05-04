// src/components/TeacherPage/TeacherLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { fetchTeacherProfile } from "../../services/teacherService"; 
import "./teacherLayout.css";

function TeacherLayout({ onLogout }) {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        const data = await fetchTeacherProfile();
        setTeacherInfo(data);
      } catch (err) {
        console.error("Failed to fetch teacher profile:", err);
      }
    };

    loadTeacher();
  }, [location]); // Reload whenever the location changes

  return (
    <div className="teacher-layout-container">
      <Sidebar onLogout={onLogout} teacherInfo={teacherInfo || {}} />
      <div className="main-content-area">
        <Outlet />
      </div>
    </div>
  );
}

export default TeacherLayout;