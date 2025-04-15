const connection = require("./db");

function reportRoutes(req, res, reqUrl) {
  // 📦 Packages Summary Report (Delivered / In Transit / Lost)
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
  loc.name AS PostOffice,
  v.license_plate AS Vehicle,
  p.shipping_cost,
  ls.timestamp AS status_timestamp
FROM package p
LEFT JOIN latest_status ls ON p.package_ID = ls.package_ID
LEFT JOIN post_office_location loc ON p.Destination_ID = loc.location_ID
LEFT JOIN delivery_vehicle v ON p.Assigned_Vehicle = v.Vehicle_ID;

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

  // ✅ Existing: Delivered Packages
  if (
    req.method === "GET" &&
    reqUrl.pathname === "/reports/packages-delivered"
  ) {
    connection.query(
      `
      SELECT 
        loc.location_ID,
        loc.name AS PostOffice,
        loc.street_address,
        loc.city,
        loc.state,
        loc.zip,
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
      JOIN post_office_location loc ON dl.location_ID = loc.location_ID
      JOIN employees e ON dl.driver_ID = e.employee_ID
      JOIN delivery_vehicle dv ON dl.vehicle_ID = dv.Vehicle_ID
      WHERE dl.delivered_at IS NOT NULL
      GROUP BY
        loc.location_ID,
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

  // ✅ Existing: Deliveries by Driver
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
        loc.name AS PostOffice,
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
      JOIN post_office_location loc ON dl.location_ID = loc.location_ID
      WHERE dl.delivered_at IS NOT NULL
      GROUP BY 
        e.employee_ID, dv.Vehicle_ID, dv.License_plate, dv.Fuel_type, dv.Mileage, loc.name;
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
