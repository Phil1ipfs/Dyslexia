import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ import useNavigate
import logo from "../../assets/images/LITEREXIA.png"; 
import "../../css/Homepage.css";

function Navbar() {
  const navigate = useNavigate(); // ✅ initialize navigate

  const handleLoginClick = () => {
    navigate("/login"); // ✅ go to the login page
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Literexia" className="nav-logo-img" />
        <p className="nav-subtext">Fun for Reading Comprehension</p>
      </div>

      <ul className="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#methodology">Methodology</a></li>
        <li><a href="#why">Why Choose</a></li>

        <li>
          <button className="login-btn" onClick={handleLoginClick}>
            Login to your Account
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
