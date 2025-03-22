import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar"; // Keep Navbar as a separate component
import HomePage from "./pages/HomePage";
import Faq from "./pages/Faq";
import TrackPackage from "./pages/TrackPackage";
import PackageMaker from "./pages/PackageMaker";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import BuyInventory from "./pages/BuyInventory";
import Dashboard from "./pages/Dashboard"; // Add the Dashboard page
import Onboard from "./pages/Onboard";
import "./App.css"; // Ensure styling is applied

// 🔹 **Private Route - Restricts Access Without JWT**
const PrivateRoute = ({ element }) => {
  return localStorage.getItem("token") ? element : <Navigate to="/login" />;
};

// 🔹 **Logout Function**
const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login"; // Redirect after logout
};

function App() {
  return (
    <Router>
      {/* Header */}
      <header className="header">Post Office</header>

      {/* Navigation Bar */}
      <Navbar onLogout={handleLogout} /> {/* Pass logout function to Navbar */}

      {/* Routing to Different Pages */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Faq" element={<Faq />} />
        <Route path="/PackageMaker" element={<PackageMaker />} />
        <Route path="/TrackPackage" element={<TrackPackage />} />
        <Route path="/LogIn" element={<LogIn />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/BuyInventory" element={<BuyInventory />} />
        <Route path="/Onboard" element={<Onboard />} />

        {/* 🔹 **Protected Route - Dashboard** */}
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />

        {/* 🔹 **Redirect unknown routes to homepage** */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Footer */}
      {/* <footer className="footer">
        <p>© 2025 Post Office. All rights reserved.</p>
      </footer> */}
    </Router>
  );
}

export default App;
