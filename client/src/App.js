import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import Faq from "./pages/Faq";
import TrackPackage from "./pages/TrackPackage";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import BuyInventory from "./pages/BuyInventory";


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Faq" element={<Faq />} />
        <Route path="/TrackPackage" element={<TrackPackage />} />
        <Route path="/LogIn" element={<LogIn />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/BuyInventory" element={<BuyInventory />} />

      </Routes>
    </Router>
  );
}

export default App;
