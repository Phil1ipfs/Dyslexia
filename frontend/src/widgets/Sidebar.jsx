import React, { useState } from "react";

import literexiaLogo from "../assets/images/LITEREXIA.png";
import dashboardIcon from "../assets/icons/Dashboard.png";
import studentProgressIcon from "../assets/icons/Progress.png";
import viewStudentIcon from "../assets/icons/ViewStudent.png";
import teacherProfileIcon from "../assets/icons/Feedback.png";
import logoutIcon from "../assets/icons/Logout.png";

function Sidebar({ defaultActive = "dashboard" }) {
  const [active, setActive] = useState(defaultActive);
  const [clickedItem, setClickedItem] = useState("");

  const handleClick = (item) => {
    setActive(item);
    setClickedItem(item);
    setTimeout(() => setClickedItem(""), 300); 
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body, html {
          margin: 0;
          padding: 0;
          font-family: 'Atkinson Hyperlegible', sans-serif;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 260px;
          height: 100vh;
          background-color: #465E98;
          padding: 2rem 1.2rem;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 12px rgba(0,0,0,0.3);
          z-index: 999;
        }

        .sidebar-logo {
          text-align: center;
          margin-bottom: 2rem;
        }

        .sidebar-logo img {
          margin-top: 2rem;
          width: 190px;
          object-fit: contain;
        }

        .sidebar-menu {
          list-style: none;
          padding: 0;
          margin-top: 20%;
          flex-grow: 1;
        }

        .sidebar-menu li {
          display: flex;
          align-items: center;
          padding: 1rem 1.2rem;
          margin-bottom: 1rem;
          border-radius: 50px 0 0 50px;
          transition: background 0.3s ease, transform 0.3s ease;
          cursor: pointer;
          color: white;
          font-size: 1rem;
        }

        .sidebar-menu li img {
          width: 28px;
          margin-right: 0.8rem;
        }

        .sidebar-menu li:hover {
          background-color: #F3C922;
          color: #333;
          transform: translateX(6px);
        }

        .sidebar-menu li.active {
          background-color: #F3C922;
          color: #333;
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        }

        .sidebar-menu li.clicked {
          animation: bounceClick 0.3s ease;
        }

        @keyframes bounceClick {
          0% { transform: scale(1); }
          50% { transform: scale(0.96) translateY(2px); }
          100% { transform: scale(1); }
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          padding: 0.9rem 1.2rem;
          border-radius: 50px 0 0 50px;
          cursor: pointer;
          transition: transform 0.3s ease;
          color: white;
          font-size: 0.95rem;
        }

        .sidebar-logout:hover {
          transform: translateX(6px);
        }

        .sidebar-logout img {
          width: 24px;
          margin-right: 0.8rem;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 80px;
            padding: 1.2rem;
          }

          .sidebar-logo img {
            width: 50px;
          }

          .sidebar-menu li span,
          .sidebar-logout span {
            display: none;
          }
        }
      `}</style>

      <div className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={literexiaLogo} alt="Literexia Logo" />
        </div>

        {/* Menu Items */}
        <ul className="sidebar-menu">
          <li
            className={`${active === "dashboard" ? "active" : ""} ${
              clickedItem === "dashboard" ? "clicked" : ""
            }`}
            onClick={() => handleClick("dashboard")}
          >
            <img src={dashboardIcon} alt="Dashboard" />
            <span>Dashboard</span>
          </li>

          <li
            className={`${active === "progress" ? "active" : ""} ${
              clickedItem === "progress" ? "clicked" : ""
            }`}
            onClick={() => handleClick("progress")}
          >
            <img src={studentProgressIcon} alt="Student Progress" />
            <span>Student Progress</span>
          </li>

          <li
            className={`${active === "view" ? "active" : ""} ${
              clickedItem === "view" ? "clicked" : ""
            }`}
            onClick={() => handleClick("view")}
          >
            <img src={viewStudentIcon} alt="View Student" />
            <span>View Student</span>
          </li>

          <li
            className={`${active === "teacher" ? "active" : ""} ${
              clickedItem === "teacher" ? "clicked" : ""
            }`}
            onClick={() => handleClick("teacher")}
          >
            <img src={teacherProfileIcon} alt="Teacher Profile" />
            <span>Teacher Profile</span>
          </li>
        </ul>

        {/* Logout */}
        <div className="sidebar-logout" onClick={() => alert("Logging out...")}>
          <img src={logoutIcon} alt="Logout" />
          <span>Logout</span>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
