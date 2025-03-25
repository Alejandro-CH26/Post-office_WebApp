import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("http://localhost:5001/admin-login", {
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
                console.error("❌ Login error:", data.error);
                setError(data.error || "Invalid credentials");
            }
        } catch (err) {
            console.error("❌ Login error:", err);
            setError("Network error, please check connection and try again.");
        }
    };

    return (
        <div className="login-container">
            <h1>Admin Login</h1>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default AdminLogin;
