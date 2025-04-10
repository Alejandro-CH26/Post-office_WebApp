import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useCart } from "../pages/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setRole(localStorage.getItem("role"));
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="hamburger" onClick={toggleMobileMenu}>
          ☰
        </button>
        <div className="nav-logo">Post Office</div>
      </div>

      <ul className={`nav-links ${isMobileMenuOpen ? "active" : ""}`}>
        {(!token || role === "customer") && (
          <li><Link to="/">Home</Link></li>
        )}



        {token && role === "customer" && (
          <>
            <li><Link to="/trackpackage">Track a Package</Link></li>
            <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>
            <li><Link to="/order-history">Order History</Link></li>
            <li className="cart-link">
              <Link to="/cart">
                Shopping Cart {cartCount > 0 && <span className="cart-count">({cartCount})</span>}
              </Link>
            </li>
          </>
        )}

        {token && role === "employee" && (
          <>
            <li><Link to="/onboard">Onboard Employee</Link></li>
            <li><Link to="/employee/clock">Clock in/out</Link></li>
          </>
        )}


        {/* Driver */}

          {token && role === "driver" && (
            <>
              <li><Link to="/driver/clock">Clock in/out</Link></li>
              <li><Link to="/driver-dashboard">Deliveries</Link></li>
            </>
          )}


        {token && role === "admin" && (
          <>
            <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>
            <li><Link to="/employeehours">Employee Hours</Link></li>
            {/*<li><Link to="/admin/reports">Reports</Link></li>*/}
            <li><Link to="/admin/employees">Employee List</Link></li>
            <li><Link to="/admin/postoffices">Post Office List</Link></li>
            <li><Link to="/admin/create-post-office">Create Post Office</Link></li>
            <li><Link to="/admin/create-delivery-vehicle">Create Delivery Vehicle</Link></li>
            <li><Link to="/sales-report">Sales Report</Link></li>
          </>
        )}

        {token && role === "warehouse" && (
          <>
            <li><Link to="/warehouse-dashboard">Warehouse Dashboard</Link></li>
            <li><Link to="/warehouse/clock">Clock in/out</Link></li>
          </>
        )}

        {!token && (
          <>
            <li><Link to="/trackpackage">Track a Package</Link></li>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/employee-login">Employee Login</Link></li>
            <li><Link to="/admin-login">Admin Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}

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
