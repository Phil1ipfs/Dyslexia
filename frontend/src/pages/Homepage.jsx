// src/pages/Homepage.jsx
import React, { useEffect, useState } from "react";
import "../css/Homepage.css";
import "../css/Teachers/responsive.css";

// Import components
import LiterexiaHomeNavbar from "../components/Homepage/LiterexiaHomeNavbar"; // Updated import
import Footer from "../components/Homepage/Footer";

// Hero section assets
import heroCloud1 from "../assets/images/Homepage/hero-clouds.png";
import heroCloud2 from "../assets/images/Homepage/hero-clouds2.png";
import heroCloud3 from "../assets/images/Homepage/hero-clouds3.png";
import heroPenguin from "../assets/images/Homepage/hero-penguin.png";
import heroImage from "../assets/images/Homepage/Group 4076.png";

// About section assets
import phones from "../assets/images/Homepage/phone.png";

// Features section assets
import phoneIcon from "../assets/icons/Homepage/feature-phone.png";
import aiIcon from "../assets/icons/Homepage/ai.png";
import flagIcon from "../assets/icons/Homepage/flag.png";
import pathIcon from "../assets/icons/Homepage/path.png";
import bearIcon from "../assets/icons/Homepage/bear.png";

// Dyslexia Customization assets
import preview from "../assets/images/Homepage/dyslexia-preview.png";

// Teaching Methodology Icons
import methodBear from "../assets/icons/Homepage/bear-2.png";
import methodPenguin from "../assets/icons/Homepage/penguin.png";
import methodElephant from "../assets/icons/Homepage/elephant.png";
import methodLion from "../assets/icons/Homepage/sealion.png";

// Why Choose Us assets
import starIcon from "../assets/icons/Homepage/star.png";

