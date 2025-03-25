const connection = require("./db");


function notificationRoutes(req, res) {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && reqUrl.pathname === "/mock-notification") {
    const fakeEntry = {
      package_ID: 4, 
      location_ID: 2, 
      status: "Mock Test Update",
      timestamp: new Date() 
    };
  
    connection.query(
      `INSERT INTO tracking_history (package_ID, location_ID, status, timestamp)
       VALUES (?, ?, ?, ?)`,
      [fakeEntry.package_ID, fakeEntry.location_ID, fakeEntry.status, fakeEntry.timestamp],
      (err, result) => {
        if (err) {
          console.error("❌ Error inserting mock notification:", err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Insert failed" }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, insertedId: result.insertId }));
      }
    );
  
    return true;
  }
  

  if (req.method === "GET" && reqUrl.pathname === "/tracking-updates") {
    const sinceId = parseInt(reqUrl.searchParams.get("sinceId")) || 0;
  
    connection.query(
      `SELECT t.tracking_history_ID, p.Package_ID, p.Recipient_Customer_ID, t.status, t.timestamp 
       FROM tracking_history t 
       JOIN package p ON t.package_ID = p.Package_ID
       WHERE t.tracking_history_ID > ?
       ORDER BY t.tracking_history_ID ASC`,
      [sinceId],
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
  
}
module.exports = notificationRoutes;
