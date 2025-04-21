import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const BASE_URL = process.env.REACT_APP_API_BASE_URL;

        fetch(`${BASE_URL}/dashboard`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "error") {
                    setError("Session expired. Please log in again.");
                    // Clears token if invalid
                    localStorage.removeItem("token");
                    setTimeout(() => navigate("/login"), 2000);
                } else {
                    setMessage(data.message);
                }
            })
            .catch((error) => {
                console.error("Error fetching dashboard:", error);
                setError("Failed to load dashboard. Please try again.");
            });
    }, [navigate]);

    return (
        <div>
            <h1>Dashboard</h1>
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{message}</p>
            )}
        </div>
    );
}

export default Dashboard;



