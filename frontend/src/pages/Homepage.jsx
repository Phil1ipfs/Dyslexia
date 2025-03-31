import React from "react";
import "../css/Homepage/Homepage.css";
import "../css/Homepage/responsive.css";

import Navbar from "../widgets/Homepage/Navbar";

// Hero
import heroImage from "../assets/images/Group 4076.png";

// About
import phones from "../assets/images/phone.png";

// Features
import phoneIcon from "../assets/icons/feature-phone.png";
import aiIcon from "../assets/icons/ai.png";
import flagIcon from "../assets/icons/flag.png";
import pathIcon from "../assets/icons/path.png";
import bearIcon from "../assets/icons/bear.png";

// Dyslexia Customization
import preview from "../assets/images/dyslexia-preview.png";

// Teaching Methodology Icons
import methodBear from "../assets/icons/bear-2.png";
import methodPenguin from "../assets/icons/penguin.png";
import methodElephant from "../assets/icons/elephant.png";
import methodLion from "../assets/icons/sealion.png";

function Homepage() {
  return (


    <div className="homepage">
      <Navbar />

      {/* ---- HERO SECTION ---- */}
      <section
        className="hero-section"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="hero-content">
          <h2>Learn Tagalog for Kids</h2>
          <p>
            Kids love learning Tagalog with fun videos, interactive games, catchy songs,
            engaging books, and printable worksheets in Filipino for children!
          </p>
          <button className="register-btn">Register</button>
        </div>
      </section>

      {/* ---- ABOUT SECTION ---- */}
      <section className="about-section">
        <div className="about-container">
          <img src={phones} className="about-image" alt="App preview" />
          <div className="about-text">
            <h3 className="about-heading">
              Best Tagalog learning website and app for kids!
            </h3>
            <p className="about-description">
              Ang Literexia ay isang makabagong mobile app na tumutulong sa mga
              mag-aaral na may dyslexia sa kanilang paglalakbay sa pagbabasa sa
              pamamagitan ng interactive na mga aralin, isinapersonal na
              pagtuturo, at masayang pagsusuri upang mapabuti ang kanilang
              kasanayan sa pagbasa.
            </p>
          </div>
        </div>
      </section>

      {/* ---- FEATURES SECTION ---- */}
      <section className="features-section">
        <h2 className="features-heading">What does “Literexia” include?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <img src={phoneIcon} alt="Mobile and Web App" />
            <h4>Mobile and Web Application</h4>
            <p>
              Mobile App for students to access interactive reading exercises
              and AI-assisted learning. Web Platform for teachers and parents
              to monitor student progress and customize learning activities.
            </p>
          </div>
          <div className="feature-card">
            <img src={aiIcon} alt="AI Chatbot" />
            <h4>Mobile and Web Application</h4>
            <p>
              Provides real-time feedback and guidance for students struggling
              with reading exercises. Helps answer student queries and improves
              engagement in learning activities.
            </p>
          </div>
          <div className="feature-card">
            <img src={flagIcon} alt="Filipino Language-Based Learning" />
            <h4>Filipino Language-Based Learning</h4>
            <p>
              Focuses on reading comprehension in Filipino, addressing the gap
              in dyslexia-friendly Filipino learning resources.
            </p>
          </div>
          <div className="feature-card">
            <img src={pathIcon} alt="Personalized Path" />
            <h4>Personalized Learning Path</h4>
            <p>
              Adaptive assessments and exercises tailored to the student's
              progress. AI-powered predictive data analytics to track
              performance and suggest areas for improvement.
            </p>
          </div>
        </div>
        <img src={bearIcon} alt="Bear Mascot" className="bear-mascot" />
      </section>

      {/* ---- DYSLEXIA SECTION ---- */}
      <section className="dyslexia-section">
        <div className="dyslexia-container">
          <img src={preview} className="dyslexia-image" alt="dyslexia font preview" />

          <div className="dyslexia-text">
            <h3 className="dyslexia-heading">
              Dyslexia-Friendly Interface & Customization
            </h3>
            <p className="dyslexia-description">
              Allows students to adjust font style, spacing, and background color
              for better readability. Ensures a stress-free and comfortable learning
              experience.
            </p>
          </div>
        </div>
      </section>

      {/* ---- TEACHING METHODOLOGY SECTION ---- */}

      <section
        className="teaching-methodology-section">

        <h2 className="features-heading">Tagalog Teaching Methodology</h2>
        <div className="features-grid">
          <div className="feature-card">
          <img src={methodBear} alt="Multisensory" />
          <h4>Multisensory Learning Approach</h4>
            <p>
              Uses visual, auditory, and kinesthetic elements to reinforce learning. Incorporates interactive exercises, such as text-to-speech (TTS), phonics-based activities, and syllable recognition, to help dyslexic learners grasp reading concepts.
            </p>
          </div>
          <div className="feature-card">
          <img src={methodPenguin} alt="Teacher-Inclusive" />
          <h4>Teacher-Guided and Parent-Inclusive Learning</h4>
            <p>
              Teachers can modify assessments and activities based on student progress. Parents can track their child’s progress through the Parent Monitoring Dashboard and communicate with educators.
            </p>
          </div>
          <div className="feature-card">
          <img src={methodElephant} alt="OGA Method" />
          <h4>Orton-Gillingham Approach (OGA) Principles Learning Path</h4>
            <p>
              A structured, sequential, and cumulative teaching method that breaks down words into sounds (phonemes) to help dyslexic students read better.
            </p>
          </div>
          <div className="feature-card">
          <img src={methodLion} alt="Personalized Path" />            
          <h4>Personalized Learning Path</h4>
            <p>
              Adaptive assessments and exercises tailored to the students progress. AI-powered predictive data analytics to track performance and suggest areas for improvement.
            </p>
          </div>
        </div>
      </section>


    </div>

  );
}

export default Homepage;
