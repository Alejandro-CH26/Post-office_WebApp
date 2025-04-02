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
          const { customer_ID, cart, shipping, saveAddress, location_ID } = JSON.parse(body);

          if (!customer_ID || !cart || !shipping || !location_ID) {
            throw new Error("Missing required fields in request body.");
          }

          const connection = await db.promise().getConnection();

          try {
            await connection.beginTransaction();

            // Insert shipping address
            let shippingAddressId;

            if (saveAddress) {
              // 1. Try to find existing matching address
              const [existingAddressRows] = await connection.execute(
                `SELECT address_id FROM addresses 
                 WHERE address_Street = ? AND unit_number <=> ? 
                   AND address_City = ? AND address_State = ? 
                   AND address_Zipcode = ? AND Office_Location = 0`,
                [
                  shipping.street,
                  shipping.unit || null,
                  shipping.city,
                  shipping.state,
                  shipping.zipcode
                ]
              );
            
              if (existingAddressRows.length > 0) {
                // ✅ Reuse existing address
                shippingAddressId = existingAddressRows[0].address_id;
              } else {
                // 🚀 Insert new address
                const [addressResult] = await connection.execute(
                  `INSERT INTO addresses 
                   (address_Street, unit_number, address_City, address_State, address_Zipcode, Office_Location) 
                   VALUES (?, ?, ?, ?, ?, 0)`,
                  [
                    shipping.street,
                    shipping.unit || null,
                    shipping.city,
                    shipping.state,
                    shipping.zipcode
                  ]
                );
                shippingAddressId = addressResult.insertId;
              }
            } else {
              // 🆕 Always insert new if not saving
              const [addressResult] = await connection.execute(
                `INSERT INTO addresses 
                 (address_Street, unit_number, address_City, address_State, address_Zipcode, Office_Location) 
                 VALUES (?, ?, ?, ?, ?, 0)`,
                [
                  shipping.street,
                  shipping.unit || null,
                  shipping.city,
                  shipping.state,
                  shipping.zipcode
                ]
              );
              shippingAddressId = addressResult.insertId;
            }
            

            // Insert order
            const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const [orderResult] = await connection.execute(
              `INSERT INTO orders 
              (Customer_ID, address_id, shipping_address_id, Total_Amount, status) 
              VALUES (?, ?, ?, ?, ?)`,
              [customer_ID, location_ID, shippingAddressId, totalAmount, "Completed"]
            );

            const orderId = orderResult.insertId;

            // Insert transaction & subtract inventory
            for (const item of cart) {
              console.log("📦 Processing cart item:", item);

              // Validate all required fields
              if (
                typeof item.productId !== "number" ||
                typeof item.quantity !== "number" ||
                typeof item.name !== "string"
              ) {
                throw new Error("Cart item is missing or has invalid fields.");
              }

              // Insert into transaction table with product_ID
              await connection.execute(
                `INSERT INTO transaction 
                 (Order_ID, Customer_ID, Payment_method, Item_name, product_ID, Quantity) 
                 VALUES (?, ?, 'Credit Card', ?, ?, ?)`,
                [orderId, customer_ID, item.name, item.productId, item.quantity]
              );

              // Update inventory
              const [inventoryResult] = await connection.execute(
                `UPDATE inventory 
                 SET quantity = quantity - ? 
                 WHERE product_ID = ? AND location_ID = ? AND quantity >= ?`,
                [item.quantity, item.productId, location_ID, item.quantity]
              );

              if (inventoryResult.affectedRows === 0) {
                throw new Error(`Insufficient inventory for product ID ${item.productId}`);
              }
            }

            // Fetch customer's email
            const [[customerRow]] = await connection.execute(
              `SELECT customer_Email FROM customers WHERE customer_ID = ?`,
              [customer_ID]
            );

            const customerEmail = customerRow?.customer_Email;

            if (customerEmail) {
              // Send email receipt
              const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              });

              const itemsHTML = cart.map(item => `
                <li>
                  ${item.name} — ${item.quantity} × $${Number(item.price).toFixed(2)} = <strong>$${(Number(item.price) * item.quantity).toFixed(2)}</strong>
                </li>
              `).join("");

              const mailOptions = {
                from: `"Post Office" <${process.env.EMAIL_USER}>`,
                to: customerEmail,
                subject: "Your Order Receipt",
                html: `
                  <h2>Thank you for your order!</h2>
                  <p>Here is your receipt:</p>
                  <ul>${itemsHTML}</ul>
                  <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
                  <p>We appreciate your business! 📨</p>
                `,
              };

              await transporter.sendMail(mailOptions);
              console.log("✅ Email sent to:", customerEmail);
            }

            await connection.commit();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Order placed successfully." }));
          } catch (error) {
            await connection.rollback();
            console.error("Transaction failed:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              error: error.sqlMessage || error.message || "Order failed to process.",
            }));
            
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error("Checkout handler error:", error);
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
