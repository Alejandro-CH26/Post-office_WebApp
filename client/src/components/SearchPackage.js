import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchPackage.css";

function SearchPackage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      navigate(`/trackpackage?number=${encodeURIComponent(trackingNumber.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="search-package">
      <h2 className="search-title">Search or Track Packages</h2>

      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search USPS.com or Enter Tracking Number(s)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={handleSearch}>🔍</button>
        </div>

        <div className="features">
          <a href="https://www.usps.com/ship/" className="feature-button">
            <span className="icon">📦</span>
            <p><strong>Click-N-Ship®</strong><br />Pay for and print shipping labels.</p>
          </a>
          <a href="https://www.usps.com/shop/" className="feature-button">
            <span className="icon">📬</span>
            <p><strong>Stamps & Supplies</strong><br />Forever® Stamps: $0.73</p>
          </a>
          <a href="https://informeddelivery.usps.com" className="feature-button">
            <span className="icon">📨</span>
            <p><strong>Informed Delivery®</strong><br />Digitally preview your incoming mail.</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default SearchPackage;
