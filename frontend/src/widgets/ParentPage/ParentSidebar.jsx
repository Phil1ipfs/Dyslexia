import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";  // Make sure to import useNavigate and useLocation
import "./ParentSidebar.css";
import literexiaLogo from "../../assets/images/Teachers/LITEREXIA.png";
import logoutIcon from "../../assets/icons/Teachers/Logout.png";
import progressIcon from "../../assets/icons/Parents/progress.png";
import feedbackIcon from "../../assets/icons/Parents/feedback.png";
import profileIcon from "../../assets/icons/Parents/profile.png";


const ParentSidebar = ({ defaultActive = "dashboard", onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(defaultActive);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/parent/dashboard")) {
      setActive("dashboard");
    } else if (path.includes("/parent/progress")) {
      setActive("progress");
    } else if (path.includes("/parent/feedback")) {
      setActive("feedback");
    } else {
      setActive("");
    }
  }, [location]);

  const handleClick = (item) => {
    setActive(item);
    if (item === "dashboard") {
      navigate("/parent/dashboard");
    } else if (item === "feedback") {
      navigate("/parent/feedback");  // Corrected path to /parent/feedback
    } else if (item === "progress") {
      navigate("/parent/progress");  // Corrected path to /parent/progress
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
  };

  return (
    <div className="parent-sidebar">
      <div className="sidebar-header">
        <img src={literexiaLogo} alt="Literexia Logo" />
      </div>
      <ul className="sidebar-menu">
        <li className={active === "profile" ? "active" : ""} onClick={() => handleClick("profile")}>
        <img src={profileIcon} alt="Literexia Logo" />
          <span>Profile</span>
        </li>
        <li className={active === "feedback" ? "active" : ""} onClick={() => handleClick("feedback")}>
        <img src={feedbackIcon} alt="Literexia Logo" />
          <span>Feedback to Teacher</span>
        </li>
        <li className={active === "progress" ? "active" : ""} onClick={() => handleClick("progress")}>
        <img src={progressIcon} alt="Literexia Logo" />
          <span>Student Progress</span>
        </li>
      </ul>
      <div className="sidebar-footer" onClick={handleLogoutClick}>
      <img src={logoutIcon} alt="Literexia Logo" />
        <span>Logout</span>
      </div>
    </div>
  );
};

export default ParentSidebar;
