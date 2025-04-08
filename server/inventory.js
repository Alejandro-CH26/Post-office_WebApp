const connection = require("./db");
const url = require("url");

module.exports = (req, res, reqUrl) => {
  if (req.method === "GET" && reqUrl.pathname === "/inventory") {
    const parsedUrl = url.parse(req.url, true);
    const selectedDate = parsedUrl.query.date; // from frontend

    const sql = `
    SELECT
      l.location_ID,
      p.product_ID,
      l.name AS location_name,
      p.product_name,
      p.item_price,
      p.desired_stock AS starting_quantity,
      i.quantity AS adjusted_quantity,
  
      COALESCE(
        SUM(
          CASE
            WHEN o.Order_Date <= ? AND t.Status = 'Completed'
            THEN t.Quantity
            ELSE 0
          END
        ),
        0
      ) AS total_sold
  
    FROM post_office_location l
    JOIN inventory i ON l.location_ID = i.location_ID
    JOIN products p ON i.product_ID = p.product_ID
    LEFT JOIN orders o ON o.address_id = l.location_ID
    LEFT JOIN transaction t ON t.order_id = o.order_id
      AND t.product_ID = p.product_ID
  
    GROUP BY
      l.location_ID, p.product_ID,
      l.name, p.product_name, p.item_price,
      p.desired_stock, i.quantity
  
    ORDER BY p.product_name;
  `;
  
 
    connection.query(sql, [selectedDate], (err, results) => {
      if (err) {
        console.error("❌ Database Error:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "❌ Database error", details: err }));
        }
        return;
      }
      if (!res.headersSent) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      }
    });

    return true;
  }

  return false;
};
