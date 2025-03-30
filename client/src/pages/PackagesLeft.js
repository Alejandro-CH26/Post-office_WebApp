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
            <h2 className="text-xl font-bold mb-4">Packages to Deliver</h2>
            {packages.length === 0 ? (
                <p className="text-gray-500">No pending packages to deliver.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                        <div 
                            key={pkg.Package_ID || pkg.packageID} 
                            className="package-card bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="text-lg font-semibold text-blue-600">
                                    #{pkg.Package_ID || pkg.packageID}
                                </div>
                                <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                    Pending
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-start">
                                    <svg className="w-4 h-4 text-gray-500 mt-1 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-gray-700">{pkg.address_Street || pkg.addressStreet || "N/A"}</p>
                                        <p className="text-gray-700">
                                            {pkg.address_City || pkg.addressCity}{pkg.address_City || pkg.addressCity ? "," : ""} {pkg.address_State || pkg.addressState}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors">
                                    Mark as Delivered
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PackagesLeft;