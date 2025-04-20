const db = require("./db");

module.exports = function postOfficeAPI(req, res, reqUrl) {
  if (req.method === "POST" && reqUrl.pathname === "/post-office") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const { name, street_address, city, state, zip, office_phone } = JSON.parse(body);

        if (!name || !street_address || !city || !state || !zip || !office_phone) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ status: "error", message: "Missing required fields." }));
        }

        let addressId;

        // Check if the address already exists
        const [existingAddress] = await db.promise().query(
          `SELECT address_id FROM addresses
           WHERE address_Street = ? AND address_City = ? AND address_State = ? AND address_Zipcode = ? AND Office_Location = 1`,
          [street_address, city, state, zip]
        );

        if (existingAddress.length > 0) {
          addressId = existingAddress[0].address_id;
        } else {
          const [addressResult] = await db.promise().query(
            `INSERT INTO addresses (address_Street, address_City, address_State, address_Zipcode, Office_Location)
             VALUES (?, ?, ?, ?, ?)`,
            [street_address, city, state, zip, 1]
          );
          addressId = addressResult.insertId;
        }

        // Check if post office already exists with same name or same address
        const [existingPostOffice] = await db.promise().query(
          `SELECT * FROM post_office_location WHERE name = ? OR Address_ID = ?`,
          [name, addressId]
        );

        if (existingPostOffice.length > 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({
            status: "error",
            message: "Post office with this name or address already exists."
          }));
        }

        // Insert post office location
        await db.promise().query(
          `INSERT INTO post_office_location 
           (location_ID, name, street_address, city, state, zip, office_phone, Address_ID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [addressId, name, street_address, city, state, zip, office_phone, addressId]
        );

        // Insert default inventory
        const inventoryInserts = [];
        for (let productId = 1; productId <= 7; productId++) {
          inventoryInserts.push([addressId, productId, 100]);
        }

        await db.promise().query(
          `INSERT INTO inventory (location_ID, product_ID, quantity) VALUES ?`,
          [inventoryInserts]
        );

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "success",
          message: "Post office and inventory created successfully.",
          postOfficeID: addressId
        }));
      } catch (err) {
        console.error("Post Office Creation Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "Phone Number already exists!" }));
      }
    });

    return true;
  }

  return false;
};

