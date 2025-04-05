import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/LITEREXIA.png";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Handle scroll events to update navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
      
      // Update active section based on scroll position
      const sections = ["home", "about", "features", "methodology", "why Choose"];
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && scrollPosition >= section.offsetTop - 100) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLoginClick = () => {
    navigate("/choose-account");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="nav-left">
        <img src={logo} alt="Literexia" className="nav-logo-img" />
        <p className="nav-subtext">Filipino Reading Comprehension Dyslexia</p>
      </div>
      
      <ul className={`nav-links ${mobileMenuOpen ? "active" : ""}`}>
        {["home", "about", "features", "methodology", "why Choose"].map((section) => (
          <li key={section}>
            <button 
              onClick={() => scrollToSection(section)}
              className={`nav-link ${activeSection === section ? "active" : ""}`}
              aria-label={`Go to ${section} section`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
              <span className="nav-link-underline"></span>
            </button>
          </li>
        ))}
        <li>
          <button 
            className="login-btn"
            onClick={handleLoginClick}
            aria-label="Login to your account"
          >
            Login Account
          </button>
        </li>
      </ul>
      
      <button 
        className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`} 
        aria-label="Toggle menu"
        onClick={toggleMobileMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}

export default Navbar;