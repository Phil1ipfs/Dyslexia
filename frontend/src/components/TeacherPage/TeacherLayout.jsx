import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { fetchTeacherProfile } from "../../services/teacherService"; // make sure this path is correct
import "./teacherLayout.css";

function TeacherLayout({ onLogout }) {
  const [teacherInfo, setTeacherInfo] = useState(null);

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
  }, []);

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
