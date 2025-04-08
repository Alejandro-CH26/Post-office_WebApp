const db = require("./db");

function routeHandler(req, res, reqUrl) {
  // SALES REPORT - Detailed Transactions
  if (req.method === "GET" && reqUrl.pathname === "/sales-report") {
    (async () => {
      let connection;
      try {
        connection = await db.promise().getConnection();

        const locationFilter = reqUrl.query.location_ID;
        const typeFilter = reqUrl.query.type;
        const from = reqUrl.query.from;
        const to = reqUrl.query.to;

        let sql = `
          SELECT 
            t.Transaction_ID,
            CONCAT(c.First_Name, ' ', c.Last_Name) AS customer_name,
            t.Item_name,
            t.Quantity,
            t.Date,
            t.product_ID,
            p.item_price,
            l.name AS Location
          FROM transaction t
          LEFT JOIN customers c ON t.Customer_ID = c.Customer_ID
          LEFT JOIN products p ON t.product_ID = p.product_ID
          LEFT JOIN orders o ON t.Order_ID = o.Order_ID
          LEFT JOIN post_office_location l ON o.address_ID = l.location_ID
          WHERE t.Status = 'Completed'
        `;

        const params = [];

        if (locationFilter && locationFilter !== "all") {
          sql += " AND o.address_ID = ?";
          params.push(locationFilter);
        }
        if (typeFilter && typeFilter !== "all") {
          sql += " AND t.Item_name = ?";
          params.push(typeFilter);
        }
        if (from) {
          sql += " AND DATE(t.Date) >= ?";
          params.push(from);
        }
        if (to) {
          sql += " AND DATE(t.Date) <= ?";
          params.push(to);
        }

        sql += " ORDER BY t.Date DESC;";

        const [rows] = await connection.execute(sql, params);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", data: rows }));
      } catch (error) {
        console.error("❌ Sales Report Error:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: error.message }));
        }
      } finally {
        if (connection) connection.release();
      }
    })();
    return true;
  }

  // SALES SUMMARY - Revenue, Total Sales, New Customers, Top Product
  if (req.method === "GET" && reqUrl.pathname === "/sales-summary") {
    (async () => {
      let connection;
      try {
        connection = await db.promise().getConnection();

        const locationFilter = reqUrl.query.location_ID;
        const typeFilter = reqUrl.query.type;
        const from = reqUrl.query.from;
        const to = reqUrl.query.to;

        let baseWhere = `WHERE t.Status = 'Completed'`;
        const params = [];

        if (locationFilter && locationFilter !== "all") {
          baseWhere += " AND o.address_ID = ?";
          params.push(locationFilter);
        }
        if (typeFilter && typeFilter !== "all") {
          baseWhere += " AND t.Item_name = ?";
          params.push(typeFilter);
        }
        if (from) {
          baseWhere += " AND DATE(t.Date) >= ?";
          params.push(from);
        }
        if (to) {
          baseWhere += " AND DATE(t.Date) <= ?";
          params.push(to);
        }

        // Revenue & Total Transactions
        const sqlMain = `
          SELECT 
            SUM(p.item_price * t.Quantity) AS totalRevenue,
            COUNT(*) AS totalTransactions
          FROM transaction t
          LEFT JOIN products p ON t.product_ID = p.product_ID
          LEFT JOIN orders o ON t.Order_ID = o.Order_ID
          ${baseWhere};
        `;
        const [summary] = await connection.execute(sqlMain, params);

        // New Customers
        const sqlNewCustomers = `
          SELECT COUNT(*) AS newCustomers FROM (
            SELECT t.Customer_ID
            FROM transaction t
            LEFT JOIN orders o ON t.Order_ID = o.Order_ID
            ${baseWhere}
            GROUP BY t.Customer_ID
          ) AS subquery;
        `;
        const [newCustomerResult] = await connection.execute(sqlNewCustomers, params);

        // Top Product
        const sqlTopProduct = `
          SELECT t.Item_name, SUM(t.Quantity) AS totalQty
          FROM transaction t
          LEFT JOIN orders o ON t.Order_ID = o.Order_ID
          ${baseWhere}
          GROUP BY t.Item_name
          ORDER BY totalQty DESC
          LIMIT 1;
        `;
        const [topProductResult] = await connection.execute(sqlTopProduct, params);

        const totalRevenue = Number(summary[0].totalRevenue || 0).toFixed(2);
        const totalTransactions = Number(summary[0].totalTransactions || 0);
        const newCustomers = Number(newCustomerResult[0].newCustomers || 0);
        const topProduct = topProductResult[0]?.Item_name || "N/A";

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            totalRevenue,
            totalTransactions,
            newCustomers,
            topProduct
          })
        );
      } catch (error) {
        console.error("❌ Sales Summary Error:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: error.message }));
        }
      } finally {
        if (connection) connection.release();
      }
    })();
    return true;
  }

  // ACTIVE LOCATIONS - Get all post office locations
  if (req.method === "GET" && reqUrl.pathname === "/active-locations") {
    (async () => {
      let connection;
      try {
        connection = await db.promise().getConnection();

        const sql = `
          SELECT location_ID, name
          FROM post_office_location
          ORDER BY name;
        `;

        const [rows] = await connection.execute(sql);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(rows));
      } catch (error) {
        console.error("❌ Active Locations Error:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: error.message }));
        }
      } finally {
        if (connection) connection.release();
      }
    })();
    return true;
  }

  return false;
}

module.exports = routeHandler;
