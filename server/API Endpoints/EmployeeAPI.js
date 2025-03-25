const connection = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


async function employeeLogIn(req, res) {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const { employee_Username, employee_Password } = JSON.parse(body);

            const sql = "SELECT * FROM employees WHERE employee_Username = ?";
            connection.query(sql, [employee_Username], async (err, results) => {
                if (err) {
                    console.error(" DB Error:", err);
                    res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000"});
                    return res.end(JSON.stringify({ error: "Server error" }));
                }

                if (results.length === 0) {
                    res.writeHead(401, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000", });
                    return res.end(JSON.stringify({ error: "Invalid username or password" }));
                }

                const employee = results[0];
                const isMatch = await bcrypt.compare(employee_Password, employee.employee_Password);

                if (!isMatch) {
                    res.writeHead(401, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000", });
                    return res.end(JSON.stringify({ error: "Invalid username or password" }));
                }

                //  Generate JWT token
                const token = jwt.sign(
                    {
                        id: employee.employee_ID,
                        username: employee.employee_Username,
                        role: employee.Role.toLowerCase(), // warehouse / driver
                        firstName: employee.First_Name,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                //  Send token + role info to frontend
                res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000", 'Set-Cookie': `employeeID=${employee.employee_ID}; Path=/; HttpOnly; SameSite=None; Secure;`,});
                res.end(JSON.stringify({
                    token,
                    role: employee.Role.toLowerCase(),
                    employeeID: employee.employee_ID,
                    firstName: employee.First_Name,
                }));
            });
        } catch (err) {
            console.error(" Error parsing employee login:", err);
            res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000" });
            res.end(JSON.stringify({ error: "Internal server error" }));
        }
    });
}

async function warehouseDashboard(req, res) {
    console.log(req.body);
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
    // var cookies = req.headers?.cookie;
    // console.log("Cookies", cookies);
    const queryString = req.url.split('?')[1];
    const urlParams = new URLSearchParams(queryString);

    // Authenticating
    if (urlParams) {
        //var employeeID = cookies.split('; ').find(row => row.startsWith('employeeID='))?.split('=')[1];
        var employeeID = urlParams.get('employeeID');
        console.log(employeeID);
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
                        console.log("Packages", results);
                        if (results.length > 0) {
                            res.writeHead(200, { 
                                'Content-Type': 'application/json',
                                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                                "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                            });
                        
                            var packages = results.map(row => ({
                                packageID: row.Package_ID,
                                addressCity: row.address_City,
                                addressState: row.address_State
                            }));
                            res.write(JSON.stringify(packages));
                            res.end(); //Used for testing with just the package query
                        }
                    }
                );
                // GET the Post Office and Warehouse locations
                // var postOfficeQuery = `
                // select addresses.address_Street, addresses.address_City, addresses.address_State, addresses.address_Zipcode
                // from db1.addresses
                // where Office_Location = true;
                // `;
                // connection.query(postOfficeQuery, [employeeID],
                //     (err, results) => {
                //         if (err) {
                //             console.error('Error accessing database', err);
                //             res.writeHead(500, { 
                //                 'Content-Type': 'application/json',
                //                 "Access-Control-Allow-Origin": "http://localhost:3000", // Allow the React app origin
                //                 "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
                //             });
                //             res.end(JSON.stringify({ error: 'Database Query Error' }));
                //             return;
                //         }
                //         console.log("Post Offices", results);
                //         if (results.length > 0) {
                //             var postOffices = results.map(
                //                 row => ({
                //                     addressStreet: row.address_Street,
                //                     addressCity: row.address_City,
                //                     addressState: row.address_State,
                //                     address_Zipcode: row.address_Zipcode
                //                 })
                //             );
                //             res.write(JSON.stringify(postOffices));
                //             res.end();
                //         }
                //     }
                // );




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