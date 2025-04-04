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
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        setCorsHeaders(req, res);  // Set headers first
        res.writeHead(200);   // Then set status code
        res.end();
        return true;
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    
    // Handle driver packages endpoint
    if (req.method === "GET" && reqUrl.pathname === "/driver/packages") {
        const employeeID = reqUrl.searchParams.get("employeeID");
        
        if (!employeeID) {
            setCorsHeaders(req, res);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Employee ID is required" }));
            return true;
        }

        // Updated query to get packages in transit assigned to the driver
        const query = `
            SELECT 
                P.Package_ID, 
                A.address_Street, 
                A.address_City, 
                A.address_State,
                SE.first_name AS sender_first_name,
                SE.last_name AS sender_last_name,
                P.Recipient_Customer_Name
            FROM employees AS E
            JOIN delivery_vehicle AS D ON E.employee_ID = D.Driver_ID
            JOIN Package AS P ON D.Vehicle_ID = P.Assigned_vehicle
            JOIN addresses AS A ON A.address_ID = P.Next_Destination
            JOIN tracking_history AS T ON P.Package_ID = T.package_ID
            JOIN customers AS SE ON P.Sender_Customer_ID = SE.customer_ID
            
            WHERE E.employee_ID = ?
            AND T.timestamp = (
                SELECT MAX(timestamp)
                FROM tracking_history
                WHERE package_ID = P.Package_ID
    )
    AND (T.status = "In Transit" OR T.status = "Out for Delivery");
        `;

        connection.query(query, [employeeID], (err, results) => {
            if (err) {
                console.error("❌ Error fetching driver packages:", err);
                setCorsHeaders(req, res);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Database query failed" }));
                return;
            }

            // Format the results for the frontend
            const packages = results.map(row => ({
                packageID: row.Package_ID,
                addressStreet: row.address_Street,
                addressCity: row.address_City,
                addressState: row.address_State,
                senderFirstName: row.sender_first_name,
                senderLastName: row.sender_last_name,
                recipientName: row.Recipient_Customer_Name
            }));

            setCorsHeaders(req, res);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(packages));
        });
        
        return true;
    }

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
                    setCorsHeaders(req, res);
                    res.writeHead(400, { "Content-Type": "application/json" });
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
                            setCorsHeaders(req, res);
                            res.writeHead(500, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ 
                                error: "Failed to record delivery",
                                details: err.sqlMessage 
                            }));
                            return;
                        }

                        // Success!
                        setCorsHeaders(req, res);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: "Package successfully delivered" 
                        }));
                    });
                });
            } catch (error) {
                console.error("❌ Error processing request:", error);
                setCorsHeaders(req, res);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid request format" }));
            }
        });
        
        return true;
    }

    return false; // Not handled by this router
}

module.exports = driverRoutes;