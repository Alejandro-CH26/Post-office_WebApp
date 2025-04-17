import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

function ClockInOut() {
    const [name, setName] = useState("");
    const [employeeID, setEmployeeID] = useState("");
    const [clockStatus, setClockStatus] = useState(null);
    const [lastAction, setLastAction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    
    const getApiUrl = () => {
        return process.env.REACT_APP_API_BASE_URL ||
            (process.env.NODE_ENV === 'development'
                ? 'http://localhost:5001'
                : 'https://post-office-webapp.onrender.com');
    };

    useEffect(() => {
        const token = localStorage.getItem("employee_token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setName(decoded.firstName || "Employee");
            setEmployeeID(decoded.id || "N/A");
            fetchClockStatus(decoded.id);
        } catch (err) {
            console.error("Invalid token:", err);
            navigate("/login");
        }
    }, [navigate]);

    const fetchClockStatus = async (id) => {
      setIsLoading(true);
      try {
          const API_URL = getApiUrl();
          const response = await fetch(`${API_URL}/api/hours_logged/status?employee_id=${id}`);
          if (!response.ok) {
              throw new Error("Failed to fetch clock status");
          }
          const data = await response.json();
          setClockStatus(data.isClockedIn);
          
          setLastAction(data.isClockedIn ? data.lastClockInTime : data.lastClockOutTime);
          setError(null);
      } catch (err) {
          console.error("Error fetching clock status:", err);
          setError("Could not load clock status");
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleClockAction = async () => {
      setIsLoading(true);
      try {
          const action = clockStatus ? "out" : "in";
          const API_URL = getApiUrl();
          const response = await fetch(`${API_URL}/api/hours_logged/clock`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("employee_token")}`
              },
              body: JSON.stringify({
                  employee_id: employeeID,
                  action: action
              })
          });
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Failed to clock ${action}`);
          }
  
          await fetchClockStatus(employeeID);
      } catch (err) {
          console.error("Error performing clock action:", err);
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div style={{ padding: "2rem" }}>
        <h1>Clock In/Out</h1>
        <p>Welcome, {name}! You can clock in and out here.</p>
        <p><strong>Employee ID:</strong> {employeeID}</p>
        
        {isLoading ? (
            <p>Loading clock status...</p>
        ) : error ? (
            <p className="error">{error}</p>
        ) : (
            <div className="clock-container">
                <p>Current status: <strong>{clockStatus ? "CLOCKED IN" : "CLOCKED OUT"}</strong></p>
                {lastAction && (
                    <p>Last {clockStatus ? "clock-in" : "clock-out"}: {new Date(lastAction).toLocaleString()}</p>
                )}
                <button 
                    onClick={handleClockAction}
                    disabled={isLoading}
                    className={clockStatus ? "clock-out" : "clock-in"}
                >
                    {isLoading ? "Processing..." : clockStatus ? "Clock Out" : "Clock In"}
                </button>
            </div>
        )}
    </div>
);
}

export default ClockInOut;