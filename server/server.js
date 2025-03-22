require("dotenv").config({ path: "./.env" });
const http = require("http");
const db = require("./db"); // Import database connection
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is missing in .env file!");
    process.exit(1);
}

// Create HTTP Server
const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // 🔹 **Registration Route (Only Adds to Database)**
    if (req.method === "POST" && req.url === "/register") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            const data = JSON.parse(body);
            console.log("🔍 Received Data:", data);

            const { first_Name, last_Name, middle_Name, customer_Email, customer_Username, customer_Password, date_Of_Birth, phone_Number } = data;

            try {
                // **Hash password before saving**
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
                                if (err.sqlMessage.includes("customers.customer_Email")) errorMessage = "Email already exists.";
                                else if (err.sqlMessage.includes("customers.customer_Username")) errorMessage = "Username already exists.";
                                else if (err.sqlMessage.includes("customers.phone_Number")) errorMessage = "Phone number already exists.";

                                console.error("❌ Duplicate Entry Error:", errorMessage);
                                res.writeHead(409, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ status: "error", message: errorMessage }));
                                return;
                            }
                            console.error("❌ Query Error:", err);
                            res.writeHead(500, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ status: "error", message: "Database error" }));
                        } else {
                            console.log("✅ Customer successfully registered!");
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ status: "success", message: "Registration successful. Please log in." }));
                        }
                    }
                );
            } catch (error) {
                console.error("❌ Registration Error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "Internal Server Error" }));
            }
        });
    }


    // 🔹 **Login Route (JWT Authentication)**
    else if (req.method === "POST" && req.url === "/login") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            try {
                const { customer_Username, customer_Password } = JSON.parse(body);

                db.query("SELECT * FROM customers WHERE customer_Username = ?", [customer_Username], async (err, results) => {
                    if (err) {
                        console.error("❌ Database Query Error:", err);
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

                    // **Check if password is valid**
                    const passwordMatch = await bcrypt.compare(customer_Password, user.customer_Password);
                    if (!passwordMatch) {
                        res.writeHead(401, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Invalid username or password" }));
                        return;
                    }

                    // **Generate JWT Token**
                    const token = jwt.sign(
                        { id: user.customer_ID, username: user.customer_Username },
                        process.env.JWT_SECRET,
                        { expiresIn: "1h" }
                    );

                    console.log("✅ User logged in:", user.customer_Username);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ token, message: "Login successful" }));
                });
            } catch (error) {
                console.error("❌ Login Error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
        });
    }

    // 🔹 **Protected Dashboard Route (JWT Required)**
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
            console.log("✅ Token verified for user:", decoded.username);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "success", message: `Welcome to the dashboard, ${decoded.username}!` }));
        } catch (error) {
            console.error("❌ Token Verification Error:", error);
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
                    console.error("❌ Missing required fields.");
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
                        console.error("❌ Query Error:", err);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ status: "error", message: "Database error" }));
                        return;
                    }

                    console.log("✅ Package successfully added!");
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ status: "success", message: "Package created successfully.", packageID: result.insertId }));
                });

            } catch (error) {
                console.error("❌ Parsing Error:", error);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "Invalid JSON data." }));
            }
        });
    }


    else if (req.method === "POST" && req.url === "/onboard") {
        let body = "";

        req.on("data", (chunk) => (body += chunk.toString()));

        req.on("end", async () => {
            try {
                const data = JSON.parse(body);
                console.log("🔍 Received Data:", data);

                // Extract fields from request body
                const {
                    employeeID, Fname, middleName, Lname, email, phone, emergencyContact,
                    addressID, street, city, state, zip, apartmentNumber,
                    role, salary, hourlyWage, supervisorID, location, locationID,
                    username, password, education, gender,
                    dobDay, dobMonth, dobYear
                } = data;

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Combine DOB fields
                const dateOfBirth = `${dobYear}-${dobMonth}-${dobDay}`;

                // SQL query to insert into employees table
                const sql = `
                INSERT INTO employees 
                (employee_ID, First_Name, Middle_Name, Last_Name, Email, Phone, Emergency_Number, 
                Address_ID, address_Street, address_City, address_State, address_Zipcode, unit_number,
                Role, Salary, Hourly_Wage, Supervisor_ID, Location, Location_ID, 
                employee_Username, employee_Password, Education, Gender, DOB)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

                const values = [
                    employeeID, Fname, middleName || null, Lname, email, phone, emergencyContact || null,
                    addressID || null, street, city, state, zip, apartmentNumber || null,
                    role, salary || null, hourlyWage || null, supervisorID || null, location, locationID || null,
                    username, hashedPassword, education || null, gender, dateOfBirth
                ];

                db.query(sql, values, (err, result) => {
                    if (err) {
                        if (err.code === "ER_DUP_ENTRY") {
                            let errorMessage = "Duplicate entry error: ";
                            if (err.sqlMessage.includes("employees.Email")) errorMessage = "Email already exists.";
                            else if (err.sqlMessage.includes("employees.employee_Username")) errorMessage = "Username already exists.";
                            else if (err.sqlMessage.includes("employees.Phone")) errorMessage = "Phone number already exists.";

                            console.error("❌ Duplicate Entry Error:", errorMessage);
                            res.writeHead(409, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ status: "error", message: errorMessage }));
                            return;
                        }
                        console.error("❌ Query Error:", err);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ status: "error", message: "Database error" }));
                    } else {
                        console.log("✅ Employee successfully registered!");
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ status: "success", message: "Employee onboarded successfully!" }));
                    }
                });

            } catch (error) {
                console.error("❌ Registration Error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "Internal Server Error" }));
            }
        });
    }







    // 🔹 **404 Not Found Handler**
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "Route not found" }));
    }
});

// **Start Server**
server.listen(5001, () => console.log("🚀 Server running on port 5001"));
