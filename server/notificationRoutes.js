const connection = require("./db");

function notificationRoutes(req, res) {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);


  // 1) Tracking History (GET: /tracking-history)
  if (req.method === "GET" && reqUrl.pathname === "/tracking-history") {
    const packageId = reqUrl.searchParams.get("packageId");

    if (!packageId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Missing packageId" }));
      return true;
    }

    connection.query(
      `
SELECT 
  t.tracking_history_ID,
  t.package_ID,
  t.status,
  t.timestamp,
  pol.name AS location_name,
  a.address_City,
  a.address_State,
  a.address_Zipcode
FROM tracking_history t
LEFT JOIN post_office_location pol 
  ON t.location_ID = pol.Address_ID
LEFT JOIN addresses a 
  ON t.location_ID = a.address_ID
WHERE t.package_ID = ?
ORDER BY t.timestamp ASC;


`,
      [packageId],
      (err, results) => {
        if (err) {
          console.error("Error fetching public tracking history:", err);
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

// 2) Sent Packages with tracking only (GET: /customer-sent-packages)
if (req.method === "GET" && reqUrl.pathname === "/customer-sent-packages") {
  const customerId = reqUrl.searchParams.get("customerId");

  if (!customerId) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Missing customerId" }));
    return true;
  }

  connection.query(
    `
SELECT 
  p.Package_ID,
  a.address_Street,
  a.address_City AS destination_city,
  a.address_State AS destination_state,
  a.address_Zipcode AS destination_zip,
  th_latest.status AS latest_status,
  th_latest.timestamp AS latest_time,
  th_sent.sent_date
FROM package p
JOIN addresses a ON p.Destination_ID = a.address_ID
JOIN (
  SELECT package_ID, MAX(timestamp) AS latest_timestamp
  FROM tracking_history
  GROUP BY package_ID
) latest ON p.Package_ID = latest.package_ID
JOIN tracking_history th_latest 
  ON th_latest.package_ID = latest.package_ID AND th_latest.timestamp = latest.latest_timestamp

LEFT JOIN (
  SELECT package_ID, MIN(timestamp) AS sent_date
  FROM tracking_history
  WHERE status IN ('Shipment Created', 'Package Created')
  GROUP BY package_ID
) th_sent ON th_sent.package_ID = p.Package_ID

WHERE p.Sender_Customer_ID = ?


`,
    [customerId],
    (err, results) => {
      if (err) {
        console.error("Error fetching sent packages:", err);
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