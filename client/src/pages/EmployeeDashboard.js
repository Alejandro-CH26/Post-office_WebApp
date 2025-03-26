import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function EmployeeDashboard() {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("employee_token");

        if (!token) {
            navigate("/employee-login");
            return;
        }

        fetch("https://post-office-webapp.onrender.com/employee-dashboard", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "error") {
                    setError("Session expired. Please log in again.");
                    localStorage.removeItem("employee_token");
                    setTimeout(() => navigate("/employee-login"), 2000);
                } else {
                    setMessage(data.message);
                }
            })
            .catch((error) => {
                console.error("Error fetching employee dashboard:", error);
                setError("Failed to load dashboard. Please try again.");
            });
    }, [navigate]);

    return (
        <div>
            <h1>Employee Dashboard</h1>
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{message}</p>
            )}
        </div>
    );
}

export default EmployeeDashboard;
