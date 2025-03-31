import React, { useEffect, useState } from 'react';
import './Reports.css';

const Reports = () => {
    const [packagesDelivered, setPackagesDelivered] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        fetch(`${BASE_URL}/reports/deliveries-by-driver`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPackagesDelivered(data);
                    

                    const uniqueDrivers = [...new Set(data.map(d => d.DriverName))].sort();
                    setDrivers(uniqueDrivers);

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
                }
            }).catch(err => {
                console.error("❌ Error fetching data:", err);
                setPackagesDelivered([]);
                setDrivers([]);
                setVehicles([]);
            });
    }, []);

    const filteredPackages = packagesDelivered.filter(pkg =>
        (selectedDriver === '' || pkg.DriverName === selectedDriver) &&
        (selectedVehicle === '' || pkg.License_plate === selectedVehicle)
    );

    const totalCost = filteredPackages.reduce((sum, p) => sum + parseFloat(p.Shipping_Cost || 0), 0);
    const totalMinutes = filteredPackages.reduce((sum, p) => sum + parseFloat(p.AvgDeliveryDurationMinutes || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.round(totalMinutes % 60);

    return (
        <div className="reports-container">
            <h2> Post Office Reports</h2>
            <div className="filter-container">
                <label>Select Driver:</label>
                <select onChange={(e) => {
                    setSelectedDriver(e.target.value);
                    setSelectedVehicle('');
                }} value={selectedDriver}>
                    <option value="">All Drivers</option>
                    {drivers.map((d, i) => (
                        <option key={i} value={d}>{d}</option>
                    ))}
                </select>

                {selectedDriver && (
                    <>
                        <label>Vehicle:</label>
                        <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                            <option value="">All Vehicles</option>
                            {vehicles.filter(v => v.driver === selectedDriver).map((v, i) => (
                                <option key={i} value={v.license_plate}>
                                    {v.fuel} ({v.license_plate})
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            {filteredPackages.length === 0 ? (
                <p>No package delivery data available.</p>
            ) : (
                <table className="excel-style-table">
                    <thead>
                        <tr>
                            <th> Driver</th>
                            <th> Vehicle</th>
                            <th> Package</th>
                            <th> Delivered On</th>
                            <th> Destination</th>
                            <th> Shipping Cost</th>
                            <th> Delivery Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPackages.map((pkg, i) => (
                            <tr key={i}>
                                <td>{pkg.DriverName}</td>
                                <td>{pkg.Fuel_type} ({pkg.License_plate})</td>
                                <td>{pkg.DeliveryDetails?.match(/Package\s(\d+)/)?.[0] || 'Package'}</td>
                                <td>{new Date(pkg.DeliveryDetails?.match(/\d{4}-\d{2}-\d{2}/)?.[0]).toDateString()}</td>
                                <td>{pkg.PostOffice || "Unknown"}</td>
                                <td>${Number(pkg.Shipping_Cost).toFixed(2)}</td>
                                <td>{pkg.AvgDeliveryDurationMinutes ? `${Math.floor(pkg.AvgDeliveryDurationMinutes / 60)}h ${pkg.AvgDeliveryDurationMinutes % 60}m` : "N/A"}</td>
                            </tr>
                        ))}
                        <tr className="summary-row">
                            <td colSpan="5"><strong>Total</strong></td>
                            <td><strong>${totalCost.toFixed(2)}</strong></td>
                            <td><strong>{totalHours}h {remainingMinutes}m</strong></td>
                        </tr>
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Reports;
