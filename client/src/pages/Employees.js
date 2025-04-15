import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const url = `${BASE_URL}/employee-reports${showDeleted ? '?includeDeleted=true' : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const normalized = data.map(emp => ({
            ...emp,
            isFired: emp.isFired === 1 || emp.isFired === true || emp.isFired === "1",
            isDeleted: emp.isDeleted === 1 || emp.isDeleted === true || emp.isDeleted === "1"
          }));
          const deduplicated = Array.from(
            new Map(normalized.map(emp => [emp.id, emp])).values()
          );
          
          setEmployees(deduplicated);
        }
      })
      .catch(err => {
        console.error("❌ Error fetching employees:", err);
        setEmployees([]);
      });
  }, [showDeleted]);

  const toggleFireStatus = async (id, currentStatus) => {
    const confirmMsg = currentStatus
      ? "Unfire this employee and restore access?"
      : "Are you sure you want to fire this employee?";
    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/fire-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_ID: id, isFired: !currentStatus })
      });

      if (res.ok) {
        setEmployees(prev =>
          prev.map(emp =>
            emp.id === id
              ? {
                  ...emp,
                  isFired: !currentStatus,
                  position: !currentStatus && emp.position.startsWith("Driver")
                    ? "Driver"
                    : emp.position
                }
              : emp
          )
        );
      } else {
        const data = await res.json();
        alert(`❌ Failed to update: ${data?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error toggling fire status:", error);
      alert("An error occurred while updating.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this employee?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/delete-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_ID: id })
      });

      if (res.ok) {
        setEmployees(prev => prev.map(emp =>
          emp.id === id ? { ...emp, isDeleted: true } : emp
        ));
        alert("Employee marked as deleted.");
      }
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("An error occurred while deleting.");
    }
  };

  const handleUndelete = async (id) => {
    const res = await fetch(`${BASE_URL}/undelete-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_ID: id })
    });

    if (res.ok) {
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === id ? { ...emp, isDeleted: false } : emp
        )
      );
      alert("Employee restored.");
    } else {
      alert("Failed to restore employee.");
    }
  };

  const simplifyPosition = (position) => {
    if (position.toLowerCase().includes('driver')) return 'Driver';
    if (position.toLowerCase().includes('warehouse')) return 'Warehouse';
    return position;
  };

  const filteredEmployees = employees.filter(emp => {
    const simplifiedPosition = simplifyPosition(emp.position);

    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !emp.isFired) ||
      (statusFilter === 'fired' && emp.isFired);

    const roleMatch =
      roleFilter === 'all' || simplifiedPosition === roleFilter;

    const locationMatch =
      locationFilter === 'all' || emp.location === locationFilter;

    const nameMatch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && roleMatch && locationMatch && nameMatch;
  });

  const uniqueRoles = [...new Set(
    employees.map(emp => simplifyPosition(emp.position))
  )];

  const uniqueLocations = [...new Set(employees.map(emp => emp.location))];

  return (
    <div className="reports-container">
      <h2>Current Employees</h2>

      <div className="filter-container">
        <label>Status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="fired">Fired</option>
        </select>

        <label>Role:</label>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All</option>
          {uniqueRoles.map((role, i) => (
            <option key={i} value={role}>{role}</option>
          ))}
        </select>

        <label>Location:</label>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
          <option value="all">All</option>
          {uniqueLocations.map((loc, i) => (
            <option key={i} value={loc}>{loc}</option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={() => setShowDeleted(prev => !prev)}
          />
          Show Deleted
        </label>

        <label>Search Name:</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter name..."
          style={{ marginLeft: "8px", padding: "4px" }}
        />
      </div>

      {filteredEmployees.length === 0 ? (
        <p>No employee data available.</p>
      ) : (
        <table className="excel-style-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Position</th>
              <th>Fired?</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, i) => (
              <tr key={i} className={emp.isFired ? "fired-row" : emp.isDeleted ? "deleted-row" : ""}>
                <td>{emp.id}</td>
                <td>{emp.name}</td>
                <td>{emp.location}</td>
                <td>{simplifyPosition(emp.position)}</td>
                <td>{emp.isFired ? "Yes" : "No"}</td>
                <td>
                  <div className="action-buttons">
                    {!emp.isDeleted ? (
                      <>
                        <button
                          className={`fire-btn ${emp.isFired ? 'unfire' : ''}`}
                          onClick={() => toggleFireStatus(emp.id, emp.isFired)}
                        >
                          {emp.isFired ? "Unfire" : "Fire"}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(emp.id)}
                        >
                          Delete
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => navigate(`/admin/editemployees/${emp.id}`)}
                        >
                          Edit
                        </button>
                      </>
                    ) : (
                      <button
                        className="undelete-btn"
                        onClick={() => handleUndelete(emp.id)}
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Employees;
