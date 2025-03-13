import React from "react";
import postOfficeImage from "../images/LARGEIDPHOTOInterior-Design-Gensler-Old-Chicago-Post-Office-idx201101_ge01-11.20.jpg"; // ✅ Import image
import "./HeroSection.css"; 

function HeroSection() {
  return (
    <div className="hero-section" style={{ backgroundImage: `url(${postOfficeImage})` }}>
      <h1>Online Shipping Made Easy</h1>
      <p>Use our service to pay for postage, print your own labels, and schedule a pickup.</p>
      <button>Print a Label</button>
      <button>Schedule a Pickup</button>
    </div>
  );
}

export default HeroSection;
