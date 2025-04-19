const db = require("./db");

module.exports = function cartAPI(req, res, reqUrl) {
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  
  if (req.method === "POST" && reqUrl.pathname === "/cart") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { customer_ID, product_ID, quantity, format, location_ID } = JSON.parse(body);
        console.log("Incoming values:", {
          customer_ID,
          product_ID,
          quantity,
          format,
          location_ID
        });
        if (!customer_ID || !product_ID || !quantity || !format || !location_ID) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing required fields." }));
        }
  
        
        const inventorySQL = `
          SELECT quantity 
          FROM inventory 
          WHERE product_ID = ? AND location_ID = ?
        `;
        db.query(inventorySQL, [product_ID, location_ID], (err, inventoryRows) => {
          if (err || inventoryRows.length === 0) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "No inventory found for this item/location." }));
          }
  
          const availableStock = inventoryRows[0].quantity;
  
          
          const checkSQL = `
            SELECT quantity 
            FROM cart 
            WHERE customer_id = ? AND product_id = ? AND format = ?
          `;
          db.query(checkSQL, [customer_ID, product_ID, format], (err, cartRows) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Cart lookup failed." }));
            }
  
            const existingCartQty = cartRows.length > 0 ? cartRows[0].quantity : 0;
            const newTotalQty = existingCartQty + quantity;
  
            
            if (newTotalQty > availableStock) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Not enough stock available at this location." }));
            }
  
           
            if (cartRows.length > 0) {
              const updateSQL = `
                UPDATE cart 
                SET quantity = ? 
                WHERE customer_id = ? AND product_id = ? AND format = ?
              `;
              db.query(updateSQL, [newTotalQty, customer_ID, product_ID, format], (err) => {
                if (err) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  return res.end(JSON.stringify({ error: "Failed to update cart" }));
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Cart updated" }));
              });
            } else {
              const insertSQL = `
                INSERT INTO cart (customer_id, product_id, quantity, format) 
                VALUES (?, ?, ?, ?)
              `;
              db.query(insertSQL, [customer_ID, product_ID, quantity, format], (err) => {
                if (err) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  return res.end(JSON.stringify({ error: "Failed to add to cart" }));
                }
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Item added to cart" }));
              });
            }
          });
        });
      } catch (err) {
        console.error("Invalid JSON:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return true;
  }
  

 
  if (req.method === "GET" && reqUrl.pathname === "/cart") {
    const customer_ID = reqUrl.query.customer_ID;
    if (!customer_ID) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing customer_ID" }));
    }

    const query = `
      SELECT c.cart_id, c.quantity, c.format, p.product_name, p.item_price, c.product_id, p.description
      FROM cart c
      JOIN products p ON c.product_id = p.product_ID
      WHERE c.customer_id = ?
    `;

    db.query(query, [customer_ID], (err, results) => {
      if (err) {
        console.error("DB Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "DB error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

    return true;
  }

  
  if (req.method === "DELETE" && reqUrl.pathname === "/cart") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { cart_id } = JSON.parse(body);

        if (!cart_id) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing cart_id" }));
        }

        const deleteSQL = "DELETE FROM cart WHERE cart_id = ?";
        db.query(deleteSQL, [cart_id], (err) => {
          if (err) {
            console.error("Delete Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Failed to delete cart item" }));
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Cart item removed" }));
        });
      } catch (err) {
        console.error("Invalid JSON:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  
  if (req.method === "DELETE" && reqUrl.pathname === "/cart/clear") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { customer_ID } = JSON.parse(body);

        if (!customer_ID || isNaN(customer_ID)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid or missing customer_ID" }));
        }

        const clearSQL = "DELETE FROM cart WHERE customer_id = ?";
        db.query(clearSQL, [Number(customer_ID)], (err, result) => {
          if (err) {
            console.error("Clear Cart Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Failed to clear cart" }));
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Cart cleared", affected: result.affectedRows }));
        });
      } catch (err) {
        console.error("Invalid JSON:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return true;
  }

  return false;
};
