const connection = require("./db");
const url = require("url");

module.exports = (req, res, reqUrl) => {
  if (req.method === "GET" && reqUrl.pathname === "/inventory") {
    const parsedUrl = url.parse(req.url, true);
    const selectedDate = parsedUrl.query.date;
    const employeeID = parsedUrl.query.employee_ID;

    let sql;
    let params;

    if (employeeID) {
      // 🔒 Restricted view for employees (only their location)
      sql = `
        SELECT
          l.location_ID,
          p.product_ID,
          l.name AS location_name,
          p.product_name,
          p.item_price,
          p.desired_stock AS starting_quantity,
          MAX(i.quantity) AS adjusted_quantity,
          p.desired_stock - IFNULL(SUM(t.Quantity), 0) AS snapshot_quantity
        FROM employees e
        JOIN post_office_location l ON e.location_ID = l.location_ID
        JOIN inventory i ON i.location_ID = l.location_ID
        JOIN products p ON i.product_ID = p.product_ID
        LEFT JOIN orders o ON o.address_ID = l.location_ID
        LEFT JOIN transaction t ON t.Order_ID = o.Order_ID
          AND t.product_ID = p.product_ID
          AND t.Status = 'Completed'
          AND DATE(t.Date) <= ?
        WHERE e.employee_ID = ?
        GROUP BY l.location_ID, p.product_ID
        ORDER BY p.product_name;
      `;
      params = [selectedDate, employeeID];
    } else {
      // 👑 Full inventory view for admins
      sql = `
        SELECT
          l.location_ID,
          p.product_ID,
          l.name AS location_name,
          p.product_name,
          p.item_price,
          p.desired_stock AS starting_quantity,
          MAX(i.quantity) AS adjusted_quantity,
          p.desired_stock - IFNULL(SUM(t.Quantity), 0) AS snapshot_quantity
        FROM inventory i
        JOIN post_office_location l ON i.location_ID = l.location_ID
        JOIN products p ON i.product_ID = p.product_ID
        LEFT JOIN orders o ON o.address_ID = l.location_ID
        LEFT JOIN transaction t ON t.Order_ID = o.Order_ID
          AND t.product_ID = p.product_ID
          AND t.Status = 'Completed'
          AND DATE(t.Date) <= ?
        GROUP BY l.location_ID, p.product_ID
        ORDER BY l.name, p.product_name;
      `;
      params = [selectedDate];
    }

    connection.query(sql, params, (err, results) => {
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
