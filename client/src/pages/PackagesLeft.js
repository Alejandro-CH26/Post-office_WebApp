import React, { useEffect, useState } from "react";
import { fetchDriverPackages } from "./EmployeeAPI";

function PackagesLeft({ employeeID }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!employeeID) return;

        async function loadPackages() {
            try {
                setLoading(true);
                const packageData = await fetchDriverPackages(employeeID);
                setPackages(packageData);
                setError(null);
            } catch (err) {
                console.error("Failed to load packages:", err);
                setError("Failed to load packages. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        loadPackages();
    }, [employeeID]);

    if (loading) return <div>Loading packages...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="packages-container">
            <h2>Packages to Deliver</h2>
            {packages.length === 0 ? (
                <p>No pending packages to deliver.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>Package ID</th>
                            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>Street</th>
                            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>City</th>
                            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map((pkg) => (
                            <tr key={pkg.packageID}>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.packageID}</td>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.addressStreet}</td>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.addressCity}</td>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.addressState}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default PackagesLeft;