/*
const http = require("http");
const url = require("url");
const connection = require("./db");

const hostname = "localhost";
const port = 5000;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const reqUrl = url.parse(req.url, true);

  // Test database connection
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
  }

  // Tracking Updates API
  else if (req.method === "GET" && reqUrl.pathname === "/tracking-updates") {
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
  }

  // Packages Delivered Report API
  else if (
    req.method === "GET" &&
    reqUrl.pathname === "/reports/packages-delivered"
  ) {
    connection.query(
      `SELECT 
    loc.location_ID, 
    loc.name AS PostOffice, 
    loc.street_address, 
    loc.city, 
    loc.state, 
    loc.zip,
    p.Package_ID,
    p.Shipping_Cost,
    TIMESTAMPDIFF(MINUTE, 
        (SELECT timestamp FROM tracking_history WHERE package_ID = p.Package_ID AND status = 'Shipment Created' LIMIT 1),
        (SELECT timestamp FROM tracking_history WHERE package_ID = p.Package_ID AND status = 'Delivered' LIMIT 1)
    ) AS DeliveryDurationMinutes,
    GROUP_CONCAT(
        CONCAT(
            ' Package ', p.Package_ID, 
            ' - Delivered by ', e.First_Name, ' ', e.Last_Name, 
            ' using ', dv.Fuel_type, ' (', dv.license_plate, ') on ', DATE(t.timestamp)
        ) SEPARATOR ' | '
    ) AS DeliveryDetails
FROM package p
JOIN post_office_location loc ON p.Destination_ID = loc.location_ID
JOIN tracking_history t ON p.Package_ID = t.package_ID
JOIN delivery_vehicle dv ON p.Assigned_Vehicle = dv.Vehicle_ID  
JOIN employees e ON dv.Driver_ID = e.employee_ID  
WHERE t.status = 'Delivered'
GROUP BY loc.location_ID, p.Package_ID, p.Shipping_Cost;
            `,
      (err, results) => {
        if (err) {
          console.error("❌ SQL Query Error:", err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Database query failed" }));
          return;
        }
        console.log("📢 API Response from SQL:", results);
        res.writeHead(200);
        res.end(JSON.stringify(results));
      }
    );
  } else if (
    req.method === "GET" &&
    reqUrl.pathname === "/reports/deliveries-by-driver"
  ) {
    connection.query(
      `SELECT 
    e.employee_ID, 
    CONCAT(e.First_Name, ' ', e.Last_Name) AS DriverName, 
    dv.Vehicle_ID,
    dv.License_plate, 
    dv.Fuel_type,
    dv.Mileage,
    loc.name AS PostOffice,
    MAX(p.Shipping_Cost) AS Shipping_Cost,  
    COUNT(DISTINCT p.Package_ID) AS PackagesDelivered,

    AVG(
        TIMESTAMPDIFF(MINUTE, 
            (SELECT MIN(t1.timestamp) FROM tracking_history t1 WHERE t1.package_ID = p.Package_ID AND t1.status = 'Shipment Created'), 
            (SELECT MAX(t2.timestamp) FROM tracking_history t2 WHERE t2.package_ID = p.Package_ID AND t2.status = 'Delivered')
        )
    ) AS AvgDeliveryDurationMinutes,

    GROUP_CONCAT(
        DISTINCT CONCAT(' Package ', p.Package_ID, ' - Delivered on ', DATE(t.timestamp))
        SEPARATOR ' | '
    ) AS DeliveryDetails

FROM employees e
JOIN delivery_vehicle dv ON e.employee_ID = dv.Driver_ID
JOIN package p ON dv.Vehicle_ID = p.Assigned_Vehicle
JOIN tracking_history t ON p.Package_ID = t.package_ID
JOIN post_office_location loc ON p.Destination_ID = loc.location_ID     

WHERE t.status = 'Delivered'

GROUP BY e.employee_ID, dv.Vehicle_ID, dv.License_plate, dv.Fuel_type, dv.Mileage, loc.name;

            `,
      (err, results) => {
        if (err) {
          console.error("❌ Error fetching deliveries by driver:", err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Database query failed" }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(results));
      }
    );
  }

  // ❌ 404 Error for Undefined Routes
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

// Start the server
server.listen(port, hostname, () => {
  console.log(`✅ Server running at http://${hostname}:${port}/`);
});

*/