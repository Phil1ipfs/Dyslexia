import React, { Component } from "react";
import Navbar from "../widgets/Homepage/Navbar";       
import HeroSection from "../widgets/Homepage/HeroSection";
import AboutSection from "../widgets/Homepage/AboutSection";

class Homepage extends Component {
  render() {
    return (
      <div>
        <Navbar />
        <HeroSection />
        <AboutSection />
      </div>
    );
  }
}

export default Homepage;
