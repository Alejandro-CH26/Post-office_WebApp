import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PackageMaker.css"; // Ensure styling is applied

function WarehouseRegisterPackage() {
    const navigate = useNavigate();
    const [weight, setWeight] = useState("");
    const [senderEmail, setSenderEmail] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [destinationStreet, setDestinationStreet] = useState("");
    const [destinationCity, setDestinationCity] = useState("");
    const [destinationState, setDestinationState] = useState("");
    const [destinationZipcode, setDestinationZipcode] = useState("");
    const [destinationUnit, setDestinationUnit] = useState(null);
    const [priority, setPriority] = useState(""); // Storing priority as an integer
    const [fragile, setFragile] = useState(false);
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");

    const BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const calculateShippingCost = () => {
        return parseFloat(weight) * (1 + (parseInt(priority, 10) / 5)) + (fragile ? 10 : 0);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Validation: Ensure all fields are filled before proceeding
        if (!weight || !senderEmail || !recipientName || !destinationStreet || !destinationCity ||
            !destinationState || !destinationZipcode || !priority || !length || !width || !height) {
            alert("Please fill in all fields before proceeding.");
            return;
        }
    
        try {
            // Make a POST request to check the sender email and retrieve customer_ID
            const employeeID = localStorage.getItem("employee_ID");
            const response = await fetch(`${BASE_URL}/warehousecheckemail?employeeID=${employeeID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderCustomerEmail: senderEmail }),
            });
    
            const data = await response.json();
            console.log("Server Response:", data);
    
            if (!response.ok) {
                alert(`Error: ${data.message}`);
                return;
            }
    
            // Create package object with retrieved customer_ID
            const newPackage = {
                weight: parseFloat(weight),
                senderCustomerID: data.customer_ID, // Store retrieved customer_ID
                recipientCustomerName: recipientName.trim(),
                destinationStreet: destinationStreet,
                destinationCity: destinationCity.trim(),
                destinationState: destinationState.trim(),
                destinationZipcode: destinationZipcode.trim(),
                shippingCost: calculateShippingCost(),
                priority: parseInt(priority, 10),
                fragile: fragile ? 1 : 0,
                length: parseFloat(length),
                width: parseFloat(width),
                height: parseFloat(height),
            };
    
            // Navigate to checkout with package data
            navigate("/warehousepackagecheckout", { state: { packageData: newPackage } });
    
        } catch (error) {
            console.error("Network Error:", error);
            alert("Failed to connect to the server. Please try again.");
        }
    };
    

    // Dropdown options
    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    const priorities = [1, 2, 3, 4, 5]; // Ensure priority options are integers

    const priorityOptions = {
        1: "Economy",
        2: "Standard",
        3: "First-Class",
        4: "Priority",
        5: "Express",
    };

    return (
        <div className="package-container">
            <div className="package-box">
                <h1 className="package-title">Create a Package</h1>
                <form className="package-form" onSubmit={handleSubmit}>
                    <input type="number" placeholder="Weight" required value={weight} onChange={(e) => setWeight(e.target.value)} />
                    <input type="text" placeholder="Sender Email" required value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                    <input type="text" placeholder="Recipient Name" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                    <input type="text" placeholder="Destination Street" required value={destinationStreet} onChange={(e) => setDestinationStreet(e.target.value)} />
                    <input type="text" placeholder="Destination Unit (Leave blank if none)" value={destinationUnit} onChange={(e) => setDestinationUnit(e.target.value)} />
                    <input type="text" placeholder="Destination City" required value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} />

                    {/* State Dropdown */}
                    <select className="select-input" required value={destinationState} onChange={(e) => setDestinationState(e.target.value)}>
                        <option value="">Select Destination State</option>
                        {states.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    <input type="text" placeholder="Destination Zipcode" required value={destinationZipcode} onChange={(e) => setDestinationZipcode(e.target.value)} />

                    {/* Priority Dropdown (Now an Integer) */}
                    <select className="select-input" required value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="">Select Priority Level</option>
                        {Object.entries(priorityOptions).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    <label>
                        Fragile:
                        <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
                    </label>

                    <input type="number" placeholder="Length" required value={length} onChange={(e) => setLength(e.target.value)} />
                    <input type="number" placeholder="Width" required value={width} onChange={(e) => setWidth(e.target.value)} />
                    <input type="number" placeholder="Height" required value={height} onChange={(e) => setHeight(e.target.value)} />
                    <button type="submit">Create Package</button>
                </form>
            </div>
        </div>
    );
}

export default WarehouseRegisterPackage;
