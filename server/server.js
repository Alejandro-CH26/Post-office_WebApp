require("dotenv").config({ path: "./.env" });
const http = require("http");
const db = require("./db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { handleReportRequest } = require("./report");
const url = require("url");

// Handle route files
const notificationRoutes = require("./notificationRoutes");
const reportRoutes = require("./reportRoutes");
const employeeRoutes = require("./employeeRoutes");
const driverRoutes = require("./driverRoutes");
const clockRoutes = require("./clockRoutes");

// Import the inventory API from the same folder
const inventoryAPI = require("./inventory");
const productsAPI = require("./products");
const locationAPI = require("./locationAPI");
const cartAPI = require("./cartAPi"); 
const handleCheckout = require("./checkout"); // 👈 Add this
const orderHistory = require("./orderHistory"); // 👈 Add this
const restock = require("./restock");
const salesReport = require("./salesReport");
// API functions
const EmployeeAPI = require("./API Endpoints/EmployeeAPI.js");

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env file!");
    process.exit(1);
}

// Create HTTP Server
const server = http.createServer((req, res) => {
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

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const reqUrl = url.parse(req.url, true);
  const path = req.url.split('?')[0]; // Path without search parameters
    console.log(req.method);
    console.log(req.url);

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }


    // Route handling:
    if (notificationRoutes(req, res, reqUrl)) return;
    if (reportRoutes(req, res, reqUrl)) return;
    if (employeeRoutes(req, res, reqUrl)) return;
    //if (inventoryAPI(req, res, reqUrl)) return; 
    //if (driverRoutes(req, res, reqUrl)) return; 
    if (clockRoutes(req, res, reqUrl)) return; 

    if (inventoryAPI(req, res, reqUrl)) return; // New Inventory route
    if (driverRoutes(req, res, reqUrl)) return; // New Driver route
    if (productsAPI(req, res, reqUrl)) return;
    if (locationAPI(req, res, reqUrl)) return;
    if (cartAPI(req, res, reqUrl)) return;
    if (handleCheckout(req, res, reqUrl)) return;
    if (orderHistory(req, res, reqUrl)) return;
    if (restock(req, res, reqUrl)) return;
    if (salesReport(req, res, reqUrl)) return;
    // Registration Route 
    if (req.method === "POST" && req.url === "/register") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            const data = JSON.parse(body);
            console.log("🔍 Received Data:", data);

            const { first_Name, last_Name, middle_Name, customer_Email, customer_Username, customer_Password, date_Of_Birth, phone_Number } = data;

            try {
                // Hashing password before saving
                const hashedPassword = await bcrypt.hash(customer_Password, 10);

                const sql = `
          INSERT INTO customers 
          (first_Name, last_Name, middle_Name, customer_Email, customer_Username, customer_Password, date_Of_Birth, phone_Number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

                db.query(sql, [first_Name, last_Name, middle_Name || null, customer_Email, customer_Username, hashedPassword, date_Of_Birth, phone_Number],
                    (err, result) => {
                        if (err) {
                            if (err.code === "ER_DUP_ENTRY") {
                                let errorMessage = "Duplicate entry error: ";
                                if (err.sqlMessage.includes("customers.customer_Email"))
                                    errorMessage = "Email already exists.";
                                else if (err.sqlMessage.includes("customers.customer_Username"))
                                    errorMessage = "Username already exists.";
                                else if (err.sqlMessage.includes("customers.phone_Number"))
                                    errorMessage = "Phone number already exists.";

                                console.error("Duplicate Entry Error:", errorMessage);
                                res.writeHead(409, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ status: "error", message: errorMessage }));
                                return;
                            }
                            console.error("Query Error:", err);
                            res.writeHead(500, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ status: "error", message: "Database error" }));
                        } else {
                            console.log("Customer successfully registered!");
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ status: "success", message: "Registration successful. Please log in." }));
                        }
                    }
                );
            } catch (error) {
                console.error("Registration Error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "Internal Server Error" }));
            }
        });
    }

    else if (req.method === "GET" && req.url === "/locations") {
        try {
            db.query(
                "SELECT location_ID, name FROM post_office_location",
                (err, results) => {
                    if (err) {
                        console.error("Error fetching locations:", err);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Database error" }));
                        return;
                    }

                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(results));
                }
            );
        } catch (error) {
            console.error("Unexpected error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }


    else if (req.method === "POST" && req.url === "/post-office") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            try {
                const data = JSON.parse(body);
                const {
                    name,
                    street_address,
                    city,
                    state,
                    zip,
                    office_phone,
                } = data;

                if (!name || !street_address || !city || !state || !zip || !office_phone) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ status: "error", message: "Missing required fields." }));
                    return;
                }

                const [addressCheck] = await db.promise().query(
                    `SELECT * FROM post_office_location
           WHERE street_address = ? AND city = ? AND state = ? AND zip = ?`,
                    [street_address, city, state, zip]
                );

                if (addressCheck.length > 0) {
                    res.writeHead(409, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ status: "error", message: "A post office at this address already exists." }));
                    return;
                }

                const [phoneCheck] = await db.promise().query(
                    `SELECT * FROM post_office_location WHERE office_phone = ?`,
                    [office_phone]
                );

                if (phoneCheck.length > 0) {
                    res.writeHead(409, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ status: "error", message: "Office phone number is already in use." }));
                    return;
                }

                const [result] = await db.promise().query(
                    `INSERT INTO post_office_location
           (name, street_address, city, state, zip, office_phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [name, street_address, city, state, zip, office_phone]
                );

                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    status: "success",
                    message: "Post office created successfully.",
                    postOfficeID: result.insertId,
                }));
            } catch (err) {
                console.error("Post Office Creation Error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "Internal Server Error" }));
            }
        });
    }

    // Login Route (JWT Authentication)
    else if (req.method === "POST" && req.url === "/login") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            try {
                const { customer_Username, customer_Password } = JSON.parse(body);

                db.query(
                    "SELECT * FROM customers WHERE customer_Username = ?",
                    [customer_Username],
                    async (err, results) => {
                        if (err) {
                            console.error("Database Query Error:", err);
                            res.writeHead(500, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Database error" }));
                            return;
                        }

                        if (results.length === 0) {
                            res.writeHead(401, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Invalid username or password" }));
                            return;
                        }

                        const user = results[0];
                        const passwordMatch = await bcrypt.compare(customer_Password, user.customer_Password);

                        if (!passwordMatch) {
                            res.writeHead(401, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Invalid username or password" }));
                            return;
                        }

                        // Generate JWT token with basic customer info
                        const token = jwt.sign(
                            {
                                id: user.customer_ID,
                                username: user.customer_Username,
                                role: "customer", // include role
                                firstName: user.first_Name
                            },
                            process.env.JWT_SECRET,
                            { expiresIn: "1h" }
                        );

                        console.log("Customer logged in:", user.customer_Username);

                        // Send back token + useful info
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            token,
                            customerID: user.customer_ID,
                            firstName: user.first_Name,
                            role: "customer",
                            message: "Login successful"
                        }));
                    }
                );
            } catch (error) {
                console.error("Login Error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
        });
    }
    // Protected Dashboard Route (JWT Required)
    else if (req.method === "GET" && req.url === "/dashboard") {
        const authHeader = req.headers["authorization"];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: "Unauthorized - No token provided" }));
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Token verified for user:", decoded.username);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "success", message: `Welcome to the dashboard, ${decoded.username}!` }));
        } catch (error) {
            console.error("Token Verification Error:", error);
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: "Invalid or expired token" }));
        }
    }
    else if (req.method === "POST" && req.url === "/addPackage") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            try {
                const data = JSON.parse(body);
                console.log("🔍 Received Data:", data);

                const {
                    weight,
                    sender_Customer_ID,
                    recipient_Customer_ID,
                    origin_ID,
                    destination_ID,
                    shipping_Cost,
                    priority,
                    fragile,
                    transaction_ID,
                    length,
                    width,
                    height
                } = data;

                // Validate required fields
                if (!weight || !sender_Customer_ID || !recipient_Customer_ID || !origin_ID || !destination_ID ||
                    !shipping_Cost || !priority || fragile === undefined || !transaction_ID || !length || !width || !height) {
                    console.error("Missing required fields.");
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ status: "error", message: "Missing required fields." }));
                    return;
                }

                const sql = `
          INSERT INTO package 
          (weight, sender_Customer_ID, recipient_Customer_ID, origin_ID, destination_ID, 
          shipping_Cost, priority, fragile, transaction_ID, length, width, height)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

                db.query(sql, [
                    weight,
                    sender_Customer_ID,
                    recipient_Customer_ID,
                    origin_ID,
                    destination_ID,
                    shipping_Cost,
                    priority,
                    fragile,
                    transaction_ID,
                    length,
                    width,
                    height
                ], (err, result) => {
                    if (err) {
                        console.error("Query Error:", err);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ status: "error", message: "Database error" }));
                        return;
                    }

                    console.log("Package successfully added!");
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ status: "success", message: "Package created successfully.", packageID: result.insertId }));
                });
            } catch (error) {
                console.error("Parsing Error:", error);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "Invalid JSON data." }));
            }
        });
    }
    // Onboard Employee Route
    else if (req.method === "POST" && req.url === "/onboard") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            try {
                const data = JSON.parse(body);
                console.log("Received Data:", data);

                const {
                    employeeID, Fname, middleName, Lname, email, phone, emergencyContact,
                    street, city, state, zip, apartmentNumber,
                    role, hourlyWage, location, locationID,
                    username, password, education, gender,
                    dobDay, dobMonth, dobYear
                } = data;

                // Duplicate check before inserting
                const [duplicates] = await db.promise().query(
                    `SELECT * FROM employees 
                 WHERE Email = ? OR employee_Username = ? OR Phone = ?`,
                    [email, username, phone]
                );

                if (duplicates.length > 0) {
                    const existing = duplicates[0];
                    let conflictField = "an existing record";

                    if (existing.Email === email) conflictField = "Email";
                    else if (existing.employee_Username === username) conflictField = "Username";
                    else if (existing.Phone === phone) conflictField = "Phone number";

                    res.writeHead(409, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        status: "error",
                        message: `${conflictField} already exists.`
                    }));
                    return;
                }

                // Hash the password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert employee into the database
                const sql = `
                INSERT INTO employees 
                (employee_ID, First_Name, Middle_Name, Last_Name, Email, Phone, Emergency_Number,
                 address_Street, address_City, address_State, address_Zipcode, unit_number,
                 Role, Hourly_Wage, Location, Location_ID,
                 employee_Username, employee_Password, Education, Gender,
                 DOB_Day, DOB_Month, DOB_Year)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

                const values = [
                    employeeID, Fname, middleName || null, Lname, email, phone, emergencyContact || null,
                    street, city, state, zip, apartmentNumber || null,
                    role, hourlyWage || null, location, locationID || null,
                    username, hashedPassword, education || null, gender,
                    dobDay, dobMonth, dobYear
                ];

                db.query(sql, values, (err, result) => {
                    if (err) {
                        console.error("Query Error:", err);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ status: "error", message: "Database error" }));
                        return;
                    }

                    console.log("✅ Employee successfully onboarded!");
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        status: "success",
                        message: "Employee onboarded successfully!"
                    }));
                });

            } catch (error) {
                console.error("Registration Error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "Internal Server Error" }));
            }
        });
    }

    else if (req.method === "POST" && req.url === "/employee-login") {
        EmployeeAPI.employeeLogIn(req, res);
    }
    else if (reqUrl.pathname === "/warehouseassignpackages" && req.method === "GET") {
        EmployeeAPI.warehouseAssignPackages(req, res);
    }
    // Admin Login Route
    else if (req.method === "POST" && req.url === "/admin-login") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));
        req.on("end", async () => {
            try {
                const { admin_Username, admin_Password } = JSON.parse(body);
                const sql = "SELECT * FROM admins WHERE admin_Username = ?";
                db.query(sql, [admin_Username], async (err, results) => {
                    if (err || results.length === 0) {
                        res.writeHead(401, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Invalid credentials" }));
                        return;
                    }

                    const admin = results[0];

                    if (!admin.Password) {
                        res.writeHead(401, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "No password found for admin" }));
                        return;
                    }

                    console.log("Password input:", admin_Password);
                    console.log("Hashed from DB:", admin.Password);
                    console.log("Admin object from DB:", admin);

                    // Debug line; remove in production
                    bcrypt.hash("lebron", 10).then(console.log);

                    const isMatch = await bcrypt.compare(admin_Password, admin.Password);

                    if (!isMatch) {
                        res.writeHead(401, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Invalid credentials" }));
                    } else {
                        const token = jwt.sign(
                            { id: admin.admin_ID, username: admin.admin_Username, role: "admin" },
                            process.env.JWT_SECRET,
                            { expiresIn: "1h" }
                        );

                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            token,
                            adminID: admin.admin_ID,
                            firstName: admin.admin_Username
                        }));
                    }
                });
            } catch (err) {
                console.error("Server error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Server error" }));
            }
        });
    }
    else if (req.method === "GET" && req.url === "/report") {
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://post-office-web-app.vercel.app"
        ];

        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
        }
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        handleReportRequest(req, res);
    }
    // 404 Not Found Handler
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "Route not found" }));
    }
});

// **Start Server**
server.listen(5001, () => console.log("🚀 Server running on port 5001"));
