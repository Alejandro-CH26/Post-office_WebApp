// inventory.js
const connection = require("./db"); // DB connection

module.exports = (req, res, reqUrl) => {
  // 1) Check if it's GET /inventory
  if (req.method === "GET" && reqUrl.pathname === "/inventory") {
    const sql = `
      SELECT
        l.name AS location_name,
        p.product_name,
        p.item_price,
        i.quantity AS starting_quantity,
        
        -- Sum the transaction Quantity (not just 1) if Status = 'Completed'
        COALESCE(
          SUM(
            CASE WHEN t.Status = 'Completed' THEN t.Quantity ELSE 0 END
          ), 
          0
        ) AS total_sold,
        
        -- Adjusted quantity is starting_quantity minus total sold
        i.quantity - COALESCE(
          SUM(
            CASE WHEN t.Status = 'Completed' THEN t.Quantity ELSE 0 END
          ), 
          0
        ) AS adjusted_quantity

      FROM post_office_location l
      JOIN inventory i 
        ON l.location_ID = i.location_ID
      JOIN products p 
        ON i.product_ID = p.product_ID
      LEFT JOIN orders o 
        ON o.address_id = l.location_ID
      LEFT JOIN transaction t 
        ON t.order_id = o.order_id 
        AND t.Item_name = p.product_name

      GROUP BY 
        l.name, 
        p.product_name, 
        p.item_price, 
        i.quantity

      ORDER BY p.product_name;
    `;

    connection.query(sql, (err, results) => {
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

    // Return true so server.js knows we handled this request
    return true;
  }

  // 2) Not our route => return false
  return false;
};
