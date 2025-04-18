import React, { useState, useEffect } from "react";
import "./Onboard.css";

function OnboardEmployee() {
  const [locations, setLocations] = useState([]);
  const [zipWarning, setZipWarning] = useState("");
  const [phoneWarning, setPhoneWarning] = useState("");
  const [emergencyWarning, setEmergencyWarning] = useState("");
  const [dobDayWarning, setDobDayWarning] = useState("");
  const [dobMonthWarning, setDobMonthWarning] = useState("");
  const [dobYearWarning, setDobYearWarning] = useState("");



  const [formData, setFormData] = useState({
    Fname: "",
    middleName: "",
    Lname: "",
    email: "",
    phone: "",
    emergencyContact: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    apartmentNumber: "",
    role: "",
    hourlyWage: "",
    locationID: "",
    username: "",
    password: "",
    education: "",
    gender: "",
    dobDay: "",
    dobMonth: "",
    dobYear: ""
  });

  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    // Fetch post office locations
    fetch(`${BASE_URL}/locations`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error("Error fetching locations:", err));
  }, [BASE_URL]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      const response = await fetch(`${BASE_URL}/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert("Employee onboarded successfully!");
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="onboard-container">
      <div className="onboard-box">
        <h1 className="onboard-title">Employee Onboarding</h1>
        <form className="onboard-form" onSubmit={handleSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <input name="Fname" placeholder="First Name" required onChange={handleChange} />
              <input name="middleName" placeholder="Middle Name (Optional)" onChange={handleChange} />
              <input name="Lname" placeholder="Last Name" required onChange={handleChange} />
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={handleChange}
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                required
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow only digits
                  if (/^\d*$/.test(value)) {
                    setFormData((prev) => ({ ...prev, phone: value }));

                    // Checks if it's exactly 10 digits
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
              <input
                type="tel"
                name="emergencyContact"
                placeholder="Emergency Contact"
                required
                maxLength={10}
                value={formData.emergencyContact}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow only digits
                  if (/^\d*$/.test(value)) {
                    setFormData((prev) => ({ ...prev, emergencyContact: value }));

                    if (value.length > 0 && value.length !== 10) {
                      setEmergencyWarning("Emergency contact must be exactly 10 digits.");
                    } else {
                      setEmergencyWarning("");
                    }
                  } else {
                    setEmergencyWarning("Only numbers are allowed.");
                  }
                }}
              />
              {emergencyWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {emergencyWarning}
                </p>
              )}
              <input name="street" placeholder="Street" required onChange={handleChange} />
              <input name="city" placeholder="City" required onChange={handleChange} />
              <select
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">Select Destination State</option>
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

            </div>

            <div className="form-column">
              <input
                name="zip"
                placeholder="Zip Code"
                required
                pattern="^\d{5}$"
                title="Zip Code must be exactly 5 digits"
                maxLength={5}
                value={formData.zip}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setFormData((prev) => ({ ...prev, zip: value }));
                    setZipWarning("");
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

              <input name="apartmentNumber" placeholder="Apt/Unit #" onChange={handleChange} />
              <select name="role" required value={formData.role} onChange={handleChange}>
                <option value="">Select Role</option>
                <option value="driver">Driver</option>
                <option value="warehouse">Warehouse</option>
              </select>

              <input name="hourlyWage" type="number" placeholder="Hourly Wage" required onChange={handleChange} />
              <select
                name="locationID"
                required
                value={formData.locationID}
                onChange={(e) => {
                  const selectedID = e.target.value;
                  const selectedLocation = locations.find(loc => loc.location_ID.toString() === selectedID);
                  setFormData(prev => ({
                    ...prev,
                    locationID: selectedID,
                    location: selectedLocation?.name || ""
                  }));
                }}
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.location_ID} value={loc.location_ID}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <input name="username" placeholder="Username" required onChange={handleChange} />
              <input name="password" type="password" placeholder="Password" required onChange={handleChange} />
              <input name="education" placeholder="Education" onChange={handleChange} />
              <input name="gender" placeholder="Gender" required onChange={handleChange} />
            </div>
          </div>

          <div className="dob-section">
            <div className="dob-section">
              {/* Day */}
              <div>
                <input
                  name="dobDay"
                  type="text"
                  placeholder="Day of Birth"
                  required
                  maxLength={2}
                  value={formData.dobDay}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 2) {
                      setFormData(prev => ({ ...prev, dobDay: value }));
                      const num = parseInt(value, 10);
                      if (value && (num < 1 || num > 31)) {
                        setDobDayWarning("Day must be between 1 and 31.");
                      } else {
                        setDobDayWarning("");
                      }
                    }
                  }}
                />
                {dobDayWarning && <p style={{ color: "red", fontSize: "0.85rem" }}>{dobDayWarning}</p>}
              </div>

              {/* Month */}
              <div>
                <input
                  name="dobMonth"
                  type="text"
                  placeholder="Month of Birth"
                  required
                  maxLength={2}
                  value={formData.dobMonth}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 2) {
                      setFormData(prev => ({ ...prev, dobMonth: value }));
                      const num = parseInt(value, 10);
                      if (value && (num < 1 || num > 12)) {
                        setDobMonthWarning("Month must be between 1 and 12.");
                      } else {
                        setDobMonthWarning("");
                      }
                    }
                  }}
                />
                {dobMonthWarning && <p style={{ color: "red", fontSize: "0.85rem" }}>{dobMonthWarning}</p>}
              </div>

              {/* Year */}
              <div>
                <input
                  name="dobYear"
                  type="text"
                  placeholder="Year of Birth"
                  required
                  maxLength={4}
                  value={formData.dobYear}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 4) {
                      setFormData(prev => ({ ...prev, dobYear: value }));
                      const num = parseInt(value, 10);
                      if (value && (num < 1900 || num > 2025)) {
                        setDobYearWarning("Year must be between 1900 and 2025.");
                      } else {
                        setDobYearWarning("");
                      }
                    }
                  }}
                />
                {dobYearWarning && <p style={{ color: "red", fontSize: "0.85rem" }}>{dobYearWarning}</p>}
              </div>
            </div>

          </div>

          <button className="onboard-button" type="submit">Onboard Employee</button>
        </form>
      </div>
    </div>


  );
}

export default OnboardEmployee;

