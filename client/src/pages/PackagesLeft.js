import React, { useEffect, useState } from "react";

function PackagesLeft({ employeeID }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!employeeID) return;

        async function loadPackages() {
            try {
                setLoading(true);
                const response = await fetch(`https://post-office-webapp.onrender.com/driver/packages?employeeID=${employeeID}`);
                const rawResponse = await response.text();
                console.log("Server response:", rawResponse);

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} - ${rawResponse}`);
                }

                const packageData = JSON.parse(rawResponse);
                setPackages(packageData);
                setError(null);
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Failed to load packages. Please check console for details.");
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
                    {/* YOUR ORIGINAL TABLE CODE - DO NOT REMOVE */}
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
                            <tr key={pkg.Package_ID || pkg.packageID}>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.Package_ID || pkg.packageID}</td>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.address_Street || pkg.addressStreet || "N/A"}</td>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.address_City || pkg.addressCity}</td>
                                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{pkg.address_State || pkg.addressState}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default PackagesLeft;