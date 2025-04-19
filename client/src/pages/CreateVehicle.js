import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function CreateVehicle() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        license_plate: "",
        fuel_type: "",
        location_ID: "",
        Driver_ID: ""
    });

    const [locations, setLocations] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [plateWarning, setPlateWarning] = useState("");

    // Fetches all post office locations
    useEffect(() => {
        fetch(`${BASE_URL}/locations`)
            .then((res) => res.json())
            .then((data) => setLocations(data))
            .catch((err) => console.error("Error fetching locations:", err));
    }, []);

    // Fetches drivers for the selected location
    useEffect(() => {
        if (!formData.location_ID) return;

        fetch(`${BASE_URL}/drivers?location_ID=${formData.location_ID}`)
            .then((res) => res.json())
            .then((data) => setDrivers(data))
            .catch((err) => console.error("Error fetching drivers:", err));
    }, [formData.location_ID]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const vehicleData = {
            license_plate: formData.license_plate,
            fuel_type: formData.fuel_type,
            Location_ID: parseInt(formData.location_ID),
            Driver_ID: parseInt(formData.Driver_ID),
            volume_capacity: 121,
            mileage: 0,
            status: "Available",
            payload_capacity: 1000,
            at_capacity: false
        };


        try {
            const response = await fetch(`${BASE_URL}/delivery-vehicle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vehicleData),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Vehicle created successfully!");
                navigate("/dashboard");
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Server error:", error);
            alert("Could not submit vehicle.");
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <h1 className="register-title">Create Delivery Vehicle</h1>
                <form className="register-form" onSubmit={handleSubmit}>
                    <input
                        name="license_plate"
                        placeholder="License Plate"
                        required
                        maxLength={20}
                        value={formData.license_plate}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, license_plate: value }));
                            setPlateWarning(
                                value.length === 20 ? "You've reached the 20-character limit for license plate." : ""
                            );
                        }}
                    />
                    {plateWarning && (
                        <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                            {plateWarning}
                        </p>
                    )}

                    <select
                        name="fuel_type"
                        required
                        value={formData.fuel_type}
                        onChange={handleChange}
                    >
                        <option value="">Select Fuel Type</option>
                        <option value="gasoline">Gasoline</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                    </select>


                    <select name="location_ID" required onChange={handleChange} value={formData.location_ID}>
                        <option value="">Select Post Office</option>
                        {locations.map((loc) => (
                            <option key={loc.location_ID} value={loc.location_ID}>
                                {loc.name}
                            </option>
                        ))}
                    </select>

                    <select name="Driver_ID" required onChange={handleChange} value={formData.Driver_ID}>
                        <option value="">Select Driver</option>
                        {drivers.map((driver) => (
                            <option key={driver.employee_ID} value={driver.employee_ID}>
                                {driver.First_Name} {driver.Last_Name}
                            </option>
                        ))}
                    </select>





                    <button className="register-button" type="submit">Submit Vehicle</button>
                </form>
            </div>
        </div>
    );
}

export default CreateVehicle;






