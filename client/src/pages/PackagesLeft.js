import React, { useEffect, useState } from "react";

function PackagesLeft({ employeeID }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deliveryStatus, setDeliveryStatus] = useState({});
    
    // Use consistent API URL for all requests
    const API_URL = "https://post-office-webapp.onrender.com";

    useEffect(() => {
        if (!employeeID) return;

        async function loadPackages() {
            try {
                setLoading(true);
                console.log("Fetching packages from:", `${API_URL}/driver/packages?employeeID=${employeeID}`);
                
                const response = await fetch(`${API_URL}/driver/packages?employeeID=${employeeID}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                });

                const responseText = await response.text();
                console.log("Raw server response:", responseText);

                // Check if we got HTML instead of JSON
                if (responseText.startsWith('<!DOCTYPE html>')) {
                    throw new Error(`Received HTML instead of JSON. Please verify the API endpoint.`);
                }

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} - ${responseText}`);
                }

                const packageData = JSON.parse(responseText);
                setPackages(packageData);
                setError(null);
            } catch (err) {
                console.error("Failed to load packages:", err);
                setError(err.message || "Failed to load packages. Please check console for details.");
            } finally {
                setLoading(false);
            }
        }

        loadPackages();
    }, [employeeID]);

    const markAsDelivered = async (packageID) => {
        try {
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'loading' }));
            
            const response = await fetch(`${API_URL}/driver/deliver-package`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeID: employeeID,
                    packageID: packageID
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `Failed to mark package as delivered: ${response.status}`);
            }
            
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'success' }));
            
            setTimeout(() => {
                setPackages(packages.filter(pkg => 
                    (pkg.Package_ID || pkg.packageID) !== packageID
                ));
                setDeliveryStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[packageID];
                    return newStatus;
                });
            }, 1500);
            
        } catch (err) {
            console.error("Error marking package as delivered:", err);
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'error' }));
            
            setTimeout(() => {
                setDeliveryStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[packageID];
                    return newStatus;
                });
            }, 3000);
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
                        const packageID = pkg.Package_ID || pkg.packageID;
                        const status = deliveryStatus[packageID];
                        const senderName = `${pkg.senderFirstName} ${pkg.senderLastName}`;
                        const recipientName = `${pkg.recipientFirstName} ${pkg.recipientLastName}`;
                        
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
                                        <p className="truncate" title={pkg.addressStreet || "N/A"}>
                                            {pkg.addressStreet || "N/A"}
                                        </p>
                                        <p className="truncate">
                                            {pkg.addressCity}{pkg.addressCity ? "," : ""} {pkg.addressState}
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