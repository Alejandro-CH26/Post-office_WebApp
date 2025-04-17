import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function PostOfficeForm() {
  const navigate = useNavigate();
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
          <input name="name" placeholder="Post Office Name" required onChange={handleChange} />
          <input name="street_address" placeholder="Street Address" required onChange={handleChange} />
          <input name="city" placeholder="City" required onChange={handleChange} />
          <input name="state" placeholder="State" required onChange={handleChange} />
          <input name="zip" placeholder="Zip Code" required onChange={handleChange} />
          <input name="office_phone" placeholder="Office Phone" required onChange={handleChange} />
          <button type="submit">Create</button>
        </form>
      </div>
    </div>
  );
}

export default PostOfficeForm;
