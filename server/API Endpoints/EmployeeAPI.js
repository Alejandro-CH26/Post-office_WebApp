const connection = require("../db")

async function employeeLogIn(req, res) {
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
}

async function warehouseDashboard(req, res) {
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
}

async function warehouseAssignPackages(req, res) {
    var cookies = req.headers?.cookie;
    console.log("Cookies", cookies);
    // Authenticating
    if (cookies) {
        var employeeID = cookies.split('; ').find(row => row.startsWith('employeeID='))?.split('=')[1];
        if (employeeID) {
            if (req.method === "GET") { // If the request is GET (employee is attempting to view packages)
                // GET the Package_ID, address_City, and address_State of every package needing to be processed at
                // the employee's location.
                var packageQuery = `
                select package.Package_ID, addresses.address_City, addresses.address_State
                from db1.package, db1.addresses, db1.employees
                where package.Destination_ID = addresses.address_ID and package.Next_Destination = employees.Location_ID
                and employees.Employee_ID = ?;
                `;
                connection.query(packageQuery, [employeeID], 
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
                        console.log("Results", results);
                        if (results.length > 0) {
                            res.writeHead(200, { 
                                'Content-Type': 'application/json',
                                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                                "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                            });
                            res.write(JSON.stringify({
                                packageID: results[0].Package_ID,
                                addressCity: results[0].address_City,
                                addressState: results[0].address_State
                            }));
                        }
                    }
                )
                // GET the Post Office and Warehouse locations
                var postOfficeQuery = `
                select addresses.address_Street, addresses.address_City, addresses.address_State, addresses.address_Zipcode
                from db1.addresses
                where Office_Location = true;
                `;
                

            } else if (req.method === "POST") { // If the request is POST (employee is attempting to assign a package)

            }
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
}

module.exports = {
    employeeLogIn,
    warehouseDashboard,
    warehouseAssignPackages
  };