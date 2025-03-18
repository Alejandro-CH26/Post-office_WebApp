require('dotenv').config();
const http = require('http');
const url = require('url');
const connection = require("../server/db");
const crypto = require("crypto");


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
    if (q.pathname === "/employeelogin" && req.method === "POST") {
        var body = "";
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            var {username, password} = JSON.parse(body);
            console.log(username);
            console.log(password);

            // Checking to see if the username and password are valid
            connection.query(
                "SELECT Employee_ID FROM employees WHERE employee_Username = ? AND employee_Password = ?",
                [username, password],
                (err, results) => {
                    // If username and password are invalid and/or the database can't be reached
                    if (err) {
                        console.error('❌ Database Query Error:', err);
                        res.writeHead(500, { 
                            'Content-Type': 'application/json',
                            "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                            "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                            });
                        res.end(JSON.stringify({ error: 'Database Query Error' }));
                        return;
                    }

                    // If the user name and password are valid and everything's okay
                    if (results.length > 0) {
                        var employeeID = results[0].Employee_ID;
                        
                        // Set cookie with the employeeID so that we know which employee is sending requests
                        res.writeHead(200, {
                            'Content-Type': 'application/json',
                            'Set-Cookie': `employeeID=${employeeID}; Path=/; HttpOnly; SameSite=None; Secure;`, 
                            "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                            "Access-Control-Allow-Credentials": "true", // Include if you're using cookies
                        });
                        
                        // Ending the response
                        res.end(JSON.stringify({success: true}));
                    } else {
                        // Respond if no matching user is found
                        res.writeHead(401, { 
                            'Content-Type': 'application/json',
                            "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                            "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                        });
                        res.end(JSON.stringify({ error: 'Invalid credentials' }));
                    }
                
                }
            )
        });
    } else if (q.pathname === '/warehousedashboard' && req.method === 'GET') {
        // Fetch employee data
        var cookies = req.headers?.cookie;
        console.log("Cookies", cookies);
        if (cookies) {
            var employeeID = cookies.split('; ').find(row => row.startsWith('employeeID='))?.split('=')[1];
            if (employeeID) {
                connection.query(
                    'SELECT First_Name FROM employees WHERE employee_ID = ?',
                    [employeeID],
                    (err, results) => {
                        if (err) {
                            console.error('Error accessing database', err);
                            res.writeHead(500, { 
                                'Content-Type': 'application/json',
                                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                                "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                            });
                            res.end(JSON.stringify({ error: 'Database Query Error' }));
                            return;
                        }

                        if (results.length > 0) {
                            res.writeHead(200, { 
                                'Content-Type': 'application/json',
                                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                                "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                            });
                            res.end(JSON.stringify({ name: results[0].First_Name }));
                        } else {
                            res.writeHead(404, { 
                                'Content-Type': 'application/json',
                                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                                "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                            });
                            res.end(JSON.stringify({ error: 'Employee not found' }));
                        }
                    
                    }
                );
            } else {
                res.writeHead(401, { 
                    'Content-Type': 'application/json',
                    "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                    "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                 });
                res.end(JSON.stringify({ error: 'Unauthorized, incorrect employee ID' }));
            }
        } else {
            res.writeHead(401, { 
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
             });
            res.end(JSON.stringify({ error: 'Unauthorized, no cookies' }));
        }

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
