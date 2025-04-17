import React from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();
    const adminName = localStorage.getItem("admin_name") || "Admin";

    const handleOnboardClick = () => {
        navigate("/onboard");
    };

    const employeeHoursClick = () => {
        navigate("/employeehours");
    };
    
    const createPostOfficeClick = () => {
        navigate("/admin/create-post-office");
    };

    const createDeliveryVehicleClick = () => {
        navigate("/admin/create-delivery-vehicle");
    };
    return (
        <div style={{ padding: "2rem" }}>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {adminName} 👋</p>

            <div style={{ marginTop: "" }}>
                <h3>Actions:</h3>
                <button onClick={handleOnboardClick} style={{ padding: "10px 20px", fontSize: "16px" }}>
                    Onboard New Employee
                </button>
                </div>
                <div style={{ marginTop: "" }}>
                <button onClick={employeeHoursClick} style={{ padding: "10px 20px", fontSize: "16px" }}>
                    Employee Hours
                </button>
            </div>
            <div style={{ marginTop: "" }}>
                <button onClick={createPostOfficeClick} style={{ padding: "10px 20px", fontSize: "16px" }}>
                    Create Post Office
                </button>
            </div>
            <div style={{ marginTop: "" }}>
                <button onClick={createDeliveryVehicleClick} style={{ padding: "10px 20px", fontSize: "16px" }}>
                    Create Delivery Vehicle
                </button>
            </div>
        </div>
    );
}

export default AdminDashboard;
