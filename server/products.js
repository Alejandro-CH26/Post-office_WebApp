    // productsAPI.js

    const db = require("./db");

    module.exports = function productsAPI(req, res, reqUrl) {
    // Only handle GET requests for products
    if (req.method === "GET" && reqUrl.pathname.startsWith("/api/products")) {
        // Split the URL pathname by "/"
        // e.g., "/api/products" -> ["", "api", "products"]
        // or "/api/products/123" -> ["", "api", "products", "123"]
        const parts = reqUrl.pathname.split("/");

        // If there's a product ID provided, fetch that specific product.
        if (parts.length === 4 && parts[3]) {
        const productId = parts[3];
        const sql = "SELECT * FROM products WHERE product_ID = ?";
        db.query(sql, [productId], (err, results) => {
            if (err) {
            console.error("Error fetching product:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Database query error" }));
            return;
            }
            if (results.length === 0) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Product not found" }));
            return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results[0]));
        });
        return true;
        }
        // Otherwise, if the request is exactly for "/api/products", fetch all products.
        else if (reqUrl.pathname === "/api/products") {
        const sql = "SELECT * FROM products";
        db.query(sql, (err, results) => {
            if (err) {
            console.error("Error fetching products:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Database query error" }));
            return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results));
        });
        return true;
        }
    }
    // Return false if the route is not handled here.
    return false;
    };
