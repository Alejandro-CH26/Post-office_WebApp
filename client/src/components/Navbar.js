import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employee_token");
    localStorage.removeItem("role");
    localStorage.removeItem("employee_ID");
    localStorage.removeItem("employee_name");
    localStorage.removeItem("customer_ID");
    localStorage.removeItem("customer_name");
    localStorage.removeItem("admin_name");

    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <ul className="nav-links">
        <li className="nav-logo">Post Office</li>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/faq">FAQ</Link></li>

        {/* Customer-only routes */}
        {token && role === "customer" && (
          <>
            <li><Link to="/PackageMaker">PM</Link></li>
            <li><Link to="/trackpackage">Track a Package</Link></li>
            <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>
          </>
        )}

        {/* Employee-only route */}
        {token && role === "employee" && (
          <>
            <li><Link to="/onboard">Onboard Employee</Link></li>
          </>
        )}

        {/* Admin-only route */}
        {token && role === "admin" && (
          <>
            <li><Link to="/onboard">Onboard Employee</Link></li>
            <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>
            <li><Link to="/employeehours">Employee Hours</Link></li>
          </>
        )}

        {/* Only show these if NOT logged in */}
        {!token && (
          <>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/employee-login">Employee Login</Link></li>
            <li><Link to="/admin-login">Admin Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}

        {/* Show logout if logged in */}
        {token && (
          <li>
            <button onClick={handleLogout} className="logout-button">Log Out</button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
