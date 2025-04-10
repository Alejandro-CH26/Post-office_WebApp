import React, { useState } from "react";
import "./CheckoutPage.css";
import { useCart } from "./CartContext";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();

  const [form, setForm] = useState({
    street: "",
    unit: "",
    city: "",
    state: "",
    zipcode: "",
  });

  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");

  const customerId = localStorage.getItem("customer_ID");
  const locationId = localStorage.getItem("location_ID");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!locationId) {
      alert("Post office location is missing. Please go back and select a store.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_ID: customerId,
          cart,
          saveAddress,
          shipping: form,
          location_ID: locationId,
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetch(`${BASE_URL}/cart/clear`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_ID: Number(customerId) }),
        });

        clearCart();
        alert("Order placed successfully!");
      } else {
        alert("Order failed: " + (result.error || result.message || "Unknown error."));
      }
    } catch (error) {
      console.error("❌ Error placing order:", error);
      alert("An error occurred. Try again later.");
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <form className="checkout-box" onSubmit={handleSubmit}>
          <h2>Shipping Address</h2>

          <input
            type="text"
            name="street"
            placeholder="Street Address"
            value={form.street}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="unit"
            placeholder="Apt, Suite (optional)"
            value={form.unit}
            onChange={handleChange}
          />
          <div className="row">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="zipcode"
              placeholder="ZIP"
              value={form.zipcode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="saveAddress"
              checked={saveAddress}
              onChange={() => setSaveAddress((prev) => !prev)}
            />
            <label htmlFor="saveAddress">Save this address</label>
          </div>

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

          <button type="submit" className="submit-btn">
            Place Order
          </button>
        </form>

        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <p><strong>Subtotal ({cart.length} items):</strong></p>
          <ul>
            {cart.map((item, index) => (
              <li key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.name} (x{item.quantity})</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <hr />
          <p style={{ fontWeight: "bold" }}>Total: ${getTotal()}</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
