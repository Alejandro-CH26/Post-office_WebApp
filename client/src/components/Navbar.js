import React from "react";
import { Link } from "react-router-dom";
// import "./Navbar.css"; // We'll create this CSS file next

function Navbar() {
  return (
    <nav className="navbar">
      <h1 className="logo">Post Office</h1>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/Faq">FAQ</Link></li>
        <li><Link to="/TrackPackage">Track a package</Link></li>
        <li><Link to="/LogIn">Log in</Link></li>
        <li><Link to="/Register">Register</Link></li>
        <li><Link to="/BuyInventory">Buy Stamps/Inventory</Link></li>

      </ul>
    </nav>
  );
}

export default Navbar;
