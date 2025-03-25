// reportRoutes.js

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
        
        dl.package_ID,
        dl.shipping_cost,
        dl.delivery_minutes,
        dl.delivered_at,

        -- Combine row-specific info into a single string:
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
      -- If you still have a post_office_location table:
      JOIN post_office_location loc
        ON dl.location_ID = loc.location_ID
      -- If you still have an employees table for driver names:
      JOIN employees e
        ON dl.driver_ID = e.employee_ID
      -- If you still have a delivery_vehicle table for vehicle details:
      JOIN delivery_vehicle dv
        ON dl.vehicle_ID = dv.Vehicle_ID

      WHERE dl.delivered_at IS NOT NULL

      -- Adjust grouping as necessary:
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

        -- Example: shipping cost aggregator
        MAX(dl.shipping_cost)         AS Shipping_Cost,  
        COUNT(DISTINCT dl.package_ID) AS PackagesDelivered,
        AVG(dl.delivery_minutes)      AS AvgDeliveryDurationMinutes,
        
        GROUP_CONCAT(
          DISTINCT CONCAT(
            'Package ', dl.package_ID, 
            ' - Delivered on ', dl.delivered_at
          )
          SEPARATOR ' | '
        ) AS DeliveryDetails

      FROM delivered_log dl
      JOIN employees e 
        ON dl.driver_ID = e.employee_ID
      JOIN delivery_vehicle dv 
        ON dl.vehicle_ID = dv.Vehicle_ID
      JOIN post_office_location loc
        ON dl.location_ID = loc.location_ID

      WHERE dl.delivered_at IS NOT NULL

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
