import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";

// import HeroSection from "./components/HeroSection"; // Import Hero Section
// import SearchPackage from "./components/SearchPackage";

import Faq from "./pages/Faq";
import TrackPackage from "./pages/TrackPackage";
import PackageMaker from "./pages/PackageMaker";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import BuyInventory from "./pages/BuyInventory";
// import Dashboard from "./pages/Dashboard";


import Onboard from "./pages/Onboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import WarehouseDashboard from "./pages/WarehouseDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

import "./App.css";

// 🔒 Restrict access based on token & role
const PrivateRoute = ({ element, requiredRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/login" />;

  return element;
};

// 🔓 Logout Handler
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("employee_token");
  localStorage.removeItem("employee_ID");
  localStorage.removeItem("employee_name");
  window.location.href = "/login";
};

function App() {
  return (
    <Router>
      <header className="header">Post Office</header>

      <Navbar onLogout={handleLogout} />

      <Routes>
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/trackpackage" element={<TrackPackage />} />
        <Route path="/packagemaker" element={<PackageMaker />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/buyinventory" element={<BuyInventory />} />
        <Route path="/onboard" element={<PrivateRoute element={<Onboard />} requiredRole="employee" />} />

        {/* Dashboards */}
        <Route path="/customer-dashboard" element={<PrivateRoute element={<CustomerDashboard />} requiredRole="customer" />} />
        <Route path="/warehouse-dashboard" element={<PrivateRoute element={<WarehouseDashboard />} requiredRole="warehouse" />} />
        <Route path="/driver-dashboard" element={<PrivateRoute element={<DriverDashboard />} requiredRole="driver" />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
