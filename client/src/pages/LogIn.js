import React, { useState, useEffect } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    // Redirects user if already logged in
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userCredentials = {
      customer_Username: username.trim(),
      customer_Password: password.trim(),
    };

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userCredentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "customer");
        localStorage.setItem("customer_ID", data.customerID);
        localStorage.setItem("customer_name", data.firstName);
        // navigate("/dashboard");
        window.location.href = "/dashboard";
      }
      else {
        setError(data.error || "Invalid username or password");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setError("Server error, please try again later.");
    }
  };

  return (

    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Login</h1>
        {error && <p className="error-message">{error}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
