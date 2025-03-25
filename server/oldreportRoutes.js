const connection = require("./db");

function reportRoutes(req, res, reqUrl) {
  if (
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
      GROUP BY loc.location_ID, p.Package_ID, p.Shipping_Cost;`,
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

  if (
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
      GROUP BY e.employee_ID, dv.Vehicle_ID, dv.License_plate, dv.Fuel_type, dv.Mileage, loc.name;`,
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

  return false;
}

module.exports = reportRoutes;
