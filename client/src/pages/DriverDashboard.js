import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import PackagesLeft from "./PackagesLeft";
function DriverDashboard() {
    const [name, setName] = useState("");
    const [employeeID, setEmployeeID] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("employee_token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log("🪪 Decoded token:", decoded);
                setName(decoded.firstName || "Driver");
                setEmployeeID(decoded.id || "N/A");
            } catch (err) {
                console.error("Invalid token:", err);
            }
        }
    }, []);

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Driver Dashboard</h1>
            <p>Welcome, {name}! You can view delivery routes, schedules, and tasks here.</p>
            <p><strong>Employee ID:</strong> {employeeID}</p>
            
            {employeeID && employeeID !== "N/A" && (
                <PackagesLeft employeeID={employeeID} />
            )}
        </div>
    );
}

export default DriverDashboard;