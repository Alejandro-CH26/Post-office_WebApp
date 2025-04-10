import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditEmployees.css";

function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [employee, setEmployee] = useState({
    first_Name: "",
    middle_Name: "",
    last_Name: "",
    location: "",
    role: "",
    vehicle_ID: "" // new
  });

  const [availableVehicles, setAvailableVehicles] = useState([]);

  // Fetch employee info
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await fetch(`${BASE_URL}/get-employee/${id}`);
        const data = await res.json();

        if (res.ok && data) {
          setEmployee({
            first_Name: data.first_Name || "",
            middle_Name: data.middle_Name || "",
            last_Name: data.last_Name || "",
            location: data.location || "",
            role: data.role || "",
            vehicle_ID: data.vehicle_ID ? String(data.vehicle_ID) : ""
          });
        } else {
          alert("Employee not found.");
          navigate("/admin/employees");
        }
      } catch (err) {
        console.error("❌ Error fetching employee:", err);
        alert("Failed to load employee data.");
        navigate("/admin/employees");
      }
    };

    fetchEmployee();
  }, [id, BASE_URL, navigate]);

  // Fetch available vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${BASE_URL}/available-vehicles?driverId=${id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailableVehicles(data);
        }
      } catch (err) {
        console.error("❌ Error fetching vehicles:", err);
      }
    };

    fetchVehicles();
  }, [BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const updatedData = {
      employee_ID: id,
      ...employee
    };
  
    try {
      // 1. Update employee info
      const res = await fetch(`${BASE_URL}/update-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(`❌ Failed to update: ${data.message || "Unknown error"}`);
        return;
      }
  
      // 2. Assign/unassign vehicle
      await fetch(`${BASE_URL}/assign-vehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_ID: id,
          vehicle_ID: employee.vehicle_ID || null
        })
      });
  
      alert("✅ Employee updated successfully.");
      navigate("/admin/employees");
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("An error occurred while updating the employee.");
    }
  };
  

  return (
    <div className="edit-container">
      <div className="edit-box">
        <h1 className="edit-title">Edit Employee</h1>
        <form className="edit-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="first_Name"
            placeholder="First Name"
            value={employee.first_Name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="middle_Name"
            placeholder="Middle Name (Optional)"
            value={employee.middle_Name}
            onChange={handleChange}
          />
          <input
            type="text"
            name="last_Name"
            placeholder="Last Name"
            value={employee.last_Name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={employee.location}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="role"
            placeholder="Position"
            value={employee.role}
            onChange={handleChange}
            required
          />

          {employee.role.toLowerCase().startsWith("driver") && (
            <select
              name="vehicle_ID"
              value={employee.vehicle_ID}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {availableVehicles.map((v) => (
                <option key={v.Vehicle_ID} value={v.Vehicle_ID}>
                  Truck ({v.Vehicle_ID}) - {v.Fuel_type}
                </option>
              ))}
            </select>
          )}

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default EditEmployee;
