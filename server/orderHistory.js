const db = require("./db");

function orderHistory(req, res, reqUrl) {
  if (req.method === "GET" && reqUrl.pathname === "/order-history") {
    const customer_ID = reqUrl.query.customer_ID;

    if (!customer_ID) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing customer_ID in query." }));
      return true;
    }

    (async () => {
      try {
        const connection = await db.promise().getConnection();

        const [results] = await connection.execute(`
SELECT 
o.Customer_ID,
  o.Order_ID,
  o.Order_Date,
  o.Total_Amount,
  o.Payment_Method,

  t.Item_name,
  t.product_ID,
  t.Quantity,

  p.Weight,
  p.Shipping_Cost,
  p.Transaction_ID,
  p.Package_ID,
  p.Origin_ID,
  p.Destination_ID,

  pr.item_price,  

  l.name AS Location_Name,

  addr1.address_Street AS order_Street,
  addr1.address_City AS order_City,
  addr1.address_State AS order_State,
  addr1.address_Zipcode AS order_Zip,

  addr2.address_Street AS package_Street,
  addr2.address_City AS package_City,
  addr2.address_State AS package_State,
  addr2.address_Zipcode AS package_Zip,

  latest_status.status AS Latest_Tracking_Status

FROM orders o
JOIN transaction t ON o.Order_ID = t.Order_ID
JOIN package p ON p.Transaction_ID = t.Transaction_ID
JOIN products pr ON t.product_ID = pr.product_ID
JOIN post_office_location l ON o.address_ID = l.location_ID

LEFT JOIN addresses addr1 ON o.shipping_address_id = addr1.address_ID
LEFT JOIN addresses addr2 ON p.Destination_ID = addr2.address_ID

LEFT JOIN (
  SELECT th1.package_ID, th1.status
  FROM tracking_history th1
  INNER JOIN (
    SELECT package_ID, MAX(timestamp) AS latest_time
    FROM tracking_history
    GROUP BY package_ID
  ) th2 ON th1.package_ID = th2.package_ID AND th1.timestamp = th2.latest_time
) latest_status ON latest_status.package_ID = p.Package_ID

WHERE o.Customer_ID = ?
ORDER BY o.Order_Date DESC;
        `, [customer_ID]);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", data: results }));
      } catch (error) {
        console.error("❌ Order History Fetch Error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: error.message }));
      }
    })();

    return true;
  }

  return false;
}

module.exports = orderHistory;
