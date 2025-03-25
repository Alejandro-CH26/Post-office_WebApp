require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

// Debugging SSL Path
console.log("🔍 Checking SSL Path:", process.env.SSL_CA);

// Resolve the path relative to the current directory
const sslCaPath = path.resolve(__dirname, process.env.SSL_CA);

// Verify file exists before reading
if (!fs.existsSync(sslCaPath)) {
    console.error(`❌ SSL Certificate not found at: ${sslCaPath}`);
    process.exit(1);
}

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: "3306",
    ssl: {
        ca: fs.readFileSync(sslCaPath),
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

module.exports = db;