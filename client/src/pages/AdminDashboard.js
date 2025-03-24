import React from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();
    const adminName = localStorage.getItem("admin_name") || "Admin";

    const handleOnboardClick = () => {
        navigate("/onboard");
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {adminName} 👋</p>

            <div style={{ marginTop: "2rem" }}>
                <h3>Actions:</h3>
                <button onClick={handleOnboardClick} style={{ padding: "10px 20px", fontSize: "16px" }}>
                    ➕ Onboard New Employee
                </button>
            </div>
        </div>
    );
}

export default AdminDashboard;
