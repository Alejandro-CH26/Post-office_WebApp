import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PostOffices.css';

const PostOffices = () => {
  const [postOffices, setPostOffices] = useState([]);
  const [cityFilter, setCityFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const fetchPostOffices = () => {
    fetch(`${BASE_URL}/postoffices?includeDeleted=${showDeleted}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPostOffices(data);
        }
      })
      .catch(err => {
        console.error("❌ Error fetching post offices:", err);
        setPostOffices([]);
      });
  };

  useEffect(() => {
    fetchPostOffices();
  }, [showDeleted]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this post office?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/delete-postoffice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address_ID: id })
      });

      if (res.ok) {
        fetchPostOffices();
        alert("Post office deleted successfully.");
      } else {
        alert("Failed to delete post office.");
      }
    } catch (err) {
      console.error("Error deleting post office:", err);
      alert("An error occurred while deleting.");
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/undelete-postoffice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address_ID: id })
      });

      if (res.ok) {
        fetchPostOffices();
        alert("Post office restored successfully.");
      } else {
        alert("Failed to restore post office.");
      }
    } catch (err) {
      console.error("Error restoring post office:", err);
      alert("An error occurred while restoring.");
    }
  };

  const uniqueCities = [...new Set(postOffices.map(po => po.city))];
  const uniqueStates = [...new Set(postOffices.map(po => po.state))];

  const filteredPostOffices = postOffices.filter(po => {
    const matchesCity = cityFilter === 'All' || po.city === cityFilter;
    const matchesState = stateFilter === 'All' || po.state === stateFilter;
    const matchesSearch =
      po.street_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.unit_number && po.unit_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (po.post_office_name && po.post_office_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCity && matchesState && matchesSearch;
  });

  return (
    <div className="reports-container">
      <h2>Post Office Locations</h2>

      <div className="filter-container">
        <label>City:</label>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="All">All</option>
          {uniqueCities.map((city, idx) => (
            <option key={idx} value={city}>{city}</option>
          ))}
        </select>

        <label style={{ marginLeft: '1rem' }}>State:</label>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="All">All</option>
          {uniqueStates.map((state, idx) => (
            <option key={idx} value={state}>{state}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search address, unit or name..."
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

      {filteredPostOffices.length === 0 ? (
        <p>No post offices available.</p>
      ) : (
        <table className="excel-style-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Post Office Name</th>
              <th>Address</th>
              <th>Unit</th>
              <th>City</th>
              <th>State</th>
              <th>Zip</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPostOffices.map((po, i) => (
              <tr key={i} className={po.is_deleted ? "fired-row" : ""}>
                <td>{po.id}</td>
                <td>{po.post_office_name || 'N/A'}</td>
                <td>{po.street_address}</td>
                <td>{po.unit_number || 'N/A'}</td>
                <td>{po.city}</td>
                <td>{po.state}</td>
                <td>{po.zip}</td>
                <td>
                  {po.is_deleted ? (
                    <button
                      className="restore-btn"
                      onClick={() => handleRestore(po.id)}
                      style={{ backgroundColor: "#28a745", color: "white" }}
                    >
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(po.id)}
                        style={{ backgroundColor: "#cc3333", color: "white" }}
                      >
                        Delete
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/admin/editpostoffices/${po.id}`)}
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

export default PostOffices;
