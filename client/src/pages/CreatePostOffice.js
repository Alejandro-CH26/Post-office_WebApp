import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function PostOfficeForm() {
    const navigate = useNavigate();
    const [zipWarning, setZipWarning] = useState("");
    const [phoneWarning, setPhoneWarning] = useState("");

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

<<<<<<< HEAD
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
=======
        try {
            const response = await fetch(`${BASE_URL}/post-office`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
>>>>>>> d967b301f65151fee805641c3d3a30a894889256

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
                    <input name="name" placeholder="Post Office Name" required onChange={handleChange} />
                    <input name="street_address" placeholder="Street Address" required onChange={handleChange} />
                    <input name="city" placeholder="City" required onChange={handleChange} />
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
                        pattern="^\d{5}$"
                        maxLength={5}
                        value={formData.zip}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value) && value.length <= 5) {
                                setFormData((prev) => ({ ...prev, zip: value }));
                                setZipWarning("");
                            } else {
                                setZipWarning("Zip Code must be 5 digits only.");
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
