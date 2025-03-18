import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Ensure this file exists

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">Post Office</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/faq">FAQ</Link></li>
        <li><Link to="/trackpackage">Track a Package</Link></li>
        <li><Link to="/login">Log in</Link></li>
        <li><Link to="/register">Register</Link></li>
        <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>
        <li><Link to="/notifications">Notifications</Link></li>
        <li><Link to="/reports">Reports</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
