// report.js
const connection = require('./db.js');

// Configuration for the report
const reportConfig = {
  title: 'Azure MySQL Database Report',
  timestamp: new Date().toISOString(),
  // Add your custom queries here
  customQueries: [
    // Example: Uncomment and modify as needed
    // {
    //   name: 'Active Users',
    //   sql: 'SELECT id, username, last_login FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 7 DAY);',
    //   description: 'Users active in the last 7 days'
    // }
    {
        name: 'Employee-Hours with Location',
        sql: `SELECT 
            e.first_name, e.middle_name, e.last_name, l.location, SUM(TIMESTAMPDIFF(HOUR, h.clock_in_time, h.clock_out_time)) AS total_hours
         FROM 
            employees AS e, hours_logged AS h, locations AS l
         WHERE
            e.employee_ID=h.employee_ID AND e.location_ID=l.location_ID;`,
        description: 'Employee hours with location'
    }
  ]
};

// Generate the report
async function generateReport() {
    console.log(`\n===== ${reportConfig.title} =====`);
    console.log(`Generated: ${reportConfig.timestamp}`);
    console.log(`Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}\n`);
    
    // Run only custom queries
    for (const query of reportConfig.customQueries) {
      await runReportQuery(query);
    }
    
    // Close the connection when done
    connection.end((err) => {
      if (err) {
        console.error('Error closing connection:', err);
        return;
      }
      console.log('\nReport complete. Database connection closed.');
    });
  }

// Execute a single report query
function runReportQuery(query) {
  return new Promise((resolve, reject) => {
    console.log(`\n## ${query.name}`);
    console.log(query.description);
    console.log('-'.repeat(50));
    
    connection.query(query.sql, query.params || [], (err, results) => {
      if (err) {
        console.error(`Error executing query "${query.name}":`, err);
        console.log('-'.repeat(50));
        resolve(); // Continue with other queries
        return;
      }
      
      if (results.length === 0) {
        console.log('No results found.');
      } else {
        // Format and display results as a table
        console.table(results);
      }
      
      console.log('-'.repeat(50));
      resolve();
    });
  });
}

// Export for use in other files
module.exports = { generateReport, reportConfig };

// Run the report if this file is executed directly
if (require.main === module) {
  generateReport();
}