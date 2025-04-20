const connection = require("./db");

function setCorsHeaders(req, res) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://post-office-web-app.vercel.app",
    "https://post-office-webapp.onrender.com"
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
}

function driverRoutes(req, res) {
 
  if (req.method === "OPTIONS") {
    setCorsHeaders(req, res); 
    res.writeHead(200); 
    res.end();
    return true;
  }

 
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  
  if (req.method === "POST" && reqUrl.pathname === "/driver/mark-departure") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
  
    req.on("end", async () => {
      try {
        const { employeeID } = JSON.parse(body);
        if (!employeeID) {
          setCorsHeaders(req, res);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Employee ID is required" }));
          return;
        }
  
        const getVehiclesQuery = `
          SELECT Vehicle_ID, Location_ID 
          FROM delivery_vehicle 
          WHERE Driver_ID = ?
        `;
  
        connection.query(getVehiclesQuery, [employeeID], (err, vehicleRows) => {
          if (err || vehicleRows.length === 0) {
            setCorsHeaders(req, res);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to retrieve vehicles for driver" }));
            return;
          }
  
          const tasks = vehicleRows.map(({ Vehicle_ID, Location_ID }) => {
            return new Promise((resolve, reject) => {
              const getPackagesQuery = `
                SELECT p.Package_ID
                FROM Package p
                LEFT JOIN (
                  SELECT package_ID
                  FROM tracking_history
                  WHERE status = 'In Transit' AND employee_ID = ?
                ) t ON p.Package_ID = t.package_ID
                WHERE p.Assigned_vehicle = ? AND t.package_ID IS NULL
              `;
  
              connection.query(getPackagesQuery, [employeeID, Vehicle_ID], (err, packages) => {
                if (err) return reject(err);
                if (packages.length === 0) return resolve();
  
                const values = packages.map(pkg =>
                  `(${pkg.Package_ID}, ${Location_ID}, 'In Transit', NOW(), ${employeeID})`
                ).join(", ");
  
                const insertQuery = `
                  INSERT INTO tracking_history 
                  (package_ID, location_ID, status, timestamp, employee_ID)
                  VALUES ${values};
                `;
  
                connection.query(insertQuery, (err) => {
                  if (err) return reject(err);
                  resolve();
                });
              });
            });
          });
  
          Promise.all(tasks)
            .then(() => {
              setCorsHeaders(req, res);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                success: true,
                message: "Tracking entries created for new packages (per employee)."
              }));
            })
            .catch(error => {
              console.error("❌ Error processing multiple vehicles:", error);
              setCorsHeaders(req, res);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                error: "Failed to insert tracking history for some vehicles."
              }));
            });
        });
      } catch (err) {
        console.error("❌ Error parsing request:", err);
        setCorsHeaders(req, res);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request format" }));
      }
    });
  
    return true;
  }
  

 
  if (req.method === "GET" && reqUrl.pathname === "/driver/packages") {
    const employeeID = reqUrl.searchParams.get("employeeID");
    if (!employeeID) {
      setCorsHeaders(req, res);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Employee ID is required" }));
      return true;
    }

    
    const query = `SELECT P.Package_ID, A.address_Street, A.address_City, A.address_State, 
                  SE.first_name AS sender_first_name, SE.last_name AS sender_last_name, 
                  P.Recipient_Customer_Name, D.Status AS vehicle_status 
                  FROM employees AS E 
                  JOIN delivery_vehicle AS D ON E.employee_ID = D.Driver_ID 
                  JOIN Package AS P ON D.Vehicle_ID = P.Assigned_vehicle 
                  JOIN addresses AS A ON A.address_ID = P.Next_Destination 
                  JOIN customers AS SE ON P.Sender_Customer_ID = SE.customer_ID 
                  WHERE E.employee_ID = ? AND P.Assigned_vehicle IS NOT NULL`;

    connection.query(query, [employeeID], (err, results) => {
      if (err) {
        console.error("Error fetching driver packages:", err);
        setCorsHeaders(req, res);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Database query failed" }));
        return;
      }

      
      const packages = results.map(row => ({
        packageID: row.Package_ID,
        addressStreet: row.address_Street,
        addressCity: row.address_City,
        addressState: row.address_State,
        senderFirstName: row.sender_first_name,
        senderLastName: row.sender_last_name,
        recipientName: row.Recipient_Customer_Name,
        vehicleStatus: row.vehicle_status
      }));

      setCorsHeaders(req, res);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(packages));
    });
    return true;
  }

  
  if (req.method === "POST" && reqUrl.pathname === "/driver/update-status") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { employeeID, status } = JSON.parse(body);
        if (!employeeID || !status) {
          setCorsHeaders(req, res);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Employee ID and status are required" }));
          return;
        }

       
        const validStatuses = ["Available", "In Transit"];
        if (!validStatuses.includes(status)) {
          setCorsHeaders(req, res);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid status. Must be 'Available' or 'In Transit'" }));
          return;
        }

       
        const updateQuery = `UPDATE delivery_vehicle SET Status = ? WHERE Driver_ID = ?`;
        connection.query(updateQuery, [status, employeeID], (err, result) => {
          if (err) {
            console.error("Error updating vehicle status:", err);
            setCorsHeaders(req, res);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to update vehicle status", details: err.sqlMessage }));
            return;
          }

          if (result.affectedRows === 0) {
            setCorsHeaders(req, res);
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No vehicle found for this driver" }));
            return;
          }

         
          setCorsHeaders(req, res);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, message: `Vehicle status updated to ${status}` }));
        });
      } catch (error) {
        console.error("Error processing request:", error);
        setCorsHeaders(req, res);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request format" }));
      }
    });
    return true;
  }

  
  if (req.method === "POST" && reqUrl.pathname === "/driver/deliver-package") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { packageID, employeeID } = JSON.parse(body);
        if (!packageID || !employeeID) {
          setCorsHeaders(req, res);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Package ID and Employee ID are required" }));
          return;
        }

        
        const verifyQuery = `SELECT COUNT(*) AS count FROM employees AS E, Package AS P, delivery_vehicle AS D 
                           WHERE E.employee_ID = D.Driver_ID AND D.Vehicle_ID = P.Assigned_vehicle 
                           AND P.Package_ID = ? AND E.employee_ID = ?`;

        connection.query(verifyQuery, [packageID, employeeID], (err, results) => {
          if (err) {
            console.error("Error verifying package assignment:", err);
            setCorsHeaders(req, res);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Database query failed" }));
            return;
          }

          if (results[0].count === 0) {
            setCorsHeaders(req, res);
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not authorized to deliver this package" }));
            return;
          }

          
          const trackingQuery = `INSERT INTO tracking_history (package_ID, location_ID, status, timestamp, employee_ID) 
                              SELECT P.Package_ID, P.Next_Destination, 
                              IF(A.Office_Location = 1, 'At Warehouse', 'Delivered') AS status, 
                              NOW(), ? AS employee_ID 
                              FROM Package P 
                              JOIN addresses A ON P.Next_Destination = A.address_ID 
                              WHERE P.Package_ID = ?`;

          connection.query(trackingQuery, [employeeID, packageID], (err, trackingResult) => {
            if (err) {
              console.error("Error adding tracking history:", { sqlMessage: err.sqlMessage, sql: err.sql, code: err.code });
              setCorsHeaders(req, res);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Failed to record delivery", details: err.sqlMessage }));
              return;
            }

            
            const updatePackageQuery = `UPDATE Package SET Assigned_vehicle = NULL WHERE Package_ID = ?`;
            connection.query(updatePackageQuery, [packageID], (err, updateResult) => {
              if (err) {
                console.error("Error updating package assignment:", { sqlMessage: err.sqlMessage, sql: err.sql, code: err.code });
                setCorsHeaders(req, res);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to clear vehicle assignment", details: err.sqlMessage }));
                return;
              }

              
              setCorsHeaders(req, res);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: "Package delivered and vehicle assignment removed" }));
            });
          });
        });
      } catch (error) {
        console.error("Error processing request:", error);
        setCorsHeaders(req, res);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request format" }));
      }
    });
    return true;
  }

  
  if (req.method === "POST" && reqUrl.pathname === "/driver/update-package-status") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { packageID, employeeID, status } = JSON.parse(body);
        if (!packageID || !employeeID || !status) {
          setCorsHeaders(req, res);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Package ID, Employee ID, and status are required" }));
          return;
        }

        
        const validStatuses = ["Lost"];
        if (!validStatuses.includes(status)) {
          setCorsHeaders(req, res);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}` }));
          return;
        }

        
        const verifyQuery = `SELECT COUNT(*) AS count FROM employees AS E, Package AS P, delivery_vehicle AS D 
                           WHERE E.employee_ID = D.Driver_ID AND D.Vehicle_ID = P.Assigned_vehicle 
                           AND P.Package_ID = ? AND E.employee_ID = ?`;

        connection.query(verifyQuery, [packageID, employeeID], (err, results) => {
          if (err) {
            console.error("Error verifying package assignment:", err);
            setCorsHeaders(req, res);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Database query failed" }));
            return;
          }

          if (results[0].count === 0) {
            setCorsHeaders(req, res);
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not authorized to update this package" }));
            return;
          }

          
          const trackingQuery = `INSERT INTO tracking_history (package_ID, location_ID, status, timestamp, employee_ID) 
                              SELECT P.Package_ID, E.Location_ID, -- Using employee's location instead of package's next destination 
                              ? AS status, NOW(), ? AS employee_ID 
                              FROM Package P 
                              JOIN delivery_vehicle D ON P.Assigned_vehicle = D.Vehicle_ID 
                              JOIN employees E ON D.Driver_ID = E.employee_ID 
                              WHERE P.Package_ID = ? AND E.employee_ID = ?`;

          connection.query(trackingQuery, [status, employeeID, packageID, employeeID], (err, trackingResult) => {
            if (err) {
              console.error(`Error adding ${status} tracking history:`, { sqlMessage: err.sqlMessage, sql: err.sql, code: err.code });
              setCorsHeaders(req, res);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: `Failed to record ${status} status`, details: err.sqlMessage }));
              return;
            }

          
            const updatePackageQuery = `UPDATE Package SET Assigned_vehicle = NULL WHERE Package_ID = ?`;
            connection.query(updatePackageQuery, [packageID], (err, updateResult) => {
              if (err) {
                console.error("Error updating package assignment:", { sqlMessage: err.sqlMessage, sql: err.sql, code: err.code });
                setCorsHeaders(req, res);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to clear vehicle assignment", details: err.sqlMessage }));
                return;
              }

              
              setCorsHeaders(req, res);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: `Package marked as ${status} and vehicle assignment removed` }));
            });
          });
        });
      } catch (error) {
        console.error("Error processing request:", error);
        setCorsHeaders(req, res);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request format" }));
      }
    });
    return true;
  }

  return false;
}

module.exports = driverRoutes;