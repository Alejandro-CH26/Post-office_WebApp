import React, { useEffect, useState } from "react";


function PackagesLeft({ employeeID }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deliveryStatus, setDeliveryStatus] = useState({});


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


    const markAsDelivered = async (packageID) => {
        try {
            // Show loading state for this package
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'loading' }));
            
            const response = await fetch(`https://post-office-webapp.onrender.com/driver/deliver-package`, {
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
            
            // Show success state briefly
            setDeliveryStatus(prev => ({ ...prev, [packageID]: 'success' }));
            
            // After a brief delay, remove the package from the list
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
            
            // Clear error status after a delay
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
                                        <span className="mr-1" role="img" aria-label="Package">📦</span>
                                        <div className="font-medium text-blue-600">
                                            #{packageID}
                                        </div>
                                    </div>
                                    <div className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                                        Pending delivery
                                    </div>
                                </div>
                                
                                <div className="text-xs text-gray-700 mb-2 border-l-2 border-blue-500 pl-2">
                                    <p className="truncate">{pkg.address_Street || pkg.addressStreet || "N/A"}</p>
                                    <p className="truncate">
                                        {pkg.address_City || pkg.addressCity}{pkg.address_City || pkg.addressCity ? "," : ""} {pkg.address_State || pkg.addressState}
                                    </p>
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



