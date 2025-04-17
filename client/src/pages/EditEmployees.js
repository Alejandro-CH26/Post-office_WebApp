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
    role: ""
  });

  const [addresses, setAddresses] = useState([]);

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
            location: data.location || "", // this should be address_ID
            role: data.role || ""
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

  // Fetch all addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch(`${BASE_URL}/all-addresses`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setAddresses(data); // [{ address_ID, label }]
        }
      } catch (err) {
        console.error("❌ Error fetching addresses:", err);
      }
    };

    fetchAddresses();
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

          <select
            name="location"
            value={employee.location}
            onChange={handleChange}
            required
          >
            <option value="">Select Location</option>
            {addresses.map(addr => (
              <option key={addr.address_ID} value={addr.address_ID}>
                {addr.label}
              </option>
            ))}
          </select>

          <select
            name="role"
            value={employee.role}
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="Driver">Driver</option>
            <option value="Warehouse">Warehouse</option>
          </select>

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default EditEmployee;
