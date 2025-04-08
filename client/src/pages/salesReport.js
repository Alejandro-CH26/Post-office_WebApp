import React, { useEffect, useState, useRef } from "react";
import "./salesReport.css";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SalesReport = () => {
  const [sales, setSales] = useState([]);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [topProduct, setTopProduct] = useState("N/A");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const [filters, setFilters] = useState({
    location: "all",
    type: "all",
    from: "",
    to: "",
  });

  useEffect(() => {
    fetchLocations();
    fetchData(filters);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData(filters);
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchLocations = async () => {
    try {
      setError(null);
      const res = await fetch(`${BASE_URL}/active-locations`);
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
      setError("Failed to load locations. Please check server connection.");
    }
  };

  const fetchData = async (filterObj) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filterObj.location !== "all") params.append("location_ID", filterObj.location);
    if (filterObj.type !== "all") params.append("type", filterObj.type);
    if (filterObj.from) params.append("from", filterObj.from);
    if (filterObj.to) params.append("to", filterObj.to);

    try {
      const [salesRes, summaryRes] = await Promise.all([
        fetch(`${BASE_URL}/sales-report?${params.toString()}`, { signal: controller.signal }),
        fetch(`${BASE_URL}/sales-summary?${params.toString()}`, { signal: controller.signal }),
      ]);

      const salesData = await salesRes.json();
      const summaryData = await summaryRes.json();

      const transactions = Array.isArray(salesData.data) ? salesData.data : [];
      const uniqueTypes = [...new Set(transactions.map((t) => t.Item_name).filter(Boolean))];

      if (abortRef.current === controller) {
        setSales(transactions);
        setTypes(uniqueTypes);
        setTotalRevenue(summaryData.totalRevenue || "0.00");
        setTotalTransactions(summaryData.totalTransactions || 0);
        setNewCustomers(summaryData.newCustomers || 0);
        setTopProduct(summaryData.topProduct || "N/A");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("❌ Failed to fetch data:", err);
        setError(`Failed to load data: ${err.message}`);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedSales = () => {
    if (!sortColumn) return sales;
    return [...sales].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? -1 : 1;
      if (bVal == null) return sortDirection === "asc" ? 1 : -1;
      return typeof aVal === "string"
        ? (sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal))
        : (sortDirection === "asc" ? aVal - bVal : bVal - aVal);
    });
  };

  const sortArrow = (col) => {
    if (sortColumn !== col) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const handleRetry = () => {
    fetchLocations();
    fetchData(filters);
  };

  return (
    <div className="sales-report-wrapper">
      <h1>Sales Report</h1>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      )}

      <div className="filters">
        <select value={filters.location} onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}>
          <option value="all">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.location_ID} value={loc.location_ID}>{loc.name}</option>
          ))}
        </select>

        <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}>
          <option value="all">All Types</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <input type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
        <input type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
      </div>

      <div className="report-summary-combined">
        <div className="summary-combined-box">
          <div>
            <p>Total Revenue</p>
            <h2>${totalRevenue}</h2>
          </div>
          <div>
            <p>Total Sales</p>
            <h2>{totalTransactions}</h2>
          </div>
          <div>
            <p>New Customers</p>
            <h2>{newCustomers}</h2>
          </div>
          <div>
            <p className="top-product-label">Top Product</p>
            <h2 className="top-product-value">{topProduct}</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator"><p>Loading...</p></div>
      ) : sales.length > 0 ? (
        <div className="report-table-wrapper">
          <table className="sales-report-table">
            <thead>
            <tr>
  <th onClick={() => handleSort("Transaction_ID")}>Sale ID{sortArrow("Transaction_ID")}</th>
  <th onClick={() => handleSort("Date")}>Date{sortArrow("Date")}</th>
  <th onClick={() => handleSort("customer_name")}>Customer Name{sortArrow("customer_name")}</th>
  <th onClick={() => handleSort("Item_name")}>Type{sortArrow("Item_name")}</th>
  <th onClick={() => handleSort("Quantity")}>Quantity{sortArrow("Quantity")}</th>
  <th onClick={() => handleSort("item_price")}>Amount{sortArrow("item_price")}</th>
  <th onClick={() => handleSort("Location")}>Location{sortArrow("Location")}</th>
</tr>

            </thead>
            <tbody>
              {getSortedSales().map((sale) => (
               <tr key={sale.Transaction_ID}>
               <td>{sale.Transaction_ID}</td>
               <td>{new Date(sale.Date).toLocaleDateString()}</td>
               <td>{sale.customer_name}</td>
               <td>{sale.Item_name}</td>
               <td>{sale.Quantity}</td>
               <td>${(sale.item_price * sale.Quantity).toFixed(2)}</td>
               <td>{sale.Location}</td>
             </tr>
             
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data-message">No sales data found matching the selected filters.</p>
      )}
    </div>
  );
};

export default SalesReport;
