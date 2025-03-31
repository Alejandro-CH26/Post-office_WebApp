import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const BASE_URL = process.env.REACT_APP_API_BASE_URL;

            const response = await fetch(`${BASE_URL}/admin-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    admin_Username: username.trim(),
                    admin_Password: password.trim()
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", "admin");
                localStorage.setItem("admin_name", data.firstName);
                navigate("/admin-dashboard");
            } else {
                setError(data.error || "Invalid credentials");
            }
        } catch (err) {
            console.error("❌ Login error:", err);
            setError("Server error, try again.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">Admin Login</h1>
                {error && <p className="error-message">{error}</p>}
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
}

export default AdminLogin;