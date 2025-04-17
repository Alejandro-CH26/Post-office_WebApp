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
            placeholder="Enter Tracking Number(s)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={handleSearch}>🔍</button>
        </div>

        
      </div>
    </div>
  );
}

export default SearchPackage;
