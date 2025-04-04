import React, { useEffect, useState } from "react";
import "./orderHistory.css"; // Ensure styling is applied
function OrderHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const customerId = localStorage.getItem("customer_ID");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`http://localhost:5001/transaction-history?customer_ID=${customerId}`);

        const data = await res.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [customerId]);

  if (loading) return <p>Loading your transaction history...</p>;
  if (transactions.length === 0) return <p>No transactions found.</p>;

  return (
    <div className="order-history-container">
      <h2>Order History</h2>

      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Order ID</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.Transaction_ID}>
              <td>{new Date(txn.Date).toLocaleString()}</td>
              <td>{txn.Payment_method}</td>
              <td>{txn.Status}</td>
              <td>{txn.Item_name}</td>
              <td>{txn.Quantity}</td>
              <td>{txn.Order_ID}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderHistory;
