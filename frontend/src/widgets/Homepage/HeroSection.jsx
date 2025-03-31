import React from "react";
import "../../css/Homepage/Homepage.css";
import "../../css/Homepage/responsive.css";

import heroImage from "../../assets/images/Group 4076.png"; 

const HeroSection = () => {
  return (
    <section
      className="hero-section"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
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
  );
};

export default HeroSection;
