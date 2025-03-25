require("dotenv").config({ path: "../.env" });
const mysql = require("mysql2");
const fs = require("fs");

// Debugging SSL Path
console.log("🔍 Checking SSL Path:", process.env.SSL_CA);

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: "3306",
    ssl: {
        ca: fs.readFileSync(process.env.SSL_CA),
    },
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ Database Connection Error:", err);
        return;
    }
    console.log("✅ Connected to MySQL with SSL");
});

module.exports = db; // Export database connection
