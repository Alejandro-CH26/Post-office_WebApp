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
                const response = await fetch(`/driver/packages?employeeID=${employeeID}`);
                
                // FIRST CHANGE: Read response as text first
                const responseText = await response.text();
                console.log("Server response:", responseText); // Debug line

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} - ${responseText}`);
                }

                // SECOND CHANGE: Parse the text manually
                const packageData = JSON.parse(responseText);
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

    /* REST OF YOUR COMPONENT REMAINS EXACTLY THE SAME */
    if (loading) return <div>Loading packages...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="packages-container">
            <h2>Packages to Deliver</h2>
            {packages.length === 0 ? (
                <p>No pending packages to deliver.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                    {/* ... your existing table JSX ... */}
                </table>
            )}
        </div>
    );
}

export default PackagesLeft;