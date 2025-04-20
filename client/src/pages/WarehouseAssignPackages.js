import React, { useState, useEffect } from "react"; 
function WarehouseAssignPackages() { 
    const [packages, setPackages] = useState([]); 
    const [locations, setLocations] = useState([]); 
    const [deliveryVehicles, setDeliveryVehicles] = useState([]); 
    const [assigningPackage, setAssigningPackage] = useState(null); 
    const [selectedLocation, setSelectedLocation] = useState(""); 
    const [selectedVehicle, setSelectedVehicle] = useState(""); 
    const [viewingPackagesForVehicle, setViewingPackagesForVehicle] = useState(null); 
    const [expandedPackageDetails, setExpandedPackageDetails] = useState({}); 
    const [error, setError] = useState(""); 
    const [viewMode, setViewMode] = useState("packages");
    const [message, setMessage] = useState({ text: "", type: "" });

    const priorityLabels = { 5: "Express", 4: "Priority", 3: "First-Class", 2: "Standard", 1: "Economy" }; 
    const BASE_URL = process.env.REACT_APP_API_BASE_URL; 
    const employeeID = localStorage.getItem("employee_ID"); 
    const fetchData = async () => { 
        try { 
            const response = await fetch(`${BASE_URL}/warehouseassignpackages?employeeID=${employeeID}`); 
            if (response.ok) { 
                const data = await response.json(); 
                setPackages(data.packages || []); 
                setDeliveryVehicles(Object.values(data.deliveryVehicles || {})); 
                setLocations(data.postOffices || []); 
            } else { 
                setMessage({ text: "Failed to fetch data.", type: "error" });
            } 
        } catch (err) { 
            console.error("Fetch error:", err); 
            setMessage({ text: "Error fetching data.", type: "error" });
        } 
    }; 

    useEffect(() => { fetchData(); }, []); 

    const startAssigning = (packageData) => {
        setAssigningPackage(prevPackage => (prevPackage === packageData.packageID ? null : packageData.packageID));
        setSelectedLocation(""); 
        setSelectedVehicle(""); 

        const destinationLocation = [{ 
            addressID: packageData.destination.addressID, 
            addressStreet: packageData.destination.addressStreet, 
            addressCity: packageData.destination.addressCity, 
            addressState: packageData.destination.addressState, 
            addressZipcode: packageData.destination.addressZipcode, 
            type: "Destination"
        }];

        setLocations([...destinationLocation, ...fetchWarehouseLocations()]);
    }; 

    const fetchWarehouseLocations = () => {
        return locations.filter(loc => loc.type !== "Destination");
    };

    const toggleView = (mode) => {
        setViewMode(mode);
    };

    const togglePackageDetails = (packageID) => { 
        setExpandedPackageDetails(prevState => ({ 
            ...prevState, 
            [packageID]: !prevState[packageID] 
        })); 
    };

    const handleSubmit = async () => { 
        if (!selectedLocation || !selectedVehicle) { 
            setMessage({ text: "Please select a location and vehicle.", type: "error" });
            return; 
        } 
        try { 
            const response = await fetch(`${BASE_URL}/warehouseassignpackages?employeeID=${employeeID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nextDestination: selectedLocation, assignedVehicle: selectedVehicle, packageId: assigningPackage })
            }); 

            const data = await response.json();
            if (response.ok) { 
                fetchData(); 
                setMessage({ text: "Package assigned successfully!", type: "success" });
            } else { 
                setMessage({ text: `${data.message}`, type: "error" });
            } 
        } catch (error) { 
            console.error("Submission error:", error); 
            setMessage({ text: "Network error.", type: "error" });
        } 

        setAssigningPackage(null);
        setTimeout(() => setMessage({ text: "", type: "" }), 5000); // Auto-clear message after 5 seconds
    }; 

    const removePackage = async (packageID) => { 
        try { 
            const response = await fetch(`${BASE_URL}/warehouseremovepackage?employeeID=${employeeID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageID }) 
            }); 

            if (response.ok) { 
                fetchData(); 
                setMessage({ text: "Package removed successfully!", type: "success" });
            } else { 
                setMessage({ text: "Failed to remove package.", type: "error" });
            }
        } catch (error) { 
            console.error("Error removing package:", error); 
            setMessage({ text: "Network error.", type: "error" });
        } 

        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }; 
    return ( 
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}> 
        <h1 style={{ textAlign: "center" }}>Warehouse Assign Packages</h1> 
         {/* Status Message */}
         {message.text && (
            <p style={{ color: message.type === "success" ? "green" : "red", textAlign: "center", fontSize: "16px", marginTop: "10px" }}>
                {message.text}
            </p>
        )}
        {/* View Toggle Buttons */}
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
                <button onClick={() => toggleView("vehicles")} style={{ marginRight: "10px", width:"250px"}}>
                    View Delivery Vehicles
                </button>
                <button onClick={() => toggleView("packages")} style={{width:"250px"}}>
                    View Packages
                </button>
        </div>
        {/* DELIVERY VEHICLES SECTION */} 
        {viewMode === "vehicles" && (
            <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px" }}> 
            <h2>Delivery Vehicles</h2> 
            {deliveryVehicles.map(vehicle => ( 
                <div key={vehicle.vehicleID} style={{ display: "flex", flexDirection: "column", backgroundColor: "#f5f5f5", marginBottom: "10px", padding: "15px", borderRadius: "8px" }}> 
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> 
                        <h3>Delivery Vehicle {vehicle.vehicleID}</h3> 
                        <p>Remaining Capacity: {vehicle.payloadCapacity} lbs, {vehicle.volumeCapacity} cb ft</p>
                        <button onClick={() => setViewingPackagesForVehicle(vehicle.vehicleID)}>View Packages</button> 
                    </div> 
                    {viewingPackagesForVehicle === vehicle.vehicleID && (
                        <div style={{ marginTop: "10px" }}>
                            {vehicle.packages && vehicle.packages[0]["packageID"] != null ? (
                                vehicle.packages.map(pkg => (
                                    <div key={pkg.packageID} style={{ border: "1px solid #ddd", padding: "10px", margin: "5px", borderRadius: "5px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <h4>Package {pkg.packageID}</h4>
                                            <h4>{priorityLabels[pkg.priority]}</h4>
                                            <p>{pkg.addressStreet}, {pkg.addressCity}, {pkg.addressState} {pkg.addressZipcode}</p>
                                            <button onClick={() => togglePackageDetails(pkg.packageID)}>View Details</button>
                                        </div>
                                        {expandedPackageDetails[pkg.packageID] && (
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                                                <p>Package Weight: {pkg.weight} lbs, Package Volume: {pkg.packageVolume} cb ft</p>
                                                <button onClick={() => removePackage(pkg.packageID)} style={{ backgroundColor: "red", color: "white" }}>Remove Package</button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: "center", fontStyle: "italic", marginTop: "10px" }}>Vehicle is currently Empty</p>
                            )}
                        </div>
                    )}



                </div> ))} 
        </div>
        )}
        {/* PACKAGES AT WAREHOUSE SECTION */}
        {viewMode === "packages" && (
            <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px", marginTop: "20px"}}> 
            <h2>Packages at Warehouse</h2> 
            {packages.map(pkg => ( 
                <div key={pkg.packageID} style={{ display: "flex", flexDirection: "column", backgroundColor: "#f5f5f5", marginBottom: "10px", padding: "15px", borderRadius: "8px" }}> 
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> 
                        <h3>Package {pkg.packageID}</h3> 
                        <h3 style={{maxWidth:"150px"}}>{priorityLabels[pkg.packagePriority]}</h3> 
                        <p style={{ width:"300px"}}><b>Destination: {pkg.destination?.addressCity}, {pkg.destination?.addressState}</b></p> 
                        <button onClick={() => togglePackageDetails(pkg.packageID)}>View Details</button> 
                        <button onClick={() => startAssigning(pkg)}>Assign Next Location</button> 
                    </div> 
                    {expandedPackageDetails[pkg.packageID] && ( 
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}> 
                            <p><b>Package Weight:</b> {pkg.packageWeight} lbs, <b>Package Volume:</b> {pkg.packageVolume} cb ft</p> 
                        </div> )} 
                    {assigningPackage === pkg.packageID && ( 
                        <div style={{ display: "flex", flexDirection: "column", marginTop: "10px", gap: "10px" }}> 
                            <label>Search Locations:</label> 
                            <select onChange={(e) => setSelectedLocation(e.target.value)} value={selectedLocation || ""} style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}> 
                                <option value="" disabled>Select a location</option> 
                                {locations.map(loc => <option key={loc.addressID} value={loc.addressID}>{loc.type}: {loc.addressStreet}, {loc.addressCity}, {loc.addressState} {loc.addressZipcode}</option>)} 
                            </select> 
                            <label>Delivery Vehicles:</label> 
                            <select onChange={(e) => setSelectedVehicle(e.target.value)} value={selectedVehicle || "" } style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}> 
                                <option value="" disabled>Select a vehicle</option> 
                                {deliveryVehicles.map(veh => <option key={veh.vehicleID} value={veh.vehicleID}>
                                    {`Truck ${veh.vehicleID}`}
                                </option>)} 
                            </select> 
                            <button onClick={handleSubmit}>Submit</button> 
                        </div> )} 
                    </div> ))} 
        </div>
        )}
         
    </div> ); 
} 
export default WarehouseAssignPackages;