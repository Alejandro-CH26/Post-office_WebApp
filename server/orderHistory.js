const connection = require("./db"); // DB connection

module.exports = (req, res) => {
  // ✅ Create URL object to safely extract search params
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && reqUrl.pathname === "/transaction-history") {
    const customerId = parseInt(reqUrl.searchParams.get("customer_ID"));

    if (!customerId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing or invalid customer_ID" }));
      return true;
    }

    const sql = `
      SELECT
        Transaction_ID,
        Order_ID,
        Date,
        Payment_method,
        Status,
        Item_name,
        Quantity
      FROM transaction
      WHERE Customer_ID = ?
      ORDER BY Date DESC
    `;

    connection.query(sql, [customerId], (err, results) => {
      if (err) {
        console.error("❌ Transaction History DB Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "❌ Database error", details: err }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

    return true;
  }

  return false;
};
