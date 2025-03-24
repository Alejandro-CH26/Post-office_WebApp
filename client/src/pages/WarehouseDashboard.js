import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

function WarehouseDashboard() {
    const [name, setName] = useState("");
    const [employeeID, setEmployeeID] = useState("");


    useEffect(() => {
        const token = localStorage.getItem("employee_token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setName(decoded.firstName || "Employee");
                setEmployeeID(decoded.id || "N/A");

            } catch (err) {
                console.error("Invalid token:", err);
            }
        }
    }, []);

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Warehouse Dashboard</h1>
            <p>Welcome, {employeeID}! You can manage inventory, packages, and more from here.</p>
        </div>
    );
}

export default WarehouseDashboard;




