import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
      const response = await fetch("https://post-office-webapp.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });

      const data = await response.json();
      console.log("✅ Server Response:", data);

      if (response.ok) {
        alert("✅ Registration Successful! Please log in.");
        navigate("/login");
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error("❌ Error registering user:", error);
      alert("❌ Server error, please try again later.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">Register</h1>
        <form className="register-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input type="text" placeholder="Middle Name (Optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          <input type="text" placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          <input type="tel" placeholder="Phone Number" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
