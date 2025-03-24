import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employee_token");
    localStorage.removeItem("role");
    localStorage.removeItem("employee_ID");
    localStorage.removeItem("employee_name");
    localStorage.removeItem("customer_ID");
    localStorage.removeItem("customer_name");

    window.location.href = "/login";
  };



  return (
    <nav className="navbar">
      <div className="logo">Post Office</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/faq">FAQ</Link></li>

        {/* Customer-only routes */}
        {token && role === "customer" && (
          <>
            <li><Link to="/PackageMaker">PM</Link></li>
            <li><Link to="/trackpackage">Track a Package</Link></li>
            <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>
          </>
        )}

        {/* Employee-only route (optional) */}
        {token && role === "employee" && (
          <>
            <li><Link to="/onboard">Onboard Employee</Link></li>
            {/* Add driver/warehouse stuff here */}
          </>
        )}

        {/* Only show these if NOT logged in */}
        {!token && (
          <>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/employee-login">Employee Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}

        {/* Show logout if logged in */}
        {token && (
          <li>
            <button onClick={handleLogout} className="logout-button">Log Out</button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;




// import React from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./Navbar.css"; // Ensure this file exists

// function Navbar() {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem("token"); // Remove token from local storage
//     navigate("/login"); // Redirect to login page
//   };

//   return (
//     <nav className="navbar">
//       <div className="logo">Post Office</div>
//       <ul className="nav-links">
//         <li><Link to="/">Home</Link></li>
//         <li><Link to="/faq">FAQ</Link></li>
//         <li><Link to="/PackageMaker">PM</Link></li>
//         <li><Link to="/trackpackage">Track a Package</Link></li>
//         <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>

//         {/* Only show Onboard Employee if the user is logged in */}
//         {localStorage.getItem("token") && (
//           <li><Link to="/onboard">Onboard Employee</Link></li>
//         )}

//         {/* Show Log In/Register if no token, otherwise show Log Out */}
//         {!localStorage.getItem("token") ? (
//           <>
//             <li><Link to="/login">Log in</Link></li>
//             <li><Link to="/employee-login">Employee Login</Link></li>
//             <li><Link to="/register">Register</Link></li>

//           </>
//         ) : (
//           <li><button onClick={handleLogout} className="logout-button">Log Out</button></li>
//         )}
//       </ul>
//     </nav>
//   );
// }

// export default Navbar;



// import React from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./Navbar.css"; // Ensure this file exists

// function Navbar() {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem("token"); // Remove token from local storage
//     navigate("/login"); // Redirect to login page
//   };

//   return (
//     <nav className="navbar">
//       <div className="logo">Post Office</div>
//       <ul className="nav-links">
//         <li><Link to="/">Home</Link></li>
//         <li><Link to="/faq">FAQ</Link></li>
//         <li><Link to="/PackageMaker">PM</Link></li>
//         <li><Link to="/trackpackage">Track a Package</Link></li>
//         <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>

//         {/* Show Log In/Register if no token, otherwise show Log Out */}
//         {!localStorage.getItem("token") ? (
//           <>
//             <li><Link to="/login">Log in</Link></li>
//             <li><Link to="/register">Register</Link></li>
//           </>
//         ) : (
//           <li><button onClick={handleLogout} className="logout-button">Log Out</button></li>
//         )}
//       </ul>
//     </nav>
//   );
// }

// export default Navbar;




// import React from "react";
// import { Link } from "react-router-dom";
// import "./Navbar.css"; // Ensure this file exists

// function Navbar() {
//   return (
//     <nav className="navbar">
//       <div className="logo">Post Office</div>
//       <ul className="nav-links">
//         <li><Link to="/">Home</Link></li>
//         <li><Link to="/faq">FAQ</Link></li>
//         <li><Link to="/trackpackage">Track a Package</Link></li>
//         <li><Link to="/buyinventory">Buy Stamps/Inventory</Link></li>
//         <li><Link to="/login">Log in</Link></li>
//         <li><Link to="/register">Register</Link></li>
//       </ul>
//     </nav>
//   );
// }

// export default Navbar;
