const connection = require("./db");

function notificationRoutes(req, res) {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // 1) Tracking Updates (GET: /tracking-updates)
  if (req.method === "GET" && reqUrl.pathname === "/tracking-updates") {
    const sinceId = parseInt(reqUrl.searchParams.get("sinceId")) || 0;
    const customerId = reqUrl.searchParams.get("customerId");

    connection.query(
      `SELECT t.tracking_history_ID, p.Package_ID, p.Recipient_Customer_ID, t.status, t.timestamp 
       FROM tracking_history t 
       JOIN package p ON t.package_ID = p.Package_ID
       WHERE t.tracking_history_ID > ? AND p.Recipient_Customer_ID = ?
       ORDER BY t.tracking_history_ID ASC`,
      [sinceId, customerId],
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

  // 2) Tracking History (GET: /tracking-history)
  if (req.method === "GET" && reqUrl.pathname === "/tracking-history") {
    const packageId = reqUrl.searchParams.get("packageId");

    if (!packageId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Missing packageId" }));
      return true;
    }

    connection.query(
      `SELECT t.tracking_history_ID, t.package_ID, t.status, t.timestamp 
       FROM tracking_history t 
       WHERE t.package_ID = ?
       ORDER BY t.timestamp ASC`,
      [packageId],
      (err, results) => {
        if (err) {
          console.error("❌ Error fetching public tracking history:", err);
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

// 3) Sent Packages with tracking only (GET: /customer-sent-packages)
if (req.method === "GET" && reqUrl.pathname === "/customer-sent-packages") {
  const customerId = reqUrl.searchParams.get("customerId");

  if (!customerId) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Missing customerId" }));
    return true;
  }

  connection.query(
    `SELECT 
       p.Package_ID,
       th.status AS latest_status,
       th.timestamp AS latest_time
     FROM package p
     INNER JOIN (
       SELECT package_ID, MAX(timestamp) AS latest_timestamp
       FROM tracking_history
       GROUP BY package_ID
     ) latest ON p.Package_ID = latest.package_ID
     INNER JOIN tracking_history th 
       ON th.package_ID = latest.package_ID AND th.timestamp = latest.latest_timestamp
     WHERE p.Sender_Customer_ID = ?`,
    [customerId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching sent packages:", err);
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

}

module.exports = notificationRoutes;
