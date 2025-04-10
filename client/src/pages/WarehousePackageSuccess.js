import { useLocation } from "react-router-dom";

function WarehousePackageSuccess() {
    const { state } = useLocation();
    const trackingNumber = state?.trackingNumber || "Not Found";

    return (
        <div className="package-success-center">
            <h1>Package Registered Successfully!</h1>
            <h2>Your tracking number is <strong>{trackingNumber}</strong></h2>
            <br></br>
            <br></br>
            <h3>You can view your tracking number any time by logging into your account.</h3>
        </div>
    );
}

export default WarehousePackageSuccess;