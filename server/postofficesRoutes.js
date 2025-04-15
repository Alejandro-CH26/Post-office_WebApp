const connection = require("./db");

function postOfficeRoutes(req, res, reqUrl) {
  // 1) Get all post offices (GET: /postoffices)
  if (req.method === "GET" && reqUrl.pathname === "/postoffices") {
    const includeDeleted = reqUrl.query.includeDeleted === "true";

    const query = `
      SELECT 
        address_ID AS id,
        address_Street AS street_address,
        address_City AS city,
        address_State AS state,
        address_Zipcode AS zip,
        unit_number,
        Office_Location,
        is_deleted
      FROM addresses
      WHERE Office_Location = 1
      ${includeDeleted ? "" : "AND is_deleted = FALSE"}
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
        address_ID AS id,
        address_Street AS street_address,
        address_City AS city,
        address_State AS state,
        address_Zipcode AS zip,
        unit_number,
        Office_Location,
        is_deleted
      FROM addresses
      WHERE Office_Location = 1 AND address_ID = ?
    `;

    connection.query(query, [id], (err, results) => {
      if (err) {
        console.error("❌ Error fetching post office:", err);
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

  // 3) Soft delete a post office (POST: /delete-postoffice)
  if (req.method === "POST" && reqUrl.pathname === "/delete-postoffice") {
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

        const query = `UPDATE addresses SET is_deleted = TRUE WHERE address_ID = ? AND Office_Location = 1`;

        connection.query(query, [address_ID], (err) => {
          if (err) {
            console.error("❌ Error deleting:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to delete." }));
            return;
          }

          res.writeHead(200);
          res.end(JSON.stringify({ message: "Post office deleted successfully." }));
        });
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
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

        const query = `UPDATE addresses SET is_deleted = FALSE WHERE address_ID = ? AND Office_Location = 1`;

        connection.query(query, [address_ID], (err) => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to restore." }));
            return;
          }

          res.writeHead(200);
          res.end(JSON.stringify({ message: "Post office restored successfully." }));
        });
      } catch (err) {
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
          unit_number
        } = JSON.parse(body);

        if (!address_ID || !street_address || !city || !state || !zip) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required fields." }));
          return;
        }

        const query = `
          UPDATE addresses
          SET address_Street = ?, address_City = ?, address_State = ?, address_Zipcode = ?, unit_number = ?
          WHERE address_ID = ? AND Office_Location = 1 AND is_deleted = FALSE
        `;

        connection.query(
          query,
          [street_address, city, state, zip, unit_number || null, address_ID],
          (err) => {
            if (err) {
              console.error("❌ Error updating:", err);
              res.writeHead(500);
              res.end(JSON.stringify({ error: "Failed to update." }));
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Post office updated successfully." }));
          }
        );
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  return false; // Default fallback
}

module.exports = postOfficeRoutes;
