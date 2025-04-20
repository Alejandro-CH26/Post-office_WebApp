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
  const [firstNameWarning, setFirstNameWarning] = useState("");
  const [middleNameWarning, setMiddleNameWarning] = useState("");
  const [lastNameWarning, setLastNameWarning] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [streetWarning, setStreetWarning] = useState("");
  const [cityWarning, setCityWarning] = useState("");
  const [apartmentWarning, setApartmentWarning] = useState("");
  const [usernameWarning, setUsernameWarning] = useState("");
  const [passwordWarning, setPasswordWarning] = useState("");
  const [educationWarning, setEducationWarning] = useState("");
  const [genderWarning, setGenderWarning] = useState("");







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
    // Fetches post office locations
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
              <input
                type="text"
                name="Fname"
                placeholder="First Name"
                required
                maxLength={50}
                value={formData.Fname}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, Fname: value }));

                  if (value.length === 50) {
                    setFirstNameWarning("You've reached the 50-character limit for first name.");
                  } else {
                    setFirstNameWarning("");
                  }
                }}
              />
              {firstNameWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {firstNameWarning}
                </p>
              )}
              <input
                type="text"
                name="middleName"
                placeholder="Middle Name (Optional)"
                maxLength={50}
                value={formData.middleName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, middleName: value }));

                  if (value.length === 50) {
                    setMiddleNameWarning("You've reached the 50-character limit for middle name.");
                  } else {
                    setMiddleNameWarning("");
                  }
                }}
              />
              {middleNameWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {middleNameWarning}
                </p>
              )}

              <input
                type="text"
                name="Lname"
                placeholder="Last Name"
                required
                maxLength={50}
                value={formData.Lname}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, Lname: value }));

                  if (value.length === 50) {
                    setLastNameWarning("You've reached the 50-character limit for last name.");
                  } else {
                    setLastNameWarning("");
                  }
                }}
              />
              {lastNameWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {lastNameWarning}
                </p>
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                maxLength={100}
                value={formData.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, email: value }));

                  if (value.length === 100) {
                    setEmailWarning("You've reached the 100-character limit for email.");
                  } else {
                    setEmailWarning("");
                  }
                }}
              />
              {emailWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {emailWarning}
                </p>
              )}


              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                required
                minLength={10}
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;

                  if (/^\d*$/.test(value)) {
                    setFormData((prev) => ({ ...prev, phone: value }));

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
                minLength={10}
                maxLength={10}
                value={formData.emergencyContact}
                onChange={(e) => {
                  const value = e.target.value;

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

              <input
                type="text"
                name="street"
                placeholder="Street"
                required
                maxLength={255}
                value={formData.street}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, street: value }));

                  setStreetWarning(
                    value.length === 255 ? "You've reached the 255-character limit for street." : ""
                  );
                }}
              />
              {streetWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {streetWarning}
                </p>
              )}

              <input
                type="text"
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
                minLength={5}
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
                type="text"
                name="apartmentNumber"
                placeholder="Apt/Unit #"
                maxLength={20}
                value={formData.apartmentNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, apartmentNumber: value }));

                  setApartmentWarning(
                    value.length === 20 ? "You've reached the 20-character limit for Apt/Unit." : ""
                  );
                }}
              />
              {apartmentWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {apartmentWarning}
                </p>
              )}

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

              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                maxLength={50}
                value={formData.username}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, username: value }));

                  setUsernameWarning(
                    value.length === 50 ? "You've reached the 50-character limit for username." : ""
                  );
                }}
              />
              {usernameWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {usernameWarning}
                </p>
              )}

              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                maxLength={255}
                value={formData.password}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, password: value }));

                  setPasswordWarning(
                    value.length === 255 ? "You've reached the 255-character limit for password." : ""
                  );
                }}
              />
              {passwordWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {passwordWarning}
                </p>
              )}

              <input
                type="text"
                name="education"
                placeholder="Education"
                maxLength={50}
                value={formData.education}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, education: value }));

                  setEducationWarning(
                    value.length === 50 ? "You've reached the 50-character limit for education." : ""
                  );
                }}
              />
              {educationWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {educationWarning}
                </p>
              )}

              <input
                type="text"
                name="gender"
                placeholder="Gender"
                required
                maxLength={10}
                value={formData.gender}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, gender: value }));

                  setGenderWarning(
                    value.length === 10 ? "You've reached the 10-character limit for gender." : ""
                  );
                }}
              />
              {genderWarning && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {genderWarning}
                </p>
              )}

            </div>
          </div>

          <div className="dob-section">
            <div className="dob-section">
              {/* Day */}
              <div>
                <input
                  name="dobDay"
                  type="text"
                  placeholder="Day of Birth (ex. 17)"
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
                  placeholder="Month of Birth (ex. 11)"
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
                  placeholder="Year of Birth (ex. 1976)"
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

