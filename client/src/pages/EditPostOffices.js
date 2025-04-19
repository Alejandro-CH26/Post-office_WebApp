import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditPostOffices.css"; 

function EditPostOffice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [office, setOffice] = useState({
    name: "",
    street_address: "",
    city: "",
    state: "",
    zip: "",
    office_phone: ""
  });

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const res = await fetch(`${BASE_URL}/get-postoffice/${id}`);
        const data = await res.json();
        console.log("📦 Loaded Post Office:", data);

        if (res.ok && data) {
          setOffice({
            name: data.name || "",
            street_address: data.street_address || "",
            city: data.city || "",
            state: data.state || "",
            zip: data.zip || "",
            office_phone: data.office_phone || ""
          });
        } else {
          alert("Post office not found.");
          navigate("/admin/postoffices");
        }
      } catch (err) {
        console.error("❌ Error fetching post office:", err);
        alert("Failed to load post office data.");
        navigate("/admin/postoffices");
      }
    };

    fetchOffice();
  }, [id, BASE_URL, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOffice(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {
      address_ID: id,
      ...office
    };

    try {
      const res = await fetch(`${BASE_URL}/update-postoffice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Post Office updated successfully.");
        navigate("/admin/postoffices");
      } else {
        alert(`❌ Failed to update: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("An error occurred while updating the post office.");
    }
  };

  return (
    <div className="edit-container">
      <div className="edit-box">
        <h1 className="edit-title">Edit Post Office</h1>
        <form className="edit-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Post Office Name"
            value={office.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="street_address"
            placeholder="Street Address"
            value={office.street_address}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={office.city}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={office.state}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="zip"
            placeholder="Zip Code"
            value={office.zip}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="office_phone"
            placeholder="Phone Number"
            value={office.office_phone}
            onChange={handleChange}
            required
          />
          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default EditPostOffice;
