import React from "react";
import { useNavigate } from "react-router-dom";
import postOfficeImage from "../images/LARGEIDPHOTOInterior-Design-Gensler-Old-Chicago-Post-Office-idx201101_ge01-11.20.jpg";
import "./HeroSection.css";

function HeroSection() {
  const navigate = useNavigate();

  const handleBrowseStore = () => {
    navigate("/buyinventory");
  };

  return (
    <div className="hero-section" style={{ backgroundImage: `url(${postOfficeImage})` }}>
      <h1>Online Shipping Made Easy</h1>
      <p>Use our service to pay for postage, track packages, and shop supplies.</p>
      <button onClick={handleBrowseStore}>Browse Store</button>
    </div>
  );
}

export default HeroSection;
