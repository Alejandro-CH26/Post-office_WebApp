import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Navbar component
import HeroSection from "./components/HeroSection"; // Import Hero Section
import SearchPackage from "./components/SearchPackage"; 
import HomePage from "./pages/HomePage"; //could be deleted empty page rn
import Faq from "./pages/Faq";
import TrackPackage from "./pages/TrackPackage";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import BuyInventory from "./pages/BuyInventory";
import WarehouseEmployeeDashboard from "./pages/WarehouseEmployeeDashboard";
import WarehouseAssignPackages from "./pages/WarehouseAssignPackages";
import ClockInOut from "./pages/ClockInOut";
import EmployeeLogInPage from "./pages/EmployeeLogIn";
import "./App.css"; // Ensure styling is applied

var userRole = "guest";

function App() {
  return (
    <Router>
      {/* Header */}
     

      {/* Navigation Bar */}
      <Navbar userRole={userRole}/> 

      {/* Hero Section and Search Package - Only on Home Page */}
      <Routes>
        <Route path="/" element={
          <>
            <HeroSection /> 
            <SearchPackage />  
          </>
        } />
      </Routes>

      {/* Routing to Different Pages */}
      <Routes>
        <Route path="/Faq" element={<Faq />} />
        <Route path="/TrackPackage" element={<TrackPackage />} />
        <Route path="/LogIn" element={<LogIn />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/BuyInventory" element={<BuyInventory />} />
        <Route path="/Employee/WarehouseDashboard" element={<WarehouseEmployeeDashboard />} />
        <Route path="/Employee/WarehouseAssignPackages" element={<WarehouseAssignPackages />} />
        <Route path="/Employee/ClockInOut" element={<ClockInOut />} />
        <Route path="/Employee/LogIn" element={<EmployeeLogInPage/>} />
      </Routes>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Post Office. All rights reserved.</p>
      </footer>
    </Router>
  );
}

export default App;
