import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PackageMaker.css"; // Ensure styling is applied

function WarehouseRegisterPackage() {
    const navigate = useNavigate();
    const [weight, setWeight] = useState("");
    const [senderID, setSenderID] = useState("");
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
    
    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Validation: Ensure all fields are filled before proceeding
        if (!weight || !senderID || !recipientName || !destinationStreet || !destinationCity ||
            !destinationState || !destinationZipcode || !priority || !length || !width || !height) {
            alert("Please fill in all fields before proceeding.");
            return;
        }
    
        const newPackage = {
            weight: parseFloat(weight),
            senderCustomerID: parseInt(senderID, 10),
            recipientCustomerName: recipientName.trim(),
            destinationStreet: destinationStreet,
            destinationCity: destinationCity.trim(),
            destinationState: destinationState.trim(),
            destinationZipcode: destinationZipcode.trim(),
            shippingCost: calculateShippingCost(),
            priority: parseInt(priority, 10), // Ensure priority is stored as an integer
            fragile: fragile ? 1 : 0,
            length: parseFloat(length),
            width: parseFloat(width),
            height: parseFloat(height),
        };
    
        navigate("/warehousepackagecheckout", { state: { packageData: newPackage } });
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

    return (
        <div className="package-container">
            <div className="package-box">
                <h1 className="package-title">Create a Package</h1>
                <form className="package-form" onSubmit={handleSubmit}>
                    <input type="number" placeholder="Weight" required value={weight} onChange={(e) => setWeight(e.target.value)} />
                    <input type="number" placeholder="Sender ID" required value={senderID} onChange={(e) => setSenderID(e.target.value)} />
                    <input type="text" placeholder="Recipient Name" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                    <input type="text" placeholder="Destination Street" required value={destinationStreet} onChange={(e) => setDestinationStreet(e.target.value)} />
                    <input type="text" placeholder="Destination Unit (Leave blank if none)" value={destinationUnit} onChange={(e) => setDestinationUnit(e.target.value)} />
                    <input type="text" placeholder="Destination City" required value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} />

                    {/* State Dropdown */}
                    <select required value={destinationState} onChange={(e) => setDestinationState(e.target.value)}>
                        <option value="">Select Destination State</option>
                        {states.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    <input type="text" placeholder="Destination Zipcode" required value={destinationZipcode} onChange={(e) => setDestinationZipcode(e.target.value)} />

                    {/* Priority Dropdown (Now an Integer) */}
                    <select required value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="">Select Priority Level</option>
                        {priorities.map((level) => (
                            <option key={level} value={level}>{level}</option>
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
