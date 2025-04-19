import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css"; 

function AdminDashboard() {
    const navigate = useNavigate();
    const adminName = localStorage.getItem("admin_name") || "Admin";

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <p className="welcome">Welcome back, {adminName.toLowerCase()}</p>

            <div className="action-section">
                <h3>Actions:</h3>
                <div className="button-group">
                    <button onClick={() => navigate("/onboard")}>Onboard New Employee</button>
                    <button onClick={() => navigate("/employeehours")}>Employee Hours</button>
                    <button onClick={() => navigate("/admin/create-post-office")}>Create Post Office</button>
                    <button onClick={() => navigate("/admin/create-delivery-vehicle")}>Create Delivery Vehicle</button>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
