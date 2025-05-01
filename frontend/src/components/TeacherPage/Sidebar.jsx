// src/components/TeacherPage/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import literexiaLogo         from "../../assets/images/Teachers/LITEREXIA.png";
import dashboardIcon        from "../../assets/icons/Teachers/Dashboard.png";
import viewStudentIcon      from "../../assets/icons/Teachers/ViewStudent.png";
import manageActivityIcon   from "../../assets/icons/Teachers/activitymanage.png";
import manageProgressIcon   from "../../assets/icons/Teachers/progress.png";
import teacherProfileIcon   from "../../assets/icons/Teachers/Feedback.png";
import logoutIcon           from "../../assets/icons/Teachers/Logout.png";
import avatarFallback       from "../../assets/icons/Teachers/avatar.png";
import chatbotIcon          from "../../assets/icons/Teachers/chatbot.png";

import "./Sidebar.css";

function Sidebar({ defaultActive = "dashboard", onLogout, teacherInfo = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(defaultActive);

  const {
    firstName = "",
    middleName = "",
    lastName = "",
    position = "",
    profileImageUrl = null,
  } = teacherInfo;

  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ");

  // cache-busting to force reload when updated
  const avatarSrc = profileImageUrl
    ? `${profileImageUrl}?t=${Date.now()}`
    : avatarFallback;

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/teacher/dashboard")) setActive("dashboard");
    else if (path.includes("/teacher/view-student")) setActive("view-student");
    else if (path.includes("/teacher/manage-activities")) setActive("manage-activities");
    else if (path.includes("/teacher/manage-progress")) setActive("manage-progress");
    else if (path.includes("/teacher/profile")) setActive("profile");
    else if (path.includes("/teacher/chatbot")) setActive("chatbot");
    else setActive("");
  }, [location]);

  const handleClick = (item, to) => {
    setActive(item);
    navigate(to);
  };

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={literexiaLogo} alt="Literexia Logo" />
      </div>

      <div className="sidebar-user-info">
        <img
          src={avatarSrc}
          onError={e => { e.currentTarget.src = avatarFallback; }}
          alt="User Avatar"
          className="sidebar-avatar"
        />
        <div className="sidebar-user-details">
          <p className="sidebar-user-name">{fullName || "Teacher"}</p>
          <p className="sidebar-user-role">{position || "Educator"}</p>
        </div>
      </div>

      <hr className="sidebar-divider" />

      <ul className="sidebar-menu">
        <li className={active === "dashboard" ? "active" : ""} onClick={() => handleClick("dashboard", "/teacher/dashboard")}>
          <img src={dashboardIcon} alt="Dashboard" /><span>Dashboard</span>
        </li>
        <li className={active === "view-student" ? "active" : ""} onClick={() => handleClick("view-student", "/teacher/view-student")}>
          <img src={viewStudentIcon} alt="View Student" /><span>Student Details and Feedback</span>
        </li>
        <li className={active === "manage-activities" ? "active" : ""} onClick={() => handleClick("manage-activities", "/teacher/manage-activities")}>
          <img src={manageActivityIcon} alt="Manage Activities" /><span>Manage Activities</span>
        </li>
        <li className={active === "manage-progress" ? "active" : ""} onClick={() => handleClick("manage-progress", "/teacher/manage-progress")}>
          <img src={manageProgressIcon} alt="Manage Progress" /><span>Manage Progress</span>
        </li>
        <li className={active === "chatbot" ? "active" : ""} onClick={() => handleClick("chatbot", "/teacher/chatbot")}>
          <img src={chatbotIcon} alt="Chatbot Assistant" /><span>Chatbot Assistant</span>
        </li>
        <li className={active === "profile" ? "active" : ""} onClick={() => handleClick("profile", "/teacher/profile")}>
          <img src={teacherProfileIcon} alt="Teacher Profile" /><span>Teacher Profile</span>
        </li>
      </ul>

      <div className="sidebar-logout" onClick={handleLogoutClick}>
        <img src={logoutIcon} alt="Logout" /><span>Logout</span>
      </div>
    </div>
  );
}

export default Sidebar;
