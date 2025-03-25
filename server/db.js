require("dotenv").config({ path: "../.env" });
const mysql = require("mysql2");
const fs = require("fs");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: "3306",
    ssl: {
        ca: fs.readFileSync(process.env.SSL_CA)
    },
    connectionLimit: 10
});

module.exports = db; // Export database connection
