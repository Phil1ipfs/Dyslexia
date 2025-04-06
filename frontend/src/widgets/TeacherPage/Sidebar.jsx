import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import literexiaLogo from "../../assets/images/LITEREXIA.png";
import dashboardIcon from "../../assets/icons/Dashboard.png";
import viewStudentIcon from "../../assets/icons/ViewStudent.png";
import manageActivityIcon from "../../assets/icons/activitymanage.png";
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
    if (path.includes("/teacher/dashboard")) {
      setActive("dashboard");
    } else if (path.includes("/teacher/view-student")) {
      setActive("view-student");
    } else if (path.includes("/teacher/manage-activities")) {
      setActive("manage-activities");
    } else if (path.includes("/teacher/profile")) {
      setActive("profile");
    } else {
      setActive("");
    }
  }, [location]);

  const handleClick = (item) => {
    setActive(item);
    if (item === "dashboard") {
      navigate("/teacher/dashboard");
    } else if (item === "view-student") {
      navigate("/teacher/view-student");
    } else if (item === "manage-activities") {
      navigate("/teacher/manage-activities");
    } else if (item === "profile") {
      navigate("/teacher/profile");
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
      <div className="sidebar-logo">
        <img src={literexiaLogo} alt="Literexia Logo" />
      </div>

      <div className="sidebar-user-info">
        <img src={avatarIcon} alt="User Avatar" className="sidebar-avatar" />
        <div className="sidebar-user-details">
          <p className="sidebar-user-name">Madam Jaja</p>
          <p className="sidebar-user-role">Teacher</p>
        </div>
      </div>
      <hr className="sidebar-divider" />

      <ul className="sidebar-menu">
        <li className={active === "dashboard" ? "active" : ""} onClick={() => handleClick("dashboard")}>
          <img src={dashboardIcon} alt="Dashboard" />
          <span>Dashboard</span>
        </li>
        <li className={active === "view-student" ? "active" : ""} onClick={() => handleClick("view-student")}>
          <img src={viewStudentIcon} alt="View Student" />
          <span>View Student</span>
        </li>
        <li className={active === "manage-activities" ? "active" : ""} onClick={() => handleClick("manage-activities")}>
          <img src={manageActivityIcon} alt="Manage Activities" />
          <span>Manage Activities</span>
        </li>
        <li className={active === "profile" ? "active" : ""} onClick={() => handleClick("profile")}>
          <img src={teacherProfileIcon} alt="Teacher Profile" />
          <span>Teacher Profile</span>
        </li>
      </ul>

      <div className="sidebar-logout" onClick={handleLogoutClick}>
        <img src={logoutIcon} alt="Logout" />
        <span>Logout</span>
      </div>
    </div>
  );
}

export default Sidebar;
