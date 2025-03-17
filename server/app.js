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
                            'Set-Cookie': `employeeID=${employeeID}; HttpOnly;`, 
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
    }

//     if (q.pathname != "/") {
//       var filename = "." + q.pathname + ".html";
//       console.log(filename);
//       fs.readFile(filename, function(err, data) {
//         if (err) {
//           console.log("Here");
//           fs.readFile("404.html", function(err404, data){
//             console.log("Herererer");
//             if (err404) {
//               res.writeHead(404, {'Content-Type': 'text/html'});
//               return res.end("Somehow, we cannot find the 404.html file. This is probably all your fault.");
//             }
//             res.writeHead(200, {'Content-Type': 'text/html'});
//             res.write(data);
//             return res.end();
//           });
//         } else {
//           res.writeHead(200, {'Content-Type': 'text/html'});
//           res.write(data);
//           return res.end();
//         }
//       });
//    } else {
//       fs.readFile("index.html", function(err, data) {
//         if (err) {
//           fs.readFile("404.html", function(err, data){
//             if (err) {
//               res.writeHead(404, {'Content-Type': 'text/html'});
//               return res.end("Error 404");
//             }
//             res.writeHead(200, {'Content-Type': 'text/html'});
//             res.write(data);
//             return res.end();
//           });
//         }
//         res.writeHead(200, {"Content-Type": "text/html"});
//         res.write(data);
//         return res.end();
//       });
//     }
  }).listen(process.env.PORT, () => {
    console.log('Server running on port', process.env.PORT);
  });

// Run a test query
// connection.query('SELECT * FROM users', (err, results) => {
//     if (err) {
//         console.error('❌ Query Error:', err);
//         return;
//     }
//     console.log('✅ Current Time from DB:', results[0]);
// });


/*
DB
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306, // Default MySQL port
    connectionLimit: 10, // Number of connections in the pool
});

module.exports = pool.promise(); // Export a promise-based pool for async/await
*/

/*
App
const pool = require("./db");

pool.query(
    "SELECT Employee_ID FROM employees WHERE employee_Username = ? AND employee_Password = ?",
    [username, password],
    (err, results) => {
        ...
*/

/*
Employee Dashboard Routing
else if (parsedUrl.pathname === '/employee' && req.method === 'GET') {
    // Fetch employee data
    const cookies = req.headers.cookie;
    if (cookies) {
      const sessionId = cookies
        .split('; ')
        .find(row => row.startsWith('sessionId='))
        ?.split('=')[1];

      const employeeId = sessionStore[sessionId];
      if (employeeId) {
        connection.query(
          'SELECT name FROM employees WHERE id = ?',
          [employeeId],
          (err, results) => {
            if (err) {
              console.error('❌ Database Query Error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database Query Error' }));
              return;
            }

            if (results.length > 0) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ name: results[0].name }));
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Employee not found' }));
            }
          }
        );
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});
*/