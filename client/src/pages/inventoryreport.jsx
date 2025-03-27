import React, { useEffect, useState } from "react";
import "./inventoryreport.css"; // Import the external CSS file

const InventoryReport = () => {
  // State variables for inventory data, filters, sort, and status message
  const [allInventoryData, setAllInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [currentSortColumn, setCurrentSortColumn] = useState(null);
  const [currentSortDirection, setCurrentSortDirection] = useState("asc");

  // Fetch inventory when the component mounts
  useEffect(() => {
    getInventory();
  }, []);

  const getInventory = async () => {
    setStatusMessage("");
    try {
      const response = await fetch("http://localhost:5001/inventory");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
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

  // Return unique options for a given key from the data
  const getUniqueOptions = (data, key) => {
    const options = new Set(data.map((item) => String(item[key]).trim()));
    return Array.from(options);
  };

  // Filter and sort the data then update state
  const applyFilterAndSort = (data, locFilter, prodFilter, sortColumn, sortDirection) => {
    let filtered = data.filter((item) => {
      const matchesLocation = locFilter === "all" || item.location_name === locFilter;
      const matchesProduct = prodFilter === "all" || item.product_name.trim() === prodFilter;
      return matchesLocation && matchesProduct;
    });

    if (sortColumn) {
      const numericColumns = ["item_price", "starting_quantity", "total_sold", "adjusted_quantity"];
      filtered.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        if (numericColumns.includes(sortColumn)) {
          valA = parseFloat(String(valA)) || 0;
          valB = parseFloat(String(valB)) || 0;
        } else {
          valA = String(valA).trim();
          valB = String(valB).trim();
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    setFilteredData(filtered);
  };

  // Handle changes for location filter
  const handleLocationChange = (e) => {
    const newFilter = e.target.value;
    setLocationFilter(newFilter);
    applyFilterAndSort(allInventoryData, newFilter, productFilter, currentSortColumn, currentSortDirection);
  };

  // Handle changes for product filter
  const handleProductChange = (e) => {
    const newFilter = e.target.value;
    setProductFilter(newFilter);
    applyFilterAndSort(allInventoryData, locationFilter, newFilter, currentSortColumn, currentSortDirection);
  };

  // When a table header is clicked, toggle or set the sort column/direction
  const onHeaderClick = (columnKey) => {
    let newDirection = "asc";
    if (currentSortColumn === columnKey) {
      newDirection = currentSortDirection === "asc" ? "desc" : "asc";
    }
    setCurrentSortColumn(columnKey);
    setCurrentSortDirection(newDirection);
    applyFilterAndSort(allInventoryData, locationFilter, productFilter, columnKey, newDirection);
  };

  return (
    <div className="inventory-report">
      <h1>Inventory Report</h1>
      <button onClick={getInventory}>Refresh Inventory</button>
      <p>{statusMessage}</p>

      <div className="filters">
        <label htmlFor="locationFilter">Filter by Location:</label>
        <select id="locationFilter" value={locationFilter} onChange={handleLocationChange}>
          <option value="all">All Locations</option>
          {getUniqueOptions(allInventoryData, "location_name").map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <label htmlFor="productFilter">Filter by Product:</label>
        <select id="productFilter" value={productFilter} onChange={handleProductChange}>
          <option value="all">All Products</option>
          {getUniqueOptions(allInventoryData, "product_name").map((prod) => (
            <option key={prod} value={prod}>
              {prod}
            </option>
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
            <th onClick={() => onHeaderClick("total_sold")}>Total Sold</th>
            <th onClick={() => onHeaderClick("adjusted_quantity")}>Current Stock</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => {
              const price = parseFloat(String(item.item_price)) || 0;
              return (
                <tr key={index}>
                  <td>{item.location_name}</td>
                  <td>{item.product_name.trim()}</td>
                  <td>${price.toFixed(2)}</td>
                  <td>{item.starting_quantity}</td>
                  <td>{item.total_sold}</td>
                  <td>{item.adjusted_quantity}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6">No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryReport;
