const express = require('express');
const connection = require('./db.js');
const open = require('open');

const app = express();
const port = 3000;

// Format timestamp neatly for Central Time
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        timeZone: 'America/Chicago', // Central Time Zone
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

// Serve the report on a web page
app.get('/report', async (req, res) => {
    const reportConfig = {
        title: 'Employee Hours Report',
        timestamp: new Date().toISOString(),
        customQueries: [
            {
                name: 'Employee-Hours',
                sql: `SELECT 
                          e.employee_ID, e.first_name, e.middle_name, e.last_name, l.name, 
                          ROUND(SUM(TIMESTAMPDIFF(MINUTE, h.clock_in_time, h.clock_out_time) / 60), 2) AS total_hours
                      FROM 
                          employees AS e, hours_logged AS h, post_office_location AS l
                      WHERE
                          e.employee_ID=h.employee_ID AND e.location_ID=l.location_ID
                      GROUP BY 
                          e.employee_ID, e.first_name, e.middle_name, e.last_name, l.name;`,
                description: 'Employee hours with location, names, and total hours'
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${reportConfig.title}</h1>
                <p><strong>Generated:</strong> ${formatTimestamp(reportConfig.timestamp)}</p>
    `;

    for (const query of reportConfig.customQueries) {
        reportHtml += `<h2>${query.name}</h2>`;
        reportHtml += `<p>${query.description}</p>`;

        try {
            const results = await new Promise((resolve, reject) => {
                connection.query(query.sql, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            if (results.length === 0) {
                reportHtml += '<p>No results found.</p>';
            } else {
                reportHtml += '<table><tr>';
                Object.keys(results[0]).forEach(key => {
                    reportHtml += `<th>${key}</th>`;
                });
                reportHtml += '</tr>';
                results.forEach(row => {
                    reportHtml += '<tr>';
                    Object.values(row).forEach(value => {
                        reportHtml += `<td>${value}</td>`;
                    });
                    reportHtml += '</tr>';
                });
                reportHtml += '</table>';
            }
        } catch (err) {
            reportHtml += `<p style="color: red;">Error executing query: ${err.message}</p>`;
        }
    }

    reportHtml += `
            </div>
        </body>
        </html>
    `;

    res.send(reportHtml);
});

app.listen(port, () => {
    const url = `http://localhost:${port}/report`;
    console.log(`Report server running at ${url}`);
    open(url); // Automatically open in browser
});
