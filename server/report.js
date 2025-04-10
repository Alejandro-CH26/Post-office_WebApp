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
        // Fetch available months, locations, and employee names for dropdowns
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

        const employeesQuery = `
             SELECT DISTINCT 
                 employee_ID, 
                 CONCAT(First_Name, ' ', COALESCE(Middle_Name, ''), ' ', Last_Name) AS full_name
             FROM employees
             ORDER BY full_name
         `;

        // Main report queries with dynamic filtering
        const summaryReportConfig = {
             title: 'Employee Hours Summary Report',
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
            `,
            aggregatedQuery: `
                SELECT 
                    e.employee_ID, 
                    e.First_Name as first_name, 
                    e.Middle_Name as middle_name, 
                    e.Last_Name as last_name, 
                    l.name AS location, 
                    'all' AS month_key,
                    ROUND(SUM(TIMESTAMPDIFF(MINUTE, h.clock_in_time, h.clock_out_time) / 60), 2) AS total_hours
                FROM 
                    employees e
                JOIN hours_logged h ON e.employee_ID = h.employee_ID
                JOIN post_office_location l ON e.Location_ID = l.location_ID
                GROUP BY 
                    e.employee_ID, e.First_Name, e.Middle_Name, e.Last_Name, l.name
            `
        };

        const detailedReportConfig = {
            title: 'Employee Clock-In/Out Details',
            query: `
                SELECT 
                    e.employee_ID, 
                    CONCAT(e.First_Name, ' ', COALESCE(e.Middle_Name, ''), ' ', e.Last_Name) AS full_name,
                    l.name AS location,
                    DATE_FORMAT(h.clock_in_time, '%Y-%m') AS month_key,
                    h.clock_in_time,
                    h.clock_out_time,
                    ROUND(TIMESTAMPDIFF(MINUTE, h.clock_in_time, h.clock_out_time) / 60, 2) AS hours_worked
                FROM 
                    employees e
                JOIN hours_logged h ON e.employee_ID = h.employee_ID
                JOIN post_office_location l ON e.Location_ID = l.location_ID
                ORDER BY 
                    e.employee_ID, h.clock_in_time
            `
        };

        // Fetch months, locations, and employees first
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

                db.query(employeesQuery, (employeeErr, employees) => {
                    if (employeeErr) {
                        console.error('Employees Query Error:', employeeErr);
                        employees = [];
                    }

                    // Run both summary report queries
                    db.query(summaryReportConfig.query, (summaryErr, summaryResults) => {
                        if (summaryErr) {
                            console.error('Summary Report Query Error:', summaryErr);
                            summaryResults = [];
                        }

                        db.query(summaryReportConfig.aggregatedQuery, (aggErr, aggregatedResults) => {
                            if (aggErr) {
                                console.error('Aggregated Summary Report Query Error:', aggErr);
                                aggregatedResults = [];
                            }

                            // Run detailed report query
                            db.query(detailedReportConfig.query, (detailErr, detailResults) => {
                                if (detailErr) {
                                    console.error('Detailed Report Query Error:', detailErr);
                                    detailResults = [];
                                }

                                // Create initial HTML for summary table using aggregated data
                                const initialSummaryRows = aggregatedResults.map(row => `
                                    <tr data-month="${row.month_key}" 
                                        data-location="${row.location}" 
                                        data-employeeid="${row.employee_ID}">
                                        <td>${row.employee_ID}</td>
                                        <td>${row.first_name} ${row.middle_name || ''} ${row.last_name}</td>
                                        <td>${row.location}</td>
                                        <td>${row.total_hours}</td>
                                    </tr>
                                `).join('');

                                const reportHtml = `
                                <html>
                                <head>
                                    <title>Employee Hours Report</title>
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
                                        .container { max-width: 1200px; margin: auto; padding: 20px; background: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                                    </style>
                                    <script>
                                        let currentSummaryData = ${JSON.stringify(summaryResults)};
                                        let aggregatedSummaryData = ${JSON.stringify(aggregatedResults)};
                                        
                                        function filterTables() {
                                            const monthSelect = document.getElementById('monthSelect');
                                            const locationSelect = document.getElementById('locationSelect');
                                            const employeeSelect = document.getElementById('employeeSelect');
                                            
                                            const selectedMonth = monthSelect.value;
                                            const selectedLocation = locationSelect.value;
                                            const selectedEmployee = employeeSelect.value;
                                            
                                            // Determine which dataset to use for summary table
                                            const useAggregated = (selectedMonth === '');
                                            const summaryData = useAggregated ? aggregatedSummaryData : currentSummaryData;
                                            
                                            // Filter Summary Table
                                            const summaryTableBody = document.getElementById('summaryTableBody');
                                            summaryTableBody.innerHTML = '';
                                            
                                            summaryData.forEach(row => {
                                                const monthMatch = selectedMonth ? row.month_key === selectedMonth : true;
                                                const locationMatch = selectedLocation ? row.location === selectedLocation : true;
                                                const employeeMatch = selectedEmployee ? row.employee_ID.toString() === selectedEmployee : true;
                                                
                                                if (monthMatch && locationMatch && employeeMatch) {
                                                    const tr = document.createElement('tr');
                                                    tr.setAttribute('data-month', row.month_key);
                                                    tr.setAttribute('data-location', row.location);
                                                    tr.setAttribute('data-employeeid', row.employee_ID);
                                                    
                                                    tr.innerHTML = \`
                                                        <td>\${row.employee_ID}</td>
                                                        <td>\${row.first_name} \${row.middle_name || ''} \${row.last_name}</td>
                                                        <td>\${row.location}</td>
                                                        <td>\${row.total_hours}</td>
                                                    \`;
                                                    summaryTableBody.appendChild(tr);
                                                }
                                            });
                                            
                                            // Filter Detailed Table
                                            const detailRows = document.querySelectorAll('#detailTableBody tr');
                                            detailRows.forEach(row => {
                                                const monthMatch = selectedMonth ? row.dataset.month === selectedMonth : true;
                                                const locationMatch = selectedLocation ? row.dataset.location === selectedLocation : true;
                                                const employeeMatch = selectedEmployee ? row.dataset.employeeid === selectedEmployee : true;
                                                
                                                row.style.display = (monthMatch && locationMatch && employeeMatch) ? '' : 'none';
                                            });
                                        }
                                        
                                        // Initialize the table when page loads
                                        window.onload = function() {
                                            // Set the month dropdown to "All Months" by default
                                            document.getElementById('monthSelect').value = '';
                                            // Apply the initial filtering
                                            filterTables();
                                        };
                                    </script>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>Employee Hours Report</h1>
                                        <p><strong>Generated:</strong> ${formatTimestamp(summaryReportConfig.timestamp)}</p>

                                        <div class="filter-container">
                                            <select id="monthSelect" onchange="filterTables()">
                                                <option value="">All Months</option>
                                                ${months.map(m => `
                                                    <option value="${m.month_key}">
                                                        ${m.month_name}
                                                    </option>
                                                `).join('')}
                                            </select>
                                            
                                            <select id="locationSelect" onchange="filterTables()">
                                                <option value="">All Locations</option>
                                                ${locations.map(l => `
                                                    <option value="${l.name}">
                                                        ${l.name}
                                                    </option>
                                                `).join('')}
                                            </select>

                                            <select id="employeeSelect" onchange="filterTables()">
                                                <option value="">All Employees</option>
                                                ${employees.map(e => `
                                                    <option value="${e.employee_ID}">
                                                        ${e.full_name}
                                                    </option>
                                                `).join('')}
                                            </select>
                                        </div>
                                        
                                        <h2>Hours Summary Report</h2>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Employee ID</th>
                                                    <th>Name</th>
                                                    <th>Location</th>
                                                    <th>Total Hours</th>
                                                </tr>
                                            </thead>
                                            <tbody id="summaryTableBody">
                                                ${initialSummaryRows}
                                            </tbody>
                                        </table>

                                        <h2>Detailed Clock-In/Out Report</h2>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Employee ID</th>
                                                    <th>Name</th>
                                                    <th>Location</th>
                                                    <th>Clock-In Time</th>
                                                    <th>Clock-Out Time</th>
                                                    <th>Hours Worked</th>
                                                </tr>
                                            </thead>
                                            <tbody id="detailTableBody">
                                                ${detailResults.map(row => `
                                                    <tr data-month="${row.month_key}" 
                                                        data-location="${row.location}" 
                                                        data-employeeid="${row.employee_ID}">
                                                        <td>${row.employee_ID}</td>
                                                        <td>${row.full_name}</td>
                                                        <td>${row.location}</td>
                                                        <td>${formatTimestamp(row.clock_in_time)}</td>
                                                        <td>${formatTimestamp(row.clock_out_time)}</td>
                                                        <td>${row.hours_worked}</td>
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