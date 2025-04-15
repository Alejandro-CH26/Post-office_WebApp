const connection = require("./db");

function vehicleRoutes(req, res, reqUrl) {
  // 1) Get all delivery vehicles (GET: /deliveryvehicles)
  if (req.method === "GET" && reqUrl.pathname === "/deliveryvehicles") {
    const includeDeleted = reqUrl.query.includeDeleted === "true";

    const query = `
      SELECT 
        vehicle_ID AS id,
        License_plate AS license_plate,
        Fuel_type AS fuel_type,
        Volume_Capacity AS volume_capacity,
        Payload_Capacity AS payload_capacity,
        Mileage AS mileage,
        Status AS status,
        Last_maintenance_date AS last_maintenance_date,
        Location_ID AS location_id,
        Driver_ID AS driver_id,
        is_deleted
      FROM delivery_vehicle
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

  // 2) Get single delivery vehicle by ID (GET: /get-deliveryvehicle/:id)
  if (req.method === "GET" && reqUrl.pathname.startsWith("/get-deliveryvehicle/")) {
    const id = parseInt(reqUrl.pathname.split("/").pop(), 10);

    if (isNaN(id)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid vehicle ID." }));
      return true;
    }

    const query = `
      SELECT 
        vehicle_ID AS id,
        License_plate AS license_plate,
        Fuel_type AS fuel_type,
        Volume_Capacity AS volume_capacity,
        Payload_Capacity AS payload_capacity,
        Mileage AS mileage,
        Status AS status,
        Last_maintenance_date AS last_maintenance_date,
        Location_ID AS location_id,
        Driver_ID AS driver_id,
        is_deleted
      FROM delivery_vehicle
      WHERE vehicle_ID = ?
    `;

    connection.query(query, [id], (err, results) => {
      if (err) {
        console.error("❌ Error fetching vehicle:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to retrieve vehicle." }));
        return;
      }

      if (!results.length) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Vehicle not found." }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results[0]));
    });

    return true;
  }

  // 3) Soft delete a delivery vehicle (POST: /delete-deliveryvehicle)
  if (req.method === "POST" && reqUrl.pathname === "/delete-deliveryvehicle") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const { vehicle_ID } = JSON.parse(body);
        if (!vehicle_ID) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing vehicle_ID." }));
          return;
        }

        const query = `UPDATE delivery_vehicle SET is_deleted = TRUE WHERE vehicle_ID = ?`;

        connection.query(query, [vehicle_ID], (err) => {
          if (err) {
            console.error("❌ Error deleting:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to delete vehicle." }));
            return;
          }

          res.writeHead(200);
          res.end(JSON.stringify({ message: "Vehicle deleted successfully." }));
        });
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  // 4) Restore soft-deleted vehicle (POST: /undelete-deliveryvehicle)
  if (req.method === "POST" && reqUrl.pathname === "/undelete-deliveryvehicle") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const { vehicle_ID } = JSON.parse(body);
        if (!vehicle_ID) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing vehicle_ID." }));
          return;
        }

        const query = `UPDATE delivery_vehicle SET is_deleted = FALSE WHERE vehicle_ID = ?`;

        connection.query(query, [vehicle_ID], (err) => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to restore vehicle." }));
            return;
          }

          res.writeHead(200);
          res.end(JSON.stringify({ message: "Vehicle restored successfully." }));
        });
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  // 5) Update delivery vehicle (POST: /update-deliveryvehicle)
  if (req.method === "POST" && reqUrl.pathname === "/update-deliveryvehicle") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const {
          vehicle_ID,
          license_plate,
          fuel_type,
          volume_capacity,
          payload_capacity,
          mileage,
          status,
          last_maintenance_date,
          location_id,
          driver_id
        } = JSON.parse(body);

        if (!vehicle_ID || !license_plate || !fuel_type || !status || !location_id) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required fields." }));
          return;
        }

        const query = `
          UPDATE delivery_vehicle
          SET License_plate = ?, Fuel_type = ?, Volume_Capacity = ?, Payload_Capacity = ?,
              Mileage = ?, Status = ?, Last_maintenance_date = ?, Location_ID = ?, Driver_ID = ?
          WHERE vehicle_ID = ? AND is_deleted = FALSE
        `;

        connection.query(
          query,
          [
            license_plate,
            fuel_type,
            volume_capacity || 0,
            payload_capacity || 0,
            mileage || 0,
            status,
            last_maintenance_date || null,
            location_id,
            driver_id || null,
            vehicle_ID
          ],
          (err) => {
            if (err) {
              console.error("❌ Error updating vehicle:", err);
              res.writeHead(500);
              res.end(JSON.stringify({ error: "Failed to update vehicle." }));
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Vehicle updated successfully." }));
          }
        );
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  return false;
}

module.exports = vehicleRoutes;