function Homepage() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Add scroll reveal animation effect
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      
      revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        
        if (elementTop < windowHeight - 100) {
          element.classList.add('revealed');
        }
      });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check on page load
    
    // Add scroll button visibility
    const handleScrollButtonVisibility = () => {
      const scrollButton = document.querySelector('.scroll-top-button');
      if (scrollButton) {
        if (window.scrollY > 300) {
          scrollButton.classList.add('scroll-top-visible');
        } else {
          scrollButton.classList.remove('scroll-top-visible');
        }
      }
    };
    
    window.addEventListener('scroll', handleScrollButtonVisibility);
    
    return () => {
      window.removeEventListener('scroll', revealOnScroll);
      window.removeEventListener('scroll', handleScrollButtonVisibility);
    };
  }, []);

  return (
    <div className="homepage">
      <LiterexiaHomeNavbar /> {/* Updated component */}

      {/* ---- HERO SECTION ---- */}
      <section
        className="hero-section"
        id="home"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* 1) Animated clouds and penguin container */}
        <div className="hero-animations">
          <img src={heroCloud1} alt="cloud" className="cloud cloud1" />
          <img src={heroCloud2} alt="cloud" className="cloud cloud2" />
          <img src={heroCloud3} alt="cloud" className="cloud cloud3" />
          <img src={heroPenguin} alt="penguin mascot" className="hero-penguin" />
        </div>

        {/* 2) Hero content */}
        <div className="hero-content">
          <h2>Learn to Read in Filipino</h2>
          <p>
            Make reading fun! With Literexia, children learn through vibrant songs,
            colorful stories, and engaging activities in Filipino—especially designed
            for children with dyslexia.
          </p>

          {/* Download Button with Animation */}
          <div className="download-button-wrapper">
            <button
              className="download-app-button"
              onClick={() => setShowDownloadModal(true)}
            >
              <div className="button-content">
                <svg
                  className="download-icon"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM17 13L12 18L7 13H10V9H14V13H17Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="button-text">Download App</span>
              </div>
              <div className="button-shine"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Download Modal - Enhanced */}
      {showDownloadModal && (
        <div className="download-modal-overlay animate-fade-in" onClick={() => setShowDownloadModal(false)}>
          <div className="download-modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Close X Button */}
            <button
              className="modal-close-x"
              onClick={() => setShowDownloadModal(false)}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Icon Header */}
            <div className="modal-icon-wrapper">
              <div className="modal-icon-circle">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM17 13L12 18L7 13H10V9H14V13H17Z"
                    fill="#FFCC00"
                  />
                </svg>
              </div>
            </div>

            <h2 className="download-modal-title">Download Literexia</h2>
            <p className="download-modal-subtitle">Scan the QR code to download the app</p>

            {/* QR Code Container with Animation */}
            <div className="qr-code-container animate-fade-in-up">
              <div className="qr-code-wrapper">
                {/* Corner decorations */}
                <div className="qr-corner qr-corner-tl"></div>
                <div className="qr-corner qr-corner-tr"></div>
                <div className="qr-corner qr-corner-bl"></div>
                <div className="qr-corner qr-corner-br"></div>

                {/* You'll need to replace this with your actual QR code image */}
                <div className="qr-code-placeholder">
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    <rect width="220" height="220" fill="white" rx="8"/>
                    <text x="110" y="110" textAnchor="middle" fill="#1F315D" fontSize="14" fontWeight="500">
                      Place QR Code Here
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="download-modal-divider">
              <span>or download directly</span>
            </div>

            {/* Download Button - Enhanced */}
            <a
              href="YOUR_APK_DOWNLOAD_LINK"
              className="download-modal-button"
              download
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM17 13L12 18L7 13H10V9H14V13H17Z"
                  fill="currentColor"
                />
              </svg>
              <span>Download for Android</span>
              <div className="button-arrow">→</div>
            </a>

          </div>
        </div>
      )}

      {/* ---- ABOUT SECTION ---- */}
      <section className="about-section reveal" id="about">
        <div className="about-container">
          <img src={phones} className="about-image" alt="App preview" />
          <div className="about-text">
            <h3 className="about-heading">
              The best Filipino reading comprehension app for children with dyslexia!
            </h3>
            <p className="about-description">
              Literexia is an innovative mobile app that helps students with dyslexia 
              on their reading journey through interactive lessons, personalized 
              instruction, and engaging assessments to improve their reading skills.
            </p>
          </div>
        </div>
      </section>

      {/* ---- FEATURES SECTION ---- */}
      <section className="features-section" id="features">
        <h2 className="features-heading">What does "Literexia" include?</h2>
        <div className="features-grid">
          <div className="feature-card reveal">
            <img src={phoneIcon} alt="Mobile and Web App" />
            <h4>Mobile and Web Application</h4>
            <p>
              Mobile App for students to access interactive reading exercises
              and AI-assisted learning. Web Platform for teachers and parents
              to monitor student progress and customize learning activities.
            </p>
          </div>
          <div className="feature-card reveal">
            <img src={aiIcon} alt="AI Chatbot" />
            <h4>Chatbot Assistance</h4>
            <p>
              Provides guidance for students struggling with reading exercises. Helps answer student queries and improves
              engagement in learning activities.
            </p>
          </div>
          <div className="feature-card reveal">
            <img src={flagIcon} alt="Filipino Language-Based Learning" />
            <h4>Filipino Language-Based Learning</h4>
            <p>
              Focuses on reading comprehension in Filipino, addressing the gap
              in dyslexia-friendly Filipino learning resources to strengthen
              native language literacy.
            </p>
          </div>
          <div className="feature-card reveal">
            <img src={pathIcon} alt="Personalized Path" />
            <h4>Personalized Learning Path</h4>
            <p>
              Adaptive assessments and exercises tailored to each student's
              progress. Prescriptive data analytics to track
              performance and suggest areas for improvement.
            </p>
          </div>
        </div>
        <img src={bearIcon} alt="Bear Mascot" className="bear-mascot" />
      </section>

      {/* ---- DYSLEXIA SECTION ---- */}
      <section className="dyslexia-section reveal">
        <div className="dyslexia-container">
          <img
            src={preview}
            className="dyslexia-image"
            alt="dyslexia font preview"
          />

          <div className="dyslexia-text">
            <h3 className="dyslexia-heading">
              Dyslexia-Friendly Interface & Customization
            </h3>
            <p className="dyslexia-description">
              Allows students to adjust font style, spacing, and background
              color for better readability. The app ensures a stress-free and
              comfortable learning experience with intuitive controls that
              help reduce visual stress for dyslexic learners.
            </p>
          </div>
        </div>
      </section>

      {/* ---- TEACHING METHODOLOGY SECTION ---- */}
      <section className="teaching-methodology-section" id="methodology">
        <h2 className="features-heading">Teaching Methodology</h2>
        <div className="features-grid">
          <div className="feature-card reveal">
            <img src={methodBear} alt="Multisensory" />
            <h4>Multisensory Learning Approach</h4>
            <p>
              Uses visual, auditory, and kinesthetic elements to reinforce
              learning. Incorporates interactive exercises, such as
              text-to-speech (TTS), phonics-based activities, and syllable
              recognition, to help dyslexic learners grasp reading concepts.
            </p>
          </div>
          <div className="feature-card reveal">
            <img src={methodPenguin} alt="Teacher-Inclusive" />
            <h4>Teacher-Guided and Parent-Inclusive Learning</h4>
            <p>
              Teachers can modify assessments and activities based on student
              progress. Parents can track their child's progress through the
              Parent Monitoring Dashboard and communicate with educators.
            </p>
          </div>
          <div className="feature-card reveal">
            <img src={methodElephant} alt="OGA Method" />
            <h4>Orton-Gillingham Approach Principles</h4>
            <p>
              A structured, sequential, and cumulative teaching method that
              breaks down words into sounds (phonemes) to help dyslexic students
              read better and build confidence in their language skills.
            </p>
          </div>
          <div className="feature-card reveal">
            <img src={methodLion} alt="Personalized Path" />
            <h4>Adaptive Learning Technology</h4>
            <p>
              Smart assessments and exercises tailored to each student's
              progress. AI data analytics track performance and
              recommend areas for improvement, ensuring no child falls behind.
            </p>
          </div>
        </div>
      </section>

      {/* ---- WHY CHOOSE LITEREXIA SECTION ---- */}
      <section className="why-literexia-section reveal" id="why Choose">
        <h2 className="why-literexia-heading">Why choose Literexia?</h2>

    

        {/* Four-star features */}
        <div className="why-literexia-grid">
          <div className="why-card reveal">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Progress Tracking &amp; Performance Dashboard</h4>
            <p>
              Teachers and parents can monitor student progress through
              detailed reports and insights, allowing for timely intervention
              and celebration of achievements.
            </p>
          </div>

          <div className="why-card reveal">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Data-Driven Personalized Learning</h4>
            <p>
              Monitors reading progress and identifies areas for improvement.
              Recommends personalized learning paths based on student data.
              Generates insights for teachers to optimize reading activities.
            </p>
          </div>

          <div className="why-card reveal">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Interactive Learning Activities</h4>
            <p>
              Word recognition, phonics, and comprehension games designed to be
              both educational and fun. Engaging exercises reinforce learning
              while maintaining student interest and motivation.
            </p>
          </div>

          <div className="why-card reveal">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Dyslexia-Friendly Features &amp; Accessibility</h4>
            <p>
              Customizable fonts (Dyslexie, OpenDyslexic, etc.) for better
              readability. Adjustable word spacing &amp; background colors to
              reduce visual stress. Text-to-speech &amp; speech-to-text
              for auditory support.
            </p>
          </div>
        </div>
      </section>
      
      <button 
        className="scroll-top-button" 
        onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        aria-label="Scroll to top"
      >
        ↑
      </button>

      {/* ---- FOOTER SECTION ---- */}
      <Footer />
    </div>
  );
}

export default Homepage;