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
        <div className="packages-container max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-3">Packages to Deliver</h2>
            {packages.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending packages to deliver.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {packages.map((pkg) => (
                        <div 
                            key={pkg.Package_ID || pkg.packageID} 
                            className="package-card bg-white rounded shadow p-3 border-l-2 border-blue-500 hover:shadow-md transition-shadow text-sm"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-medium text-blue-600">
                                    #{pkg.Package_ID || pkg.packageID}
                                </div>
                                <div className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                                    Pending
                                </div>
                            </div>
                            
                            <div className="text-xs text-gray-700 mb-2">
                                <p className="truncate">{pkg.address_Street || pkg.addressStreet || "N/A"}</p>
                                <p className="truncate">
                                    {pkg.address_City || pkg.addressCity}{pkg.address_City || pkg.addressCity ? "," : ""} {pkg.address_State || pkg.addressState}
                                </p>
                            </div>
                            
                            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs transition-colors">
                                Mark Delivered
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PackagesLeft;