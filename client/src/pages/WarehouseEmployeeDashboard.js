import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function WarehouseEmployeeDashboard() {
  var employeeName = "Nathaniel Bartholemew";
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Hello, {employeeName}</h1>
      <Link to="/view-packages">
      <button style={{ margin: "10px", padding: "10px", width: "100%", display:"block" }}>View Packages</button>
      </Link>
      <Link to="/clock-in-out">
      <button style={{ margin: "10px", padding: "10px", width: "100%", display:"block" }}>Clock In/Out</button>
      </Link>
    </div>
  );
}

export default WarehouseEmployeeDashboard;