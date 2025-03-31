import React, { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './TrackPackage.css';

const TrackPackage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('none'); // default is "Select a Package"
  const [selectedStatus, setSelectedStatus] = useState('');
  const lastSeenIdRef = useRef(0);
  const shownIdsRef = useRef(new Set());
  const isInitialLoad = useRef(true);

  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchUpdates = () => {
      const customerId = localStorage.getItem("customer_ID");
      if (!customerId) return;

      fetch(`${BASE_URL}/tracking-updates?sinceId=${lastSeenIdRef.current}&customerId=${customerId}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            data.forEach(update => {
              if (!shownIdsRef.current.has(update.tracking_history_ID)) {
                if (!isInitialLoad.current) {
                  toast.info(`📦 Package #${update.Package_ID}: ${update.status}`);
                }
                shownIdsRef.current.add(update.tracking_history_ID);
              }
            });

            setNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.tracking_history_ID));
              const newUnique = data.filter(n => !existingIds.has(n.tracking_history_ID));
              return [...newUnique, ...prev];
            });

            const highestId = Math.max(...data.map(d => d.tracking_history_ID));
            lastSeenIdRef.current = highestId;
          }

          isInitialLoad.current = false;
        })
        .catch(error => console.error('Error fetching tracking updates:', error));
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = notifications;

    if (selectedPackageId !== 'none' && selectedPackageId !== 'all') {
      filtered = filtered.filter(update => update.Package_ID === parseInt(selectedPackageId));
    }

    if (selectedStatus) {
      filtered = filtered.filter(update => update.status === selectedStatus);
    }

    setFilteredNotifications(filtered);
  }, [notifications, selectedPackageId, selectedStatus]);

  const uniquePackageIds = [...new Set(notifications.map(update => update.Package_ID))];
  const uniqueStatuses = [...new Set(notifications.map(update => update.status))];

  return (
    <div className="notifications-container">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />
      
      <div className="notifications-header">
        <h2>Tracking History</h2>
      </div>

      <div className="filter-bar">
        <select
          value={selectedPackageId}
          onChange={(e) => setSelectedPackageId(e.target.value)}
        >
          <option value="none">Select a Package</option>
          <option value="all">All Packages</option>
          {uniquePackageIds.map(id => (
            <option key={id} value={id}>Package #{id}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {selectedPackageId === 'none' ? (
        <p>Please select a package to view its tracking history.</p>
      ) : filteredNotifications.length === 0 ? (
        <p>No tracking updates available.</p>
      ) : (
        <ul className="notification-list">
          {filteredNotifications.map((update, index) => (
            <li key={index} className="notification-item">
              📦 <strong>Package #{update.Package_ID}</strong>: {update.status}
              <br />
              🕒 <small>{new Date(update.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrackPackage;
