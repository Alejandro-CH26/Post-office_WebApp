import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./productdetails.css";
import expressMailImage from "../images/express_mail.jpg";
import shippingLabelImage from "../images/ShippingLabel.jpg";
import bubbleEnvelopeImage from "../images/BubbleEnvelope2.jpg";
import smallBoxImage from "../images/smallbox.webp";
import medBoxImage from "../images/medbox.webp";
import largeBoxImage from "../images/largebox.webp";
import packagingTapeImage from "../images/packagetape.webp";
import { useCart } from "./CartContext";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ProductDetails() {
  const { productId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const locationId = searchParams.get("location_id");

  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [stock, setStock] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [productId]);

  useEffect(() => {
    if (!locationId || !productId) return;

    fetch(`${BASE_URL}/api/products/${productId}`)

      .then((res) => res.json())
      .then((data) => {
        const match = data.find((p) => String(p.product_ID) === String(productId));
        setStock(match?.quantity ?? 0);
      })
      .catch((err) => {
        console.error("Error fetching stock:", err);
        setStock(0);
      });
  }, [productId, locationId]);

  const handleBackToStore = () => {
    navigate("/buyinventory");
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const format = selectedFormat || formatOptions[0].label;

    const cartItem = {
      customer_ID: localStorage.getItem("customer_ID"),
      product_ID: product.product_ID,
      quantity,
      format,
    };

    try {
      const response = await fetch(`${BASE_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartItem),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to add to cart");

      addToCart({
        productId: product.product_ID,
        name: product.product_name,
        format,
        quantity,
        price: Number(chosenFormat.price),
        locationId,
      });

      alert("Added to cart!");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add item to cart.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const productName = product.product_name;
  const description = product.description;

  const productImages = {
    1: expressMailImage,
    2: shippingLabelImage,
    3: bubbleEnvelopeImage,
    4: smallBoxImage,
    5: medBoxImage,
    6: largeBoxImage,
    7: packagingTapeImage,
  };

  const productSubtitles = {
    1: "Forever 73c | Multiple Stamp Designs and Formats",
    2: "Self-adhesive labels | Easy to peel",
    3: "Padded protection for your items",
    4: "Affordable flat-rate box (small)",
    5: "Mid-sized option for flat-rate shipping",
    6: "Largest flat-rate USPS box",
    7: "Durable tape for packages",
  };

  const productFormats = {
    1: [
      { label: "Book of 20", price: 14.6, pieces: 20 },
      { label: "Coil of 3,000", price: 2190, pieces: 3000 },
      { label: "Coil of 10,000", price: 7300, pieces: 10000 },
    ],
    default: [{ label: "Single", price: product.item_price || 1.0, pieces: 1 }],
  };

  const formatOptions = productFormats[product.product_ID] || productFormats.default;
  const chosenFormat = formatOptions.find((f) => f.label === selectedFormat) || formatOptions[0];

  const totalPrice = (chosenFormat.price * quantity).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const totalPieces = chosenFormat.pieces * quantity;

  return (
    <div className="product-details-container">
      <div className="product-image-section">
        <img src={productImages[product.product_ID]} alt={productName} className="product-image" />
      </div>

      <div className="product-info-section">
        <h1 className="product-name">{productName}</h1>
        <p className="product-subtitle">{productSubtitles[product.product_ID]}</p>
        {stock !== null && (
          <p style={{ fontWeight: "bold", color: stock > 0 ? "green" : "red", fontSize: "18px" }}>
            {stock > 0 ? "In Stock" : "Out of Stock"}
          </p>
        )}
        <p className="product-description">{description}</p>

        <div className="format-column">
          <h3>1. Choose a Format</h3>
          <div className="format-button-group">
            {formatOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`format-button ${chosenFormat.label === option.label ? "selected" : ""}`}
                onClick={() => setSelectedFormat(option.label)}
              >
                {option.label} - ${option.price.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="quantity-section" style={{ marginTop: "20px" }}>
            <h3>2. Choose a Quantity</h3>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))}
            />
          </div>
        </div>

        <div className="product-summary">
          <p>Total Price: ${totalPrice}</p>
          <p>Total Pieces: {totalPieces.toLocaleString()}</p>
        </div>

        <div className="product-actions">
          <button className="save-for-later-button" onClick={handleBackToStore}>
            Back to Store
          </button>
          <button className="preorder-button" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
