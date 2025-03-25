/*
Here is what this page will do:

When an employee opens the page, he or she will see a list of all the packages that are at
his or her location. We can find these packages by looking at the location_ID of all the 
packages in the tracking_history table and matching them with the Location_ID of the employee.

The employee will have an option to assign a new Next_Destination to a package and to assign
it to a delivery vehicle at the employee's location. When assigning a package to a new
Next_Destination, the employee will have two mutually exclusive dropdown menus. One menu
will have all the addresses of post office locations and the other will have all the non-
post office location addresses. There will also be a dropdown menu of vehicles to choose
from. 

When the employee finalizes assigning a package and clicks the submit button, the backend
server will create a new tracking_history instance with the updated status of the package
in addition to updating the rest of the relevant package information.

The packages displayed on screen will only be the packages that are marked as unprocessed.
Once an employee finalizes a package, it will be marked as processed, the page will refresh,
and a new list of unprocessed packages will populate.

If an employee tries to assign a package that has already been processed to a Next_Destination
and vehicle, he or she will receive an error that the package has already been processed,
and that he or she should refresh the page. 

Note: In order for unprocessed packages to be registered correctly, the driver dropping
packages off at a location will need to mark all the packages in his or her vehicle as
unprocessed.
Trigger: A package needs to be processed by a different employee at each post office location.

*/


import React, { useState, useEffect } from "react";

function WarehouseAssignPackages() {
  const [packages, setPackages] = useState([]); // Packages fetched from the backend
  const [assigningPackage, setAssigningPackage] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [submittedPackage, setSubmittedPackage] = useState(null);
  const [error, setError] = useState(""); // To handle errors during fetch

  // Dummy dropdown data (to be replaced with backend logic later)
  const postOfficeAndWarehouses = ["Warehouse 1", "Post Office 2", "Warehouse 3"];
  const residentialAndBusinessAddresses = ["123 Elm St", "456 Oak Ave", "789 Pine Blvd"];
  const deliveryVehicles = ["Truck 1", "Truck 2", "Truck 3"];

  const [filteredLocations, setFilteredLocations] = useState(postOfficeAndWarehouses);
  const [filteredAddresses, setFilteredAddresses] = useState(residentialAndBusinessAddresses);
  const [filteredVehicles, setFilteredVehicles] = useState(deliveryVehicles);


  // Fetch packages from the backend when the component mounts
  useEffect(() => {
    async function fetchPackages() {
      try {
        const response = await fetch("http://localhost:5001/warehouseassignpackages", {
          method: "GET",
          credentials: "include", // Include EmployeeID and other cookies in request
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setPackages(data); // Convert single object to an array
        } else {
          setError("Failed to fetch packages. Please try again.");
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
        setError("An error occurred while fetching packages.");
      }
    }

    fetchPackages();
  }, []);

  useEffect(() => {
    console.log("Updated packages:", packages);
}, [packages]);

  const startAssigning = (packageId) => {
    setAssigningPackage(packageId);
    setSelectedLocation("");
    setSelectedAddress("");
    setSelectedVehicle("");
  };

  const handleFilter = (e, list, setFilteredList) => {
    const searchValue = e.target.value.toLowerCase();
    setFilteredList(list.filter(item => item.toLowerCase().includes(searchValue)));
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSelectedAddress(""); // Deselect address
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setSelectedLocation(""); // Deselect location
  };

  const handleSubmit = () => {
    setPackages(packages.filter(pkg => pkg.packageID !== assigningPackage));
    setSubmittedPackage(assigningPackage);
    setAssigningPackage(null); // Hide dropdowns
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
          <div
            key={pkg.packageID}
            style={{
              backgroundColor: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              textAlign: "left",
            }}
          >
            <h3>ID: {pkg.packageID}</h3>
            <p>Destination City: {pkg.addressCity}, {pkg.addressState}</p>
            <button
              onClick={() => startAssigning(pkg.packageID)}
              style={{ padding: "10px 15px", marginBottom: "10px" }}
            >
              Assign Next Location
            </button>
            {assigningPackage === pkg.packageID && (
              <div style={{ marginTop: "10px" }}>
                <label>Post Office and Warehouse Locations:</label>
                <input
                  type="text"
                  placeholder="Search locations"
                  style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
                  onChange={(e) => handleFilter(e, postOfficeAndWarehouses, setFilteredLocations)}
                />
                <select
                  onChange={(e) => handleLocationSelect(e.target.value)}
                  value={selectedLocation || ""}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                >
                  <option value="" disabled>Select a location</option>
                  {filteredLocations.map((loc, index) => (
                    <option key={index} value={loc}>{loc}</option>
                  ))}
                </select>

                <label>Residential and Business Addresses:</label>
                <input
                  type="text"
                  placeholder="Search addresses"
                  style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
                  onChange={(e) => handleFilter(e, residentialAndBusinessAddresses, setFilteredAddresses)}
                />
                <select
                  onChange={(e) => handleAddressSelect(e.target.value)}
                  value={selectedAddress || ""}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                >
                  <option value="" disabled>Select an address</option>
                  {filteredAddresses.map((addr, index) => (
                    <option key={index} value={addr}>{addr}</option>
                  ))}
                </select>

                <label>Delivery Vehicles:</label>
                <input
                  type="text"
                  placeholder="Search vehicles"
                  style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
                  onChange={(e) => handleFilter(e, deliveryVehicles, setFilteredVehicles)}
                />
                <select
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  value={selectedVehicle || ""}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                >
                  <option value="" disabled>Select a vehicle</option>
                  {filteredVehicles.map((veh, index) => (
                    <option key={index} value={veh}>{veh}</option>
                  ))}
                </select>

                <button
                  onClick={handleSubmit}
                  disabled={!selectedVehicle || (!selectedLocation && !selectedAddress)}
                  style={{ padding: "10px 15px", marginTop: "10px" }}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {submittedPackage && (
        <p style={{ color: "green", marginTop: "20px" }}>
          Package {submittedPackage} was successfully submitted!
        </p>
      )}
    </div>
  );
}

export default WarehouseAssignPackages;
