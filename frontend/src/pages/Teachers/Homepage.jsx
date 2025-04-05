// src/pages/Teachers/Homepage.jsx
import React from "react";
import "../../css/Homepage.css";
import "../../css/responsive.css";

// widgets reusable
import Navbar from "../../widgets/Homepage/Navbar";
import Footer from "../../widgets/Homepage/Footer";

import heroCloud1 from "../../assets/images/hero-clouds.png";
import heroCloud2 from "../../assets/images/hero-clouds2.png";
import heroCloud3 from "../../assets/images/hero-clouds3.png";
import heroPenguin from "../../assets/images/hero-penguin.png";

// Hero
import heroImage from "../../assets/images/Group 4076.png";

// About
import phones from "../../assets/images/phone.png";

// Features
import phoneIcon from "../../assets/icons/feature-phone.png";
import aiIcon from "../../assets/icons/ai.png";
import flagIcon from "../../assets/icons/flag.png";
import pathIcon from "../../assets/icons/path.png";
import bearIcon from "../../assets/icons/bear.png";

// Dyslexia Customization
import preview from "../../assets/images/dyslexia-preview.png";

// Teaching Methodology Icons
import methodBear from "../../assets/icons/bear-2.png";
import methodPenguin from "../../assets/icons/penguin.png";
import methodElephant from "../../assets/icons/elephant.png";
import methodLion from "../../assets/icons/sealion.png";

// Why Choose Us
import laptopPenguin from "../../assets/icons/laptop.png";
import starIcon from "../../assets/icons/star.png";

function Homepage() {
  return (
    <div className="homepage">
      <Navbar />

      {/* ---- HERO SECTION ---- */}
      <section
        className="hero-section"
        id="home"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* 1) Animated clouds and penguin container */}
        <div className="hero-animations">
          <img src={heroCloud1} alt="cloud 1" className="cloud cloud1" />
          <img src={heroCloud2} alt="cloud 2" className="cloud cloud2" />
          <img src={heroCloud3} alt="cloud 3" className="cloud cloud3" />
          <img src={heroPenguin} alt="hero penguin" className="hero-penguin" />
        </div>

        {/* 2) Existing hero content */}
        <div className="hero-content">
          <h2>Matutong Magbasa sa Tagalog</h2>
          <p>
            Maging masaya ang pagbabasa! Sa Literexia, matututo ang mga bata sa
            pamamagitan ng masisiglang awitin, makukulay na kwento, at masayang
            aktibidad sa wikang Filipino—lalo na para sa mga batang may dyslexia.
          </p>
        </div>
      </section>

      {/* ---- ABOUT SECTION ---- */}
      <section className="about-section" id="about">
        <div className="about-container">
          <img src={phones} className="about-image" alt="App preview" />
          <div className="about-text">
            <h3 className="about-heading">
              Pinakamahusay na Tagalog na aplikasyon sa pag-unawa sa binasa para
              sa mga batang may disleksiya!
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
      <section className="features-section" id="features">
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
              color for better readability. Ensures a stress-free and
              comfortable learning experience.
            </p>
          </div>
        </div>
      </section>

      {/* ---- TEACHING METHODOLOGY SECTION ---- */}
      <section className="teaching-methodology-section" id="methodology">
        <h2 className="features-heading">Tagalog Teaching Methodology</h2>
        <div className="features-grid">
          <div className="feature-card">
            <img src={methodBear} alt="Multisensory" />
            <h4>Multisensory Learning Approach</h4>
            <p>
              Uses visual, auditory, and kinesthetic elements to reinforce
              learning. Incorporates interactive exercises, such as
              text-to-speech (TTS), phonics-based activities, and syllable
              recognition, to help dyslexic learners grasp reading concepts.
            </p>
          </div>
          <div className="feature-card">
            <img src={methodPenguin} alt="Teacher-Inclusive" />
            <h4>Teacher-Guided and Parent-Inclusive Learning</h4>
            <p>
              Teachers can modify assessments and activities based on student
              progress. Parents can track their child’s progress through the
              Parent Monitoring Dashboard and communicate with educators.
            </p>
          </div>
          <div className="feature-card">
            <img src={methodElephant} alt="OGA Method" />
            <h4>Orton-Gillingham Approach (OGA) Principles Learning Path</h4>
            <p>
              A structured, sequential, and cumulative teaching method that
              breaks down words into sounds (phonemes) to help dyslexic students
              read better.
            </p>
          </div>
          <div className="feature-card">
            <img src={methodLion} alt="Personalized Path" />
            <h4>Personalized Learning Path</h4>
            <p>
              Adaptive assessments and exercises tailored to the students
              progress. AI prescriptive data analytics to track performance and
              recommend areas for improvement.
            </p>
          </div>
        </div>
      </section>

      {/* ---- WHY CHOOSE LITEREXIA SECTION ---- */}
      <section className="why-literexia-section" id="why Choose">
        <h2 className="why-literexia-heading">Why choose Literexia?</h2>

        {/* Centered laptop image */}
        <div className="why-laptop-wrapper">
          <img
            src={laptopPenguin}
            alt="Laptop with Penguin"
            className="why-laptop-image"
          />
        </div>

        {/* Four-star features */}
        <div className="why-literexia-grid">
          <div className="why-card">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Progress Tracking &amp; Performance Dashboard</h4>
            <p>
              Teachers and parents can monitor student progress through
              detailed reports and insights.
            </p>
          </div>

          <div className="why-card">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Prescriptive Data Analytics for Personalized Learning</h4>
            <p>
              Monitors reading progress and identifies weaknesses. Recommends
              personalized learning paths based on student data. Generates
              insights for teachers to optimize reading activities plans.
            </p>
          </div>

          <div className="why-card">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Interactive Learning Activities</h4>
            <p>
              Word recognition, phonics, and comprehension games. Repetitive
              but engaging exercises to reinforce learning.
            </p>
          </div>

          <div className="why-card">
            <img src={starIcon} alt="Star Icon" className="why-star" />
            <h4>Dyslexia-Friendly Features &amp; Accessibility</h4>
            <p>
              Customizable fonts (Dyslexie, OpenDyslexic, etc.) for better
              readability. Adjustable word spacing &amp; background colors to
              reduce visual stress. Text-to-speech (TTS) &amp; speech-to-text
              (STT) for auditory support.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Homepage;
