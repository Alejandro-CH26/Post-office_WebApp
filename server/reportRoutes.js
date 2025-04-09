const connection = require("./db");

function reportRoutes(req, res, reqUrl) {
  // 1) PACKAGES DELIVERED
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

        p.package_ID,
        p.shipping_cost,
        
        TIMESTAMPDIFF(MINUTE, 
          (
            SELECT MIN(th_inner.timestamp)
            FROM tracking_history th_inner
            WHERE th_inner.package_ID = p.package_ID
          ),
          th.timestamp
        ) AS delivery_minutes,

        th.timestamp AS delivered_at,

        CONCAT(
          'Package ', p.package_ID,
          ' - Delivered by ', e.First_Name, ' ', e.Last_Name,
          ' using ', dv.Fuel_type, ' (', dv.License_plate, ')',
          ' on ', th.timestamp
        ) AS DeliveryDetails

      FROM tracking_history th
      JOIN package p
        ON th.package_ID = p.package_ID
      JOIN post_office_location loc
        ON p.Destination_ID = loc.location_ID
      JOIN delivery_vehicle dv
        ON p.Assigned_Vehicle = dv.Vehicle_ID
      JOIN employees e
        ON dv.Driver_ID = e.employee_ID

      WHERE th.status = 'Delivered'
        AND th.timestamp = (
          SELECT MAX(sub.timestamp)
          FROM tracking_history sub
          WHERE sub.package_ID = th.package_ID AND sub.status = 'Delivered'
        );
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

  // 2) DELIVERIES BY DRIVER
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

        MAX(p.shipping_cost) AS Shipping_Cost,
        COUNT(DISTINCT p.package_ID) AS PackagesDelivered,
        AVG(TIMESTAMPDIFF(MINUTE,
          (
            SELECT MIN(th_start.timestamp)
            FROM tracking_history th_start
            WHERE th_start.package_ID = p.package_ID
          ),
          th.timestamp
        )) AS AvgDeliveryDurationMinutes,

        GROUP_CONCAT(
          DISTINCT CONCAT(
            'Package ', p.package_ID,
            ' - Delivered on ', th.timestamp
          )
          SEPARATOR ' | '
        ) AS DeliveryDetails

      FROM tracking_history th
      JOIN package p
        ON th.package_ID = p.package_ID
      JOIN delivery_vehicle dv
        ON p.Assigned_Vehicle = dv.Vehicle_ID
      JOIN employees e
        ON dv.Driver_ID = e.employee_ID
      JOIN post_office_location loc
        ON p.Destination_ID = loc.location_ID

      WHERE th.status = 'Delivered'
        AND th.timestamp = (
          SELECT MAX(sub.timestamp)
          FROM tracking_history sub
          WHERE sub.package_ID = th.package_ID AND sub.status = 'Delivered'
        )

      GROUP BY 
        e.employee_ID,
        dv.Vehicle_ID,
        dv.License_plate,
        dv.Fuel_type,
        dv.Mileage,
        loc.name;
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

  // If no route matched, return false so other routes can handle it
  return false;
}

module.exports = reportRoutes;
