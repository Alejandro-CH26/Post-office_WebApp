const connection = require("./db");

function notificationRoutes(req, res, reqUrl) {
  if (req.method === "GET" && reqUrl.pathname === "/test-db") {
    connection.query("SELECT * FROM customers", (err, results) => {
      if (err) {
        console.error("❌ Query Error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Database query failed" }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify(results));
    });
    return true;
  }

  if (req.method === "GET" && reqUrl.pathname === "/tracking-updates") {
    connection.query(
      `SELECT p.Package_ID, p.Recipient_Customer_ID, t.status, t.timestamp 
       FROM tracking_history t 
       JOIN package p ON t.package_ID = p.Package_ID
       ORDER BY t.timestamp DESC 
       LIMIT 10`,
      (err, results) => {
        if (err) {
          console.error("❌ Error fetching tracking updates:", err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Database query failed" }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(results));
      }
    );
    return true;
  }

  return false;
}

module.exports = notificationRoutes;
