import React, { useState } from 'react';



function EmployeeLogInPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function handleLogIn() {
      try {
        // Send a post request with the username and password and store the response
        var response = await fetch("http://localhost:5001/employee/login", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          credentials: "include"
        });

        console.log({username, password});
    
        // Wait to execute until the response comes back
        var data = await response.json();
    
        // If the username and password are correct (the server returns no errors)
        if (response.ok) {
          console.log("Log In Successful!", data);
          window.location.href = "/employee/warehousedashboard";
        } else {
          console.log("Incorrect username or password");
          setError(data.error);
        }
      } catch (err) { // If something goes wrong and the request is not sent
        console.error('❌ Error logging in:', err);
        setError('Login failed');
      }
        
    }

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1>Employee Log In</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ display: 'block', margin: '10px auto', padding: '10px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', margin: '10px auto', padding: '10px' }}
          />
          <button onClick={handleLogIn} style={{ padding: '10px 20px' }}>
            Log In
          </button>
        </div>
      );
}

export default EmployeeLogInPage;