import React, { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styling/Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const lastSeenIdRef = useRef(0);
    const shownIdsRef = useRef(new Set());


    useEffect(() => {
        const fetchUpdates = () => {
            fetch(`http://localhost:5000/tracking-updates?sinceId=${lastSeenIdRef.current}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    data.forEach(update => {
                        if (!shownIdsRef.current.has(update.tracking_history_ID)) {
                          toast.info(`📦 Package #${update.Package_ID}: ${update.status}`);
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
            })
                .catch(error => console.error('Error fetching tracking updates:', error));
        };

        fetchUpdates();
        const interval = setInterval(fetchUpdates, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = notifications;

        if (selectedPackageId) {
            filtered = filtered.filter(update => update.Package_ID === parseInt(selectedPackageId));
        }

        if (selectedStatus) {
            filtered = filtered.filter(update => update.status === selectedStatus);
        }

        setFilteredNotifications(filtered);
    }, [notifications, selectedPackageId, selectedStatus]);

    const uniquePackageIds = [...new Set(notifications.map(update => update.Package_ID))];
    const uniqueStatuses = [...new Set(notifications.map(update => update.status))];
    /*
    const triggerMockNotification = () => {
        fetch('http://localhost:5000/mock-notification', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("✅ Mock notification inserted.");
            } else {
                console.error("❌ Mock failed", data);
            }
        })
        .catch(error => console.error('Error triggering mock:', error));
    };*/
    
    return (
        <div className="notifications-container">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar />
            <div className="notifications-header">
            <h2>Tracking History</h2>
            {/*
            <button onClick={triggerMockNotification} className="mock-btn">
                🔧 Trigger Mock Notification
            </button>
            */}
            </div>



            <div className="filter-bar">
                <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                >
                    <option value="">All Packages</option>
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

            {filteredNotifications.length === 0 ? (
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

export default Notifications;
