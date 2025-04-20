const connection = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const allowedOrigins = [
    "http://localhost:3000",
    "https://post-office-web-app.vercel.app",
    "https://post-office-webapp.onrender.com"
];

function getCORSOrigin(req) {
    const origin = req.headers.origin;
    return allowedOrigins.includes(origin) ? origin : "http://localhost:3000";
}

function setCORSHeaders(req, res, allowCredentials = false) {
    const origin = getCORSOrigin(req);
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (allowCredentials) {
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }
}

function generateTrackingNumber(packageID) {
    return crypto.createHash('sha256').update(packageID.toString()).digest('hex').slice(0, 12);
}

async function employeeLogIn(req, res) {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });
    setCORSHeaders(req, res);
    req.on("end", async () => {
        try {
            const { employee_Username, employee_Password } = JSON.parse(body);

            // const sql = "SELECT * FROM employees WHERE employee_Username = ?";
            const sql = "SELECT * FROM employees WHERE employee_Username = ? AND is_fired = 0";

            connection.query(sql, [employee_Username], async (err, results) => {
                if (err) {
                    console.error(" DB Error:", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Server error" }));
                }

                if (results.length === 0) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Invalid username or password" }));
                }

                const employee = results[0];
                const isMatch = await bcrypt.compare(employee_Password, employee.employee_Password);

                if (!isMatch) {
                    res.writeHead(401, { "Content-Type": "application/json" });
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
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    token,
                    role: employee.Role.toLowerCase(),
                    employeeID: employee.employee_ID,
                    firstName: employee.First_Name,
                }));
            });
        } catch (err) {
            console.error(" Error parsing employee login:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
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
                        setCORSHeaders(req, res, true);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: 'Database Query Error' }));
                        return;
                    }

                    if (results.length > 0) {
                        setCORSHeaders(req, res, true);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ name: results[0].First_Name }));
                    } else {
                        setCORSHeaders(req, res, true);
                        res.writeHead(404, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: 'Employee not found' }));
                    }

                }
            );
        } else {
            setCORSHeaders(req, res, true);
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: 'Unauthorized, incorrect employee ID' }));
        }
    } else {
        setCORSHeaders(req, res, true);
        res.writeHead(401, { "Content-Type": "application/json" });
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
                ORDER BY package.Priority DESC;
                `;
                connection.query(packageQuery, [employeeID], (err, packageResults) => {
                    if (err) {
                        console.error("Error accessing database:", err);
                        setCORSHeaders(req, res, true);
                        res.writeHead(500, {
                            "Content-Type": "application/json",
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
                    WHERE addresses.Office_Location = true and addresses.is_deleted = 0 and post_office_location.location_ID <> employees.Location_ID
                    and post_office_location.Address_ID = addresses.Address_ID and employees.Employee_ID = ?;
                    `;

                    connection.query(postOfficeQuery, [employeeID], (err, postOfficeResults) => {
                        if (err) {
                            console.error("Error accessing database:", err);
                            setCORSHeaders(req, res, true);
                            res.writeHead(500, {
                                "Content-Type": "application/json",
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
                                    setCORSHeaders(req, res, true);
                                    res.writeHead(500, {
                                        "Content-Type": "application/json",
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
                                SELECT 
                                    dv.Vehicle_ID, 
                                    ROUND(dv.Volume_Capacity - COALESCE(SUM(p.Length/12 * p.Width/12 * p.Height/12), 0), 1) AS Remaining_Volume, 
                                    ROUND(dv.Payload_Capacity - COALESCE(SUM(p.Weight), 0), 1) AS Remaining_Payload,
                                    p.Package_ID, 
                                    p.Priority, 
                                    p.Weight, 
                                    ROUND((p.Length/12 * p.Width/12 * p.Height/12), 1) AS Package_Volume,
                                    a.address_Street, 
                                    a.address_City, 
                                    a.address_State, 
                                    a.address_Zipcode, 
                                    p.Destination_ID
                                FROM db1.delivery_vehicle dv
                                JOIN db1.employees e ON dv.Location_ID = e.Location_ID
                                LEFT JOIN db1.package p ON p.Assigned_Vehicle = dv.Vehicle_ID
                                LEFT JOIN db1.addresses a ON p.Destination_ID = a.address_ID
                                WHERE dv.Status = "Available" 
                                    AND e.Employee_ID = ?
                                GROUP BY dv.Vehicle_ID, dv.Volume_Capacity, dv.Payload_Capacity, 
                                        p.Package_ID, p.Priority, p.Weight, p.Length, p.Width, p.Height, 
                                        a.address_Street, a.address_City, a.address_State, a.address_Zipcode, p.Destination_ID;
                                `;

                                connection.query(deliveryVehicleQuery, [employeeID],
                                    (err, deliveryVehicleResults) => {
                                        if (err) {
                                            console.error("Error accessing database:", err);
                                            setCORSHeaders(req, res, true);
                                            res.writeHead(500, {
                                                "Content-Type": "application/json",
                                            });
                                            res.end(JSON.stringify({ error: "Database Query Error" }));
                                            return;
                                        }

                                        responseData.deliveryVehicles = {};

                                        deliveryVehicleResults.forEach(row => {
                                            const vehicleID = row.Vehicle_ID;

                                            // If vehicle is not already in responseData, initialize it
                                            if (!responseData.deliveryVehicles[vehicleID]) {
                                                responseData.deliveryVehicles[vehicleID] = {
                                                    vehicleID: vehicleID,
                                                    volumeCapacity: row.Remaining_Volume,
                                                    payloadCapacity: row.Remaining_Payload,
                                                    packages: [] // Initialize empty package list
                                                };
                                            }

                                            // Push package details into the array for the vehicle
                                            responseData.deliveryVehicles[vehicleID].packages.push({
                                                packageID: row.Package_ID,
                                                priority: row.Priority,
                                                weight: row.Weight,
                                                packageVolume: row.Package_Volume,
                                                addressStreet: row.address_Street,
                                                addressCity: row.address_City,
                                                addressState: row.address_State,
                                                addressZipcode: row.address_Zipcode,
                                                destinationID: row.Destination_ID
                                            });
                                        });



                                        setCORSHeaders(req, res, true);
                                        res.writeHead(200, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify(responseData));

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
            setCORSHeaders(req, res, true);
            res.writeHead(401, {
                'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Unauthorized, incorrect employee ID' }));
        }
    } else {
        setCORSHeaders(req, res, true);
        res.writeHead(401, {
            'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Unauthorized, no cookies' }));
    }
}

async function warehouseRegisterPackage(req, res) {
    /*
    This endpoint needs to do the following:
    * The front-end page should allow the customer/employee to enter in all of the package data. Once done, there should be a button
    to checkout. Validation should ensure that all fields are filled in before the customer can proceed to checkout.
    * The checkout page should display all of the package information as a summary in a box at the top of the page. The checkout page
    should calculate the total shipping cost and ask for the user's payment information to checkout with. There should also be a
    button to cancel and return to the previous page, as well as a button to checkout once all the user's payment information is entered.
    * When the checkout button is pressed, it should make a call using the Fetch API to the warehouseRegisterPackage route, with
    all of the data necessary to create a new transaction instance and a new package instance.
    * The transaction instance will require the following attributes, 
    * Create a new package instance with the correct Weight, Sender_Customer_ID, Origin_ID, Destination_ID, Shipping_Cost, Priority,
    Fragile, Transaction_ID, Length, Width, Height, Next_Destination, Assigned_Vehicle, and Recipient_Customer_Name.
    * There also needs to be a customer look-up page, where the Warehouse Employee enters in the name of the customer, and it
    retrieves a list of all customers with matching names, as well as the address (and birthdate?) of each customer for differentiation
    purposes.
    * The very first thing we need to do is check if the recipient address matches any address currently in the addresses table.
    If there is not a match, then we need to create a new instance of an address.
    * We also need to automatically update the At_Capacity attribute when a truck becomes full.
    */
    const queryString = req.url.split('?')[1];
    const urlParams = new URLSearchParams(queryString);

    if (urlParams) {
        var employeeID = urlParams.get('employeeID');
        console.log(employeeID);
        if (employeeID) {
            if (req.method === "POST") {
                var body = "";

                req.on("data", chunk => {
                    body += chunk.toString();
                });

                req.on("end", async () => {
                    const asyncconnection = await connection.promise().getConnection();
                    try {
                        // Parse request body as JSON
                        const { weight, senderCustomerID, recipientCustomerName, destinationStreet,
                            destinationCity, destinationState, destinationZipcode, priority, fragile,
                            length, width, height, paymentMethod, shippingCost, destinationUnit
                        } = JSON.parse(body);

                        console.log(weight, senderCustomerID, recipientCustomerName, destinationStreet,
                            destinationCity, destinationState, destinationZipcode, priority, fragile,
                            length, width, height, paymentMethod, shippingCost, destinationUnit);

                        // First things first, create an order instance.
                        // In order to do this, we need to get the employee's location

                        const [employeeAddressResult] = await asyncconnection.execute(
                            `select Address_ID
                            from employees, post_office_location
                            where employees.Location_ID = post_office_location.location_ID and employees.employee_ID = ?
                            `, [employeeID]
                        );
                        const employeeAddress = employeeAddressResult[0].Address_ID;
                        console.log("Employee Address", employeeAddress);

                        const [employeeLocationResult] = await asyncconnection.execute(
                            `select Location_ID
                            from employees
                            where employees.Employee_ID = ?
                            `, [employeeID]
                        );

                        const employeeLocation = employeeLocationResult[0].Location_ID;
                        console.log("Employee Location", employeeLocation);

                        // Next, we need to get the shipping address ID. 
                        // First, if there is no address for the shipping address, we create one.
                        if (destinationUnit != undefined) {
                            console.log("HERE")
                            var [existingAddress] = await asyncconnection.execute(
                                `SELECT address_ID FROM addresses 
                                 WHERE address_Street = ? AND unit_number <=> ? AND address_City = ? AND address_State = ? AND address_Zipcode = ? AND Office_Location = 0`,
                                [destinationStreet, destinationUnit || null, destinationCity, destinationState, destinationZipcode]
                            );
                        } else {
                            console.log("here")
                            var [existingAddress] = await asyncconnection.execute(
                                `SELECT address_ID FROM addresses 
                                 WHERE address_Street = ? AND unit_number <=> ? AND address_City = ? AND address_State = ? AND address_Zipcode = ? AND Office_Location = 0`,
                                [destinationStreet, null, destinationCity, destinationState, destinationZipcode]
                            );
                        }

                        //console.log("Hello");
                        console.log("Existing Address", existingAddress);

                        var shippingAddressID;
                        if (existingAddress.length > 0) {
                            console.log("Here")
                            shippingAddressID = existingAddress[0].address_ID;
                        } else {
                            console.log("ereh")
                            if (destinationUnit != undefined) {
                                console.log("X")
                                const [newAddress] = await asyncconnection.execute(
                                    `INSERT INTO addresses 
                                     (address_Street, unit_number, address_City, address_State, address_Zipcode, Office_Location) 
                                     VALUES (?, ?, ?, ?, ?, 0)`,
                                    [destinationStreet, destinationUnit || null, destinationCity, destinationState, destinationZipcode]
                                );
                                shippingAddressID = newAddress.insertId;
                            } else {
                                console.log("Y")
                                try {
                                    const [newAddress1] = await asyncconnection.execute(
                                        `INSERT INTO addresses 
                                         (address_Street, unit_number, address_City, address_State, address_Zipcode, Office_Location) 
                                         VALUES (?, ?, ?, ?, ?, 0)`,
                                        [destinationStreet, null, destinationCity, destinationState, destinationZipcode]
                                    );
                                    shippingAddressID = newAddress1.insertId;
                                } catch (error) {
                                    console.error(error.message);
                                }

                            }


                        }

                        console.log("Shipping Address", shippingAddressID);

                        const [orderResult] = await asyncconnection.execute(
                            `INSERT INTO orders (
                               Customer_ID, address_id, shipping_address_id, Total_Amount, status, Payment_Method
                             ) VALUES (?, ?, ?, ?, ?, ?)`,
                            [senderCustomerID, employeeLocation, shippingAddressID, shippingCost, "Completed", paymentMethod]
                        );

                        const order_ID = orderResult.insertId;

                        console.log("Order ID:", order_ID);

                        // Next is the transaction query
                        // const [transactionResult] = await asyncconnection.execute(
                        //     `INSERT INTO db1.transaction (Order_ID, Customer_ID, Payment_method, Item_name, Quantity)
                        //     VALUES (1000, 2, "Credit Card", "Flat Box", 4)`
                        // );
                        const [transactionResult] = await asyncconnection.execute(
                            `INSERT INTO transaction (Order_ID, Customer_ID, Payment_method, Item_name, Quantity) 
                             VALUES (?, ?, ?, ?, ?)`,
                            [order_ID, senderCustomerID, paymentMethod, "Package", 1]
                        );

                        //console.log(transactionResult);
                        const transaction_ID = transactionResult.insertId;
                        console.log("Transaction ID", transaction_ID)

                        // Finally is the package query
                        const [packageResult] = await asyncconnection.execute(
                            `INSERT INTO package (
                              Weight, Sender_Customer_ID, Origin_ID, Destination_ID, Shipping_Cost,
                              Priority, Fragile, Transaction_ID, Length, Width, Height,
                              Next_Destination, Assigned_Vehicle, Processed, Recipient_Customer_Name
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)`,
                            [
                                weight,
                                senderCustomerID,
                                employeeAddress,
                                shippingAddressID,
                                shippingCost,
                                priority,
                                fragile,
                                transaction_ID,
                                length,
                                width,
                                height,
                                employeeAddress,
                                recipientCustomerName
                            ]
                        );

                        const package_ID = packageResult.insertId;
                        console.log("Package ID", package_ID);

                        const [trackingHistoryResult] = await asyncconnection.execute(
                            `INSERT INTO tracking_history (package_ID, location_ID, status, employee_ID)
                             VALUES (?, ?, ?, ?)`,
                            [package_ID, employeeAddress, 'Package Created', employeeID]
                        );

                        const trackingHistoryID = trackingHistoryResult.insertId;
                        console.log("Tracking History ID", trackingHistoryID);



                        await asyncconnection.commit();
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            message: "Order placed and package(s) created successfully.",
                            trackingNumber: package_ID
                        }));


                        // We also need to get the financial information for the transaction data.

                        // SQL query to update the package
                        // const query = `
                        //     UPDATE package 
                        //     SET Next_Destination = ?, Assigned_Vehicle = ?
                        //     WHERE Package_ID = ?`;

                        // connection.query(query, [nextDestination, assignedVehicle, packageId], (error, results) => {
                        //     if (error) {
                        //         console.error("Error updating package:", error);
                        //         res.writeHead(500, { "Content-Type": "application/json" });
                        //         res.end(JSON.stringify({ message: error.message }));
                        //         console.log("Error updating package");
                        //         return;
                        //     }

                        //     if (results.affectedRows > 0) {
                        //         res.writeHead(200, { "Content-Type": "application/json" });
                        //         res.end(JSON.stringify({ message: "Package updated successfully!", updatedPackageId: packageId }));
                        //         console.log("Package successfully updated.");
                        //     } else {
                        //         res.writeHead(404, { "Content-Type": "application/json" });
                        //         res.end(JSON.stringify({ message: "Package not found or no changes made." }));
                        //         console.log("Package not modified.");
                        //     }
                        // });

                    } catch (err) {
                        // console.error("Error parsing request body:", err);
                        // res.writeHead(400, { "Content-Type": "application/json" });
                        // res.end(JSON.stringify({ message: "Invalid JSON format in request body." }));
                        await asyncconnection.rollback();
                        console.error("Registration transaction failed:", err);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: err.sqlMessage || err.message }));
                    } finally {
                        asyncconnection.release();
                    }
                });


            }
        }
    }
}

