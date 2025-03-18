import React, { useEffect, useState } from 'react';

const Reports = () => {
    const [packagesDelivered, setPackagesDelivered] = useState([]);
    const [customersRegistered, setCustomersRegistered] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/reports/packages-delivered')
            .then(response => response.json())
            .then(data => setPackagesDelivered(data))
            .catch(error => console.error('Error fetching package reports:', error));

        fetch('http://localhost:5000/reports/customers-registered')
            .then(response => response.json())
            .then(data => setCustomersRegistered(data))
            .catch(error => console.error('Error fetching customer reports:', error));
    }, []);

    return (
        <div className="reports-container">
            <h2>📊 Post Office Reports</h2>
            
            <div className="reports-grid">
                {/* Packages Delivered */}
                <div className="report-box">
                    <h3>📦 Packages Delivered Per Location</h3>
                    {packagesDelivered.length === 0 ? (
                        <p>No package delivery data available.</p>
                    ) : (
                        <div>
                            {packagesDelivered.map((report, index) => (
                                <p key={index}>
                                  <strong> {report.PostOffice}</strong>
                                  <span> • {report.TotalDelivered} Packages Delivered</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* Customers Registered */}
                <div className="report-box">
                    <h3>👤 Customers Registered Per Location</h3>
                    {customersRegistered.length === 0 ? (
                        <p>No customer registration data available.</p>
                    ) : (
                        <ul>
                            {customersRegistered.map((report, index) => (
                                <p key={index}>
                                  <strong> {report.PostOffice}</strong> 
                                  <span> • {report.TotalCustomers} Customers Registered</span>
                                </p>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
