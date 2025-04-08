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
                res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000",});
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


// Trigger Ideas:
// This may be a single trigger or a combination of triggers.
/* When an employee assigns a package, it may only be to a vehicle marked as not at capacity. Part of the trigger will be
setting a vehicle's At_Capacity attribute to "true" when a vehicle either has a Volume_Capacity less than or equal to 0.5 cubic feet
or a Payload_Capacity less than or equal to 1 pound. These are not exactly at 0 to provide a little bit of leeway from a real-world context.
Additionally, if the package that an employee attempts to assign to a vehicle would cause it to be over capacity, the employee will
receive a message telling him or her that the package cannot be assigned to that vehicle. 
*/

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
                var responseData = {};
                
                // GET the Package_ID, address_City, and address_State of every package needing to be processed at
                // the employee's location.
                var packageQuery = `
                select package.Package_ID, package.Priority, package.Weight, ROUND(((package.Length/12) * (package.Width/12) * (package.Height/12)), 1) as Package_Volume,
                addresses.address_Street, addresses.address_City, addresses.address_State, addresses.address_Zipcode, package.Destination_ID
                from db1.package, db1.addresses, db1.employees, db1.post_office_location
                where package.Destination_ID = addresses.address_ID and post_office_location.location_ID = employees.Location_ID
                and package.Next_Destination = post_office_location.Address_ID
                and package.Next_Destination = (
                SELECT tracking_history.location_ID 
                    FROM db1.tracking_history 
                    WHERE tracking_history.package_ID = package.Package_ID 
                    ORDER BY tracking_history.timestamp DESC 
                    LIMIT 1
                )
                and employees.Employee_ID = ?
                ORDER BY package.Priority ASC;
                `;
                connection.query(packageQuery, [employeeID], (err, packageResults) => {
                    if (err) {
                        console.error("Error accessing database:", err);
                        res.writeHead(500, { 
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "http://localhost:3000",
                            "Access-Control-Allow-Credentials": "true", 
                        });
                        res.end(JSON.stringify({ error: "Database Query Error" }));
                        return;
                    }
    
                    responseData.packages = packageResults.map(row => ({
                        packageID: row.Package_ID,
                        packagePriority: row.Priority,
                        packageWeight: row.Weight,
                        packageVolume: row.Package_Volume,
                        destination: {  // Store only this package's destination
                            addressID: row.Destination_ID,
                            addressStreet: row.address_Street,
                            addressCity: row.address_City,
                            addressState: row.address_State,
                            addressZipcode: row.address_Zipcode,
                            type: "Destination"
                        }
                    }));

                    // GET Post Office and Warehouse locations
                    var postOfficeQuery = `
                    SELECT addresses.address_ID, addresses.address_Street, addresses.address_City, addresses.address_State, addresses.address_Zipcode
                    FROM db1.addresses, db1.employees, db1.post_office_location
                    WHERE addresses.Office_Location = true and post_office_location.location_ID <> employees.Location_ID
                    and post_office_location.Address_ID = addresses.Address_ID and employees.Employee_ID = ?;
                    `;

                    connection.query(postOfficeQuery, [employeeID], (err, postOfficeResults) => {
                        if (err) {
                            console.error("Error accessing database:", err);
                            res.writeHead(500, { 
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "http://localhost:3000",
                                "Access-Control-Allow-Credentials": "true",
                            });
                            res.end(JSON.stringify({ error: "Database Query Error" }));
                            return;
                        }

                        responseData.postOffices = postOfficeResults.map(row => ({
                            addressID: row.address_ID,
                            addressStreet: row.address_Street,
                            addressCity: row.address_City,
                            addressState: row.address_State,
                            addressZipcode: row.address_Zipcode,
                            type: "Warehouse"
                        }));

                        // GET the Residential and Business locations
                        var residentialBusinessQuery = `
                        SELECT addresses.address_ID, addresses.address_Street, addresses.address_City, addresses.address_State, addresses.address_Zipcode
                        FROM db1.addresses
                        WHERE Office_Location = false;
                        `;

                        connection.query(residentialBusinessQuery,
                            (err, residentialBusinessResults) => {
                                if (err) {
                                    console.error("Error accessing database:", err);
                                    res.writeHead(500, { 
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "http://localhost:3000",
                                        "Access-Control-Allow-Credentials": "true",
                                    });
                                    res.end(JSON.stringify({ error: "Database Query Error" }));
                                    return;
                                }

                                responseData.residentialBusiness = residentialBusinessResults.map(
                                    row => ({
                                        addressID: row.address_ID,
                                        addressStreet: row.address_Street,
                                        addressCity: row.address_City,
                                        addressState: row.address_State,
                                        address_Zipcode: row.address_Zipcode,
                                    })
                                );


                                // GET the Delivery Vehicles information
                                var deliveryVehicleQuery = `
                                select Vehicle_ID, ROUND(Volume_Capacity - SUM((Length/12) * (Width/12) * (Height/12)), 1) as Remaining_Volume, ROUND(Payload_Capacity - SUM(Weight), 1) as Remaining_Payload
                                from db1.delivery_vehicle, db1.employees, db1.package
                                where delivery_vehicle.Location_ID = employees.Location_ID and package.Assigned_Vehicle = delivery_vehicle.Vehicle_ID and delivery_vehicle.At_Capacity = false
                                and delivery_vehicle.Status = "Available" and employees.Employee_ID = 104
                                GROUP BY Vehicle_ID, Volume_Capacity, Payload_Capacity;
                                `;

                                connection.query(deliveryVehicleQuery, 
                                    (err, deliveryVehicleResults) => {
                                        if (err) {
                                            console.error("Error accessing database:", err);
                                            res.writeHead(500, { 
                                                "Content-Type": "application/json",
                                                "Access-Control-Allow-Origin": "http://localhost:3000",
                                                "Access-Control-Allow-Credentials": "true",
                                            });
                                            res.end(JSON.stringify({ error: "Database Query Error" }));
                                            return;
                                        }

                                        responseData.deliveryVehicles = deliveryVehicleResults.map(
                                            row => ({
                                                vehicleID: row.Vehicle_ID,
                                                volumeCapacity: row.Remaining_Volume,
                                                payloadCapacity: row.Remaining_Payload,
                                            })
                                        );

                                        // Send the final combined response
                                        res.writeHead(200, { 
                                            "Content-Type": "application/json",
                                            "Access-Control-Allow-Origin": "http://localhost:3000",
                                            "Access-Control-Allow-Credentials": "true",
                                        });
                                        res.end(JSON.stringify(responseData));
                                        console.log(responseData);

                                    }
                                );

                                

                            }
                        );

                        
                    });
                
                });




            } else if (req.method === "POST") { // If the request is POST (employee is attempting to assign a package)
                // The query will do the following things (in rougly this order):
                /* The employee will attempt to assign a package to a delivery vehicle. In doing so, the employee will be
                attempting to update the package's Next_Destination and Assigned_Vehicle attributes.
                Before the package's attributes are update, a trigger will execute to determine if the delivery vehicle the 
                package is assigned to has enough capacity (both volumetric and payload) to hold the package. If the delivery 
                vehicle can accomodate the package, the package is successfully assigned and the attributes are modified.
                Otherwise, the package is not successfully assigned, the attributes are not modified, and the user will receive
                a message indicating that the package cannot be assigned to the chosen vehicle. See my notes about multi-user
                concurrency issues for why a trigger, rather than front-end or back-end functionality, is necessary here.
                */
                // The TA says the trigger is good. He said that the semantic constraint is "That delivery vehicles have a limited
                // capacity, and we want to ensure that we do not go over this capacity."
                // Side Note: I don't even think we need an At_Capacity attribute for the Delivery_Vehicle anymore. I think we can
                // get all of the delivery vehicles with a capacity greater than or equal to the threshold amount (for both payload
                // and volume capacity) from the query. This might be a complex query, but I really do think that it's doable. And it
                // reduces the amount of triggers that need to be created if so, as well as gets rid of an attribute that must constantly
                // change back-and-forth in the database. The data is already in there, after all.
                
                // Notes for things to add:
                /*
                * Make the Warehouse Dashboard better. Also consolidate the address dropdown so that it only shows the post office
                and delivery addresses.
                * Make the package creation form. The package creation form has a trigger that creates a new address 
                (if there is not currently an address with that location) and creates an instance of transaction.
                * Make the inventory purchase page on the customer side. When a customer purchases an inventory item, it should 
                create a new instance of transaction and a new instance of a package.

                * We need a check so that we don't also get the address of the current warehouse the employee is at.
                */

                var body = "";

                req.on("data", chunk => {
                    body += chunk.toString();
                });

                req.on("end", () => {
                    try {
                        // Parse request body as JSON
                        const { nextDestination, assignedVehicle, packageId } = JSON.parse(body);

                        // SQL query to update the package
                        const query = `
                            UPDATE package 
                            SET Next_Destination = ?, Assigned_Vehicle = ?
                            WHERE Package_ID = ?`;

                        connection.query(query, [nextDestination, assignedVehicle, packageId], (error, results) => {
                            if (error) {
                                console.error("Error updating package:", error);
                                res.writeHead(500, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ message: error.message }));
                                console.log("Error updating package");
                                return;
                            }

                            if (results.affectedRows > 0) {
                                res.writeHead(200, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ message: "Package updated successfully!", updatedPackageId: packageId }));
                                console.log("Package successfully updated.");
                            } else {
                                res.writeHead(404, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ message: "Package not found or no changes made." }));
                                console.log("Package not modified.");
                            }
                        });

                    } catch (err) {
                        console.error("Error parsing request body:", err);
                        res.writeHead(400, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Invalid JSON format in request body." }));
                    }
                });


            }
        } else {
            res.writeHead(401, { 
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "http://localhost:3000/", // Allow the React app origin
                "Access-Control-Allow-Credentials": "true", // Include if you're using cookies 
             });
            res.end(JSON.stringify({ error: 'Unauthorized, incorrect employee ID' }));
        }
    } else {
        res.writeHead(401, { 
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "http://localhost:3000/", // Allow the React app origin
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