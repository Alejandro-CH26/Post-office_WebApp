import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  // Refresh role/token on location change (login/logout/etc)
  useEffect(() => {
    const newToken = localStorage.getItem("token");
    const newRole = localStorage.getItem("role");
    setToken(newToken);
    setRole(newRole);
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <ul className="nav-links">
        <li className="nav-logo">Post Office</li>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/faq">FAQ</Link></li>

        {/* Customer-only */}
        {token && role === "customer" && (
          <>
            <li><Link to="/PackageMaker">PM</Link></li>
            <li><Link to="/trackpackage">Track a Package</Link></li>
            <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>
          </>
        )}

        {/* Employee-only */}
        {token && role === "employee" && (
          <>
            <li><Link to="/onboard">Onboard Employee</Link></li>
          </>
        )}

        {/* Admin-only */}
        {token && role === "admin" && (
          <>
            <li><Link to="/onboard">Onboard Employee</Link></li>
            <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>
            <li><Link to="/employeehours">Employee Hours</Link></li>
            <li><Link to="/admin/reports">Reports</Link></li>
            <li><Link to="/admin/employees">Employee List</Link></li>
            <li><Link to="/admin/create-post-office">Create Post Office</Link></li>

          </>
        )}
        {/* Warehouse-only */}
        {token && role === "warehouse" && (
          <>
            <li><Link to="/warehouse-dashboard">Warehouse Dashboard</Link></li>
          </>
        )}


        {/* Not logged in */}
        {!token && (
          <>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/employee-login">Employee Login</Link></li>
            <li><Link to="/admin-login">Admin Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}

        {/* Log out */}
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