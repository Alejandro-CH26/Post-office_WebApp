import React, { useEffect, useState } from 'react';
import './Employees.css';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all'); // NEW

    useEffect(() => {
        fetch('http://localhost:5001/employee-reports')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const normalized = data.map(emp => ({
                        ...emp,
                        isFired: emp.isFired === 1 || emp.isFired === true || emp.isFired === "1",
                        isSupervisor: emp.isSupervisor === 1 || emp.isSupervisor === true || emp.isSupervisor === "1"
                    }));
                    setEmployees(normalized);
                }
            })            
            .catch(err => {
                console.error("❌ Error fetching employees:", err);
                setEmployees([]);
            });
    }, []);

    const toggleFireStatus = async (id, currentStatus) => {
        const confirmMsg = currentStatus
          ? "Unfire this employee and restore access?"
          : "Are you sure you want to fire this employee?";
        const confirmed = window.confirm(confirmMsg);
        if (!confirmed) return;
      
        try {
          const res = await fetch('http://localhost:5001/fire-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_ID: id, isFired: !currentStatus })
          });
      
          if (res.ok) {
            setEmployees(prev =>
              prev.map(emp =>
                emp.id === id ? { ...emp, isFired: !currentStatus } : emp
              )
            );
          } else {
            console.error("Failed to update employee status.");
          }
        } catch (error) {
          console.error("Error toggling fire status:", error);
        }
    };

    // 🔍 Filter employees based on selected status
    const filteredEmployees = employees.filter(emp => {
        if (statusFilter === 'active') return !emp.isFired;
        if (statusFilter === 'fired') return emp.isFired;
        return true; // 'all'
    });

    return (
        <div className="reports-container">
            <h2>👥 Current Employees</h2>

            {/* 🔽 Filter dropdown */}
            <div className="filter-container">
                <label>Show:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="fired">Fired</option>
                </select>
            </div>

            {filteredEmployees.length === 0 ? (
                <p>No employee data available.</p>
            ) : (
                <table className="excel-style-table">
                    <thead>
                        <tr>
                            <th> ID</th>
                            <th> Name</th>
                            <th> Location</th>
                            <th> Position</th>
                            <th> Supervisor?</th>
                            <th> Fired?</th>
                            <th> Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((emp, i) => (
                            <tr key={i} className={emp.isFired ? "fired-row" : ""}>
                                <td>{emp.id}</td>
                                <td>{emp.name}</td>
                                <td>{emp.location}</td>
                                <td>{emp.position}</td>
                                <td>{emp.isSupervisor ? "✅" : "❌"}</td>
                                <td>{emp.isFired ? " Yes" : " No"}</td>
                                <td>
                                    <button
                                        className={`fire-btn ${emp.isFired ? 'unfire' : ''}`}
                                        onClick={() => toggleFireStatus(emp.id, emp.isFired)}
                                    >
                                        {emp.isFired ? "Unfire" : "Fire"}
                                    </button>
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
