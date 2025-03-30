const connection = require("./db");

function driverRoutes(req, res) {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
        });
        res.end();
        return true;
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    
    // Handle driver packages endpoint
    if (req.method === "GET" && reqUrl.pathname === "/driver/packages") {
        const employeeID = reqUrl.searchParams.get("employeeID");
        
        if (!employeeID) {
            res.writeHead(400, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                "Access-Control-Allow-Credentials": "true",
            });
            res.end(JSON.stringify({ error: "Employee ID is required" }));
            return true;
        }

        // Updated query to get packages in transit assigned to the driver
        const query = `
            SELECT P.Package_ID, A.address_Street, A.address_City, A.address_State
            FROM employees AS E, Package AS P, delivery_vehicle AS D, addresses AS A, tracking_history AS T
            WHERE A.address_ID = P.Next_Destination 
                AND E.employee_ID = D.Driver_ID 
                AND D.Vehicle_ID = P.Assigned_vehicle 
                AND P.Package_ID = T.package_ID
                AND T.status = "In Transit"
                AND E.employee_ID = ?;
        `;

        connection.query(query, [employeeID], (err, results) => {
            if (err) {
                console.error("❌ Error fetching driver packages:", err);
                res.writeHead(500, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                    "Access-Control-Allow-Credentials": "true",
                });
                res.end(JSON.stringify({ error: "Database query failed" }));
                return;
            }

            // Format the results for the frontend
            const packages = results.map(row => ({
                packageID: row.Package_ID,
                addressStreet: row.address_Street,
                addressCity: row.address_City,
                addressState: row.address_State
            }));

            res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                "Access-Control-Allow-Credentials": "true",
            });
            res.end(JSON.stringify(packages));
        });
        
        return true;
    }

    // Handle package delivery confirmation endpoint
    // Handle package delivery confirmation endpoint
// Handle package delivery confirmation endpoint
if (req.method === "POST" && reqUrl.pathname === "/driver/deliver-package") {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", () => {
        try {
            const { packageID, employeeID } = JSON.parse(body);

            if (!packageID || !employeeID) {
                res.writeHead(400, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                    "Access-Control-Allow-Credentials": "true",
                });
                res.end(JSON.stringify({ error: "Package ID and Employee ID are required" }));
                return;
            }

            // Verify driver is assigned to this package (security check)
            const verifyQuery = `
                SELECT COUNT(*) AS count
                FROM employees AS E, Package AS P, delivery_vehicle AS D
                WHERE E.employee_ID = D.Driver_ID 
                    AND D.Vehicle_ID = P.Assigned_vehicle 
                    AND P.Package_ID = ? 
                    AND E.employee_ID = ?;
            `;

            connection.query(verifyQuery, [packageID, employeeID], (err, results) => {
                if (err) {
                    console.error("❌ Error verifying package assignment:", err);
                    res.writeHead(500, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                        "Access-Control-Allow-Credentials": "true",
                    });
                    res.end(JSON.stringify({ error: "Database query failed" }));
                    return;
                }

                if (results[0].count === 0) {
                    res.writeHead(403, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                        "Access-Control-Allow-Credentials": "true",
                    });
                    res.end(JSON.stringify({ error: "Not authorized to deliver this package" }));
                    return;
                }

                // ONLY insert into tracking_history (no other table updates)
                const trackingQuery = `
                    INSERT INTO tracking_history (package_ID, location_ID, status, timestamp)
                    SELECT P.Package_ID, P.Next_Destination, 'Delivered', NOW()
                    FROM Package P
                    WHERE P.Package_ID = ?;
                `;

                connection.query(trackingQuery, [packageID], (err, trackingResult) => {
                    if (err) {
                        console.error("❌ Error adding tracking history:", {
                            sqlMessage: err.sqlMessage,
                            sql: err.sql,
                            code: err.code
                        });
                        res.writeHead(500, {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                            "Access-Control-Allow-Credentials": "true",
                        });
                        res.end(JSON.stringify({ 
                            error: "Failed to record delivery",
                            details: err.sqlMessage 
                        }));
                        return;
                    }

                    // Success!
                    res.writeHead(200, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                        "Access-Control-Allow-Credentials": "true",
                    });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: "Package successfully delivered" 
                    }));
                });
            });
        } catch (error) {
            console.error("❌ Error processing request:", error);
            res.writeHead(400, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "https://post-office-web-app.vercel.app",
                "Access-Control-Allow-Credentials": "true",
            });
            res.end(JSON.stringify({ error: "Invalid request format" }));
        }
    });
    
    return true;
}

    return false; // Not handled by this router
}

module.exports = driverRoutes;