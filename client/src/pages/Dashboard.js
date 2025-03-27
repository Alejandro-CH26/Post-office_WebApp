import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        fetch("https://post-office-webapp.onrender.com/dashboard", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "error") {
                    setError("Session expired. Please log in again.");
                    localStorage.removeItem("token"); // Clear token if invalid
                    setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
                } else {
                    setMessage(data.message);
                }
            })
            .catch((error) => {
                console.error("Error fetching dashboard:", error);
                setError("Failed to load dashboard. Please try again.");
            });
    }, [navigate]);

    return (
        <div>
            <h1>Dashboard</h1>
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{message}</p>
            )}
        </div>
    );
}

export default Dashboard;



// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// function Dashboard() {
//     const navigate = useNavigate();
//     const [message, setMessage] = useState("");

//     useEffect(() => {
//         const token = localStorage.getItem("token");

//         if (!token) {
//             navigate("/login");
//             return;
//         }

//         fetch("http://localhost:5001/dashboard", {
//             method: "GET",
//             headers: { Authorization: `Bearer ${token}` },
//         })
//             .then((res) => res.json())
//             .then((data) => setMessage(data.message))
//             .catch((error) => console.error("Error fetching dashboard:", error));
//     }, [navigate]);

//     return (
//         <div>
//             <h1>Dashboard</h1>
//             <p>{message}</p>
//         </div>
//     );
// }

// export default Dashboard;
