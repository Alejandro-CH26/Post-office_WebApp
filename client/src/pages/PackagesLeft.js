import React, { useEffect, useState, useCallback } from "react";

function PackagesLeft({ employeeID }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deliveryStatus, setDeliveryStatus] = useState({});
    const [vehicleStatus, setVehicleStatus] = useState("Available");
    const [updatingStatus, setUpdatingStatus] = useState(false);
   
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
            
            // Set vehicle status from first package (assuming all packages share the same vehicle status)
            if (data && data.length > 0 && data[0].vehicleStatus) {
                setVehicleStatus(data[0].vehicleStatus);
            }
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

    const updateVehicleStatus = async (newStatus) => {
        if (!employeeID) return;
        
        try {
            setUpdatingStatus(true);
            const API_URL = getApiUrl();
            
            const response = await fetch(`${API_URL}/driver/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    employeeID, 
                    status: newStatus 
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server responded with ${response.status}`);
            }
            
            // Update local state and refetch packages to get fresh data
            setVehicleStatus(newStatus);
            await loadPackages();
            
        } catch (err) {
            console.error("Failed to update vehicle status:", err);
            setError(`Failed to update status: ${err.message}`);
        } finally {
            setUpdatingStatus(false);
        }
    };

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

    // Button styles
    const buttonStyle = (isDisabled, type) => ({
        padding: "6px 16px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "500",
        marginLeft: "15px", // Added spacing between buttons
        transition: "background-color 0.2s",
        cursor: isDisabled ? "not-allowed" : "pointer",
        backgroundColor: isDisabled 
            ? "#D1D5DB" 
            : type === "left" ? "#F59E0B" : "#10B981", // Yellow for Left, Green for Arrived
        color: isDisabled ? "#6B7280" : "white"
    });

    // Status badge style
    const statusBadgeStyle = {
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        marginTop: "4px",
        backgroundColor: vehicleStatus === "In Transit" ? "#FEF3C7" : "#D1FAE5",
        color: vehicleStatus === "In Transit" ? "#92400E" : "#065F46"
    };

    return (
        <div className="packages-container max-w-4xl mx-auto">
            {/* Vehicle Status Control Panel */}
            <div style={{
                backgroundColor: "#F3F4F6",
                padding: "16px",
                marginBottom: "16px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ fontWeight: "600", marginBottom: "4px" }}>Vehicle Status</h3>
                        <div style={statusBadgeStyle}>
                            {vehicleStatus || "Unknown"}
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={() => updateVehicleStatus("In Transit")}
                            disabled={updatingStatus || vehicleStatus === "In Transit"}
                            style={buttonStyle(updatingStatus || vehicleStatus === "In Transit", "left")}
                        >
                            Left Office
                        </button>
                        <button
                            onClick={() => updateVehicleStatus("Available")}
                            disabled={updatingStatus || vehicleStatus === "Available"}
                            style={buttonStyle(updatingStatus || vehicleStatus === "Available", "arrived")}
                        >
                            Arrived at Office
                        </button>
                    </div>
                </div>
            </div>

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
                                    disabled={status === 'loading' || vehicleStatus !== 'In Transit'}
                                    className={`w-full py-1 px-2 rounded text-xs transition-colors ${
                                        status === 'loading' ? 'bg-gray-400 cursor-not-allowed' :
                                        status === 'success' ? 'bg-green-600 text-white' :
                                        status === 'error' ? 'bg-red-500 text-white' :
                                        vehicleStatus !== 'In Transit' ? 'bg-gray-400 cursor-not-allowed' :
                                        'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                >
                                    {status === 'loading' ? 'Processing...' :
                                    status === 'success' ? 'Delivered! ✓' :
                                    status === 'error' ? 'Failed! Try Again' :
                                    vehicleStatus !== 'In Transit' ? 'Must be In Transit' :
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