import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./WarehousePackageCheckout.css";

function WarehousePackageCheckout() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [paymentMethod, setPaymentMethod] = useState("Credit Card");

    var packageData = state?.packageData;
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;

    if (!packageData) {
        return <p> Error: No package data found.</p>;
    }

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
    
        const packageWithPayment = {
            ...packageData, // Include existing package data
            paymentMethod: paymentMethod, // Add selected payment method
        };
        console.log("Payment Method", paymentMethod);
    
        try {
            const employeeID = localStorage.getItem("employee_ID");
            const response = await fetch(`${BASE_URL}/warehouseregisterpackage?employeeID=${employeeID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageWithPayment),
            });
    
            const data = await response.json();
            console.log("Server Response:", data);
    
            if (response.ok) {
                // Navigate to success page and pass trackingNumber as state
                navigate("/WarehousePackageSuccess", { state: { trackingNumber: data.trackingNumber } });
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment failed. Try again.");
        }
    };
    

    return (
        <div className="checkout-wrapper">
            <div className="package-summary">
                <h2>Package Summary</h2>
                <p>Recipient: {packageData.recipientCustomerName}</p>
                <p>Weight: {packageData.weight} lbs</p>
                <p>Destination: {packageData.destinationStreet}, {packageData.destinationCity}, {packageData.destinationState} {packageData.destinationZipcode}</p>
                <p>Priority: {packageData.priority}</p>
                <p>Fragile: {packageData.fragile ? "Yes" : "No"}</p>
                <p>Size: {packageData.length} x {packageData.width} x {packageData.height}</p>
                <p style={{ fontWeight: "bold" }}>Shipping Cost: ${packageData.shippingCost.toFixed(2)}</p>
            </div>

            <form className="checkout-box" onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                    <label htmlFor="paymentMethod">Payment Method</label>
                    <select 
                        id="paymentMethod" 
                        className="select-input" 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                        required
                    >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                    </select>
                </div>

                <div className="payment-details">
                    <input type="text" placeholder="Card Number" minLength="16" maxLength="16" pattern="\d{16}" required />
                    <input type="text" placeholder="Exp. (MM/YY)" pattern="(0[1-9]|1[0-2])\/[0-9]{2}" required />
                    <input type="text" placeholder="CVV" minLength="3" maxLength="4" pattern="\d{3,4}" required />
                </div>

                <button type="submit" className="submit-btn">Checkout</button>
                <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>Cancel</button>
            </form>
        </div>
    );
}

export default WarehousePackageCheckout;
