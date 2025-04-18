import React from "react";
import literexiaLogo from "../../assets/images/Teachers/LITEREXIA.png"; 
import "../../components/Homepage/Footer.css";



function Footer() {
  return (
    <footer className="footer-section">
      
      <div className="footer-links-container">
        
        <div className="footer-column">
          <h4>About</h4>
          <ul>
            <li><a href="#howitworks">How it works?</a></li>
            <li><a href="#curriculum">Curriculum</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#award">Award</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Courses</h4>
          <ul>
            <li><a href="#howitworks">How it works?</a></li>
            <li><a href="#curriculum">Curriculum</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#award">Award</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Schools</h4>
          <ul>
            <li><a href="#cradle">Cradle of learners</a></li>
            <li><a href="#curriculum">Curriculum</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#award">Award</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Blog</h4>
          <ul>
            <li><a href="#categories">Blog: Categories</a></li>
            <li><a href="#languageeducation">Blog: Language Education</a></li>
          </ul>
        </div>


      <div className="footer-column">
      <h4>Help</h4>
          <ul>
            <li><a href="#faq">FAQ</a></li>
          </ul>

        </div>

      </div>
      <div className="footer-bottom">
        <img 
          src={literexiaLogo} 
          alt="LITEREXIA Logo" 
          className="footer-logo"
        />
        <p className="footer-rights">All rights reserved</p>
      </div>
    </footer>
  );
}

export default Footer;
