import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";


function CustomerDashboard() {
    const [firstName, setFirstName] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);


                setFirstName(decoded.firstName || decoded.username || "Customer");
            } catch (err) {
                console.error("❌ Invalid token", err);
                setFirstName("Customer");
            }
        }
    }, []);

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Customer Dashboard</h1>
            <p>Welcome to the Post Office, {firstName}!</p>
            <ul>
                <li>🔹 You can track your packages</li>
                <li>🔹 Buy stamps and inventory</li>
                <li>🔹 Create new packages to send</li>
            </ul>
        </div>
    );
}

export default CustomerDashboard;
