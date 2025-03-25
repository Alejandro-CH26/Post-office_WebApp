const db = require("./db");

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        timeZone: 'America/Chicago', 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function handleReportRequest(req, res) {
    try {
        // Fetch available months and locations for dropdowns
        const monthsQuery = `
            SELECT DISTINCT 
                DATE_FORMAT(clock_in_time, '%Y-%m') AS month_key,
                DATE_FORMAT(clock_in_time, '%M %Y') AS month_name
            FROM hours_logged
            ORDER BY month_key
        `;

        const locationsQuery = `
            SELECT DISTINCT name 
            FROM post_office_location 
            ORDER BY name
        `;

        // Main report query with dynamic filtering
        const reportConfig = {
            title: 'Employee Hours Report',
            timestamp: new Date().toISOString(),
            query: `
                SELECT 
                    e.employee_ID, 
                    e.First_Name as first_name, 
                    e.Middle_Name as middle_name, 
                    e.Last_Name as last_name, 
                    l.name AS location, 
                    DATE_FORMAT(h.clock_in_time, '%Y-%m') AS month_key,
                    ROUND(SUM(TIMESTAMPDIFF(MINUTE, h.clock_in_time, h.clock_out_time) / 60), 2) AS total_hours
                FROM 
                    employees e
                JOIN hours_logged h ON e.employee_ID = h.employee_ID
                JOIN post_office_location l ON e.Location_ID = l.location_ID
                GROUP BY 
                    e.employee_ID, e.First_Name, e.Middle_Name, e.Last_Name, l.name, month_key
            `
        };

        // Fetch months and locations first
        db.query(monthsQuery, (monthErr, months) => {
            if (monthErr) {
                console.error('Months Query Error:', monthErr);
                months = [];
            }

            db.query(locationsQuery, (locationErr, locations) => {
                if (locationErr) {
                    console.error('Locations Query Error:', locationErr);
                    locations = [];
                }

                db.query(reportConfig.query, (err, results) => {
                    if (err) {
                        console.error('Report Query Error:', err);
                        res.writeHead(500, { "Content-Type": "text/html" });
                        res.end(`<html><body><h1>Database Error</h1><p>${err.message}</p></body></html>`);
                        return;
                    }

                    const reportHtml = `
                    <html>
                    <head>
                        <title>${reportConfig.title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f4f4f4; color: #333; }
                            h1 { color: #2c3e50; }
                            .filter-container { 
                                display: flex; 
                                gap: 10px; 
                                margin-bottom: 20px; 
                                align-items: center; 
                            }
                            .filter-container select { 
                                padding: 8px; 
                                font-size: 16px; 
                                flex-grow: 1; 
                                max-width: 200px; 
                            }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #fff; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background: #3498db; color: #fff; }
                            tr:nth-child(even) { background: #f9f9f9; }
                            .container { max-width: 900px; margin: auto; padding: 20px; background: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                        </style>
                        <script>
                            function filterTable() {
                                const monthSelect = document.getElementById('monthSelect');
                                const locationSelect = document.getElementById('locationSelect');
                                const rows = document.querySelectorAll('#reportTableBody tr');
                                
                                const selectedMonth = monthSelect.value;
                                const selectedLocation = locationSelect.value;
                                
                                rows.forEach(row => {
                                    const monthMatch = selectedMonth ? row.dataset.month === selectedMonth : true;
                                    const locationMatch = selectedLocation ? row.dataset.location === selectedLocation : true;
                                    
                                    row.style.display = (monthMatch && locationMatch) ? '' : 'none';
                                });
                            }
                        </script>
                    </head>
                    <body>
                        <div class="container">
                            <h1>${reportConfig.title}</h1>
                            <p><strong>Generated:</strong> ${formatTimestamp(reportConfig.timestamp)}</p>
                            
                            <div class="filter-container">
                                <select id="monthSelect" onchange="filterTable()">
                                    <option value="">All Months</option>
                                    ${months.map(m => `
                                        <option value="${m.month_key}">
                                            ${m.month_name}
                                        </option>
                                    `).join('')}
                                </select>
                                
                                <select id="locationSelect" onchange="filterTable()">
                                    <option value="">All Locations</option>
                                    ${locations.map(l => `
                                        <option value="${l.name}">
                                            ${l.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Total Hours</th>
                                    </tr>
                                </thead>
                                <tbody id="reportTableBody">
                                    ${results.map(row => `
                                        <tr data-month="${row.month_key}" data-location="${row.location}">
                                            <td>${row.employee_ID}</td>
                                            <td>${row.first_name} ${row.middle_name || ''} ${row.last_name}</td>
                                            <td>${row.location}</td>
                                            <td>${row.total_hours}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </body>
                    </html>
                    `;

                    res.writeHead(200, { 
                        "Content-Type": "text/html",
                        "Cache-Control": "no-store, no-cache, must-revalidate, private",
                        "Pragma": "no-cache",
                        "Expires": "0"
                    });
                    res.end(reportHtml);
                });
            });
        });
    } catch (error) {
        console.error('Unexpected Error in Report Generation:', error);
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end('<html><body><h1>Server Error</h1><p>An unexpected error occurred</p></body></html>');
    }
}

module.exports = { handleReportRequest };