const db = require("./db");
const { URL } = require("url");

function routeHandler(req, res, reqUrl) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const query = parsedUrl.searchParams;

 
  if (req.method === "GET" && parsedUrl.pathname === "/sales-report") {
    (async () => {
      let connection;
      try {
        connection = await db.promise().getConnection();
  
        const locationFilter = query.get("location_ID");
        const typeFilter = query.get("type");
        const from = query.get("from");
        const to = query.get("to");
  
        let sql = `
          SELECT 
            t.Transaction_ID,
            CONCAT(c.First_Name, ' ', c.Last_Name) AS customer_name,
            CASE 
              WHEN t.Item_name = 'Package' THEN CONCAT('Package #', pk.package_ID)
              ELSE t.Item_name 
            END AS Item_name,
            t.Item_name AS raw_type, 
            t.Quantity,
            t.Date,
            t.product_ID,
            CASE 
              WHEN t.Item_name = 'Package' THEN pk.Shipping_Cost
              ELSE p.item_price
            END AS item_price,
            l.name AS Location
          FROM transaction t
          LEFT JOIN customers c ON t.Customer_ID = c.Customer_ID
          LEFT JOIN products p ON t.product_ID = p.product_ID
          LEFT JOIN package pk ON t.Transaction_ID = pk.Transaction_ID
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
  
        sql += " ORDER BY t.Date DESC";
  
        const [rows] = await connection.execute(sql, params);
  
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", data: rows }));
      } catch (error) {
        console.error("Sales Report Error:", error);
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
  
 
  if (req.method === "GET" && parsedUrl.pathname === "/sales-summary") {
    (async () => {
      let connection;
      try {
        connection = await db.promise().getConnection();

        const locationFilter = query.get("location_ID");
        const typeFilter = query.get("type");
        const from = query.get("from");
        const to = query.get("to");

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

      
        const sqlMain = `
          SELECT 
            SUM(CASE 
                  WHEN t.Item_name = 'Package' THEN pk.Shipping_Cost 
                  ELSE p.item_price * t.Quantity 
                END) AS totalRevenue,
            COUNT(*) AS totalTransactions
          FROM transaction t
          LEFT JOIN products p ON t.product_ID = p.product_ID
          LEFT JOIN package pk ON t.Transaction_ID = pk.Transaction_ID
          LEFT JOIN orders o ON t.Order_ID = o.Order_ID
          ${baseWhere};
        `;
        const [summary] = await connection.execute(sqlMain, params);

       
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

       
        let packagesQuery = `
          SELECT COUNT(*) AS packagesCreated
          FROM transaction t
          LEFT JOIN orders o ON t.Order_ID = o.Order_ID
          WHERE t.Status = 'Completed' AND t.Item_name = 'Package'
        `;
        const packagesParams = [];

        if (locationFilter && locationFilter !== "all") {
          packagesQuery += " AND o.address_ID = ?";
          packagesParams.push(locationFilter);
        }
        if (from) {
          packagesQuery += " AND DATE(t.Date) >= ?";
          packagesParams.push(from);
        }
        if (to) {
          packagesQuery += " AND DATE(t.Date) <= ?";
          packagesParams.push(to);
        }

        if (typeFilter && typeFilter !== "all" && typeFilter !== "Package") {
          packagesQuery = `SELECT 0 AS packagesCreated`;
          packagesParams.length = 0;
        }

        const [packagesResult] = await connection.execute(packagesQuery, packagesParams);

        const totalRevenue = Number(summary[0].totalRevenue || 0).toFixed(2);
        const totalTransactions = Number(summary[0].totalTransactions || 0);
        const newCustomers = Number(newCustomerResult[0].newCustomers || 0);
        const topProduct = topProductResult[0]?.Item_name || "N/A";
        const packagesCreated = Number(packagesResult[0].packagesCreated || 0);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            totalRevenue,
            totalTransactions,
            newCustomers,
            topProduct,
            packagesCreated,
          })
        );
      } catch (error) {
        console.error("Sales Summary Error:", error);
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
