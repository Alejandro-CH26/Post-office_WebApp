import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function PostOfficeForm() {
    const navigate = useNavigate();
    const [zipWarning, setZipWarning] = useState("");
    const [phoneWarning, setPhoneWarning] = useState("");
    const [nameWarning, setNameWarning] = useState("");
    const [streetWarning, setStreetWarning] = useState("");
    const [cityWarning, setCityWarning] = useState("");


    const BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const [formData, setFormData] = useState({
        name: "",
        street_address: "",
        city: "",
        state: "",
        zip: "",
        office_phone: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${BASE_URL}/post-office`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Post office successfully registered!");
                navigate("/dashboard");
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error creating post office:", error);
            alert("Server error, please try again later.");
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <h1 className="register-title">Create Post Office</h1>
                <form className="register-form" onSubmit={handleSubmit}>
                    <input
                        name="name"
                        placeholder="Post Office Name"
                        required
                        maxLength={100}
                        value={formData.name}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, name: value }));
                            setNameWarning(
                                value.length === 100 ? "You've reached the 100-character limit for post office name." : ""
                            );
                        }}
                    />
                    {nameWarning && (
                        <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                            {nameWarning}
                        </p>
                    )}

                    <input
                        name="street_address"
                        placeholder="Street Address"
                        required
                        maxLength={255}
                        value={formData.street_address}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, street_address: value }));
                            setStreetWarning(
                                value.length === 255 ? "You've reached the 255-character limit for street address." : ""
                            );
                        }}
                    />
                    {streetWarning && (
                        <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                            {streetWarning}
                        </p>
                    )}
                    <input
                        name="city"
                        placeholder="City"
                        required
                        maxLength={100}
                        value={formData.city}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, city: value }));
                            setCityWarning(
                                value.length === 100 ? "You've reached the 100-character limit for city." : ""
                            );
                        }}
                    />
                    {cityWarning && (
                        <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                            {cityWarning}
                        </p>
                    )}

                    <select
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                    >
                        <option value="">Select State</option>
                        {[
                            "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                            "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                            "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
                            "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
                            "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
                        ].map((abbr) => (
                            <option key={abbr} value={abbr}>
                                {abbr}
                            </option>
                        ))}
                    </select>

                    <input
                        name="zip"
                        placeholder="Zip Code"
                        required
                        maxLength={5}
                        value={formData.zip}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setFormData((prev) => ({ ...prev, zip: value }));
                                if (value.length > 0 && value.length !== 5) {
                                    setZipWarning("Zip Code must be exactly 5 digits.");
                                } else {
                                    setZipWarning("");
                                }
                            } else {
                                setZipWarning("Zip Code must contain digits only.");
                            }
                        }}
                    />
                    {zipWarning && (
                        <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                            {zipWarning}
                        </p>
                    )}

                    <input
                        type="tel"
                        name="office_phone"
                        placeholder="Office Phone"
                        required
                        maxLength={10}
                        value={formData.office_phone}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setFormData((prev) => ({ ...prev, office_phone: value }));
                                if (value.length > 0 && value.length !== 10) {
                                    setPhoneWarning("Phone number must be exactly 10 digits.");
                                } else {
                                    setPhoneWarning("");
                                }
                            } else {
                                setPhoneWarning("Only numbers are allowed.");
                            }
                        }}
                    />
                    {phoneWarning && (
                        <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                            {phoneWarning}
                        </p>
                    )}
                    <button type="submit">Create</button>
                </form>
            </div>
        </div>
    );
}

export default PostOfficeForm;
