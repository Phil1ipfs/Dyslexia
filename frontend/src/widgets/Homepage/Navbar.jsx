import React from "react";
import logo from "../../assets/images/LITEREXIA.png"; 
import "../../css/Homepage/Homepage.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Literexia" className="nav-logo-img" />
        <p className="nav-subtext">Fun for Reading Comprehension</p>
      </div>
      <ul className="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><button className="login-btn">Login to your Account</button></li>
      </ul>
    </nav>
  );
}

export default Navbar;
