import React, { useState } from "react";

function Onboard() {
  const [employee, setEmployee] = useState({
    employeeID: "",
    Fname: "",
    middleName: "",
    Lname: "",
    email: "",
    phone: "",
    emergencyContact: "",
    addressID: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    apartmentNumber: "",
    role: "",
    hourlyWage: "",
    supervisorID: "",
    location: "",
    locationID: "",
    username: "",
    password: "",
    education: "",
    gender: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmployee({
      ...employee,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    let formErrors = {};
    if (!employee.employeeID) formErrors.employeeID = "Employee ID is required.";
    if (!employee.Fname) formErrors.Fname = "First name is required.";
    if (!employee.Lname) formErrors.Lname = "Last name is required.";
    if (!employee.email) formErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(employee.email)) formErrors.email = "Email is invalid.";
    if (!employee.phone) formErrors.phone = "Phone number is required.";
    if (!employee.role) formErrors.role = "Role is required.";
    if (!employee.dobDay || !employee.dobMonth || !employee.dobYear) formErrors.dob = "Complete date of birth is required.";
    if (!employee.gender) formErrors.gender = "Gender is required.";
    if (!employee.username) formErrors.username = "Username is required.";
    if (!employee.password) formErrors.password = "Password is required.";
    if (!employee.street) formErrors.street = "Street address is required.";
    if (!employee.city) formErrors.city = "City is required.";
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("https://post-office-webapp.onrender.com/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Employee onboarded successfully!");
        setEmployee({
          employeeID: "",
          Fname: "",
          middleName: "",
          Lname: "",
          email: "",
          phone: "",
          emergencyContact: "",
          addressID: "",
          street: "",
          city: "",
          state: "",
          zip: "",
          apartmentNumber: "",
          role: "",
          hourlyWage: "",
          supervisorID: "",
          location: "",
          locationID: "",
          username: "",
          password: "",
          education: "",
          gender: "",
          dobDay: "",
          dobMonth: "",
          dobYear: "",
        });
      } else {
        alert(data.error || "An error occurred");
      }
    } catch (error) {
      alert("Failed to submit data. Check your server connection.");
    } finally {
      setLoading(false);
    }
  };

  const formStyles = {
    container: {
      padding: "32px",
      maxWidth: "900px",
      margin: "0 auto",
      backgroundColor: "white",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      borderRadius: "16px",
    },
    header: {
      textAlign: "center",
      fontSize: "32px",
      fontWeight: "bold",
      marginBottom: "40px",
      color: "#4A90E2",
    },
    subHeader: {
      textAlign: "center",
      fontSize: "18px",
      marginBottom: "24px",
      color: "#606060",
    },
    label: {
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "8px",
      color: "#333333",
    },
    input: {
      padding: "16px",
      borderRadius: "8px",
      border: "2px solid #D1D5DB",
      width: "100%",
      marginBottom: "24px",
      fontSize: "16px",
    },
    inputError: {
      borderColor: "red",
    },
    errorMessage: {
      color: "red",
      fontSize: "14px",
      marginBottom: "16px",
    },
    button: {
      backgroundColor: "#4A90E2",
      color: "white",
      padding: "16px",
      borderRadius: "8px",
      width: "100%",
      cursor: "pointer",
      fontSize: "18px",
      fontWeight: "bold",
    },
  };

  // Generate days and months for dropdown
  const generateDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    return days;
  };

  const generateMonths = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months;
  };

  return (
    <div style={formStyles.container}>
      <h1 style={formStyles.header}>Onboard Employee</h1>
      <p style={formStyles.subHeader}>Please fill in the details below:</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>Employee Identification</h2>

          <label style={formStyles.label}>Employee ID</label>
          <input
            type="text"
            name="employeeID"
            value={employee.employeeID}
            onChange={handleChange}
            placeholder="Enter employee ID"
            style={{
              ...formStyles.input,
              ...(errors.employeeID ? formStyles.inputError : {}),
            }}
          />
          {errors.employeeID && <p style={formStyles.errorMessage}>{errors.employeeID}</p>}

          <label style={formStyles.label}>Username</label>
          <input
            type="text"
            name="username"
            value={employee.username}
            onChange={handleChange}
            placeholder="Enter username"
            style={{
              ...formStyles.input,
              ...(errors.username ? formStyles.inputError : {}),
            }}
          />
          {errors.username && <p style={formStyles.errorMessage}>{errors.username}</p>}

          <label style={formStyles.label}>Password</label>
          <input
            type="password"
            name="password"
            value={employee.password}
            onChange={handleChange}
            placeholder="Enter password"
            style={{
              ...formStyles.input,
              ...(errors.password ? formStyles.inputError : {}),
            }}
          />
          {errors.password && <p style={formStyles.errorMessage}>{errors.password}</p>}
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>Personal Information</h2>

          <label style={formStyles.label}>First Name</label>
          <input
            type="text"
            name="Fname"
            value={employee.Fname}
            onChange={handleChange}
            placeholder="Enter first name"
            style={{
              ...formStyles.input,
              ...(errors.Fname ? formStyles.inputError : {}),
            }}
          />
          {errors.Fname && <p style={formStyles.errorMessage}>{errors.Fname}</p>}

          <label style={formStyles.label}>Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={employee.middleName}
            onChange={handleChange}
            placeholder="Enter middle name"
            style={formStyles.input}
          />

          <label style={formStyles.label}>Last Name</label>
          <input
            type="text"
            name="Lname"
            value={employee.Lname}
            onChange={handleChange}
            placeholder="Enter last name"
            style={{
              ...formStyles.input,
              ...(errors.Lname ? formStyles.inputError : {}),
            }}
          />
          {errors.Lname && <p style={formStyles.errorMessage}>{errors.Lname}</p>}

          <label style={formStyles.label}>Gender</label>
          <select
            name="gender"
            value={employee.gender}
            onChange={handleChange}
            style={{
              ...formStyles.input,
              ...(errors.gender ? formStyles.inputError : {}),
            }}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p style={formStyles.errorMessage}>{errors.gender}</p>}

          <label style={formStyles.label}>Date of Birth</label>
          <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
            <select
              name="dobDay"
              value={employee.dobDay}
              onChange={handleChange}
              style={formStyles.input}
            >
              <option value="">Day</option>
              {generateDays().map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <select
              name="dobMonth"
              value={employee.dobMonth}
              onChange={handleChange}
              style={formStyles.input}
            >
              <option value="">Month</option>
              {generateMonths().map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>

            <input
              type="text"
              name="dobYear"
              value={employee.dobYear}
              onChange={handleChange}
              placeholder="Year"
              style={formStyles.input}
            />
          </div>
          {errors.dob && <p style={formStyles.errorMessage}>{errors.dob}</p>}
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>Address Information</h2>

          <label style={formStyles.label}>Address ID</label>
          <input
            type="text"
            name="addressID"
            value={employee.addressID}
            onChange={handleChange}
            placeholder="Address ID"
            style={formStyles.input}
          />

          <label style={formStyles.label}>Street</label>
          <input
            type="text"
            name="street"
            value={employee.street}
            onChange={handleChange}
            placeholder="Street address"
            style={{
              ...formStyles.input,
              ...(errors.street ? formStyles.inputError : {}),
            }}
          />
          {errors.street && <p style={formStyles.errorMessage}>{errors.street}</p>}

          <label style={formStyles.label}>Apartment #</label>
          <input
            type="text"
            name="apartmentNumber"
            value={employee.apartmentNumber}
            onChange={handleChange}
            placeholder="Apartment number"
            style={formStyles.input}
          />

          <label style={formStyles.label}>City</label>
          <input
            type="text"
            name="city"
            value={employee.city}
            onChange={handleChange}
            placeholder="City"
            style={{
              ...formStyles.input,
              ...(errors.city ? formStyles.inputError : {}),
            }}
          />
          {errors.city && <p style={formStyles.errorMessage}>{errors.city}</p>}

          <label style={formStyles.label}>State</label>
          <input
            type="text"
            name="state"
            value={employee.state}
            onChange={handleChange}
            placeholder="State"
            style={formStyles.input}
          />

          <label style={formStyles.label}>ZIP Code</label>
          <input
            type="text"
            name="zip"
            value={employee.zip}
            onChange={handleChange}
            placeholder="ZIP code"
            style={formStyles.input}
          />
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>Contact Information</h2>

          <label style={formStyles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={employee.email}
            onChange={handleChange}
            placeholder="Email"
            style={{
              ...formStyles.input,
              ...(errors.email ? formStyles.inputError : {}),
            }}
          />
          {errors.email && <p style={formStyles.errorMessage}>{errors.email}</p>}

          <label style={formStyles.label}>Phone Number</label>
          <input
            type="text"
            name="phone"
            value={employee.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            style={{
              ...formStyles.input,
              ...(errors.phone ? formStyles.inputError : {}),
            }}
          />
          {errors.phone && <p style={formStyles.errorMessage}>{errors.phone}</p>}

          <label style={formStyles.label}>Emergency Contact</label>
          <input
            type="text"
            name="emergencyContact"
            value={employee.emergencyContact}
            onChange={handleChange}
            placeholder="Emergency Contact Number"
            style={formStyles.input}
          />
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>Job Information</h2>

          <label style={formStyles.label}>Role</label>
          <input
            type="text"
            name="role"
            value={employee.role}
            onChange={handleChange}
            placeholder="Role"
            style={{
              ...formStyles.input,
              ...(errors.role ? formStyles.inputError : {}),
            }}
          />
          {errors.role && <p style={formStyles.errorMessage}>{errors.role}</p>}

          <label style={formStyles.label}>Hourly Wage</label>
          <input
            type="text"
            name="hourlyWage"
            value={employee.hourlyWage}
            onChange={handleChange}
            placeholder="Hourly Wage"
            style={formStyles.input}
          />

          <label style={formStyles.label}>Supervisor ID</label>
          <input
            type="text"
            name="supervisorID"
            value={employee.supervisorID}
            onChange={handleChange}
            placeholder="Supervisor ID"
            style={formStyles.input}
          />

          <label style={formStyles.label}>Location</label>
          <input
            type="text"
            name="location"
            value={employee.location}
            onChange={handleChange}
            placeholder="Work Location"
            style={formStyles.input}
          />

          <label style={formStyles.label}>Location ID</label>
          <input
            type="text"
            name="locationID"
            value={employee.locationID}
            onChange={handleChange}
            placeholder="Location ID"
            style={formStyles.input}
          />

          <label style={formStyles.label}>Education</label>
          <input
            type="text"
            name="education"
            value={employee.education}
            onChange={handleChange}
            placeholder="Education Level"
            style={formStyles.input}
          />
        </div>

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...formStyles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Submit Onboarding Form"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Onboard;