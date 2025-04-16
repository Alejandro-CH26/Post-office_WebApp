const connection = require("./db");

function reportRoutes(req, res, reqUrl) {
  // 📦 Packages Summary Report (Admin Analytics View)
  if (
    req.method === "GET" &&
    reqUrl.pathname === "/reports/packages-summary"
  ) {
    connection.query(
      `
      WITH latest_status AS (
        SELECT th.package_ID, th.status, th.timestamp
        FROM tracking_history th
        INNER JOIN (
          SELECT package_ID, MAX(timestamp) AS max_ts
          FROM tracking_history
          GROUP BY package_ID
        ) latest ON th.package_ID = latest.package_ID AND th.timestamp = latest.max_ts
      )
      
      SELECT 
        p.package_ID,
        ls.status AS current_status,
        COALESCE(
          CONCAT_WS(', ', a.address_Street, a.address_City, a.address_State, a.address_Zipcode),
          'Unknown'
        ) AS Destination,
        v.license_plate AS Vehicle,
        CONCAT(e.First_Name, ' ', e.Last_Name) AS DriverName,
        p.shipping_cost,
        ls.timestamp AS status_timestamp
      FROM package p
      INNER JOIN latest_status ls ON p.package_ID = ls.package_ID
      LEFT JOIN addresses a ON p.Destination_ID = a.address_ID
      LEFT JOIN delivery_vehicle v ON p.Assigned_Vehicle = v.Vehicle_ID
      LEFT JOIN employees e ON v.Driver_ID = e.employee_ID
      WHERE ls.timestamp IS NOT NULL
      ORDER BY ls.timestamp DESC;
      `,
      (err, results) => {
        if (err) {
          console.error("❌ Error fetching package summary:", err);
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

  // 📬 Delivered Packages Report
  if (
    req.method === "GET" &&
    reqUrl.pathname === "/reports/packages-delivered"
  ) {
    connection.query(
      `
      SELECT 
        a.address_ID,
        CONCAT_WS(', ', a.address_Street, a.address_City, a.address_State, a.address_Zipcode) AS Destination,
        dl.package_ID,
        dl.shipping_cost,
        dl.delivery_minutes,
        dl.delivered_at,
        GROUP_CONCAT(
          CONCAT(
            'Package ', dl.package_ID, 
            ' - Delivered by ', e.First_Name, ' ', e.Last_Name,
            ' using ', dv.Fuel_type, ' (', dv.license_plate, ')',
            ' on ', dl.delivered_at
          )
          SEPARATOR ' | '
        ) AS DeliveryDetails
      FROM delivered_log dl
      LEFT JOIN addresses a ON dl.location_ID = a.address_ID
      JOIN employees e ON dl.driver_ID = e.employee_ID
      JOIN delivery_vehicle dv ON dl.vehicle_ID = dv.Vehicle_ID
      WHERE dl.delivered_at IS NOT NULL
      GROUP BY
        a.address_ID,
        dl.package_ID,
        dl.shipping_cost,
        dl.delivery_minutes,
        dl.delivered_at;
      `,
      (err, results) => {
        if (err) {
          console.error("❌ SQL Query Error:", err);
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

  // 👤 Deliveries by Driver Report
  if (
    req.method === "GET" &&
    reqUrl.pathname === "/reports/deliveries-by-driver"
  ) {
    connection.query(
      `
      SELECT 
        e.employee_ID, 
        CONCAT(e.First_Name, ' ', e.Last_Name) AS DriverName, 
        dv.Vehicle_ID,
        dv.License_plate, 
        dv.Fuel_type,
        dv.Mileage,
        MAX(dl.shipping_cost) AS Shipping_Cost,  
        COUNT(DISTINCT dl.package_ID) AS PackagesDelivered,
        AVG(dl.delivery_minutes) AS AvgDeliveryDurationMinutes,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            'Package ', dl.package_ID, 
            ' - Delivered on ', dl.delivered_at
          )
          SEPARATOR ' | '
        ) AS DeliveryDetails
      FROM delivered_log dl
      JOIN employees e ON dl.driver_ID = e.employee_ID
      JOIN delivery_vehicle dv ON dl.vehicle_ID = dv.Vehicle_ID
      WHERE dl.delivered_at IS NOT NULL
      GROUP BY 
        e.employee_ID, dv.Vehicle_ID, dv.License_plate, dv.Fuel_type, dv.Mileage;
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
    return true;
  }

  return false; // Let other routes handle unrecognized paths
}

module.exports = reportRoutes;