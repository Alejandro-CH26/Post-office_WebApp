// ProductDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function ProductDetails() {
  // Extract productId from the URL (e.g., /products/123)
  const { productId } = useParams();
  
  // Local state to manage product data, loading status, and errors
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the product details from the API
    fetch(`/api/products/${productId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch product details.');
        }
        return response.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [productId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>No product found.</div>;

  return (
    <div className="product-details">
      <h1>{product.product_Name}</h1>
      <p>{product.product_Description}</p>
      <p>Price: ${product.product_Price}</p>
      <button>Add to Cart</button>
    </div>
  );
}

export default ProductDetails;
