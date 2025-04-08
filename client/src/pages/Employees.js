import React, { useEffect, useState } from 'react';
import './Employees.css';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;


    useEffect(() => {
        fetch(`${BASE_URL}/employee-reports`)
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
            const res = await fetch(`${BASE_URL}/fire-employee`, {
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

    //  Combined filtering
    const filteredEmployees = employees.filter(emp => {
        const statusMatch =
            statusFilter === 'all' ||
            (statusFilter === 'active' && !emp.isFired) ||
            (statusFilter === 'fired' && emp.isFired);

        const roleMatch = roleFilter === 'all' || emp.position === roleFilter;
        const locationMatch = locationFilter === 'all' || emp.location === locationFilter;

        return statusMatch && roleMatch && locationMatch;
    });

    //  Get unique roles and locations for filter dropdowns
    const uniqueRoles = [...new Set(employees.map(emp => emp.position))];
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
                            <th>Supervisor?</th>
                            <th>Fired?</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((emp, i) => (
                            <tr key={i} className={emp.isFired ? "fired-row" : ""}>
                                <td>{emp.id}</td>
                                <td>{emp.name}</td>
                                <td>{emp.location}</td>
                                <td>{emp.position}</td>
                                <td>{emp.isSupervisor ? "Yes" : "No"}</td>
                                <td>{emp.isFired ? "Yes" : "No"}</td>
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
