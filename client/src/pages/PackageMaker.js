import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PackageMaker.css"; // Ensure styling is applied

function PackageMaker() {
    const navigate = useNavigate();
    const [weight, setWeight] = useState("");
    const [senderID, setSenderID] = useState("");
    const [recipientID, setRecipientID] = useState("");
    const [originID, setOriginID] = useState("");
    const [destinationID, setDestinationID] = useState("");
    const [shippingCost, setShippingCost] = useState("");
    const [priority, setPriority] = useState("");
    const [fragile, setFragile] = useState(false);
    const [transactionID, setTransactionID] = useState("");
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newPackage = {
            weight: parseFloat(weight),
            sender_Customer_ID: parseInt(senderID),
            recipient_Customer_ID: parseInt(recipientID),
            origin_ID: parseInt(originID),
            destination_ID: parseInt(destinationID),
            shipping_Cost: parseFloat(shippingCost),
            priority: priority.trim(),
            fragile: fragile ? 1 : 0, // Convert boolean to tinyint (1 or 0)
            transaction_ID: parseInt(transactionID),
            length: parseFloat(length),
            width: parseFloat(width),
            height: parseFloat(height),
        };

        try {
            const response = await fetch("https://post-office-webapp.onrender.com/addPackage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPackage),
            });

            const data = await response.json();
            console.log("✅ Server Response:", data);

            if (response.ok) {
                alert("✅ Package Created Successfully!");
                navigate("/trackpackage"); // Redirect to tracking page
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error("❌ Error adding package:", error);
            alert("❌ Server error, please try again later.");
        }
    };

    return (
        <div className="package-container">
            <div className="package-box">
                <h1 className="package-title">Create a Package</h1>
                <form className="package-form" onSubmit={handleSubmit}>
                    <input type="number" placeholder="Weight" required value={weight} onChange={(e) => setWeight(e.target.value)} />
                    <input type="number" placeholder="Sender ID" required value={senderID} onChange={(e) => setSenderID(e.target.value)} />
                    <input type="number" placeholder="Recipient ID" required value={recipientID} onChange={(e) => setRecipientID(e.target.value)} />
                    <input type="number" placeholder="Origin ID" required value={originID} onChange={(e) => setOriginID(e.target.value)} />
                    <input type="number" placeholder="Destination ID" required value={destinationID} onChange={(e) => setDestinationID(e.target.value)} />
                    <input type="number" placeholder="Shipping Cost" required value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
                    <input type="text" placeholder="Priority Level" required value={priority} onChange={(e) => setPriority(e.target.value)} />
                    <label>
                        Fragile:
                        <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
                    </label>
                    <input type="number" placeholder="Transaction ID" required value={transactionID} onChange={(e) => setTransactionID(e.target.value)} />
                    <input type="number" placeholder="Length" required value={length} onChange={(e) => setLength(e.target.value)} />
                    <input type="number" placeholder="Width" required value={width} onChange={(e) => setWidth(e.target.value)} />
                    <input type="number" placeholder="Height" required value={height} onChange={(e) => setHeight(e.target.value)} />
                    <button type="submit">Create Package</button>
                </form>
            </div>
        </div>
    );
}

export default PackageMaker;