async function warehouseCheckEmail(req, res) {
    const queryString = req.url.split('?')[1];
    const urlParams = new URLSearchParams(queryString);

    if (urlParams && req.method === "POST") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const { senderCustomerEmail } = JSON.parse(body);
                const customerQuery = `SELECT customer_ID FROM customers WHERE customer_Email = ?`;

                connection.query(customerQuery, [senderCustomerEmail], (error, results) => {
                    if (error) {
                        console.error("Database Error:", error);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Customer Email Not Registered" }));
                        return;
                    }

                    // Ensure query returns a result
                    if (!results.length) {
                        res.writeHead(404, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Email not registered." }));
                        return;
                    }

                    const customer_ID = results[0].customer_ID; // Extract customer_ID
                    console.log("Customer ID:", customer_ID);

                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Customer found.", customer_ID }));
                });
            } catch (err) {
                console.error("JSON Parsing Error:", err);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Invalid JSON input." }));
            }
        });
    }
}

async function warehouseRemovePackage(req, res) {
    const queryString = req.url.split('?')[1];
    const urlParams = new URLSearchParams(queryString);

    if (urlParams) {
        var employeeID = urlParams.get('employeeID');
        console.log(employeeID);
        if (employeeID) {
            if (req.method === "POST") {
                var body = "";

                req.on("data", chunk => {
                    body += chunk.toString();
                });

                req.on("end", async () => {
                    const asyncconnection = await connection.promise().getConnection();
                    try {
                        // Parse request body as JSON
                        const { packageID } = JSON.parse(body);

                        const [employeeAddressResult] = await asyncconnection.execute(
                            `select Address_ID
                            from employees, post_office_location
                            where employees.Location_ID = post_office_location.location_ID and employees.employee_ID = ?
                            `, [employeeID]
                        );
                        const employeeAddress = employeeAddressResult[0].Address_ID;
                        console.log("Employee Address", employeeAddress);

                        await asyncconnection.execute(
                            `UPDATE package
                            SET Assigned_Vehicle = NULL, Next_Destination = ?
                            where Package_ID = ?`, [employeeAddress, packageID]
                        );

                        // await asyncconnection.execute(
                        //     `DELETE th FROM tracking_history th
                        //     JOIN (
                        //         SELECT tracking_history_ID FROM tracking_history
                        //         WHERE Package_ID = ?
                        //         ORDER BY timestamp DESC 
                        //         LIMIT 1
                        //     ) AS subquery ON th.tracking_history_ID = subquery.tracking_history_ID;`,
                        //      [packageID]
                        // );

                        await asyncconnection.commit();
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            message: "Package removed from truck successfully",
                        }));


                    } catch (err) {
                        console.error("Error parsing request body:", err);
                        res.writeHead(400, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Invalid JSON format in request body." }));
                    }
                });
            }
        }
    }
}


module.exports = {
    employeeLogIn,
    warehouseDashboard,
    warehouseAssignPackages,
    warehouseRegisterPackage,
    warehouseCheckEmail,
    warehouseRemovePackage
};


// Trigger: A package cannot be assigned to a vehicle if it would cause that vehicle to exceed its capacity limits.