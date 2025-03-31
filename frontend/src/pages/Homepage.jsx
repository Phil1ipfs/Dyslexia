import React from "react";
import Navbar from "../widgets/Homepage/Navbar";
import HeroSection from "../widgets/Homepage/HeroSection";
import AboutSection from "../widgets/Homepage/AboutSection";
import FeaturesSection from "../widgets/Homepage/Features";


const Homepage = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
    </>
  );
};

export default Homepage;
