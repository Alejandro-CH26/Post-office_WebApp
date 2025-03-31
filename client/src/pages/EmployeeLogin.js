import React, { useState, useEffect } from "react";
// import "./Login.css";
import { useNavigate } from "react-router-dom";

function EmployeeLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;


    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role === "warehouse") {
            navigate("/warehouse-dashboard");
        } else if (role === "driver") {
            navigate("/driver-dashboard");
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const credentials = {
            employee_Username: username.trim(),
            employee_Password: password.trim(),
        };

        try {
            const response = await fetch(`${BASE_URL}/employee-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("employee_token", data.token);
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("employee_ID", data.employeeID);

                // store name
                localStorage.setItem("employee_name", data.firstName);

                // Navigation based on role
                if (data.role === "warehouse") {
                    navigate("/warehouse-dashboard");
                } else if (data.role === "driver") {
                    navigate("/driver-dashboard");
                } else {
                    navigate("/employee-dashboard");
                }
            }
            else {
                setError(data.error || "Invalid username or password");
            }
        } catch (error) {
            console.error("❌ Error logging in:", error);
            setError("❌ Server error, please try again later.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">Employee Login</h1>
                {error && <p className="error-message">{error}</p>}
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
}

export default EmployeeLogin;


