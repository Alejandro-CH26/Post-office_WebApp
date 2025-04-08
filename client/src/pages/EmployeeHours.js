import { useState } from "react";

function EmployeeHourReportButton() {
  const [loading, setLoading] = useState(false);
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;


  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/report`, {
        method: 'GET'
      });

      if (response.ok) {
        // Open the report in a new window/tab
        const reportHtml = await response.text();
        const newWindow = window.open();
        newWindow.document.write(reportHtml);
      } else {
        const errorText = await response.text();
        console.error("Report generation error:", errorText);
        alert("Failed to generate report.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerateReport}
      style={{
        backgroundColor: "#4A90E2",
        color: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        opacity: loading ? 0.6 : 1,
        display: "block",
        margin: "20px auto",
        width: "auto",
      }}
      disabled={loading}
    >
      {loading ? "Generating..." : "Generate Report"}
    </button>
  );
}

export default EmployeeHourReportButton;