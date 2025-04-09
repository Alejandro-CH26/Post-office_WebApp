import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import  { jwtDecode } from "jwt-decode";

function WarehouseDashboard() {
    const [name, setName] = useState("");
    const [employeeID, setEmployeeID] = useState("");


    useEffect(() => {
        const token = localStorage.getItem("employee_token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setName(decoded.firstName || "Employee");
                setEmployeeID(decoded.id || "N/A");
                localStorage.setItem("employee_ID", decoded.id);

            } catch (err) {
                console.error("Invalid token:", err);
            }
        }
    }, []);

    const buttonStyle = {
        display: 'block',
        width: '100%',
        margin: '10px 0',
        padding: '10px',
      };
    
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1>Hello, {name}</h1>
          <Link to="/WarehouseAssignPackages" style={{ textDecoration: 'none' }}>
         <button style={buttonStyle}>View Packages</button>
    </Link>
              {/* New button: Check Inventory */}
      <Link to="/inventoryreport"style={{ textDecoration: 'none' }}>
        <button style={buttonStyle}>Check Inventory</button>
      </Link>

          <Link to ="/WarehouseClockInOut"style={{ textDecoration: 'none' }}>
          <button style={buttonStyle}>Clock In/Out</button>
          </Link>

          <Link to ="/WarehouseRegisterPackage"style={{ textDecoration: 'none' }}>
          <button style={buttonStyle}>Register A Package</button>
          </Link>

          
          
        </div>
      );
}

export default WarehouseDashboard;