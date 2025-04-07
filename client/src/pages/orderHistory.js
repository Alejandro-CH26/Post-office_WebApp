import React, { useEffect, useState } from "react";
import "./orderHistory.css";

import expressMailImage from "../images/express_mail.jpg";
import ShippingLabel from "../images/ShippingLabel.jpg";
import BubbleEnvelope from "../images/BubbleEnvelope2.jpg";
import smallbox from "../images/smallbox.webp";
import medbox from "../images/medbox.webp";
import largebox from "../images/largebox.webp";
import packagetape from "../images/packagetape.webp";
import packageBox from "../images/package.jpg.webp"; // Default image

const productImages = {
  1: expressMailImage,
  2: ShippingLabel,
  3: BubbleEnvelope,
  4: smallbox,
  5: medbox,
  6: largebox,
  7: packagetape,
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const customerId = localStorage.getItem("customer_ID");

  useEffect(() => {
    if (!customerId) return;

    fetch(`http://localhost:5001/order-history?customer_ID=${customerId}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.data || []))
      .catch((err) => console.error("Error fetching order history:", err));
  }, [customerId]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const orderDate = new Date(order.Order_Date);
    const matchesQuery = (
      order.Order_ID.toString().includes(query) ||
      order.Item_name?.toLowerCase().includes(query) ||
      new Date(order.Order_Date).toLocaleDateString().includes(query) ||
      order.Location_Name?.toLowerCase().includes(query)
    );

    const isAfterStart = !startDate || orderDate >= new Date(startDate);
    const isBeforeEnd = !endDate || orderDate <= new Date(endDate);

    return matchesQuery && isAfterStart && isBeforeEnd;
  });

  // Group by Order_ID
  const groupedOrders = Object.entries(
    filteredOrders.reduce((acc, order) => {
      if (!acc[order.Order_ID]) {
        acc[order.Order_ID] = {
          ...order,
          items: [],
          totalItems: 0,
        };
      }

      acc[order.Order_ID].items.push(order);
      acc[order.Order_ID].totalItems += order.Quantity || 1;

      return acc;
    }, {})
  );

  return (
    <div className="order-history-wrapper">
      <div className="order-header-bar">
        <h1>Orders</h1>
        <form className="order-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search your orders"
            className="order-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="order-search-input"
            title="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="order-search-input"
            title="End Date"
          />
          <button type="submit" className="order-search-btn">Search</button>
        </form>
      </div>

      {groupedOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        groupedOrders.map(([orderId, order]) => (
          <div key={orderId} className="order-box">
            <div className="order-header">
              <p className="delivered-status"><strong>Delivered</strong></p>
              <div className="order-meta">
                <span>Order date: {new Date(order.Order_Date).toLocaleDateString()}</span>
                <span>Order total: <strong>US ${Number(order.Total_Amount).toFixed(2)}</strong></span>
                <span>Order number: {orderId}</span>
                <span>Total items: {order.totalItems}</span>
              </div>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="order-content">
                <div className="order-img">
                  <img
                    src={productImages[item.product_ID] || packageBox}
                    alt={item.Item_name}
                  />
                </div>

                <div className="order-details">
                  <p className="item-name">{item.Item_name}</p>
                  <p>
  US ${(item.item_price * item.Quantity).toFixed(2)} — Quantity: {item.Quantity}
</p>

                  <p className="sold-by">Brought from: {item.Location_Name}</p>
                  <p>Payment method: {item.Payment_Method}</p>
                  <p>
                    Shipping to: {
                      (item.package_Street || item.order_Street)
                        ? `${item.package_Street || item.order_Street}, ${item.package_City || item.order_City}, ${item.package_State || item.order_State} ${item.package_Zip || item.order_Zip}`
                        : "N/A"
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistory;
