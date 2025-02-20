const connection = require('../server/db');

// Run a test query
connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
        console.error('❌ Query Error:', err);
        return;
    }
    console.log('✅ Current Time from DB:', results[0]);
});

// Close the connection after querying
connection.end();