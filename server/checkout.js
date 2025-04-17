const db = require("./db");
const nodemailer = require("nodemailer");

function handleCheckout(req, res, reqUrl) {
  if (req.method === "POST" && reqUrl.pathname === "/checkout") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      (async () => {
        try {
          const { customer_ID, cart, shipping, saveAddress, location_ID, paymentMethod } = JSON.parse(body);

          if (!customer_ID || !cart || !shipping || !location_ID) {
            throw new Error("Missing required fields in request body.");
          }

          const connection = await db.promise().getConnection();

          try {
            await connection.beginTransaction();

            // Handle shipping address
            let shippingAddressId;

            const [existingAddress] = await connection.execute(
              `SELECT address_id FROM addresses 
               WHERE address_Street = ? AND unit_number <=> ? AND address_City = ? AND address_State = ? AND address_Zipcode = ? AND Office_Location = 0`,
              [shipping.street, shipping.unit || null, shipping.city, shipping.state, shipping.zipcode]
            );

            if (saveAddress && existingAddress.length > 0) {
              shippingAddressId = existingAddress[0].address_id;
            } else {
              const [newAddress] = await connection.execute(
                `INSERT INTO addresses 
                 (address_Street, unit_number, address_City, address_State, address_Zipcode, Office_Location) 
                 VALUES (?, ?, ?, ?, ?, 0)`,
                [shipping.street, shipping.unit || null, shipping.city, shipping.state, shipping.zipcode]
              );
              shippingAddressId = newAddress.insertId;
            }

            // Insert into orders table
            const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const [orderResult] = await connection.execute(
              `INSERT INTO orders (
                 Customer_ID, address_id, shipping_address_id, Total_Amount, status, Payment_Method
               ) VALUES (?, ?, ?, ?, 'Completed', ?)`,
              [customer_ID, location_ID, shippingAddressId, totalAmount, paymentMethod]
            );

            const order_ID = orderResult.insertId;

            // Get customer name
            const [[{ first_Name: customer_Name }]] = await connection.execute(
              `SELECT first_Name FROM customers WHERE customer_ID = ?`,
              [customer_ID]
            );

            // ✅ Declare array to collect package info for email
            const packageInfoArray = [];

            for (const item of cart) {
              const { productId, quantity, name } = item;

              // Insert into transaction
              const [transactionResult] = await connection.execute(
                `INSERT INTO transaction (Order_ID, Customer_ID, Payment_method, Status, Item_name, product_ID, Quantity) 
                 VALUES (?, ?, ?, 'Completed', ?, ?, ?)`,
                [order_ID, customer_ID, paymentMethod, name, productId, quantity]
              );

              const transaction_ID = transactionResult.insertId;

              // Update inventory
              await connection.execute(
                `UPDATE inventory SET quantity = quantity - ? 
                 WHERE product_ID = ? AND location_ID = ? AND quantity >= ?`,
                [quantity, productId, location_ID, quantity]
              );

              // Fetch product details for package
              const [[product]] = await connection.execute(
                `SELECT weight, fragile, priority, length, width, height 
                 FROM products WHERE product_ID = ?`,
                [productId]
              );

              const unitWeight = parseFloat(product.weight) || 0.1;
const weight = unitWeight * quantity; 
const fragile = product.fragile ? 1 : 0;
const priority = parseInt(product.priority) || 3;
const length = parseFloat(product.length) || 1;
const width = parseFloat(product.width) || 1;
const height = parseFloat(product.height) || 1;


              const shippingCost = parseFloat(
                (weight * (1 + (priority / 5)) + (fragile ? 10 : 0)).toFixed(2)
              );

              // Insert into package table
              const [packageResult] = await connection.execute(
                `INSERT INTO package (
                  Weight, Sender_Customer_ID, Origin_ID, Destination_ID, Shipping_Cost,
                  Priority, Fragile, Transaction_ID, Length, Width, Height,
                  Next_Destination, Assigned_Vehicle, Processed, Recipient_Customer_Name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)`,
                [
                  weight,
                  customer_ID,
                  location_ID,
                  shippingAddressId,
                  shippingCost,
                  priority,
                  fragile,
                  transaction_ID,
                  length,
                  width,
                  height,
                  location_ID,
                  customer_Name
                ]
              );

              const package_ID = packageResult.insertId;

              // Save for email
              packageInfoArray.push({
                name,
                quantity,
                price: item.price,
                package_ID
              });

              // Insert into tracking_history table
              await connection.execute(
                `INSERT INTO tracking_history (package_ID, location_ID, status, employee_ID)
                 VALUES (?, ?, ?, ?)`,
                [package_ID, location_ID, 'Package Created', null]
              );
            }

            // Optional: Email receipt
            const [[{ customer_Email }]] = await connection.execute(
              `SELECT customer_Email FROM customers WHERE customer_ID = ?`,
              [customer_ID]
            );

            if (customer_Email) {
              const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              });

              const itemsHTML = packageInfoArray.map(item =>
                `<li>
                  ${item.name} — ${item.quantity} × $${Number(item.price).toFixed(2)} 
                  = <strong>$${(item.quantity * Number(item.price)).toFixed(2)}</strong><br/>
                  Tracking number: <strong>${item.package_ID}</strong>
                </li>`
              ).join("");

              await transporter.sendMail({
                from: `"Post Office" <${process.env.EMAIL_USER}>`,
                to: customer_Email,
                subject: "Your Order Receipt",
                html: `
                  <h2>Thank you for your order!</h2>
                  <ul>${itemsHTML}</ul>
                  <p><strong>Total Paid:</strong> $${totalAmount.toFixed(2)}</p>
                `,
              });
            }

            await connection.commit();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Order placed and package(s) created successfully." }));
          } catch (error) {
            await connection.rollback();
            console.error("❌ Checkout transaction failed:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: error.sqlMessage || error.message }));
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error("❌ Checkout handler error:", error);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request or missing data" }));
        }
      })();
    });

    return true;
  }

  return false;
}

module.exports = handleCheckout;
