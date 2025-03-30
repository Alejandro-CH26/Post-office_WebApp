import React from "react";
import { useCart } from "./CartContext";
import "./CartPage.css";
import { Link } from "react-router-dom";

// Manual image imports
import expressMailImage from "../images/express_mail.jpg";
import ShippingLabel from "../images/ShippingLabel.jpg";
import BubbleEnvelope from "../images/BubbleEnvelope2.jpg";
import smallbox from "../images/smallbox.webp";
import medbox from "../images/medbox.webp";
import largebox from "../images/largebox.webp";
import packagetape from "../images/packagetape.webp";

// Product image mapping by productId
const productImages = {
  1: expressMailImage,
  2: ShippingLabel,
  3: BubbleEnvelope,
  4: smallbox,
  5: medbox,
  6: largebox,
  7: packagetape,
};

const CartPage = () => {
  const { cart, removeFromCart, updateCartQuantity } = useCart();

  const getTotalPrice = () =>
    cart
      .reduce((total, item) => total + Number(item.price) * item.quantity, 0)
      .toFixed(2);

  return (
    <div className="cart-page-wrapper">
      <h1>Your Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/buyinventory" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          {/* LEFT: Cart Items */}
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={`${item.productId}-${item.format}`}>
                <div className="cart-item-left">
                  <img
                    src={productImages[item.productId]}
                    alt={item.name}
                    className="cart-thumb"
                  />
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item)}
                  >
                    Remove
                  </button>
                </div>
                <div className="cart-item-right">
                  <h3>{item.name}</h3>
                  <div className="cart-item-row">
                    <div><strong>Format:</strong> {item.format}</div>
                    <div>
                      <strong>Quantity:</strong>{" "}
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        className="quantity-input"
                        onChange={(e) =>
                          updateCartQuantity(item, parseInt(e.target.value, 10))
                        }
                      />
                    </div>
                    <div>
                      <strong>Total:</strong> ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Order Summary */}
          <div className="cart-summary-box">
            <h2>Order Summary</h2>
            <p><strong>Total:</strong> ${getTotalPrice()}</p>
            <Link to="/buyinventory" className="summary-btn light">
              Continue Shopping
            </Link>
            <button className="summary-btn dark">Check Out Now</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
