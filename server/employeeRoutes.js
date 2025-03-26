const connection = require("./db");

function employeeRoutes(req, res, reqUrl) {
  // 1) Employee Reports (GET: /employee-reports)
  if (req.method === "GET" && reqUrl.pathname === "/employee-reports") {
    connection.query(
      `
      SELECT 
        employee_ID AS id,
        CONCAT(First_Name, ' ', Last_Name) AS name,
        Location AS location,
        Role AS position,
        EXISTS (
          SELECT 1 FROM employees sub WHERE sub.Supervisor_ID = e.employee_ID
        ) AS isSupervisor,
        Is_Fired AS isFired
      FROM employees e
      `,
      (err, results) => {
        if (err) {
          console.error("❌ SQL Query Error:", err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Database query failed" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      }
    );
    return true;
  }

  // 2) Fire/Unfire an employee (POST: /fire-employee)
  if (req.method === "POST" && reqUrl.pathname === "/fire-employee") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { employee_ID, isFired } = JSON.parse(body);

        if (employee_ID === undefined || isFired === undefined) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing employee_ID or isFired value." }));
          return;
        }

        const query = `
          UPDATE employees
          SET Is_Fired = ?
          WHERE employee_ID = ?
        `;

        connection.query(query, [isFired, employee_ID], (err, result) => {
          if (err) {
            console.error("❌ Error updating Is_Fired:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to update employee status" }));
            return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Employee status updated successfully" }));
        });
      } catch (err) {
        console.error("❌ JSON Parsing Error:", err);
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  // Default fallback
  return false;
}

module.exports = employeeRoutes;