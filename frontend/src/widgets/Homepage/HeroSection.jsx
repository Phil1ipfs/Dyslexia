import React from 'react';
import "../css/Homepage.css";  
import penguin from '../../assets/images/penguin.png';
import clouds from '../../assets/images/clouds.png';

function HeroSection() {
  return (
    <section className="hero-section">
      <img src={clouds} className="clouds-bg" alt="Clouds" />
      <div className="hero-left">
        <h2>Learn Tagalog for Kids</h2>
        <p>
          Kids love learning Tagalog with fun videos, interactive games, catchy songs,
          engaging books, and printable worksheets in Filipino for children!
        </p>
        <button className="register-btn">Register</button>
      </div>
      <img src={penguin} className="penguin-float" alt="Penguin Mascot" />
    </section>
  );
}

export default HeroSection;
