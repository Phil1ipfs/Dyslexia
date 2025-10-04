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
import qrCodeAndroid from "../assets/images/android.PNG";

// About section assets
import phones from "../assets/images/Homepage/phone.svg";

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

    // Download the Android APK
    if (platform === 'android') {
      window.open('https://drive.google.com/uc?export=download&id=1emDP41QVpoq0fa3g1RLiFgfc7nD8Ropi', '_blank');
    }
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
          <button
            className="hero-download-btn"
            onClick={() => setIsDownloadModalOpen(true)}
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
                <div className="qr-code-container">
                  <div className="qr-code">
                    <img
                      src={qrCodeAndroid}
                      alt="QR Code to download Literexia app for Android"
                      className="qr-code-image"
                    />
                    <p className="qr-platform-label">Android</p>
                  </div>
                </div>
              </div>

              <div className="divider">
                <span>or</span>
              </div>

              <div className="download-platforms">
                <div className="platform-buttons">
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
                      <div className="platform-name">Android</div>
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
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#0038A8" d="M32 5H4a4 4 0 0 0-4 4v9h36V9a4 4 0 0 0-4-4z"/>
                        <path fill="#CE1126" d="M4 31h28a4 4 0 0 0 4-4v-9H0v9a4 4 0 0 0 4 4z"/>
                        <path fill="#FFF" d="M13.5 18L0 27V9l13.5 9z"/>
                        <path fill="#FCD116" d="m6.527 11.643.439 1.351h1.421l-1.15.836.439 1.351-1.149-.835-1.15.835.439-1.351-1.149-.836h1.421l.439-1.351zm6 6 .439 1.351h1.421l-1.15.836.439 1.351-1.149-.835-1.15.835.439-1.351-1.149-.836h1.421l.439-1.351zm-6 6 .439 1.351h1.421l-1.15.836.439 1.351-1.149-.835-1.15.835.439-1.351-1.149-.836h1.421l.439-1.351z"/>
                        <circle fill="#FCD116" cx="6.527" cy="11.643" r=".5"/>
                        <circle fill="#FCD116" cx="12.527" cy="17.643" r=".5"/>
                        <circle fill="#FCD116" cx="6.527" cy="23.643" r=".5"/>
                      </svg>
                    </div>
                    <span>Filipino Language</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="download-modal-footer">
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Homepage;