import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vehicles.css';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [fuelFilter, setFuelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const fetchVehicles = () => {
    fetch(`${BASE_URL}/deliveryvehicles?includeDeleted=${showDeleted}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehicles(data);
      })
      .catch(err => {
        console.error("❌ Error fetching vehicles:", err);
        setVehicles([]);
      });
  };

  useEffect(() => {
    fetchVehicles();
  }, [showDeleted]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this vehicle?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/delete-deliveryvehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_ID: id })
      });

      if (res.ok) {
        fetchVehicles();
        alert("Vehicle deleted successfully.");
      } else {
        alert("Failed to delete vehicle.");
      }
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      alert("An error occurred while deleting.");
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/undelete-deliveryvehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_ID: id })
      });

      if (res.ok) {
        fetchVehicles();
        alert("Vehicle restored successfully.");
      } else {
        alert("Failed to restore vehicle.");
      }
    } catch (err) {
      console.error("Error restoring vehicle:", err);
      alert("An error occurred while restoring.");
    }
  };

  const uniqueFuelTypes = [...new Set(vehicles.map(v => v.fuel_type))];
  const uniqueStatuses = [...new Set(vehicles.map(v => v.status))];

  const filteredVehicles = vehicles.filter(v => {
    const fuelMatch = fuelFilter === 'All' || v.fuel_type === fuelFilter;
    const statusMatch = statusFilter === 'All' || v.status === statusFilter;
    const searchMatch =
      v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.driver_id && v.driver_id.toString().includes(searchTerm));
    return fuelMatch && statusMatch && searchMatch;
  });

  return (
    <div className="reports-container">
      <h2>Delivery Vehicles</h2>

      <div className="filter-container">
        <label>Fuel:</label>
        <select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)}>
          <option value="All">All</option>
          {uniqueFuelTypes.map((f, i) => (
            <option key={i} value={f}>{f}</option>
          ))}
        </select>

        <label style={{ marginLeft: '1rem' }}>Status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All</option>
          {uniqueStatuses.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by plate or driver ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginLeft: "1rem", padding: "0.3rem" }}
        />

        <label style={{ marginLeft: '1rem' }}>
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            style={{ marginRight: "0.3rem" }}
          />
          Show Deleted
        </label>
      </div>

      {filteredVehicles.length === 0 ? (
        <p>No vehicles available.</p>
      ) : (
        <table className="excel-style-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Plate</th>
              <th>Fuel</th>
              <th>Volume</th>
              <th>Payload</th>
              <th>Mileage</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Last Maintenance</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((v, i) => (
              <tr key={i} className={v.is_deleted ? "fired-row" : ""}>
                <td>{v.id}</td>
                <td>{v.license_plate}</td>
                <td>{v.fuel_type}</td>
                <td>{v.volume_capacity}</td>
                <td>{v.payload_capacity}</td>
                <td>{v.mileage}</td>
                <td>{v.status}</td>
                <td>{v.driver_name || 'Unassigned'}</td>
                <td>{v.last_maintenance_date ? new Date(v.last_maintenance_date).toLocaleDateString() : "N/A"}</td>
                <td>{v.location_address || '-'}</td>
                <td>
                  {v.is_deleted ? (
                    <button
                      className="restore-btn"
                      onClick={() => handleRestore(v.id)}
                      style={{ backgroundColor: "#28a745", color: "white" }}
                    >
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(v.id)}
                        style={{ backgroundColor: "#cc3333", color: "white" }}
                      >
                        Delete
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/admin/editvehicles/${v.id}`)}
                        style={{ marginLeft: "0.5rem", backgroundColor: "#007bff", color: "white" }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Vehicles;
