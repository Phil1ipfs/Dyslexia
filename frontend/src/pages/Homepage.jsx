import React from 'react';
import '../styles/homepage.css';

function Homepage() {
  return (
    <div className="homepage">
      <header className="homepage-header">
        <h1>Dyslexia App</h1>
        <p>Empowering young minds through better reading support.</p>
      </header>

      <main className="homepage-content">
        <section className="features">
          <div className="card">
            <h2>Personalized Lessons</h2>
            <p>Interactive and adaptive reading exercises tailored to each child.</p>
          </div>
          <div className="card">
            <h2>Progress Tracking</h2>
            <p>Real-time feedback and analytics to monitor reading improvements.</p>
          </div>
          <div className="card">
            <h2>Teacher Support</h2>
            <p>Tools for teachers to manage students and review progress easily.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Homepage;
