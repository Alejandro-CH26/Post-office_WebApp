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

  const [locations, setLocations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);

  // Fetch vehicle + meta data
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
        console.error("Error fetching vehicle:", err);
        alert("Failed to load vehicle.");
        navigate("/admin/vehicles");
      }
    };

    const fetchLocationsAndAllDrivers = async () => {
      try {
        const [locRes, driverRes] = await Promise.all([
          fetch(`${BASE_URL}/get-postoffices`),
          fetch(`${BASE_URL}/get-drivers`)
        ]);

        const [locationData, allDriverData] = await Promise.all([
          locRes.json(),
          driverRes.json()
        ]);

        setLocations(Array.isArray(locationData) ? locationData : []);
        setAllDrivers(Array.isArray(allDriverData) ? allDriverData : []);
      } catch (err) {
        console.error("Error fetching metadata:", err);
        setLocations([]);
        setAllDrivers([]);
      }
    };

    fetchVehicle();
    fetchLocationsAndAllDrivers();
  }, [id, BASE_URL, navigate]);

  // Fetch filtered drivers when location changes
  useEffect(() => {
    const fetchDriversByLocation = async () => {
      if (!vehicle.location_id) return;

      try {
        const res = await fetch(`${BASE_URL}/get-drivers-by-location?location_id=${vehicle.location_id}`);
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          setDrivers(data);
        } else {
          setDrivers([]);
        }
      } catch (err) {
        console.error("Error fetching drivers by location:", err);
        setDrivers([]);
      }
    };

    fetchDriversByLocation();
  }, [vehicle.location_id, BASE_URL]);

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
        alert(`Failed to update: ${data.message || "Unknown error"}`);
        return;
      }

      alert("Vehicle updated successfully.");
      navigate("/admin/vehicles");
    } catch (err) {
      console.error("Update failed:", err);
      alert("An error occurred while updating the vehicle.");
    }
  };

  // Merge in current driver if not in filtered list
  const currentDriverInList = drivers.some((d) => d.driver_id === vehicle.driver_id);
  const driversToShow = currentDriverInList
    ? drivers
    : [
      ...drivers,
      ...allDrivers.filter(
        (drv) => drv.driver_id === vehicle.driver_id
      )
    ];

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
          <select
            name="location_id"
            value={vehicle.location_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Location</option>
            {locations.map((loc) => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.location_name}
              </option>
            ))}
          </select>
          <select
            name="driver_id"
            value={vehicle.driver_id}
            onChange={handleChange}
          >
            <option value="">Select Driver</option>
            {driversToShow.map((drv) => (
              <option key={drv.driver_id} value={drv.driver_id}>
                {drv.driver_name}
              </option>
            ))}
          </select>

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default EditVehicle;
