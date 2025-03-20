require('dotenv').config();
const http = require('http');
const url = require('url');
const connection = require("./db");
const crypto = require("crypto");

// API functions
const EmployeeAPI = require("./API Endpoints/EmployeeAPI.js");

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    console.log(q.pathname);
    console.log(req.method);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "http://localhost:3000", // Allow requests from your React app's origin
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS", // Allowed methods
            "Access-Control-Allow-Headers": "Content-Type", // Allowed headers
            "Access-Control-Allow-Credentials": "true", // Allow cookies
        });
        res.end(); // End the OPTIONS request here
        return;
    }

    // Handling employee log in
    if (q.pathname === "/employee/login" && req.method === "POST") {
        EmployeeAPI.employeeLogIn(req, res);

    } else if (q.pathname === '/employee/warehousedashboard' && req.method === 'GET') {
        EmployeeAPI.warehouseDashboard(req, res);

    } else {
        res.writeHead(404, { 
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
            "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
         });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
  }).listen(process.env.PORT, () => {
    console.log('Server running on port', process.env.PORT);
  });
