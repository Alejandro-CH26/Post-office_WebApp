import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './TrackPackage.css';

const TrackPackage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResults, setTrackingResults] = useState([]);
  const [sentPackages, setSentPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [view, setView] = useState('receiving');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const isLoggedIn = !!localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const customerId = localStorage.getItem("customer_ID");
  const location = useLocation();

  useEffect(() => {
    if (view === 'sending' && isLoggedIn && role === "customer" && customerId) {
      fetch(`${BASE_URL}/customer-sent-packages?customerId=${customerId}`)
        .then(res => res.json())
        .then(data => {
          const unique = Array.isArray(data)
            ? Object.values(
                data.reduce((acc, curr) => {
                  acc[curr.Package_ID] = curr;
                  return acc;
                }, {})
              )
            : [];
          setSentPackages(unique);
        })
        .catch(err => console.error("Error fetching sent packages:", err));
    }
  }, [view, isLoggedIn, role, customerId, BASE_URL]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromURL = params.get("number");

    if (fromURL) {
      setTrackingNumber(fromURL);
      handleTrack(fromURL);
      setView("receiving");
    }
  }, [location.search]);

  const handleTrack = async (overrideId = null) => {
    const packageId = overrideId || trackingNumber;
    if (!packageId) {
      setErrorMessage('Please enter or select a tracking number.');
      setTrackingResults([]);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setTrackingResults([]);
    setShowFullHistory(false);

    try {
      const response = await fetch(`${BASE_URL}/tracking-history?packageId=${packageId}`);
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setErrorMessage('No tracking history found for that number.');
      } else {
        setTrackingResults(data);
      }
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      setErrorMessage('Failed to fetch tracking history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === 'sending') {
      setTrackingResults([]);
      setErrorMessage('');
      setTrackingNumber('');
      setShowFullHistory(false);
    }
  };

  const toggleHistory = () => setShowFullHistory(prev => !prev);

  const visibleUpdates = showFullHistory ? trackingResults : trackingResults.slice(-1);

  const sortedPackages = [...sentPackages]
    .filter(pkg => pkg.Package_ID.toString().includes(searchQuery))
    .sort((a, b) => {
      const dateA = new Date(a.sent_date);
      const dateB = new Date(b.sent_date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Track a Package</h2>
      </div>

      {isLoggedIn && role === "customer" && (
        <div className="tab-toggle">
          <button
            onClick={() => handleViewChange("receiving")}
            className={view === "receiving" ? "active-tab" : ""}
          >
            Receiving
          </button>
          <button
            onClick={() => handleViewChange("sending")}
            className={view === "sending" ? "active-tab" : ""}
          >
            Sending
          </button>
        </div>
      )}

      {view === "receiving" && (
        <div className="tracking-form">
          <input
            type="text"
            placeholder="Enter tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <button onClick={() => handleTrack()}>Track</button>
        </div>
      )}

      {view === "sending" && (
        <>
          <div className="tracking-form">
            <input
              type="text"
              placeholder="Search by tracking number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {sortedPackages.length === 0 ? (
            <p>No packages found that you’ve sent.</p>
          ) : (
            <ul className="notification-list">
              {sortedPackages.map((pkg) => (
                <li key={pkg.Package_ID} className="notification-item">
                  <strong>Package #{pkg.Package_ID}</strong>
                  <p>
                    Destination:{" "}
                    {pkg.address_Street && pkg.destination_city && pkg.destination_state && pkg.destination_zip
                      ? `${pkg.address_Street}, ${pkg.destination_city}, ${pkg.destination_state} ${pkg.destination_zip}`
                      : "Unknown"}
                  </p>
                  <p>
                    Sent:{" "}
                    {pkg.sent_date
                      ? new Date(pkg.sent_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <button
                    className="toggle-button"
                    onClick={() => {
                      setTrackingNumber(pkg.Package_ID);
                      handleViewChange("receiving");
                      handleTrack(pkg.Package_ID);
                    }}
                  >
                    View Tracking
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {loading && <p>Loading tracking history...</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {trackingResults.length > 0 && (
        <>
          <button onClick={toggleHistory} className="toggle-button">
            {showFullHistory ? 'Show Latest Only' : 'Show Full History'}
          </button>

          <ul className="notification-list">
            {visibleUpdates.map((update, index) => (
              <li key={index} className="notification-item">
                <strong>Package #{update.package_ID}</strong>{" "}
                {(update.status === "Delivered" || update.status === "At Warehouse") ? (
                  update.location_name
                    ? `${update.status} (${update.location_name})`
                    : update.address_City
                      ? `${update.status} (${update.address_City}, ${update.address_State} ${update.address_Zipcode})`
                      : update.status
                ) : update.status}
                <br />
                <small>{new Date(update.timestamp).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="bottom-spacer" />
    </div>
  );
};

export default TrackPackage;
