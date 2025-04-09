const connection = require("./db");

function postOfficeRoutes(req, res, reqUrl) {
  // 1) Get all post offices (GET: /postoffices)
  if (req.method === "GET" && reqUrl.pathname === "/postoffices") {
    const includeDeleted = reqUrl.query.includeDeleted === "true";

    const query = `
      SELECT 
        location_ID AS id,
        name,
        street_address,
        city,
        state,
        zip,
        office_phone,
        is_deleted
      FROM post_office_location
      ${includeDeleted ? "" : "WHERE is_deleted = FALSE"}
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
        location_ID AS id,
        name,
        street_address,
        city,
        state,
        zip,
        office_phone
      FROM post_office_location
      WHERE location_ID = ? AND is_deleted = FALSE
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
        const { location_ID } = JSON.parse(body);
        if (!location_ID) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing location_ID." }));
          return;
        }

        const query = `UPDATE post_office_location SET is_deleted = TRUE WHERE location_ID = ?`;

        connection.query(query, [location_ID], (err) => {
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
        const { location_ID } = JSON.parse(body);
        if (!location_ID) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing location_ID." }));
          return;
        }

        const query = `UPDATE post_office_location SET is_deleted = FALSE WHERE location_ID = ?`;

        connection.query(query, [location_ID], (err) => {
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
          location_ID,
          name,
          street_address,
          city,
          state,
          zip,
          office_phone
        } = JSON.parse(body);

        if (!location_ID || !name || !street_address || !city || !state || !zip || !office_phone) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required fields." }));
          return;
        }

        const query = `
          UPDATE post_office_location
          SET name = ?, street_address = ?, city = ?, state = ?, zip = ?, office_phone = ?
          WHERE location_ID = ? AND is_deleted = FALSE
        `;

        connection.query(
          query,
          [name, street_address, city, state, zip, office_phone, location_ID],
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
