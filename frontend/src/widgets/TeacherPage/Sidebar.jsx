// src/widgets/TeacherPage/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import literexiaLogo from "../../assets/images/LITEREXIA.png";
import dashboardIcon from "../../assets/icons/Dashboard.png";
import viewStudentIcon from "../../assets/icons/ViewStudent.png";
import teacherProfileIcon from "../../assets/icons/Feedback.png";
import logoutIcon from "../../assets/icons/Logout.png";
import avatarIcon from "../../assets/icons/avatar.png";

import "./Sidebar.css";

function Sidebar({ defaultActive = "dashboard", onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(defaultActive);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/teacher-dashboard")) {
      setActive("dashboard");
    } else if (path.includes("/view-student")) {
      setActive("view");
    } else if (path.includes("/teacher")) {
      setActive("teacher");
    } else {
      setActive("");
    }
  }, [location]);

  const handleClick = (item) => {
    setActive(item);
    if (item === "dashboard") {
      navigate("/teacher-dashboard");
    } else if (item === "view") {
      navigate("/view-student");
    } else if (item === "activities") {
      navigate("/manage-activities");
    } else if (item === "teacher") {
      navigate("/teacher");
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src={literexiaLogo} alt="Literexia Logo" />
      </div>

      {/* User Info */}
      <div className="sidebar-user-info">
        <img src={avatarIcon} alt="User Avatar" className="sidebar-avatar" />
        <div className="sidebar-user-details">
          <p className="sidebar-user-name">Madam Jaja</p>
          <p className="sidebar-user-role">Teacher</p>
        </div>
      </div>
      <hr className="sidebar-divider" />

      {/* Menu Items */}
      <ul className="sidebar-menu">
        <li
          className={active === "dashboard" ? "active" : ""}
          onClick={() => handleClick("dashboard")}
        >
          <img src={dashboardIcon} alt="Dashboard" />
          <span>Dashboard</span>
        </li>
        <li
          className={active === "view" ? "active" : ""}
          onClick={() => handleClick("view")}
        >
          <img src={viewStudentIcon} alt="View Student" />
          <span>View Student</span>
        </li>

        <li
          className={active === "activities" ? "active" : ""}
          onClick={() => handleClick("activities")}
        >
          <img src={viewStudentIcon} alt="Manage Activities" />
          <span>Manage Activities</span>
        </li>


        <li
          className={active === "teacher" ? "active" : ""}
          onClick={() => handleClick("teacher")}
        >
          <img src={teacherProfileIcon} alt="Teacher Profile" />
          <span>Teacher Profile</span>
        </li>
      </ul>

      {/* Logout */}
      <div className="sidebar-logout" onClick={handleLogoutClick}>
        <img src={logoutIcon} alt="Logout" />
        <span>Logout</span>
      </div>
    </div>
  );
}

export default Sidebar;
