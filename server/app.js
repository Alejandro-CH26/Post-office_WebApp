const http = require('http'); 
const url = require('url');
const connection = require('../server/db');

const hostname = 'localhost';
const port = 5000;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Content-Type', 'application/json');

    const reqUrl = url.parse(req.url, true);

    // ✅ Test database connection
    if (req.method === 'GET' && reqUrl.pathname === '/test-db') {
        connection.query('SELECT * FROM customers', (err, results) => {
            if (err) {
                console.error('❌ Query Error:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Database query failed' }));
                return;
            }
            res.writeHead(200);
            res.end(JSON.stringify(results));
        });
    }

    // ✅ Fix: Tracking Updates API (Correct Table & Column Names)
    else if (req.method === 'GET' && reqUrl.pathname === '/tracking-updates') {
        connection.query(
            `SELECT p.Package_ID, p.Recipient_Customer_ID, t.status, t.timestamp 
             FROM tracking_history t 
             JOIN package p ON t.package_ID = p.Package_ID
             ORDER BY t.timestamp DESC 
             LIMIT 10`,
            (err, results) => {
                if (err) {
                    console.error('❌ Error fetching tracking updates:', err);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Database query failed' }));
                    return;
                }
                res.writeHead(200);
                res.end(JSON.stringify(results));
            }
        );
    }

    // ✅ Fix: Packages Delivered Report API (Correct Table & Column Names)
    else if (req.method === 'GET' && reqUrl.pathname === '/reports/packages-delivered') {
        connection.query(
            `SELECT loc.location_ID, loc.name AS PostOffice, COUNT(p.Package_ID) AS TotalDelivered
             FROM package p
             JOIN post_office_location loc ON p.Destination_ID = loc.location_ID
             JOIN tracking_history t ON p.Package_ID = t.package_ID
             WHERE t.status = 'Delivered'
             GROUP BY loc.location_ID`,
            (err, results) => {
                if (err) {
                    console.error('❌ Error fetching delivered packages:', err);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Database query failed' }));
                    return;
                }
                res.writeHead(200);
                res.end(JSON.stringify(results));
            }
        );
    }
    

    // ✅ Fix: Customers Registered Report API (Correct Table & Column Names)
    else if (req.method === 'GET' && reqUrl.pathname === '/reports/customers-registered') {
        connection.query(
            `SELECT loc.location_ID, loc.name AS PostOffice, COUNT(c.customer_ID) AS TotalCustomers
             FROM customers c
             JOIN post_office_location loc ON c.customer_ID = loc.Address_ID
             GROUP BY loc.location_ID`,
            (err, results) => {
                if (err) {
                    console.error('❌ Error fetching customer registrations:', err);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Database query failed' }));
                    return;
                }
                res.writeHead(200);
                res.end(JSON.stringify(results));
            }
        );
    }

    // ❌ 404 Error for Undefined Routes
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not Found" }));
    }
});

// ✅ Start the server
server.listen(port, hostname, () => {
    console.log(`✅ Server running at http://${hostname}:${port}/`);
});
