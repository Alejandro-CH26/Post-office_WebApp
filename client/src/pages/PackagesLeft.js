import React, { useEffect, useState, useCallback } from "react";

function PackagesLeft({ employeeID }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deliveryStatus, setDeliveryStatus] = useState({});
   
    // Updated to use REACT_APP_API_BASE_URL as per Render configuration
    const getApiUrl = () => {
        return process.env.REACT_APP_API_BASE_URL ||
            (process.env.NODE_ENV === 'development'
                ? 'http://localhost:5001'
                : 'https://post-office-webapp.onrender.com');
    };

    // Extract loadPackages into a callback to reuse it
    const loadPackages = useCallback(async () => {
        if (!employeeID) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const API_URL = getApiUrl();
            console.log("Fetching from:", `${API_URL}/driver/packages?employeeID=${employeeID}`);
            
            const response = await fetch(`${API_URL}/driver/packages?employeeID=${employeeID}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            setPackages(data);
        } catch (err) {
            console.error("Failed to load packages:", err);
            setError(err.message || "Failed to fetch packages");
        } finally {
            setLoading(false);
        }
    }, [employeeID]);

    useEffect(() => {
        loadPackages();
    }, [loadPackages]);

    const markAsDelivered = async (packageID) => {
        const API_URL = getApiUrl();
        
        try {
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'loading' }));
            
            const response = await fetch(`${API_URL}/driver/deliver-package`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeID, packageID }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }
            
            // Set temp success status
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'success' }));
            
            // Refetch packages after a brief delay to show success feedback to user
            setTimeout(() => {
                loadPackages();
                // Clear delivery status for this package after refetch
                setDeliveryStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[packageID];
                    return newStatus;
                });
            }, 1000);
            
        } catch (err) {
            console.error("Delivery error:", err);
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'error' }));
        }
    };

    if (loading) return <div>Loading packages...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="packages-container max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-3">Packages to Deliver</h2>
            {packages.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending packages to deliver.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {packages.map((pkg) => {
                        // Normalize package ID references
                        const packageID = pkg.Package_ID || pkg.packageID;
                        const status = deliveryStatus[packageID];
                        const senderName = `${pkg.senderFirstName || pkg.sender_first_name} ${pkg.senderLastName || pkg.sender_last_name}`;
                        const recipientName = pkg.recipientName || "N/A";
                        const addressStreet = pkg.addressStreet || pkg.address_Street || "N/A";
                        const addressCity = pkg.addressCity || pkg.address_City || "";
                        const addressState = pkg.addressState || pkg.address_State || "";
                        
                        return (
                            <div
                                key={packageID}
                                style={{
                                    border: "2px solid #999",
                                    borderRadius: "0.25rem",
                                    padding: "0.75rem",
                                    backgroundColor: "white"
                                }}
                                className="package-card text-sm hover:border-blue-500"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center">
                                        <span className="mr-1" role="img" aria-label="Package">Package</span>
                                        <div className="font-medium text-blue-600">
                                            #{packageID}
                                        </div>
                                    </div>
                                    <div className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                                        Pending delivery
                                    </div>
                                </div>
                               
                                <div className="text-xs text-gray-700 mb-2 border-l-2 border-blue-500 pl-2">
                                    <div className="mb-1">
                                        <div className="font-semibold">From:</div>
                                        <div className="truncate" title={senderName}>{senderName}</div>
                                    </div>
                                    <div className="mb-1">
                                        <div className="font-semibold">To:</div>
                                        <div className="truncate" title={recipientName}>{recipientName}</div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="font-semibold">Address:</div>
                                        <p className="truncate" title={addressStreet}>
                                            {addressStreet}
                                        </p>
                                        <p className="truncate">
                                            {addressCity}{addressCity ? "," : ""} {addressState}
                                        </p>
                                    </div>
                                </div>
                               
                                <button
                                    onClick={() => markAsDelivered(packageID)}
                                    disabled={status === 'loading'}
                                    className={`w-full py-1 px-2 rounded text-xs transition-colors ${
                                        status === 'loading' ? 'bg-gray-400 cursor-not-allowed' :
                                        status === 'success' ? 'bg-green-600 text-white' :
                                        status === 'error' ? 'bg-red-500 text-white' :
                                        'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                >
                                    {status === 'loading' ? 'Processing...' :
                                    status === 'success' ? 'Delivered! ✓' :
                                    status === 'error' ? 'Failed! Try Again' :
                                    'Mark Delivered'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PackagesLeft;