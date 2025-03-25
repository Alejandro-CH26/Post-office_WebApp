const express = require('express');
const router = express.Router();
const connection = require('./db.js');

// Format timestamp neatly for Central Time
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

// New API endpoint for filtering (returns JSON)
router.get('/api/filter', async (req, res) => {
    try {
        const selectedMonth = req.query.month || '';
        const selectedLocation = req.query.location || '';

        // Construct dynamic WHERE clause
        let whereClause = 'WHERE 1=1';
        let params = [];

        if (selectedMonth) {
            whereClause += ' AND DATE_FORMAT(h.clock_in_time, \'%Y-%m\') = ?';
            params.push(selectedMonth);
        }

        if (selectedLocation) {
            whereClause += ' AND l.name = ?';
            params.push(selectedLocation);
        }

        const sql = `
            SELECT 
                e.employee_ID, 
                e.first_name, 
                e.middle_name, 
                e.last_name, 
                l.name AS location, 
                ROUND(SUM(TIMESTAMPDIFF(MINUTE, h.clock_in_time, h.clock_out_time) / 60), 2) AS total_hours
            FROM 
                employees e
            JOIN hours_logged h ON e.employee_ID = h.employee_ID
            JOIN post_office_location l ON e.location_ID = l.location_ID
            ${whereClause}
            GROUP BY 
                e.employee_ID, e.first_name, e.middle_name, e.last_name, l.name;
        `;

        connection.query(sql, params, (err, results) => {
            if (err) {
                console.error('Filter Query Error:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Unexpected Error in Filter API:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Existing route for full page rendering
router.get('/', async (req, res) => {
    try {
        // Get selected month and location from query parameters
        const selectedMonth = req.query.month || '';
        const selectedLocation = req.query.location || '';

        // Fetch available months and locations for dropdowns
        const monthsQuery = `
            SELECT DISTINCT 
                DATE_FORMAT(h.clock_in_time, '%Y-%m') AS month_key,
                DATE_FORMAT(h.clock_in_time, '%M %Y') AS month_name
            FROM hours_logged h
            ORDER BY month_key
        `;

        const locationsQuery = `
            SELECT DISTINCT name 
            FROM post_office_location 
            ORDER BY name
        `;

        const months = await new Promise((resolve, reject) => {
            connection.query(monthsQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        const locations = await new Promise((resolve, reject) => {
            connection.query(locationsQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Construct dynamic WHERE clause
        let whereClause = 'WHERE 1=1';
        let params = [];

        if (selectedMonth) {
            whereClause += ' AND DATE_FORMAT(h.clock_in_time, \'%Y-%m\') = ?';
            params.push(selectedMonth);
        }

        if (selectedLocation) {
            whereClause += ' AND l.name = ?';
            params.push(selectedLocation);
        }

        const reportConfig = {
            title: 'Employee Hours Report',
            timestamp: new Date().toISOString(),
            customQueries: [
                {
                    name: 'Employee-Hours',
                    sql: `SELECT 
                              e.employee_ID, e.first_name, e.middle_name, e.last_name, l.name AS location, 
                              ROUND(SUM(TIMESTAMPDIFF(MINUTE, h.clock_in_time, h.clock_out_time) / 60), 2) AS total_hours
                          FROM 
                              employees e
                          JOIN hours_logged h ON e.employee_ID = h.employee_ID
                          JOIN post_office_location l ON e.location_ID = l.location_ID
                          ${whereClause}
                          GROUP BY 
                              e.employee_ID, e.first_name, e.middle_name, e.last_name, l.name;`,
                    params: params
                }
            ]
        };

        let reportHtml = `
            <html>
            <head>
                <title>${reportConfig.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f4f4f4; color: #333; }
                    h1, h2 { color: #2c3e50; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #fff; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #3498db; color: #fff; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .container { max-width: 900px; margin: auto; padding: 20px; background: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                    .filter-container { display: flex; gap: 10px; margin-bottom: 20px; }
                    select { padding: 5px; font-size: 16px; flex-grow: 1; }
                </style>
                <script>
                    async function updateReport() {
                        const monthSelect = document.getElementById('monthSelect');
                        const locationSelect = document.getElementById('locationSelect');
                        
                        const month = monthSelect.value;
                        const location = locationSelect.value;
                        
                        try {
                            const response = await fetch(\`/report/api/filter?month=\${encodeURIComponent(month)}&location=\${encodeURIComponent(location)}\`);
                            const data = await response.json();
                            
                            const tableBody = document.getElementById('reportTableBody');
                            tableBody.innerHTML = ''; // Clear existing rows
                            
                            data.forEach(row => {
                                const tr = document.createElement('tr');
                                tr.innerHTML = \`
                                    <td>\${row.employee_ID}</td>
                                    <td>\${row.first_name} \${row.middle_name || ''} \${row.last_name}</td>
                                    <td>\${row.location}</td>
                                    <td>\${row.total_hours}</td>
                                \`;
                                tableBody.appendChild(tr);
                            });
                        } catch (error) {
                            console.error('Error updating report:', error);
                            alert('Failed to update report');
                        }
                    }
                </script>
            </head>
            <body>
                <div class="container">
                    <h1>${reportConfig.title}</h1>
                    <p><strong>Generated:</strong> ${formatTimestamp(reportConfig.timestamp)}</p>
                    
                    <div class="filter-container">
                        <select id="monthSelect" onchange="updateReport()">
                            <option value="">All Months</option>
                            ${months.map(m => `
                                <option value="${m.month_key}" ${selectedMonth === m.month_key ? 'selected' : ''}>
                                    ${m.month_name}
                                </option>
                            `).join('')}
                        </select>
                        
                        <select id="locationSelect" onchange="updateReport()">
                            <option value="">All Locations</option>
                            ${locations.map(l => `
                                <option value="${l.name}" ${selectedLocation === l.name ? 'selected' : ''}>
                                    ${l.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
        `;

        for (const query of reportConfig.customQueries) {
            reportHtml += `<h2>${query.name}</h2>`;
            //reportHtml += `<p>${query.description}</p>`;

            try {
                const results = await new Promise((resolve, reject) => {
                    connection.query(
                        query.sql, 
                        query.params, 
                        (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        }
                    );
                });

                if (results.length === 0) {
                    reportHtml += '<p>No results found.</p>';
                } else {
                    reportHtml += `
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
                    `;
                    results.forEach(row => {
                        reportHtml += `
                            <tr>
                                <td>${row.employee_ID}</td>
                                <td>${row.first_name} ${row.middle_name || ''} ${row.last_name}</td>
                                <td>${row.location}</td>
                                <td>${row.total_hours}</td>
                            </tr>
                        `;
                    });
                    reportHtml += '</tbody></table>';
                }
            } catch (err) {
                reportHtml += `<p style="color: red;">Error executing query: ${err.message}</p>`;
                console.error('Report Generation Error:', err);
            }
        }

        reportHtml += `
                </div>
            </body>
            </html>
        `;

        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.send(reportHtml);
    } catch (error) {
        console.error('Unexpected Error in Report Generation:', error);
        res.status(500).send('An unexpected error occurred while generating the report');
    }
});

module.exports = router;