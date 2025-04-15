import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditVehicles.css";

function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [vehicle, setVehicle] = useState({
    license_plate: "",
    fuel_type: "",
    volume_capacity: "",
    payload_capacity: "",
    mileage: "",
    status: "",
    last_maintenance_date: "",
    location_id: "",
    driver_id: ""
  });

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`${BASE_URL}/get-deliveryvehicle/${id}`);
        const data = await res.json();

        if (res.ok && data) {
          setVehicle({
            license_plate: data.license_plate || "",
            fuel_type: data.fuel_type || "",
            volume_capacity: data.volume_capacity || "",
            payload_capacity: data.payload_capacity || "",
            mileage: data.mileage || "",
            status: data.status || "",
            last_maintenance_date: data.last_maintenance_date?.split("T")[0] || "",
            location_id: data.location_id || "",
            driver_id: data.driver_id || ""
          });
        } else {
          alert("Vehicle not found.");
          navigate("/admin/vehicles");
        }
      } catch (err) {
        console.error("❌ Error fetching vehicle:", err);
        alert("Failed to load vehicle.");
        navigate("/admin/vehicles");
      }
    };

    fetchVehicle();
  }, [id, BASE_URL, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicle((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {
      vehicle_ID: id,
      ...vehicle
    };

    try {
      const res = await fetch(`${BASE_URL}/update-deliveryvehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`❌ Failed to update: ${data.message || "Unknown error"}`);
        return;
      }

      alert("✅ Vehicle updated successfully.");
      navigate("/admin/vehicles");
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("An error occurred while updating the vehicle.");
    }
  };

  return (
    <div className="edit-container">
      <div className="edit-box">
        <h1 className="edit-title">Edit Vehicle</h1>
        <form className="edit-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="license_plate"
            placeholder="License Plate"
            value={vehicle.license_plate}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="fuel_type"
            placeholder="Fuel Type"
            value={vehicle.fuel_type}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="volume_capacity"
            placeholder="Volume Capacity"
            value={vehicle.volume_capacity}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="payload_capacity"
            placeholder="Payload Capacity"
            value={vehicle.payload_capacity}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="mileage"
            placeholder="Mileage"
            value={vehicle.mileage}
            onChange={handleChange}
          />
          <select
            name="status"
            value={vehicle.status}
            onChange={handleChange}
            required
          >
            <option value="">Select Status</option>
            <option value="Available">Available</option>
            <option value="In Transit">In Transit</option>
          </select>
          <input
            type="date"
            name="last_maintenance_date"
            value={vehicle.last_maintenance_date}
            onChange={handleChange}
          />
          <input
            type="number"
            name="location_id"
            placeholder="Location ID"
            value={vehicle.location_id}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="driver_id"
            placeholder="Driver ID (optional)"
            value={vehicle.driver_id}
            onChange={handleChange}
          />

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default EditVehicle;
