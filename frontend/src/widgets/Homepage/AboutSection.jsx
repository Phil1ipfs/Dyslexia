import React, { Component } from "react";
import "../../css/Homepage/Homepage.css";
import phones from "../../assets/images/phone.png"; 

class AboutSection extends Component {
  render() {
    return (
        <section className="about-section">
        <div className="about-container">
          <img src={phones} className="about-image" alt="App preview" />
          <div className="about-text">
            <h3 className="about-heading">
              Best Tagalog learning website and app for kids!
            </h3>
            <p className="about-description">
              Ang Literexia ay isang makabagong mobile app na tumutulong sa mga mag-aaral na may dyslexia sa kanilang
              paglalakbay sa pagbabasa sa pamamagitan ng interactive na mga aralin, isinapersonal na pagtuturo, at masayang
              pagsusuri upang mapabuti ang kanilang kasanayan sa pagbasa.
            </p>
          </div>
        </div>
      </section>
      
    );
  }
}

export default AboutSection;
