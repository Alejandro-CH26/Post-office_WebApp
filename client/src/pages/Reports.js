import React, { useEffect, useState } from 'react';
import './Reports.css';

const Reports = () => {
    const [packagesDelivered, setPackagesDelivered] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [viewMode, setViewMode] = useState('driver'); // NEW
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
    }, [BASE_URL]);

    const filteredPackages = packagesDelivered.filter(pkg => {
        const deliveryDateMatch = pkg.DeliveryDetails?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
        const deliveryDate = deliveryDateMatch ? new Date(deliveryDateMatch) : null;

        const matchesDriver = selectedDriver === '' || pkg.DriverName === selectedDriver;
        const matchesVehicle = selectedVehicle === '' || pkg.License_plate === selectedVehicle;
        const matchesStart = !startDate || (deliveryDate && deliveryDate >= new Date(startDate));
        const matchesEnd = !endDate || (deliveryDate && deliveryDate <= new Date(endDate));

        return matchesDriver && matchesVehicle && matchesStart && matchesEnd;
    });

    const totalCost = filteredPackages.reduce((sum, p) => sum + parseFloat(p.Shipping_Cost || 0), 0);
    let totalMinutes = filteredPackages.reduce((sum, p) => sum + parseFloat(p.AvgDeliveryDurationMinutes || 0), 0);
    totalMinutes = Math.round(totalMinutes);
    let totalHours = Math.floor(totalMinutes / 60);
    let remainingMinutes = totalMinutes % 60;

    // Group packages by Post Office
    const revenueByPostOffice = {};
    filteredPackages.forEach(pkg => {
        const office = pkg.PostOffice || 'Unknown';
        if (!revenueByPostOffice[office]) {
            revenueByPostOffice[office] = { count: 0, revenue: 0 };
        }
        revenueByPostOffice[office].count++;
        revenueByPostOffice[office].revenue += parseFloat(pkg.Shipping_Cost || 0);
    });

    return (
        <div className="reports-container">
            <h2>Post Office Reports</h2>

            {/* Toggle View Mode */}
            <div class="view-buttons">
            <div style={{ marginBottom: '1rem' }}>
                <button onClick={() => setViewMode('driver')} disabled={viewMode === 'driver'}>
                    Driver View
                </button>
                <button onClick={() => setViewMode('revenue')} disabled={viewMode === 'revenue'} style={{ marginLeft: '1rem' }}>
                    Revenue View
                </button>
            </div>
            </div>
            {/* Filters */}
            {viewMode === 'driver' && (
                <div className="filter-container">
                    <div className="filter-group">
                        <label>Start Date:</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label>End Date:</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label>Select Driver:</label>
                        <select
                            onChange={(e) => {
                                setSelectedDriver(e.target.value);
                                setSelectedVehicle('');
                            }}
                            value={selectedDriver}
                        >
                            <option value="">All Drivers</option>
                            {drivers.map((d, i) => (
                                <option key={i} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    {selectedDriver && (
                        <div className="filter-group">
                            <label>Vehicle:</label>
                            <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                                <option value="">All Vehicles</option>
                                {vehicles.filter(v => v.driver === selectedDriver).map((v, i) => (
                                    <option key={i} value={v.license_plate}>
                                        {v.fuel} ({v.license_plate})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Tables */}
            {viewMode === 'driver' ? (
                filteredPackages.length === 0 ? (
                    <p>No package delivery data available.</p>
                ) : (
                    <table className="excel-style-table">
                        <thead>
                            <tr>
                                <th>Driver</th>
                                <th>Vehicle</th>
                                <th>Package</th>
                                <th>Delivered On</th>
                                <th>Destination</th>
                                <th>Shipping Cost</th>
                                <th>Delivery Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPackages.map((pkg, i) => {
                                const minutes = Math.round(pkg.AvgDeliveryDurationMinutes || 0);
                                const hours = Math.floor(minutes / 60);
                                const mins = minutes % 60;
                                const deliveryDateStr = pkg.DeliveryDetails?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
                                const formattedDate = deliveryDateStr ? new Date(deliveryDateStr).toDateString() : "Unknown";

                                return (
                                    <tr key={i}>
                                        <td>{pkg.DriverName}</td>
                                        <td>Truck ({pkg.Vehicle_ID}) - {pkg.Fuel_type}</td>
                                        <td>{pkg.DeliveryDetails?.match(/Package\s(\d+)/)?.[0] || 'Package'}</td>
                                        <td>{formattedDate}</td>
                                        <td>{pkg.PostOffice || "Unknown"}</td>
                                        <td>${Number(pkg.Shipping_Cost).toFixed(2)}</td>
                                        <td>{minutes > 0 ? `${hours}h ${mins}m` : 'N/A'}</td>
                                    </tr>
                                );
                            })}
                            <tr className="summary-row">
                                <td colSpan="5"><strong>Total</strong></td>
                                <td><strong>${totalCost.toFixed(2)}</strong></td>
                                <td><strong>{totalHours}h {remainingMinutes}m</strong></td>
                            </tr>
                        </tbody>
                    </table>
                )
            ) : (
                <table className="excel-style-table">
                    <thead>
                        <tr>
                            <th>Post Office</th>
                            <th>Packages Delivered</th>
                            <th>Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(revenueByPostOffice).map(([office, data], i) => (
                            <tr key={i}>
                                <td>{office}</td>
                                <td>{data.count}</td>
                                <td>${data.revenue.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Reports;
