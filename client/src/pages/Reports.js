import React, { useEffect, useState } from 'react';
import './Reports.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PackageReport = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    status: ''
  });

  useEffect(() => {
    fetch(`${BASE_URL}/reports/packages-summary`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("❌ Failed to fetch package data:", err));
  }, []);

  const filtered = data.filter(pkg => {
    const status = pkg.current_status?.toLowerCase();
    const timestamp = pkg.status_timestamp ? new Date(pkg.status_timestamp) : null;

    const matchStatus = !filters.status || status === filters.status;
    const matchFrom = !filters.from || (timestamp && timestamp >= new Date(filters.from));
    const matchTo = !filters.to || (timestamp && timestamp <= new Date(filters.to));

    return matchStatus && matchFrom && matchTo;
  });

  const totalCost = filtered.reduce((sum, p) => sum + parseFloat(p.shipping_cost || 0), 0).toFixed(2);

  return (
    <div className="package-report-wrapper">
      <h1>Packages Report</h1>

      {/* Filters */}
      <div className="package-filters">
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
        />
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="delivered">Delivered</option>
          <option value="in transit">In Transit</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Table */}
      <div className="report-table-wrapper">
        <table className="package-report-table">
          <thead>
            <tr>
              <th>Package ID</th>
              <th>Status</th>
              <th>Destination</th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Shipping Cost</th>
              <th>Status Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((pkg, i) => (
                <tr key={i}>
                  <td>{pkg.package_ID}</td>
                  <td>{pkg.current_status}</td>
                  <td>{pkg.PostOffice || "—"}</td>
                  <td>{pkg.DriverName || "—"}</td>
                  <td>{pkg.Vehicle || "—"}</td>
                  <td>${parseFloat(pkg.shipping_cost || 0).toFixed(2)}</td>
                  <td>{pkg.status_timestamp ? new Date(pkg.status_timestamp).toLocaleString() : "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No package data found.
                </td>
              </tr>
            )}
            <tr className="summary-row">
              <td colSpan="5"><strong>Total</strong></td>
              <td><strong>${totalCost}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackageReport;
