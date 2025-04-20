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

function clockRoutes(req, res, reqUrl) {
    
    if (req.method === "OPTIONS") {
        setCorsHeaders(req, res);
        res.writeHead(200);
        res.end();
        return true;
    }
    
    
    if (req.method === "GET" && reqUrl.pathname === "/api/hours_logged/status") {
        const employeeID = reqUrl.query.employee_id;
        
        if (!employeeID) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Employee ID is required" }));
            return true;
        }
    
        const query = `
            SELECT 
                clock_in_time,
                clock_out_time
            FROM hours_logged 
            WHERE Employee_ID = ?
            ORDER BY clock_in_time DESC 
            LIMIT 1
        `;
    
        connection.query(query, [employeeID], (err, results) => {
            if (err) {
                console.error("❌ Database Error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ 
                    error: "Database query failed",
                    details: err.message 
                }));
                return;
            }
    
           
            if (results.length === 0) {
                res.end(JSON.stringify({ 
                    isClockedIn: false,
                    lastClockInTime: null,
                    lastClockOutTime: null
                }));
                return;
            }
    
            const lastRecord = results[0];
            const isClockedIn = lastRecord.clock_in_time !== null && lastRecord.clock_out_time === null;
    
            res.end(JSON.stringify({
                isClockedIn: isClockedIn,
                lastClockInTime: lastRecord.clock_in_time,
                lastClockOutTime: lastRecord.clock_out_time
            }));
        });
        
        return true;
    }

    // Handle clock in/out endpoint
    if (req.method === "POST" && reqUrl.pathname === "/api/hours_logged/clock") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {
                const { employee_id, action } = JSON.parse(body);
                if (!employee_id || !action) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Employee ID and action are required" }));
                    return;
                }
    
                
                const checkQuery = `
                    SELECT 
                        clock_in_time,
                        clock_out_time
                    FROM hours_logged 
                    WHERE Employee_ID = ?
                    ORDER BY clock_in_time DESC 
                    LIMIT 1
                `;
    
                connection.query(checkQuery, [employee_id], (err, results) => {
                    if (err) {
                        console.error("❌ Database Error:", err);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Database query failed" }));
                        return;
                    }
    
                    const hasOpenSession = results.length > 0 && 
                                        results[0].clock_in_time !== null && 
                                        results[0].clock_out_time === null;
    
                    
                    if (action === "in") {
                        if (hasOpenSession) {
                            res.writeHead(400, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Employee is already clocked in" }));
                            return;
                        }
    
                        const insertQuery = `
                            INSERT INTO hours_logged (Employee_ID, clock_in_time)
                            VALUES (?, NOW())
                        `;
    
                        connection.query(insertQuery, [employee_id], (err) => {
                            if (err) {
                                console.error("❌ Failed to clock in:", err);
                                res.writeHead(500, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ error: "Failed to clock in" }));
                                return;
                            }
    
                            res.end(JSON.stringify({ 
                                success: true, 
                                message: "Clocked in successfully"
                            }));
                        });
                    } 
                    
                    else if (action === "out") {
                        if (!hasOpenSession) {
                            res.writeHead(400, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "No active clock-in session found" }));
                            return;
                        }
    
                        const updateQuery = `
                            UPDATE hours_logged 
                            SET clock_out_time = NOW()
                            WHERE Employee_ID = ? 
                            AND clock_out_time IS NULL
                            ORDER BY clock_in_time DESC
                            LIMIT 1
                        `;
    
                        connection.query(updateQuery, [employee_id], (err) => {
                            if (err) {
                                console.error("❌ Failed to clock out:", err);
                                res.writeHead(500, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ error: "Failed to clock out" }));
                                return;
                            }
    
                            res.end(JSON.stringify({ 
                                success: true, 
                                message: "Clocked out successfully"
                            }));
                        });
                    }
                });
            } catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid request format" }));
            }
        });
        return true;
    }

    
    if (req.method === "GET" && reqUrl.pathname === "/api/employees") {
        
        
        const query = `
            SELECT 
                employee_ID,
                First_Name,
                Last_Name,
                role
            FROM employees
            ORDER BY Last_Name, First_Name
        `;

        connection.query(query, (err, results) => {
            if (err) {
                console.error("❌ Error fetching employees:", err);
                setCorsHeaders(req, res);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Database query failed" }));
                return;
            }

            setCorsHeaders(req, res);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results));
        });
        
        return true;
    }

    // Admin endpoint to get clock history for an employee
    if (req.method === "GET" && reqUrl.pathname === "/api/hours_logged/history") {
        const employeeID = reqUrl.query.employee_id;
        const startDate = reqUrl.query.start_date;
        const endDate = reqUrl.query.end_date;     
        
        if (!employeeID) {
            setCorsHeaders(req, res);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Employee ID is required" }));
            return true;
        }

        let query = `
            SELECT 
                id,
                Employee_ID,
                action_type,
                timestamp
            FROM hours_logged 
            WHERE Employee_ID = ?
        `;
        
        const queryParams = [employeeID];
        
        
        if (startDate) {
            query += ` AND DATE(timestamp) >= ?`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND DATE(timestamp) <= ?`;
            queryParams.push(endDate);
        }
        
        query += ` ORDER BY timestamp DESC`;

        connection.query(query, queryParams, (err, results) => {
            if (err) {
                console.error("❌ Error fetching clock history:", err);
                setCorsHeaders(req, res);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Database query failed" }));
                return;
            }

            setCorsHeaders(req, res);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results));
        });
        
        return true;
    }

    return false;
}

module.exports = clockRoutes;