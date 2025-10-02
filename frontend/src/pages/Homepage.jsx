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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [clickedButton, setClickedButton] = useState(null);

  // Handle platform button clicks with animation
  const handlePlatformClick = (platform) => {
    setClickedButton(platform);
    
    // Reset animation after 600ms
    setTimeout(() => {
      setClickedButton(null);
    }, 600);
    
    // Here you would typically redirect to the actual app store
    // For now, we'll just show a console log
    console.log(`Downloading for ${platform}...`);
  };

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
          <button className="hero-download-btn" onClick={() => setIsDownloadModalOpen(true)}>
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE3IDlIMTNWM0gxMUMxMC40NDc3IDMgMTAgMy40NDc3MiAxMCA0VjlIN0M2LjQ0NzcyIDkgNiA5LjQ0NzcyIDYgMTBWMTdDNiAxNy41NTIzIDYuNDQ3NzIgMTggNyAxOEgxN0MxNy41NTIzIDE4IDE4IDE3LjU1MjMgMTggMTdWMTBDMTggOS40NDc3MiAxNy41NTIzIDkgMTcgOVoiIGZpbGw9IiMxRjI5MzciLz4KPHBhdGggZD0iTTE0IDEzTDEyIDE1TDEwIDEzIiBzdHJva2U9IiMxRjI5MzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=" alt="Download" className="download-icon" />
            Download App
          </button>
        </div>
      </section>

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

      {/* Download Modal */}
      {isDownloadModalOpen && (
        <div className="download-modal-overlay" onClick={() => setIsDownloadModalOpen(false)}>
          <div className="download-modal" onClick={(e) => e.stopPropagation()}>
            <div className="download-modal-header">
              <h3>Download Literexia</h3>
              <button 
                className="download-modal-close" 
                onClick={() => setIsDownloadModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="download-modal-content">
              <div className="qr-section">
                <p className="qr-instruction">Scan the QR code to download the app</p>
                <div className="qr-code">
                  {/* Placeholder QR code - replace with actual QR code image */}
                  <div className="qr-placeholder">
                    <div className="qr-pattern">
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="divider">
                <span>or</span>
              </div>
              
              <div className="download-platforms">
                <div className="platform-buttons">
                  <button 
                    className={`platform-btn ios-btn ${clickedButton === 'ios' ? 'clicked' : ''}`}
                    onClick={() => handlePlatformClick('ios')}
                  >
                    <div className="platform-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.96-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.03-3.11z"/>
                      </svg>
                    </div>
                    <div className="platform-info">
                      <div className="platform-text">Download on the</div>
                      <div className="platform-name">App Store</div>
                    </div>
                    <div className="click-ripple"></div>
                  </button>
                  
                  <button 
                    className={`platform-btn android-btn ${clickedButton === 'android' ? 'clicked' : ''}`}
                    onClick={() => handlePlatformClick('android')}
                  >
                    <div className="platform-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.1779 13.8533 7.8508 12 7.8508s-3.5902.3271-5.1367.5357L4.841 4.8837a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 10.1867.3432 12.6589 0 15.7617h24c-.3432-3.1028-2.6889-5.575-5.1185-6.4403"/>
                      </svg>
                    </div>
                    <div className="platform-info">
                      <div className="platform-text">GET IT ON</div>
                      <div className="platform-name">Google Play</div>
                    </div>
                    <div className="click-ripple"></div>
                  </button>
                </div>
                
                <div className="download-features">
                  <div className="feature-item">
                    <div className="feature-icon">📱</div>
                    <span>Mobile & Web</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">🎯</div>
                    <span>Dyslexia-Friendly</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">🇵🇭</div>
                    <span>Filipino Language</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="download-modal-footer">
              <button 
                className="download-modal-close-btn" 
                onClick={() => setIsDownloadModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Homepage;