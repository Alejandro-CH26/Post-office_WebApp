import React, { useEffect, useState } from "react";
import "./inventoryreport.css";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const InventoryReport = () => {
  const [allInventoryData, setAllInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [currentSortColumn, setCurrentSortColumn] = useState(null);
  const [currentSortDirection, setCurrentSortDirection] = useState("asc");
  const [showReorderForm, setShowReorderForm] = useState(false);
  const [restockAmount, setRestockAmount] = useState("");
  const [feedback, setFeedback] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return today;
  });

  useEffect(() => {
    getInventory(selectedDate);
  }, [selectedDate]);

  const getInventory = async (dateParam = selectedDate) => {
    setStatusMessage("");
    try {
      const response = await fetch(`${BASE_URL}/inventory?date=${dateParam}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!data || data.length === 0) {
        setStatusMessage("⚠️ No inventory found.");
        setAllInventoryData([]);
        setFilteredData([]);
        return;
      }
      setAllInventoryData(data);
      applyFilterAndSort(data, locationFilter, productFilter, currentSortColumn, currentSortDirection);
    } catch (error) {
      console.error("Fetch error:", error);
      setStatusMessage("⚠️ Error fetching inventory. Check console.");
    }
  };

  const getUniqueOptions = (data, key) => {
    const options = new Set(data.map((item) => String(item[key]).trim()));
    return Array.from(options);
  };

  const applyFilterAndSort = (data, locFilter, prodFilter, sortColumn, sortDirection) => {
    let filtered = data.filter((item) => {
      const matchesLocation = locFilter === "all" || item.location_name === locFilter;
      const matchesProduct = prodFilter === "all" || item.product_name.trim() === prodFilter;
      return matchesLocation && matchesProduct;
    });

    if (sortColumn) {
      const numericColumns = ["item_price", "starting_quantity", "adjusted_quantity"];
      filtered.sort((a, b) => {
        let valA, valB;

        if (sortColumn === "restock_needed") {
          valA = a.starting_quantity - getDisplayQuantity(a);
          valB = b.starting_quantity - getDisplayQuantity(b);
        } else {
          valA = a[sortColumn];
          valB = b[sortColumn];
          if (numericColumns.includes(sortColumn)) {
            valA = parseFloat(String(valA)) || 0;
            valB = parseFloat(String(valB)) || 0;
          } else {
            valA = String(valA).trim();
            valB = String(valB).trim();
          }
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
  };

  const getDisplayQuantity = (item) => {
    const today = new Date().toISOString().split("T")[0];
    return selectedDate === today
      ? item.adjusted_quantity
      : item.snapshot_quantity ?? item.adjusted_quantity;
  };

  const handleLocationChange = (e) => {
    const newFilter = e.target.value;
    setLocationFilter(newFilter);
    applyFilterAndSort(allInventoryData, newFilter, productFilter, currentSortColumn, currentSortDirection);
  };

  const handleProductChange = (e) => {
    const newFilter = e.target.value;
    setProductFilter(newFilter);
    applyFilterAndSort(allInventoryData, locationFilter, newFilter, currentSortColumn, currentSortDirection);
  };

  const onHeaderClick = (columnKey) => {
    let newDirection = "asc";
    if (currentSortColumn === columnKey) {
      newDirection = currentSortDirection === "asc" ? "desc" : "asc";
    }
    setCurrentSortColumn(columnKey);
    setCurrentSortDirection(newDirection);
    applyFilterAndSort(allInventoryData, locationFilter, productFilter, columnKey, newDirection);
  };

  const handleReorderSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");

    const match = allInventoryData.find(
      (item) =>
        item.location_name === locationFilter &&
        item.product_name.trim() === productFilter
    );

    if (!match) {
      setFeedback("❌ No matching product/location found in inventory.");
      return;
    }

    const product_ID = match.product_ID;
    const location_ID = match.location_ID;

    try {
      const response = await fetch(`${BASE_URL}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ID,
          location_ID,
          amount: parseInt(restockAmount),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setFeedback("Restock successful!");
        setRestockAmount("");
        getInventory();
      } else {
        throw new Error(data.error || "Restock failed.");
      }
    } catch (err) {
      console.error("Restock error:", err);
      setFeedback("❌ Error submitting restock.");
    }
  };

  return (
    <div className={`inventory-report ${showReorderForm ? 'reorder-visible' : ''}`}>
      <h1>Inventory Report</h1>

      <div className="inventory-buttons">
        <button className="action-button" onClick={() => getInventory()}>Refresh Inventory</button>
        <button className="action-button" onClick={() => setShowReorderForm((prev) => !prev)}>
          {showReorderForm ? "Hide Reorder Form" : "Reorder Stock"}
        </button>
      </div>

      <p>{statusMessage}</p>

      <div className="filters">
        <div className="date-filter-wrapper">
          <label htmlFor="dateFilter">View as of:</label>
          <input
            type="date"
            id="dateFilter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <label htmlFor="locationFilter">Filter by Location:</label>
        <select id="locationFilter" value={locationFilter} onChange={handleLocationChange}>
          <option value="all">All Locations</option>
          {getUniqueOptions(allInventoryData, "location_name").map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <label htmlFor="productFilter">Filter by Product:</label>
        <select id="productFilter" value={productFilter} onChange={handleProductChange}>
          <option value="all">All Products</option>
          {getUniqueOptions(allInventoryData, "product_name").map((prod) => (
            <option key={prod} value={prod}>{prod}</option>
          ))}
        </select>
      </div>

      <table id="inventoryTable">
        <thead>
          <tr>
            <th onClick={() => onHeaderClick("location_name")}>Location</th>
            <th onClick={() => onHeaderClick("product_name")}>Product Name</th>
            <th onClick={() => onHeaderClick("item_price")}>Price</th>
            <th onClick={() => onHeaderClick("starting_quantity")}>Full Stock</th>
            <th onClick={() => onHeaderClick("adjusted_quantity")}>Current Stock</th>
            <th onClick={() => onHeaderClick("restock_needed")}>Restock Needed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => {
              const price = parseFloat(String(item.item_price)) || 0;
              const quantity = getDisplayQuantity(item);
              const restockNeeded = item.starting_quantity - quantity;
              const stockRatio = quantity / item.starting_quantity;
              const status = stockRatio < 0.5 ? "Low" : "Good";

              return (
                <tr key={index}>
                  <td>{item.location_name}</td>
                  <td>{item.product_name.trim()}</td>
                  <td>${price.toFixed(2)}</td>
                  <td>{item.starting_quantity}</td>
                  <td>{quantity}</td>
                  <td>{restockNeeded}</td>
                  <td className={status === "Low" ? "low-stock" : "good-stock"}>{status}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7">No data</td>
            </tr>
          )}
        </tbody>
      </table>

      {showReorderForm && (
        <div className="reorder-form">
          <h2>Reorder Stock</h2>
          <form onSubmit={handleReorderSubmit} className="reorder-flex-form">
            <div className="form-field">
              <label>Location:</label>
              <p>{locationFilter === "all" ? "Select location above" : locationFilter}</p>
            </div>

            <div className="form-field">
              <label>Product:</label>
              <p>{productFilter === "all" ? "Select product above" : productFilter}</p>
            </div>

            <div className="form-field">
              <label htmlFor="restockAmount">Quantity:</label>
              <input
                type="number"
                id="restockAmount"
                min="1"
                required
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={locationFilter === "all" || productFilter === "all"}
            >
              Submit Reorder
            </button>
          </form>
          {feedback && <p className="feedback">{feedback}</p>}
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
