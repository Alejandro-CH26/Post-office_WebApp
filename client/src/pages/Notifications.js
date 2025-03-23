import React, { useEffect, useState } from 'react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        const fetchUpdates = () => {
            fetch('http://localhost:5000/tracking-updates')
                .then(response => response.json())
                .then(data => {
                    setNotifications(data);
                })
                .catch(error => console.error('Error fetching tracking updates:', error));
        };
    
        fetchUpdates(); 
        const interval = setInterval(fetchUpdates, 10000); 
    
        return () => clearInterval(interval); 
    }, []);

    // Update filtered list whenever filters or notifications change
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

    // Get unique Package IDs and Statuses for dropdowns
    const uniquePackageIds = [...new Set(notifications.map(update => update.Package_ID))];
    const uniqueStatuses = [...new Set(notifications.map(update => update.status))];

    return (
        <div className="notifications-container">
            <h2>Tracking History</h2>

            <div className="filter-bar" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
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
                <ul>
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
