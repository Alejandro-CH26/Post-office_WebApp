const connection = require("./db");

function employeeRoutes(req, res, reqUrl) {
  // 1) Get available vehicles (GET: /available-vehicles?driverId=123)
  if (req.method === "GET" && reqUrl.pathname === "/available-vehicles") {
    const driverId = reqUrl.query.driverId;

    const query = `
      SELECT Vehicle_ID, License_plate, Fuel_type, Driver_ID
      FROM delivery_vehicle
      WHERE Driver_ID IS NULL ${driverId ? `OR Driver_ID = ${connection.escape(driverId)}` : ""}
    `;

    connection.query(query, (err, results) => {
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to fetch available vehicles" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      }
    });

    return true;
  }

  // 2) Assign/Unassign a vehicle to a driver (POST: /assign-vehicle)
  if (req.method === "POST" && reqUrl.pathname === "/assign-vehicle") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { employee_ID, vehicle_ID } = JSON.parse(body);

        if (!employee_ID) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing employee_ID." }));
          return;
        }

        const unassignQuery = `UPDATE delivery_vehicle SET Driver_ID = NULL WHERE Driver_ID = ?`;

        connection.query(unassignQuery, [employee_ID], (err) => {
          if (err) {
            console.error("Failed to unassign old vehicle:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to unassign previous vehicle." }));
            return;
          }

          if (!vehicle_ID) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Driver unassigned from vehicle." }));
            return;
          }

          const assignQuery = `UPDATE delivery_vehicle SET Driver_ID = ? WHERE Vehicle_ID = ?`;

          connection.query(assignQuery, [employee_ID, vehicle_ID], (err2) => {
            if (err2) {
              console.error("Failed to assign new vehicle:", err2);
              res.writeHead(500);
              res.end(JSON.stringify({ error: "Failed to assign vehicle to driver." }));
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Vehicle assigned to driver." }));
          });
        });
      } catch (err) {
        console.error("JSON Parsing Error:", err);
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  // 3) Fire or rehire an employee (with auto-unassign on fire)
  if (req.method === "POST" && reqUrl.pathname === "/fire-employee") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());

    req.on("end", () => {
      try {
        const { employee_ID, isFired } = JSON.parse(body);

        if (employee_ID === undefined || isFired === undefined) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing employee_ID or isFired." }));
          return;
        }

        const updateFiredQuery = `
          UPDATE employees
          SET Is_Fired = ?
          WHERE employee_ID = ?
        `;

        connection.query(updateFiredQuery, [isFired, employee_ID], (err) => {
          if (err) {
            console.error("Error updating fired status:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to update employee status." }));
            return;
          }

          if (isFired) {
            const unassignVehicleQuery = `
              UPDATE delivery_vehicle
              SET Driver_ID = NULL
              WHERE Driver_ID = ?
            `;

            connection.query(unassignVehicleQuery, [employee_ID], (unassignErr) => {
              if (unassignErr) {
                console.error("Failed to unassign vehicle on fire:", unassignErr);
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Fired, but failed to unassign vehicle." }));
                return;
              }

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Employee fired and vehicle unassigned." }));
            });
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Employee rehired successfully." }));
          }
        });

      } catch (err) {
        console.error("JSON Parsing Error:", err);
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  // 5) Get employee by ID
  if (req.method === "GET" && reqUrl.pathname.startsWith("/get-employee/")) {
    const segments = reqUrl.pathname.split("/");
    const id = parseInt(segments[segments.length - 1], 10);
    if (isNaN(id)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid ID." }));
      return true;
    }

    const query = `
SELECT 
  e.employee_ID,
  e.First_Name AS first_Name,
  e.Middle_Name AS middle_Name,
  e.Last_Name AS last_Name,
  e.Location_ID AS location,
  e.Role AS role,
  dv.Vehicle_ID AS vehicle_ID,
  dv.Fuel_type AS fuel_type
FROM employees e
LEFT JOIN delivery_vehicle dv ON e.employee_ID = dv.Driver_ID
WHERE e.employee_ID = ? AND e.Is_Deleted = 0

    `;

    connection.query(query, [id], (err, results) => {
      if (err || results.length === 0) {
        res.writeHead(err ? 500 : 404);
        res.end(JSON.stringify({ error: "Employee not found." }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results[0]));
    });

    return true;
  }

  // 6) Update employee details
  if (req.method === "POST" && reqUrl.pathname === "/update-employee") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      try {
        const {
          employee_ID, first_Name, middle_Name, last_Name, location, role
        } = JSON.parse(body);

        if (!employee_ID || !first_Name || !last_Name || !location || !role) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing fields." }));
          return;
        }

        const query = `
          UPDATE employees SET First_Name = ?, Middle_Name = ?, Last_Name = ?, Location_ID = ?, Role = ?
          WHERE employee_ID = ? AND Is_Deleted = 0
        `;

        connection.query(query, [first_Name, middle_Name, last_Name, location, role, employee_ID], (err) => {
          if (err) {
            console.error("Update error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to update." }));
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Employee updated." }));
          }
        });
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  // 7) Get all employees
  if (req.method === "GET" && reqUrl.pathname === "/employee-reports") {
    const includeDeleted = reqUrl.query.includeDeleted === "true";

    const query = `
    SELECT 
      e.employee_ID AS id,
      CONCAT(e.First_Name, ' ', e.Last_Name) AS name,
      e.Location_ID AS location_id,
      po.name AS location_name,
      CASE 
        WHEN e.Role = 'Driver' AND dv.Vehicle_ID IS NOT NULL 
          THEN CONCAT('Driver - Truck (', dv.Vehicle_ID, ') - ', dv.Fuel_type)
        ELSE e.Role
      END AS position,
      e.Is_Fired AS isFired,
      e.Is_Deleted AS isDeleted
    FROM employees e
    LEFT JOIN delivery_vehicle dv ON e.employee_ID = dv.Driver_ID
    LEFT JOIN post_office_location po ON e.Location_ID = po.location_ID
    ${includeDeleted ? "" : "WHERE e.Is_Deleted = 0 AND po.is_deleted = 0"}
    `;
    

    connection.query(query, (err, results) => {
      if (err) {
        console.error("Fetch error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to fetch employees." }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

    return true;
  }

  // 9) Get all post office names (GET: /post-offices)
  if (req.method === "GET" && reqUrl.pathname === "/post-offices") {
const query = `
  SELECT 
    name,
    Address_ID
  FROM db1.post_office_location
  WHERE is_deleted = 0
`;


    connection.query(query, (err, results) => {
      if (err) {
        console.error("Failed to fetch post offices:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to fetch post offices" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      }
    });

    return true;
  }

  // 10) Get all addresses (GET: /all-addresses)
  if (req.method === "GET" && reqUrl.pathname === "/all-addresses") {
    const query = `
      SELECT 
        address_ID,
        CONCAT(address_Street, ', ', address_City, ', ', address_State, ' ', address_Zipcode) AS label
      FROM db1.addresses
      WHERE is_deleted = 0
    `;
  
    connection.query(query, (err, results) => {
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to fetch addresses" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      }
    });
  
    return true;
  }
  

  return false;
}

module.exports = employeeRoutes;
