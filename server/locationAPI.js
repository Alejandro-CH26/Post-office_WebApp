const db = require("./db");

module.exports = function locationAPI(req, res, reqUrl) {
  if (req.method === "GET" && reqUrl.pathname.startsWith("/api/location")) {
    const searchParams = new URLSearchParams(reqUrl.search);
    const locationId = searchParams.get("location_id");

    let sql = `
      SELECT 
        inventory.inventory_ID,
        inventory.quantity,
        products.product_ID,
        products.product_name,
        products.item_price,
        products.description,
        post_office_location.location_ID AS location_ID,
        post_office_location.name AS location_name
      FROM inventory
      JOIN products ON inventory.product_ID = products.product_ID
      JOIN post_office_location ON inventory.location_ID = post_office_location.location_ID
    `;

    const params = [];

    if (locationId) {
      sql += " WHERE inventory.location_ID = ?";
      params.push(locationId);
    }

    sql += " ORDER BY post_office_location.name, products.product_name";

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("SQL Error:", err.sqlMessage || err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.sqlMessage || "Database query error" }));
        return true;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

    return true;
  }

  return false;
};
