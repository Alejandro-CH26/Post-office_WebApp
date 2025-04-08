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

        // Insert into addresses table
        const [addressResult] = await db.promise().query(
          `INSERT INTO addresses (address_Street, address_City, address_State, address_Zipcode, Office_Location)
           VALUES (?, ?, ?, ?, ?)`,
          [street_address, city, state, zip, 1]
        );

        const addressId = addressResult.insertId;

        // Insert into post_office_location using the same ID
        await db.promise().query(
          `INSERT INTO post_office_location 
           (location_ID, name, street_address, city, state, zip, office_phone, Address_ID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [addressId, name, street_address, city, state, zip, office_phone, addressId]
        );

        // Insert 7 inventory rows for the new location
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
        res.end(JSON.stringify({ status: "error", message: "Internal Server Error" }));
      }
    });

    return true;
  }

  return false;
};
