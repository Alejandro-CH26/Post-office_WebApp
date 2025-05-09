import React, { useEffect, useState } from 'react';

import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function WarehouseEmployeeDashboard() {
  const [employeeName, setEmployeeName] = useState("");

  const allCookies = document.cookie;
  console.log(allCookies);
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch(`${BASE_URL}/employee/warehousedashboard`, {
          method: "GET",
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setEmployeeName(data.name)
        } else {
          setEmployeeName("Unauthorized User")
        }
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setEmployeeName('Error loading name');
      }
    }

    fetchEmployeeData();

  }, []);

  const buttonStyle = {
    display: 'block',
    width: '100%',
    margin: '10px 0',
    padding: '10px',
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Hello, {employeeName}</h1>
      <Link to="/Employee/WarehouseAssignPackages">
        <button style={buttonStyle}>View Packages</button>
      </Link>
      <Link to="/Employee/ClockInOut">
        <button style={buttonStyle}>Clock In/Out</button>
      </Link>

    </div>
  );
}

export default WarehouseEmployeeDashboard;