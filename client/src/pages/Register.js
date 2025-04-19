import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [phoneWarning, setPhoneWarning] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [usernameWarning, setUsernameWarning] = useState("");
  const [passwordWarning, setPasswordWarning] = useState("");
  const [firstNameWarning, setFirstNameWarning] = useState("");
  const [middleNameWarning, setMiddleNameWarning] = useState("");
  const [lastNameWarning, setLastNameWarning] = useState("");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const BASE_URL = process.env.REACT_APP_API_BASE_URL;


  const handleSubmit = async (e) => {
    e.preventDefault();

    const newCustomer = {
      first_Name: firstName.trim(),
      last_Name: lastName.trim(),
      middle_Name: middleName.trim() || null,
      customer_Email: email.trim(),
      customer_Username: username.trim(),
      customer_Password: password.trim(),
      date_Of_Birth: dob.trim(),
      phone_Number: phoneNumber.trim(),
    };

    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok) {
        alert("Registration Successful! Please log in.");
        navigate("/login");
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error registering user:", error);
      alert("Server error, please try again later.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">Register</h1>
        <form className="register-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            required
            maxLength={100}
            value={email}
            onChange={(e) => {
              const value = e.target.value;
              setEmail(value);

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
            type="text"
            placeholder="Username"
            required
            maxLength={50}
            value={username}
            onChange={(e) => {
              const value = e.target.value;
              setUsername(value);

              if (value.length === 50) {
                setUsernameWarning("You've reached the 50-character limit for username.");
              } else {
                setUsernameWarning("");
              }
            }}
          />
          {usernameWarning && (
            <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
              {usernameWarning}
            </p>
          )}

          <input
            type="password"
            placeholder="Password"
            required
            maxLength={255}
            value={password}
            onChange={(e) => {
              const value = e.target.value;
              setPassword(value);

              if (value.length === 255) {
                setPasswordWarning("You've reached the 255-character limit for password.");
              } else {
                setPasswordWarning("");
              }
            }}
          />
          {passwordWarning && (
            <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
              {passwordWarning}
            </p>
          )}
          <input
            type="text"
            placeholder="First Name"
            required
            maxLength={50}
            value={firstName}
            onChange={(e) => {
              const value = e.target.value;
              setFirstName(value);

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
            placeholder="Middle Name (Optional)"
            maxLength={50}
            value={middleName}
            onChange={(e) => {
              const value = e.target.value;
              setMiddleName(value);

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
            placeholder="Last Name"
            required
            maxLength={50}
            value={lastName}
            onChange={(e) => {
              const value = e.target.value;
              setLastName(value);

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
          <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          <input
            type="tel"
            placeholder="Phone Number"
            required
            maxLength={10}
            value={phoneNumber}
            onChange={(e) => {
              const value = e.target.value;

              if (/^\d*$/.test(value)) {
                setPhoneNumber(value);

                if (value.length === 10) {
                  setPhoneWarning("");
                } else {
                  setPhoneWarning("Phone number must be exactly 10 digits.");
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

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
