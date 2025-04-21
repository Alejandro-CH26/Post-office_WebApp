import React, { useEffect, useState } from 'react';
import './Reports.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PackageReport = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    status: '',
    postOffice: ''
  });

  useEffect(() => {
    fetch(`${BASE_URL}/reports/packages-summary`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to fetch package data:", err));
  }, []);

  const filtered = data
    .filter(pkg => {
      const status = pkg.current_status?.toLowerCase();
      const timestamp = pkg.status_timestamp ? new Date(pkg.status_timestamp) : null;

      const matchStatus = !filters.status || status === filters.status;
      const matchFrom = !filters.from || (timestamp && timestamp >= new Date(filters.from));
      const matchTo = !filters.to || (timestamp && timestamp <= new Date(filters.to));
      const matchPostOffice = !filters.postOffice || pkg.PostOfficeName === filters.postOffice;

      return matchStatus && matchFrom && matchTo && matchPostOffice;
    })
    .sort((a, b) => new Date(b.status_timestamp) - new Date(a.status_timestamp));

  const totalCost = filtered.reduce((sum, p) => sum + parseFloat(p.shipping_cost || 0), 0).toFixed(2);
  const totalLost = filtered.filter(p => p.current_status?.toLowerCase() === 'lost').length;
  const totalDelivered = filtered.filter(p => p.current_status?.toLowerCase() === 'delivered').length;
  const totalInTransit = filtered.filter(p => p.current_status?.toLowerCase() === 'in transit').length;

  const uniquePostOffices = [...new Set(data.map(p => p.PostOfficeName).filter(Boolean))];

  return (
    <div className="sales-report-wrapper">
      <h1 className="report-title">Packages Report</h1>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.postOffice}
          onChange={e => setFilters(f => ({ ...f, postOffice: e.target.value }))}
        >
          <option value="">All Locations</option>
          {uniquePostOffices.map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="at warehouse">At Warehouse</option>
          <option value="package created">Package Created</option>
          <option value="delivered">Delivered</option>
          <option value="in transit">In Transit</option>
          <option value="lost">Lost</option>
        </select>
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
      </div>

      {/* Summary */}
      <div className="report-summary-combined">
        <div className="summary-combined-box">
          <div>
            <p>Total Revenue</p>
            <h2>${totalCost}</h2>
          </div>
          <div>
            <p>Total Packages</p>
            <h2>{filtered.length}</h2>
          </div>
          <div>
            <p>Total Lost</p>
            <h2>{totalLost}</h2>
          </div>
          <div>
            <p>In Transit</p>
            <h2>{totalInTransit}</h2>
          </div>
          <div>
            <p>Delivered</p>
            <h2>{totalDelivered}</h2>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="report-table-wrapper">
        <table className="sales-report-table">
          <thead>
            <tr>
              <th>Package ID</th>
              <th>Status</th>
              <th>Location</th>
              <th>Employee</th>
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
                  <td>{pkg.Location || "—"}</td>
                  <td>{pkg.Employee || "—"}</td>
                  <td>${parseFloat(pkg.shipping_cost || 0).toFixed(2)}</td>
                  <td>{pkg.status_timestamp ? new Date(pkg.status_timestamp).toLocaleString() : "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data-message">
                  No package data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackageReport;