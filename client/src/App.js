import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import HeroSection from "./components/HeroSection";
import SearchPackage from "./components/SearchPackage";

import Faq from "./pages/Faq";
import TrackPackage from "./pages/TrackPackage";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import BuyInventory from "./pages/BuyInventory";
import Onboard from "./pages/Onboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import WarehouseDashboard from "./pages/WarehouseDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";
import "./App.css";
import WarehouseAssignPackages from "./pages/WarehouseAssignPackages";
import ClockInOut from "./pages/ClockInOut";
import EmployeeHours from "./pages/EmployeeHours";

// Restrict access based on token & role
const PrivateRoute = ({ element, requiredRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/login" />;

  return element;
};

// Logout Handler
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
      {/* Removed the <header className="header">Post Office</header> */}
      
      {/* Navbar remains */}
      <Navbar onLogout={handleLogout} />

      {/* Routes */}
      <Routes>
        {/* Example homepage route */}
        <Route
          path="/"
          element={
            <main className="homepage">
              <HeroSection />
              <SearchPackage />
            </main>
          }
        />
        <Route path="/faq" element={<Faq />} />
        <Route path="/trackpackage" element={<PrivateRoute element={<TrackPackage />} requiredRole="customer" />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/buyinventory" element={<BuyInventory />} />
        <Route path="/onboard" element={<PrivateRoute element={<Onboard />} requiredRole="admin" />} />
        <Route path="/employeehours" element={<PrivateRoute element={<EmployeeHours />} requiredRole="admin" />} />
        <Route path="/admin/reports" element={<PrivateRoute element={<Reports />} requiredRole="admin" />} />


        {/* Dashboards */}
        <Route path="/customer-dashboard" element={<PrivateRoute element={<CustomerDashboard />} requiredRole="customer" />} />
        <Route path="/warehouse-dashboard" element={<PrivateRoute element={<WarehouseDashboard />} requiredRole="warehouse" />} />
        <Route path="/driver-dashboard" element={<PrivateRoute element={<DriverDashboard />} requiredRole="driver" />} />
        <Route path="/admin-dashboard" element={<PrivateRoute element={<AdminDashboard />} requiredRole="admin" />} />

        {/* Warehouse Employee Routes */}
        <Route path="/warehouseassignpackages" element={<PrivateRoute element={<WarehouseAssignPackages />} requiredRole="warehouse" />} />
        <Route path="/warehouseclockinout" element={<PrivateRoute element={<ClockInOut />} requiredRole="warehouse" />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Footer at the bottom */}
      <footer className="footer">
        © 2025 Post Office. All rights reserved.
      </footer>
    </Router>
  );
}

export default App;
