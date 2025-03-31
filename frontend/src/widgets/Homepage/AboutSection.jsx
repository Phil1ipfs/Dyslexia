import React, { Component } from "react";
import phones from "../../assets/images/phones.png"; 

class AboutSection extends Component {
  render() {
    return (
      <section className="about-section">
        <img src={phones} className="phones-img" alt="App preview" />
        <div className="about-text">
          <h3>Best Tagalog learning website and app for kids!</h3>
          <p>
            Ang Literexia ay isang makabagong mobile app na tumutulong sa mga mag-aaral na may dyslexia sa kanilang
            paglalakbay sa pagbabasa sa pamamagitan ng interactive na mga aralin, isinapersonal na pagtuturo, at masayang
            pagsusuri upang mapabuti ang kanilang kasanayan sa pagbasa.
          </p>
        </div>
      </section>
    );
  }
}

export default AboutSection;
