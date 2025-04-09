/* eslint-disable */
import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./BuyInventory.css";
import mailHero from "../images/mail_hero.jpg";
import expressMailImage from "../images/express_mail.jpg";
import ShippingLabel from "../images/ShippingLabel.jpg";
import BubbleEnvelope from "../images/BubbleEnvelope2.jpg";
import smallbox from "../images/smallbox.webp";
import medbox from "../images/medbox.webp";
import largebox from "../images/largebox.webp";
import packagetape from "../images/packagetape.webp";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

const BuyInventory = () => {
  const productRef = useRef(null);
  const scrollToProducts = () => {
    productRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [storeLocations, setStoreLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [nearbyStore, setNearbyStore] = useState("");
  const [inventory, setInventory] = useState({});

  // Fetch all store locations dynamically
  useEffect(() => {
    fetch(`${BASE_URL}/locations`)
      .then((res) => res.json())
      .then((locations) => {
        setStoreLocations(locations);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const withFallbackCoords = locations.map((loc) => ({
              ...loc,
              lat: parseFloat(loc.lat || 0),
              lng: parseFloat(loc.lng || 0),
            }));

            const closest = withFallbackCoords.reduce((closestStore, currentStore) => {
              const distance = Math.sqrt(
                Math.pow(userLat - currentStore.lat, 2) +
                Math.pow(userLng - currentStore.lng, 2)
              );
              return distance < closestStore.distance
                ? { ...currentStore, distance }
                : closestStore;
            }, { ...withFallbackCoords[0], distance: Infinity });

            setNearbyStore(closest.name);
            setSelectedLocationId(closest.location_ID.toString());
            localStorage.setItem("location_ID", closest.location_ID.toString());
          },
          (err) => {
            console.log("Geolocation failed:", err);
          }
        );
      })
      .catch((err) => {
        console.error("Failed to load locations:", err);
      });
  }, []);

  useEffect(() => {
    if (!selectedLocationId) return;

    fetch(`${BASE_URL}/api/location?location_id=${selectedLocationId}`)
      .then((res) => res.json())
      .then((data) => {
        const invMap = {};
        data.forEach((item) => {
          const id = item.product_ID || item.product_id;
          invMap[id] = item.quantity;
        });
        setInventory(invMap);
      })
      .catch((err) => {
        console.error("Failed to load inventory:", err);
      });
  }, [selectedLocationId]);

  const products = [
    { product_ID: 1, product_name: "Express Mail Stamps", item_price: 9.99, description: "Stamps for Priority Mail service", image: expressMailImage },
    { product_ID: 2, product_name: "Shipping Labels", item_price: 5.0, description: "Self-adhesive shipping labels for mail", image: ShippingLabel },
    { product_ID: 3, product_name: "Bubble Envelope", item_price: 1.5, description: "Padded envelope for fragile items", image: BubbleEnvelope },
    { product_ID: 4, product_name: "Flat Rate Box - Small", item_price: 8.0, description: "USPS Small Flat Rate Box", image: smallbox },
    { product_ID: 5, product_name: "Flat Rate Box - Medium", item_price: 13.0, description: "USPS Medium Flat Rate Box", image: medbox },
    { product_ID: 6, product_name: "Flat Rate Box - Large", item_price: 18.0, description: "USPS Large Flat Rate Box", image: largebox },
    { product_ID: 7, product_name: "Packaging Tape", item_price: 4.99, description: "Clear shipping and packaging tape", image: packagetape },
  ];

  return (
    <div className="buy-inventory-page">
      <div className="store-location-bar">
        <div className="store-location-label">Select a Store Location:</div>
        <select
          className="store-location-dropdown"
          value={selectedLocationId}
          onChange={(e) => {
            setSelectedLocationId(e.target.value);
            localStorage.setItem("location_ID", e.target.value);
          }}
        >
          <option value="">-- Choose a store --</option>
          {storeLocations.map((store) => (
            <option key={store.location_ID} value={store.location_ID}>
              {store.name}
            </option>
          ))}
        </select>
        {nearbyStore && (
          <div className="nearby-label">Nearest store: {nearbyStore}</div>
        )}
      </div>

      <div className="buy-hero">
        <div className="buy-hero-text">
          <h1>Fast, Reliable, Priority Mail</h1>
          <p>Priority Mail offers fast delivery, tracking, and insurance so you can ship with confidence and ease.</p>
          <button className="shop-now-btn" onClick={scrollToProducts}>Shop Now</button>
        </div>
        <div className="buy-hero-image">
          <img src={mailHero} alt="Mail Hero" />
        </div>
      </div>

      <div ref={productRef} className="inventory-container">
        <h1>Buy Inventory</h1>
        <p>Find all the essential mailing supplies here.</p>

        <div className="product-grid">
          {products.map((product) => (
            <div key={product.product_ID} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.product_name} />
              </div>
              <h3>{product.product_name}</h3>
              <p className="description">{product.description}</p>
              <p className="price">${product.item_price.toFixed(2)}</p>
              {selectedLocationId && (
                <p className="stock-info">{inventory[product.product_ID] ?? 0} in stock</p>
              )}
              <Link to={`/products/${product.product_ID}?location_id=${selectedLocationId}`} className="view-btn">
                View Details
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyInventory;
