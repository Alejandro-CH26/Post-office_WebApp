import React, { useEffect, useState } from 'react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchUpdates = () => {
            fetch('http://localhost:5000/tracking-updates')
                .then(response => response.json())
                .then(data => setNotifications(data))
                .catch(error => console.error('Error fetching tracking updates:', error));
        };
    
        fetchUpdates(); 
        const interval = setInterval(fetchUpdates, 10000); 
    
        return () => clearInterval(interval); 
    }, []);
    

    return (
<div className="notifications-container">
    <h2>Tracking Notifications</h2>
    {notifications.length === 0 ? (
        <p>No tracking updates available.</p>
    ) : (
        <ul>
            {notifications.map((update, index) => (
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
