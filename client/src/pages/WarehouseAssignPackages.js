import React, { useState, useEffect } from "react";

function WarehouseAssignPackages() {
    const [packages, setPackages] = useState([]); // Packages fetched from the backend
    const [locations, setLocations] = useState([]); // Combined list of destinations & post offices
    const [filteredLocations, setFilteredLocations] = useState([]);
    const [deliveryVehicles, setDeliveryVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [assigningPackage, setAssigningPackage] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [submittedPackage, setSubmittedPackage] = useState(null);
    const [error, setError] = useState(""); // Error handling

    const priorityLabels = {
        5: "Express",
        4: "Priority",
        3: "First-Class",
        2: "Standard",
        1: "Economy"
    };
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const employeeID = localStorage.getItem("employee_ID");


    const fetchPackages = async () => {
        try {
           
            const response = await fetch(`${BASE_URL}/warehouseassignpackages?employeeID=${employeeID}`, {
              method: "GET",
             
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Backend response:", data);

                // Store packages without affecting post office locations
                setPackages(data.packages || []);
                setDeliveryVehicles(data.deliveryVehicles || []);
                setFilteredVehicles(data.deliveryVehicles || []);


                // Set post offices separately
                const postOffices = data.postOffices.map(postOffice => ({
                    addressID: postOffice.addressID,
                    addressStreet: postOffice.addressStreet,
                    addressCity: postOffice.addressCity,
                    addressState: postOffice.addressState,
                    addressZipcode: postOffice.addressZipcode,
                    type: "Warehouse"
                }));

                setLocations(postOffices); // Default locations hold only warehouses
              } else {
                setError("Failed to fetch data. Please try again.");
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("An error occurred while fetching data.");
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const startAssigning = (packageData) => {
      setAssigningPackage(packageData.packageID);
      setSelectedLocation("");
      setSelectedVehicle("");
  
      // Ensure the package's destination is properly formatted and added
      const destinationLocation = {
          addressID: packageData.destination.addressID,
          addressStreet: packageData.destination.addressStreet,
          addressCity: packageData.destination.addressCity,
          addressState: packageData.destination.addressState,
          addressZipcode: packageData.destination.addressZipcode,
          type: "Destination"
      };
  
      // Merge this package's destination with warehouse locations
      setFilteredLocations([destinationLocation, ...locations]);  
  };
  

    const locationFilter = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setFilteredLocations(
            filteredLocations.filter(loc =>
                `${loc.addressStreet}, ${loc.addressCity}, ${loc.addressState} ${loc.addressZipcode}`
                    .toLowerCase()
                    .includes(searchValue)
            )
        );
    };

    const vehicleFilter = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setFilteredVehicles(
            deliveryVehicles.filter(veh =>
                `Truck ${veh.vehicleID}`.toLowerCase().includes(searchValue)
            )
        );
    };

    const handleSubmit = async () => {
        if (!selectedLocation) {
            alert("Please select a location before submitting.");
            return;
        }

        if (!selectedVehicle) {
            alert("Please select a delivery vehicle before submitting.");
            return;
        }

        const nextDestination = selectedLocation;
        const assignedVehicle = selectedVehicle;
        const packageId = assigningPackage;

        try {
            const response = await fetch(`${BASE_URL}/warehouseassignpackages?employeeID=${employeeID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nextDestination, assignedVehicle, packageId })
            });

            const data = await response.json();
            console.log("Server response:", data.message);

            if (response.ok) {
                alert(`Package ${data.updatedPackageId} was successfully updated!`);
                fetchPackages(); // Refresh package list
            } else {
                alert(`${data.message}`);
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Failed to update package due to a network issue.");
        }

        setAssigningPackage(null);
        setSelectedLocation("");
        setSelectedVehicle("");
    };

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "20px" }}>
                <h1>Error</h1>
                <p style={{ color: "red" }}>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ textAlign: "center", margin: "0 auto", maxWidth: "800px", padding: "20px" }}>
            <h1>Warehouse Assign Packages</h1>
            <div style={{ display: "grid", gap: "20px" }}>
                {packages.map(pkg => (
                    <div key={pkg.packageID} style={{
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "20px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                        textAlign: "left",
                    }}>
                        <h3>ID: {pkg.packageID}</h3>
                        <h3>{priorityLabels[pkg.packagePriority] || "Unknown"}</h3>
                        <p>Destination City: {pkg.destination?.addressCity}, {pkg.destination?.addressState}</p>
                        <p>{pkg.packageWeight} lbs, {pkg.packageVolume} cu ft</p>
                        <button
                            onClick={() => startAssigning(pkg)}
                            style={{ padding: "10px 15px", marginBottom: "10px" }}
                        >
                            Assign Next Location
                        </button>
                        {assigningPackage === pkg.packageID && (
                            <div style={{ marginTop: "10px" }}>
                                {/* Combined Location Dropdown */}
                                <label>Search Locations (Destinations & Warehouses):</label>
                                <input
                                    type="text"
                                    placeholder="Search locations"
                                    style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
                                    onChange={locationFilter}
                                />
                                <select
                                    onChange={(e) => setSelectedLocation(e.target.value)}  // Use e.target.value instead of dataset.id
                                    value={selectedLocation || ""}
                                    style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                                >
                                    <option value="" disabled>Select a location</option>
                                    {filteredLocations.map((loc) => (
                                        <option key={loc.addressID} value={loc.addressID}>  
                                            {`${loc.type}: ${loc.addressStreet}, ${loc.addressCity}, ${loc.addressState} ${loc.addressZipcode}`} 
                                        </option>
                                    ))}
                                </select>





                                {/* Delivery Vehicles Dropdown */}
                                <label>Delivery Vehicles:</label>
                                <input
                                    type="text"
                                    placeholder="Search vehicles"
                                    style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
                                    onChange={vehicleFilter}
                                />
                                <select
                                    onChange={(e) => setSelectedVehicle(e.target.value)}
                                    value={selectedVehicle || ""}
                                    style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                                >
                                    <option value="" disabled>Select a vehicle</option>
                                    {filteredVehicles.map((veh) => (
                                        <option key={veh.vehicleID} value={veh.vehicleID}>{`Truck ${veh.vehicleID}`}</option>
                                    ))}
                                </select>

                                <button onClick={handleSubmit} style={{ padding: "10px 15px", marginTop: "10px" }}>
                                    Submit
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default WarehouseAssignPackages;
