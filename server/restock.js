const db = require("./db");

function handleRestock(req, res, reqUrl) {
  if (req.method === "POST" && reqUrl.pathname === "/restock") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      (async () => {
        try {
          const { product_ID, location_ID, amount } = JSON.parse(body);

          if (!product_ID || !location_ID || !amount || amount <= 0) {
            throw new Error("Missing or invalid restock data.");
          }

          const connection = await db.promise().getConnection();
          try {
            await connection.execute(
              `UPDATE inventory
               SET quantity = quantity + ?
               WHERE product_ID = ? AND location_ID = ?`,
              [amount, product_ID, location_ID]
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Inventory restocked successfully." }));
          } catch (err) {
            console.error("Restock DB error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Database update failed." }));
          } finally {
            connection.release();
          }
        } catch (err) {
          console.error("Restock request error:", err);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      })();
    });

    return true;
  }

  return false;
}

module.exports = handleRestock;
