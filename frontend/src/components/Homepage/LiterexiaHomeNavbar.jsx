import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/Teachers/LITEREXIA.png";
import "./Homepage-Navbar.css"; // Import the renamed CSS file

function LiterexiaHomeNavbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const handleDownload = () => {
    window.open('https://drive.google.com/uc?export=download&id=12zk_OyBrbiAxArTFpwPKGRAi3hk_zw5u', '_blank');
  };

  return (
    <nav className={`literexia-home-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="literexia-home-brand">
        <img src={logo} alt="Literexia" className="literexia-home-logo" />
        <button
          className="literexia-home-downloadbtn"
          onClick={handleDownload}
          aria-label="Download Literexia App"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ marginRight: '8px' }}
          >
            <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.2C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z"/>
          </svg>
          Download
        </button>
      </div>
      
      <ul className={`literexia-home-menu ${mobileMenuOpen ? "active" : ""}`}>
        {["home", "about", "features", "methodology", "why Choose"].map((section) => (
          <li key={section}>
            <button 
              onClick={() => scrollToSection(section)}
              className={`literexia-home-menuitem ${activeSection === section ? "active" : ""}`}
              aria-label={`Go to ${section} section`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
              <span className="literexia-home-menuline"></span>
            </button>
          </li>
        ))}
        <li>
          <button 
            className="literexia-home-loginbtn"
            onClick={handleLoginClick}
            aria-label="Login to your account"
          >
            Login Account
          </button>
        </li>
      </ul>
      
      <button 
        className={`literexia-home-mobilebtn ${mobileMenuOpen ? "active" : ""}`} 
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

export default LiterexiaHomeNavbar;