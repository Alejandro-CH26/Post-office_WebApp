import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Keep Navbar as a separate component
import HomePage from "./pages/HomePage";
import Faq from "./pages/Faq";
import TrackPackage from "./pages/TrackPackage";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import BuyInventory from "./pages/BuyInventory";
import "./App.css"; // Ensure styling is applied

function App() {
  return (
    <Router>
      {/* Header */}
      <header className="header">Post Office</header>

      {/* Navigation Bar */}
      <Navbar /> 

      {/* Hero Section - Only on Home Page */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="hero-section">
              <h1>Online Shipping Made Easy</h1>
              <p>Use our service to pay for postage, print your own labels, and schedule a pickup.</p>
              <button>Print a Label</button>
              <button>Schedule a Pickup</button>
            </div>
          }
        />
      </Routes>

      {/* Routing to Different Pages */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Faq" element={<Faq />} />
        <Route path="/TrackPackage" element={<TrackPackage />} />
        <Route path="/LogIn" element={<LogIn />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/BuyInventory" element={<BuyInventory />} />
      </Routes>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Post Office. All rights reserved.</p>
      </footer>
    </Router>
  );
}

export default App;
