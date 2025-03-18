require('dotenv').config();

console.log("🔍 DB_USER:", process.env.DB_USER);
console.log("🔍 DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("🔍 DB_HOST:", process.env.DB_HOST);
console.log("🔍 DB_HOST:", process.env.SSL_CA);


const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:'3306',
    ssl: {
        ca: fs.readFileSync(process.env.SSL_CA)
    },
    connectionLimit: 10
});

module.exports = connection;