import React from "react";
import "../../css/Homepage/Homepage.css";
import phoneIcon from "../../assets/icons/feature-phone.png";
import aiIcon from "../../assets/icons/ai.png";
import flagIcon from "../../assets/icons/flag.png";
import pathIcon from "../../assets/icons/path.png";
import bearIcon from "../../assets/icons/bear.png";

function Features() {
  return (
    <section className="features-section">
      <h2 className="features-heading">What does “Literexia” include?</h2>
      <div className="features-grid">
        <div className="feature-card">
          <img src={phoneIcon} alt="Mobile and Web App" />
          <h4>Mobile and Web Application</h4>
          <p>
            Mobile App for students to access interactive reading exercises and
            AI-assisted learning. Web Platform for teachers and parents to monitor
            student progress and customize learning activities.
          </p>
        </div>
        <div className="feature-card">
          <img src={aiIcon} alt="AI Chatbot" />
          <h4>Mobile and Web Application</h4>
          <p>
            Provides real-time feedback and guidance for students struggling with
            reading exercises. Helps answer student queries and improves engagement
            in learning activities.
          </p>
        </div>
        <div className="feature-card">
          <img src={flagIcon} alt="Filipino Language-Based Learning" />
          <h4>Filipino Language-Based Learning</h4>
          <p>
            Focuses on reading comprehension in Filipino, addressing the gap in
            dyslexia-friendly Filipino learning resources.
          </p>
        </div>
        <div className="feature-card">
          <img src={pathIcon} alt="Personalized Path" />
          <h4>Personalized Learning Path</h4>
          <p>
            Adaptive assessments and exercises tailored to the student's progress.
            AI-powered predictive data analytics to track performance and suggest
            areas for improvement.
          </p>
        </div>
      </div>
      <img src={bearIcon} alt="Bear Mascot" className="bear-mascot" />
    </section>
  );
}

export default Features;
