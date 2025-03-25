require("dotenv").config({ path: "./.env" });
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");
const reportRoutes = require('./report');

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env file!");
    process.exit(1);
}

const app = express();
const port = 5001;

app.use(cors());

app.use(express.json());
app.use('/report', reportRoutes);

// Registration Route
app.post("/register", async (req, res) => {
    try {
        const { 
            first_Name, last_Name, middle_Name, customer_Email, 
            customer_Username, customer_Password, date_Of_Birth, phone_Number 
        } = req.body;

        // Hashing password before saving
        const hashedPassword = await bcrypt.hash(customer_Password, 10);

        const sql = `
            INSERT INTO customers 
            (first_Name, last_Name, middle_Name, customer_Email, customer_Username, customer_Password, date_Of_Birth, phone_Number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, 
            [first_Name, last_Name, middle_Name || null, customer_Email, customer_Username, hashedPassword, date_Of_Birth, phone_Number],
            (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        let errorMessage = "Duplicate entry error: ";
                        if (err.sqlMessage.includes("customers.customer_Email")) errorMessage = "Email already exists.";
                        else if (err.sqlMessage.includes("customers.customer_Username")) errorMessage = "Username already exists.";
                        else if (err.sqlMessage.includes("customers.phone_Number")) errorMessage = "Phone number already exists.";

                        console.error("Duplicate Entry Error:", errorMessage);
                        return res.status(409).json({ status: "error", message: errorMessage });
                    }
                    console.error("Query Error:", err);
                    return res.status(500).json({ status: "error", message: "Database error" });
                }

                console.log("Customer successfully registered!");
                res.status(200).json({ status: "success", message: "Registration successful. Please log in." });
            }
        );
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { customer_Username, customer_Password } = req.body;

        db.query(
            "SELECT * FROM customers WHERE customer_Username = ?",
            [customer_Username],
            async (err, results) => {
                if (err) {
                    console.error("Database Query Error:", err);
                    return res.status(500).json({ error: "Database error" });
                }

                if (results.length === 0) {
                    return res.status(401).json({ error: "Invalid username or password" });
                }

                const user = results[0];
                const passwordMatch = await bcrypt.compare(
                    customer_Password,
                    user.customer_Password
                );

                if (!passwordMatch) {
                    return res.status(401).json({ error: "Invalid username or password" });
                }

                // Generate JWT token with basic customer info
                const token = jwt.sign(
                    {
                        id: user.customer_ID,
                        username: user.customer_Username,
                        role: "customer",
                        firstName: user.first_Name
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                console.log("Customer logged in:", user.customer_Username);

                // Send back token + useful info
                res.status(200).json({
                    token,
                    customerID: user.customer_ID,
                    firstName: user.first_Name,
                    role: "customer",
                    message: "Login successful"
                });
            }
        );
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Admin Login Route
app.post("/admin-login", async (req, res) => {
    try {
        const { admin_Username, admin_Password } = req.body;

        const sql = "SELECT * FROM admins WHERE admin_Username = ?";
        db.query(sql, [admin_Username], async (err, results) => {
            if (err) {
                console.error("Admin Login DB Error:", err);
                return res.status(500).json({ error: "Server error" });
            }

            // Inside the admin login route
            if (results.length === 0) {
                console.error(`Login attempt failed: No admin found with username ${admin_Username}`);
                return res.status(401).json({ error: "Invalid username or password" });
            }

            const admin = results[0];

            if (!admin.Password) {
                return res.status(401).json({ error: "No password found for admin" });
            }

            try {
                const isMatch = await bcrypt.compare(admin_Password, admin.Password);

                if (!isMatch) {
                    return res.status(401).json({ error: "Invalid credentials" });
                }

                const token = jwt.sign(
                    { 
                        id: admin.admin_ID, 
                        username: admin.admin_Username, 
                        role: "admin" 
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                res.status(200).json({
                    token,
                    adminID: admin.admin_ID,
                    firstName: admin.admin_Username
                });
            } catch (compareError) {
                console.error("Password Compare Error:", compareError);
                res.status(500).json({ error: "Authentication error" });
            }
        });
    } catch (err) {
        console.error("Admin Login Server Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Protected Dashboard Route
app.get("/dashboard", (req, res) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ status: "error", message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token verified for user:", decoded.username);

        res.status(200).json({ status: "success", message: `Welcome to the dashboard, ${decoded.username}!` });
    } catch (error) {
        console.error("Token Verification Error:", error);
        res.status(403).json({ status: "error", message: "Invalid or expired token" });
    }
});

// Add more routes from your original server.js here (addPackage, onboard, etc.)
// They should be converted to Express middleware format similar to the examples above

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});