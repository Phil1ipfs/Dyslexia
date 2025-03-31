import React from 'react';
import '../../styles/navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        <h1>LIT<span>EREXIA</span></h1>
        <p>Fun for Reading Comprehension</p>
      </div>
      <ul className="nav-links">
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><button className="login-btn">Login</button></li>
      </ul>
    </nav>
  );
}

export default Navbar;
