const connection = require("./db");

function postOfficeRoutes(req, res, reqUrl) {
  // 1) Get all post offices (GET: /postoffices)
  if (req.method === "GET" && reqUrl.pathname === "/postoffices") {
    const includeDeleted = reqUrl.query.includeDeleted === "true";

    const query = `
SELECT 
  a.address_ID AS id,
  a.address_Street AS street_address,
  a.address_City AS city,
  a.address_State AS state,
  a.address_Zipcode AS zip,
  a.unit_number,
  a.Office_Location,
  a.is_deleted,
  p.name AS post_office_name,
  p.office_phone, 
  p.location_ID
FROM addresses a
LEFT JOIN post_office_location p ON a.address_ID = p.Address_ID
WHERE a.Office_Location = 1
${includeDeleted ? "" : "AND a.is_deleted = FALSE"}

    `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error("❌ SQL Query Error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Database query failed" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

    return true;
  }

  // 2) Get single post office by ID (GET: /get-postoffice/:id)
  if (req.method === "GET" && reqUrl.pathname.startsWith("/get-postoffice/")) {
    const id = parseInt(reqUrl.pathname.split("/").pop(), 10);

    if (isNaN(id)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid post office ID." }));
      return true;
    }

    const query = `
SELECT 
  a.address_ID AS id,
  a.address_Street AS street_address,
  a.address_City AS city,
  a.address_State AS state,
  a.address_Zipcode AS zip,
  a.unit_number,
  a.Office_Location,
  a.is_deleted,
  p.name AS name,
  p.office_phone AS office_phone
FROM addresses a
LEFT JOIN post_office_location p ON a.address_ID = p.Address_ID
WHERE a.Office_Location = 1 AND a.address_ID = ?

    `;

    connection.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error fetching post office:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to retrieve post office." }));
        return;
      }

      if (!results.length) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Post office not found." }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results[0]));
    });

    return true;
  }

// 3) Soft delete a post office and fire employees (POST: /delete-postoffice)
if (req.method === "POST" && reqUrl.pathname === "/delete-postoffice") {
  let body = "";
  req.on("data", chunk => (body += chunk));
  req.on("end", async () => {
    try {
      const { address_ID } = JSON.parse(body);
      if (!address_ID) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Missing address_ID." }));
        return;
      }

      // First: get post office name by Address_ID
      const [postOfficeResult] = await connection
        .promise()
        .query(`SELECT name FROM post_office_location WHERE Address_ID = ?`, [address_ID]);

      const postOfficeName = postOfficeResult[0]?.name;

      if (!postOfficeName) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Post office not found." }));
        return;
      }

      // Soft delete in both tables
      const deleteAddresses = connection
        .promise()
        .query(`UPDATE addresses SET is_deleted = TRUE WHERE address_ID = ?`, [address_ID]);

      const deletePostOffice = connection
        .promise()
        .query(`UPDATE post_office_location SET is_deleted = TRUE WHERE Address_ID = ?`, [address_ID]);

      const fireEmployees = connection
        .promise()
        .query(`UPDATE employees SET is_fired = TRUE WHERE Location = ?`, [postOfficeName]);

      await Promise.all([deleteAddresses, deletePostOffice, fireEmployees]);

      res.writeHead(200);
      res.end(JSON.stringify({ message: "Post office deleted and employees fired." }));
    } catch (err) {
      console.error("Error deleting and firing employees:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Failed to delete or fire employees." }));
    }
  });

  return true;
}




// 4) Restore soft-deleted post office (POST: /undelete-postoffice)
if (req.method === "POST" && reqUrl.pathname === "/undelete-postoffice") {
  let body = "";
  req.on("data", chunk => (body += chunk));
  req.on("end", () => {
    try {
      const { address_ID } = JSON.parse(body);
      if (!address_ID) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Missing address_ID." }));
        return;
      }

      const restoreAddressQuery = `
        UPDATE addresses 
        SET is_deleted = FALSE 
        WHERE address_ID = ? AND Office_Location = 1
      `;

      connection.query(restoreAddressQuery, [address_ID], (err1) => {
        if (err1) {
          console.error("Error restoring address:", err1);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Failed to restore address." }));
          return;
        }

        const restoreLocationQuery = `
          UPDATE post_office_location 
          SET is_deleted = FALSE 
          WHERE Address_ID = ?
        `;

        connection.query(restoreLocationQuery, [address_ID], (err2) => {
          if (err2) {
            console.error("Error restoring post office location:", err2);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Address restored but failed to update post office location." }));
            return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Post office restored successfully." }));
        });
      });
    } catch (err) {
      console.error("JSON parse error:", err);
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });

  return true;
}


  // 5) Update post office (POST: /update-postoffice)
  if (req.method === "POST" && reqUrl.pathname === "/update-postoffice") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const {
          address_ID,
          street_address,
          city,
          state,
          zip,
          unit_number,
          name,
          office_phone
        } = JSON.parse(body);
  
        if (!address_ID || !street_address || !city || !state || !zip || !name) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required fields." }));
          return;
        }
  
        const updateAddressQuery = `
          UPDATE addresses
          SET address_Street = ?, address_City = ?, address_State = ?, address_Zipcode = ?, unit_number = ?
          WHERE address_ID = ? AND Office_Location = 1 AND is_deleted = FALSE
        `;
  
        const updatePostOfficeQuery = `
          UPDATE post_office_location
          SET name = ?, office_phone = ?, street_address = ?, city = ?, state = ?, zip = ?
          WHERE Address_ID = ?
        `;
  
        // First: update the address table
        connection.query(
          updateAddressQuery,
          [street_address, city, state, zip, unit_number || null, address_ID],
          (err1) => {
            if (err1) {
              console.error("Error updating address:", err1);
              res.writeHead(500);
              res.end(JSON.stringify({ error: "Failed to update address." }));
              return;
            }
  
            // Then: update the post_office_location table
            connection.query(
              updatePostOfficeQuery,
              [name, office_phone || null, street_address, city, state, zip, address_ID],
              (err2) => {
                if (err2) {
                  console.error("Error updating post office location:", err2);
                  res.writeHead(500);
                  res.end(JSON.stringify({ error: "Failed to update post office location." }));
                  return;
                }
  
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Post office updated successfully." }));
              }
            );
          }
        );
      } catch (err) {
        console.error("JSON parse error:", err);
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  
    return true;
  }
  


  return false;
}

module.exports = postOfficeRoutes;
