import React, { useEffect, useState } from 'react';

const Reports = () => {
    const [packagesDelivered, setPackagesDelivered] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [drivers, setDrivers] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/reports/deliveries-by-driver')
            .then(response => response.json())
            .then(data => {
                console.log("📦 API Response:", data);  
                
                if (Array.isArray(data)) {
                    setPackagesDelivered(data);

                    const uniqueDrivers = [...new Set(data.map(d => 
                        `${d.DriverName || "Unknown"} - ${d.Fuel_type || "Unknown"} (${d.License_plate || "No Plate"})`
                    ))];

                    setDrivers(uniqueDrivers);
                } else {
                    console.error("❌ API did not return an array!");
                    setPackagesDelivered([]);  
                    setDrivers([]);
                }
            })
            .catch(error => {
                console.error('❌ Error fetching delivery reports:', error);
                setPackagesDelivered([]); 
                setDrivers([]);
            });
    }, []);
    
    return (
        <div className="reports-container">
            <h2>📊 Post Office Reports</h2>
            <br />
            {/* Dropdown to Select Driver */}
            <div className="filter-container">
                <label>Select Driver & Vehicle:</label>
                <select onChange={(e) => setSelectedDriver(e.target.value)} value={selectedDriver}>
                    <option value="">All Drivers</option>
                    {drivers.map((driver, index) => (
                        <option key={index} value={driver}>{driver}</option>
                    ))}
                </select>
            </div>

            <div className="reports-grid">
                {/* Packages Delivered */}
                <div className="report-box">
                    <h3> Deliveries Per Driver</h3>
                    {packagesDelivered.length === 0 ? (
                        <p>No package delivery data available.</p>
                    ) : (
                        <div>
                            {packagesDelivered.map((report, index) => (
                                <p key={index}>
                                    <strong> 📦 {report.DeliveryDetails || "No Package Info"}</strong>
                                    <br />
                                    <strong>🚚 Delivered by: 
                                    <br />
                                    {report.DriverName || "Unknown"} using {report.Fuel_type || "Unknown"} ({report.License_plate || "No Plate"})</strong>
                                    <br />
                                    <strong>📍 Delivered to:</strong> {report.PostOffice || "Unknown"}
                                    <br />
                                    <br />
                                    <strong>💰 Shipping Cost:</strong> ${report.Shipping_Cost ? Number(report.Shipping_Cost).toFixed(2) : "N/A"}
                                    <br />
                                    <br />
                                    <strong>⏳ Delivery Duration:</strong> {report.AvgDeliveryDurationMinutes ? `${Math.floor(report.AvgDeliveryDurationMinutes / 60)} hours ${report.AvgDeliveryDurationMinutes % 60} minutes` : "N/A"}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
