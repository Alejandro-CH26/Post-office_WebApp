import React, { useEffect, useState } from 'react';
import '../styling/Reports.css';

const Reports = () => {
    const [packagesDelivered, setPackagesDelivered] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/reports/deliveries-by-driver')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPackagesDelivered(data);
                    console.log("📦 Raw Package Data:", data);

                    // Get unique drivers
                    const uniqueDrivers = [...new Set(data.map(d => d.DriverName))].sort();
                    setDrivers(uniqueDrivers);

                    // Store vehicles with associated driver
                    const uniqueVehicles = [];
                    const seen = new Set();
                    data.forEach(d => {
                        const key = `${d.DriverName}-${d.License_plate}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            uniqueVehicles.push({
                                driver: d.DriverName,
                                license_plate: d.License_plate,
                                fuel: d.Fuel_type
                            });
                        }
                    });
                    setVehicles(uniqueVehicles);
                } else {
                    console.error("❌ API did not return an array!");
                    setPackagesDelivered([]);
                    setDrivers([]);
                    setVehicles([]);
                }
            })
            .catch(error => {
                console.error('❌ Error fetching delivery reports:', error);
                setPackagesDelivered([]);
                setDrivers([]);
                setVehicles([]);
            });
    }, []);

    // Group data by driver + vehicle
    const groupedReports = (() => {
        const grouped = {};

        packagesDelivered
            .filter(pkg =>
                (selectedDriver === '' || pkg.DriverName === selectedDriver) &&
                (selectedVehicle === '' || pkg.License_plate === selectedVehicle)
            )
            .forEach(pkg => {
                const key = `${pkg.DriverName}-${pkg.License_plate}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        driver: pkg.DriverName,
                        fuel: pkg.Fuel_type,
                        plate: pkg.License_plate,
                        packages: []
                    };
                }
                grouped[key].packages.push(pkg);
            });

        return Object.values(grouped);
    })();

    return (
        <div className="reports-container">
            <h2>📊 Post Office Reports</h2>
            <br />
            
            {/* Filters */}
            <div className="filter-container">
                <label>Select Driver:</label>
                <select onChange={(e) => {
                    setSelectedDriver(e.target.value);
                    setSelectedVehicle('');
                }} value={selectedDriver}>
                    <option value="">All Drivers</option>
                    {drivers.map((driver, index) => (
                        <option key={index} value={driver}>{driver}</option>
                    ))}
                </select>

                {selectedDriver && (
                    <>
                        <label>Currently Showing:</label>
                        <select onChange={(e) => setSelectedVehicle(e.target.value)} value={selectedVehicle}>
                            <option value="">All Vehicles</option>
                            {vehicles
                                .filter(v => v.driver === selectedDriver)
                                .map((v, index) => (
                                    <option key={index} value={v.license_plate}>
                                        {v.fuel} ({v.license_plate})
                                    </option>
                                ))}
                        </select>
                    </>
                )}
            </div>

            <div className="reports-grid">
                {groupedReports.length === 0 ? (
                    <p>No package delivery data available.</p>
                ) : (
                    groupedReports.map((group, index) => (
                        <div key={index} className="report-box">
                            <h3>🚚 {group.driver} using {group.fuel} ({group.plate})</h3>
                            {group.packages.map((pkg, i) => (
                                <div key={i} className="package-entry">
                                <strong>📦 {pkg.DeliveryDetails?.match(/Package\s(\d+)/)?.[0] || 'Package'} - Delivered on {new Date(pkg.DeliveryDetails?.match(/\d{4}-\d{2}-\d{2}/)?.[0]).toDateString() || 'N/A'}</strong>
                                    <br />
                                    <strong>📍 Delivered to:</strong> {pkg.PostOffice || "Unknown"}
                                    <br />
                                    <strong>💰 Shipping Cost:</strong> ${pkg.Shipping_Cost ? Number(pkg.Shipping_Cost).toFixed(2) : "N/A"}
                                    <br />
                                    <strong>⏳ Delivery Duration:</strong> {pkg.AvgDeliveryDurationMinutes ? `${Math.floor(pkg.AvgDeliveryDurationMinutes / 60)} hours ${pkg.AvgDeliveryDurationMinutes % 60} minutes` : "N/A"}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Reports;
