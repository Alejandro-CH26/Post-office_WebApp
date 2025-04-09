import React, { createContext, useContext, useState, useEffect } from "react";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from backend on initial mount
  useEffect(() => {
    const fetchCart = async () => {
      const customer_ID = localStorage.getItem("customer_ID");
      if (!customer_ID) return;

      try {
        const res = await fetch(`${BASE_URL}/cart?customer_ID=${customer_ID}`);
        const backendCart = await res.json();

        const transformed = backendCart.map((item) => ({
          cartId: item.cart_id,
          productId: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          format: item.format,
          price: item.item_price,
          description: item.description,
        }));

        setCart(transformed);
      } catch (err) {
        console.error("Failed to fetch cart from backend:", err);
      }
    };

    fetchCart();
  }, []);

  const addToCart = (newItem) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.productId === newItem.productId && item.format === newItem.format
      );
  
      if (existingIndex !== -1) {
        // If item exists, update the quantity
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += newItem.quantity;
        return updatedCart;
      }
  
      // If it's a new item, add it to the cart
      return [...prevCart, newItem];
    });
  };
  

  const removeFromCart = async (itemToRemove) => {
    try {
      const customer_ID = localStorage.getItem("customer_ID");
      const res = await fetch(`${BASE_URL}/cart?customer_ID=${customer_ID}`);
      const backendCart = await res.json();

      const match = backendCart.find(
        (entry) =>
          entry.product_name === itemToRemove.name &&
          entry.format === itemToRemove.format
      );

      if (!match || !match.cart_id) return;

      await fetch(`${BASE_URL}/cart`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: match.cart_id }),
      });

      // Refresh cart from backend
      const refreshed = await fetch(`${BASE_URL}/cart?customer_ID=${customer_ID}`);
      const updatedCart = await refreshed.json();

      const transformed = updatedCart.map((item) => ({
        cartId: item.cart_id,
        productId: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        format: item.format,
        price: item.item_price,
        description: item.description,
      }));

      setCart(transformed);
    } catch (err) {
      console.error("Error removing item from cart:", err);
    }
  };

  const updateCartQuantity = async (itemToUpdate, newQuantity) => {
    try {
      const customer_ID = localStorage.getItem("customer_ID");
      const res = await fetch(`${BASE_URL}/cart?customer_ID=${customer_ID}`);
      const backendCart = await res.json();

      const match = backendCart.find(
        (entry) =>
          entry.product_name === itemToUpdate.name &&
          entry.format === itemToUpdate.format
      );

      if (!match || !match.cart_id) return;

      // Delete the old item first
      await fetch(`${BASE_URL}/cart`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: match.cart_id }),
      });

      // Reinsert with updated quantity
      await fetch(`${BASE_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_ID,
          product_ID: itemToUpdate.productId,
          quantity: newQuantity,
          format: itemToUpdate.format,
        }),
      });

      // Refresh cart again
      const refreshed = fetch(`${BASE_URL}/cart?customer_ID=${customer_ID}`);
      const updatedCart = await refreshed.json();

      const transformed = updatedCart.map((item) => ({
        cartId: item.cart_id,
        productId: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        format: item.format,
        price: item.item_price,
        description: item.description, 
      }));

      setCart(transformed);
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, updateCartQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
